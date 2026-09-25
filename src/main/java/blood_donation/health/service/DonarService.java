package blood_donation.health.service;

import blood_donation.health.DTO.DistrictDonorCountDto;
import blood_donation.health.DTO.DonarResponseDto;
import blood_donation.health.DTO.DonorTableDto;
import blood_donation.health.Entity.BloodRequest;
import blood_donation.health.Entity.Enum.BloodGroup;
import blood_donation.health.Entity.Enum.MatchStatus;
import blood_donation.health.Entity.Enum.NotificationType;
import blood_donation.health.Entity.Enum.RequestStatus;
import blood_donation.health.Entity.Enum.UrgencyLevel;
import blood_donation.health.Entity.Hospital;
import blood_donation.health.Entity.DonorRequestMatch;
import blood_donation.health.Entity.UserProfile;
import blood_donation.health.Entity.Users;
import blood_donation.health.Utils.BusinessRuleException;
import blood_donation.health.Utils.DonationRules;
import blood_donation.health.Utils.ResourceNotFoundException;
import blood_donation.health.repository.BloodRequestRepository;
import blood_donation.health.repository.DonarRequestMatchRepository;
import blood_donation.health.repository.HospitalProfileRepository;
import blood_donation.health.repository.UserProfileRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DonarService {

    private final BloodRequestRepository bloodRequestRepository;
    private final UserProfileRepository userProfileRepository;
    private final DonarRequestMatchRepository donorRequestMatchRepository;
    private final HospitalProfileRepository hospitalProfileRepository;
    private final NotificationService notificationService;

    /**
     * Finds donors for a blood request (or around the hospital when no request
     * is given).
     *
     * For a request: only donors whose blood group is compatible, who are
     * available, active and past the donation cooldown are returned. Each newly
     * matched donor is recorded as NOTIFIED and receives a notification, and an
     * OPEN request moves to MATCHING.
     */
    @Transactional
    public List<DonarResponseDto> getNearbyDonors(
            Long bloodReqId,
            double radiusKm,
            String email
    ) {

        DonationRules.validateRadius(radiusKm);

        Hospital hospital = requireVerifiedHospital(email);
        Users hospitalUser = hospital.getUser();

        Point searchLocation;
        BloodRequest request = null;
        List<String> donorGroups;

        if (bloodReqId != null) {

            request = bloodRequestRepository.findById(bloodReqId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Blood request not found"));

            // a hospital may only work with its own requests
            if (!request.getRequestedBy().getId().equals(hospitalUser.getId())) {
                throw new BusinessRuleException(HttpStatus.FORBIDDEN,
                        "You are not allowed to find donors for this request");
            }

            if (!DonationRules.ACTIVE_REQUEST_STATUSES.contains(request.getStatus())) {
                throw new BusinessRuleException(HttpStatus.CONFLICT,
                        "This request is already " + request.getStatus());
            }

            if (request.getRequiredBefore() != null
                    && request.getRequiredBefore().isBefore(LocalDateTime.now())) {
                throw new BusinessRuleException(HttpStatus.CONFLICT,
                        "This request has expired");
            }

            searchLocation = request.getLocation();

            // compatible donors, not only the identical blood group
            donorGroups = DonationRules.names(
                    DonationRules.donorsFor(request.getBloodGroup()));

        } else {

            if (hospital.getLocation() == null) {
                throw new IllegalArgumentException(
                        "Hospital location not set. Update your hospital profile with latitude and longitude");
            }

            searchLocation = hospital.getLocation();
            donorGroups = DonationRules.allGroupNames();
        }

        List<UserProfile> donors = userProfileRepository.findNearbyDonors(
                searchLocation,
                radiusKm * 1000,
                hospitalUser.getId(),
                donorGroups,
                true,   // available only
                true,   // past cooldown only
                DonationRules.eligibleBefore(LocalDate.now())
        );

        LocalDate today = LocalDate.now();
        List<DonarResponseDto> result = new ArrayList<>();
        boolean anyNewMatch = false;

        for (UserProfile profile : donors) {

            DonarResponseDto dto = mapToDto(profile, today);

            double distanceKm = calculateDistanceKm(searchLocation, profile.getLocation());
            dto.setDistanceKm(distanceKm);

            if (request != null && registerMatch(request, profile, distanceKm)) {
                anyNewMatch = true;
            }

            result.add(dto);
        }

        if (request != null && anyNewMatch && request.getStatus() == RequestStatus.OPEN) {
            request.setStatus(RequestStatus.MATCHING);
            request.setUpdatedAt(LocalDateTime.now());
            bloodRequestRepository.save(request);
        }

        return result;
    }

    /** @return true if a new match was created (and the donor notified) */
    private boolean registerMatch(BloodRequest request, UserProfile profile, double distanceKm) {

        if (donorRequestMatchRepository.existsByRequest_IdAndDonor_Id(
                request.getId(), profile.getUser().getId())) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();

        DonorRequestMatch match = new DonorRequestMatch();
        match.setRequest(request);
        match.setDonor(profile.getUser());
        match.setDistanceKm(distanceKm);
        match.setStatus(MatchStatus.NOTIFIED);
        match.setNotifiedAt(now);
        donorRequestMatchRepository.save(match);

        boolean urgent = request.getUrgency() == UrgencyLevel.HIGH
                || request.getUrgency() == UrgencyLevel.CRITICAL;

        notificationService.createNotification(
                profile.getUser(),
                urgent ? "Urgent blood request near you" : "Blood request near you",
                request.getBloodGroup() + " blood needed at " + request.getHospitalName()
                        + (request.getCity() != null ? ", " + request.getCity() : "")
                        + " (" + request.getUnitsRequired() + " unit(s), urgency "
                        + request.getUrgency() + ").",
                urgent ? NotificationType.URGENT_REQUEST : NotificationType.SYSTEM
        );

        return true;
    }

    public List<DistrictDonorCountDto> getDonorCountByDistrict() {

        List<Object[]> result = userProfileRepository.getDonorCountByDistrict();

        return result.stream()
                .map(row -> new DistrictDonorCountDto(
                        (String) row[0],
                        (Long) row[1]
                ))
                .toList();
    }

    public List<DonorTableDto> getAllDonorsForTable() {

        List<UserProfile> donors = userProfileRepository.getAllDonors();

        return donors.stream()
                .map(donor -> {

                    String initials = Arrays.stream(donor.getFullName().trim().split("\\s+"))
                            .filter(word -> !word.isEmpty())
                            .map(word -> word.substring(0, 1).toUpperCase())
                            .collect(Collectors.joining());

                    String location = donor.getCity() + ", " + donor.getState();

                    String lastDonated = donor.getLastDonationDate() == null
                            ? "Never"
                            : getTimeAgo(donor.getLastDonationDate());

                    return new DonorTableDto(
                            initials,
                            donor.getFullName(),
                            donor.getBloodGroup() != null
                                    ? donor.getBloodGroup().toString()
                                    : "Unknown",
                            location,
                            lastDonated,
                            donor.isAvailable()
                    );
                })
                .toList();
    }

    private String getTimeAgo(LocalDate donationDate) {

        Period period = Period.between(donationDate, LocalDate.now());

        if (period.getYears() > 0) {
            return period.getYears() + (period.getYears() == 1 ? " year ago" : " years ago");
        }

        if (period.getMonths() > 0) {
            return period.getMonths() + (period.getMonths() == 1 ? " month ago" : " months ago");
        }

        return period.getDays() + (period.getDays() == 1 ? " day ago" : " days ago");
    }

    private DonarResponseDto mapToDto(UserProfile profile, LocalDate today) {

        DonarResponseDto dto = new DonarResponseDto();

        dto.setId(profile.getUser().getId());
        dto.setName(profile.getFullName());
        dto.setBloodGroup(profile.getBloodGroup());
        dto.setCity(profile.getCity());
        dto.setDistrict(profile.getDistrict());
        dto.setState(profile.getState());
        dto.setAvailable(profile.isAvailable());
        dto.setEligible(DonationRules.isEligible(profile.getLastDonationDate(), today));
        dto.setPhone(profile.getPhone());
        dto.setLat(profile.getLat());
        dto.setLon(profile.getLon());

        return dto;
    }

    private double calculateDistanceKm(
            Point source,
            Point destination
    ) {

        final int EARTH_RADIUS_KM = 6371;

        double lat1 = source.getY();
        double lon1 = source.getX();

        double lat2 = destination.getY();
        double lon2 = destination.getX();

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2)
                        + Math.cos(Math.toRadians(lat1))
                        * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2)
                        * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        double distance = EARTH_RADIUS_KM * c;

        return Math.round(distance * 100.0) / 100.0;
    }

    /**
     * Manual donor search for hospitals. Blood group is an exact filter here
     * (the hospital explicitly chose it). Deactivated donors never appear.
     */
    public List<DonarResponseDto> searchDonors(
            String email,
            BloodGroup bloodGroup,
            Double radiusKm,
            String city,
            Boolean available,
            BloodGroup forRecipient,
            Double lat,
            Double lon
    ) {

        if (radiusKm != null) {
            DonationRules.validateRadius(radiusKm);
        }

        Hospital hospital = requireVerifiedHospital(email);
        Users loggedInUser = hospital.getUser();

        // forRecipient = "who can give to a patient of this group" (compatibility);
        // bloodGroup = exact donor group filter.
        List<String> groups = forRecipient != null
                ? DonationRules.names(DonationRules.donorsFor(forRecipient))
                : bloodGroup != null
                ? List.of(bloodGroup.name())
                : DonationRules.allGroupNames();

        LocalDate today = LocalDate.now();

        List<UserProfile> donors;
        Point searchLocation = null;

        if (radiusKm != null) {

            if (lat != null || lon != null) {
                // search around any place the hospital picked on the map
                DonationRules.validateCoordinates(lat, lon);
                Point p = new GeometryFactory(new PrecisionModel(), 4326)
                        .createPoint(new Coordinate(lon, lat));
                p.setSRID(4326);
                searchLocation = p;
            } else {
                searchLocation = hospital.getLocation();
            }

            if (searchLocation == null) {
                throw new IllegalArgumentException(
                        "Hospital location not set. Update your hospital profile with latitude and longitude");
            }

            donors = userProfileRepository.findNearbyDonors(
                    searchLocation,
                    radiusKm * 1000,
                    loggedInUser.getId(),
                    groups,
                    false,  // the "available" filter below decides
                    false,
                    DonationRules.eligibleBefore(today)
            );

        } else {
            donors = userProfileRepository.searchDonorsWithoutRadius(
                    loggedInUser.getId(),
                    groups
            );
        }

        final Point origin = searchLocation;

        return donors.stream()
                .filter(profile ->
                        city == null || profile.getCity().equalsIgnoreCase(city))
                .filter(profile ->
                        available == null || profile.isAvailable() == available)
                .map(profile -> {
                    DonarResponseDto dto = mapToDto(profile, today);
                    if (origin != null) {
                        dto.setDistanceKm(calculateDistanceKm(origin, profile.getLocation()));
                    }
                    return dto;
                })
                .toList();
    }

    private Hospital requireVerifiedHospital(String email) {

        Hospital hospital = hospitalProfileRepository
                .findByUserEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Hospital profile not found"));

        if (!hospital.isVerifiedByAdmin()) {
            throw new BusinessRuleException(HttpStatus.FORBIDDEN,
                    "Your hospital must be verified by an admin before contacting donors");
        }

        return hospital;
    }
}
