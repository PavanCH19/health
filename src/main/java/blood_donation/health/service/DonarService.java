package blood_donation.health.service;

import blood_donation.health.DTO.DistrictDonorCountDto;
import blood_donation.health.DTO.DonarResponseDto;
import blood_donation.health.DTO.DonorTableDto;
import blood_donation.health.Entity.*;
import blood_donation.health.Entity.Enum.BloodGroup;
import blood_donation.health.repository.*;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Point;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DonarService {

    private final BloodRequestRepository bloodRequestRepository;
    private final UserProfileRepository userProfileRepository;
    private final DonarRequestMatchRepository donorRequestMatchRepository;

    private final HospitalProfileRepository  hospitalProfileRepository;

    public List<DonarResponseDto> getNearbyDonors(
            Long bloodReqId,
            double radiusKm,
            String email
    ) {

        Hospital hospital = hospitalProfileRepository
                .findByUserEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("Hospital not found"));

        Users loggedInUser = hospital.getUser();

        Point searchLocation;
        BloodRequest request = null;
        BloodGroup requiredBloodGroup = null;

        // CASE 1 -> Blood Request Search
        if (bloodReqId != null) {

            request = bloodRequestRepository.findById(bloodReqId)
                    .orElseThrow(() ->
                            new RuntimeException("Blood request not found"));

            searchLocation = request.getLocation();

            requiredBloodGroup = request.getBloodGroup();
        }

        // CASE 2 -> Logged-in user location search
        else {

            Hospital profile =
                    hospitalProfileRepository.findByUserEmail(email)
                            .orElseThrow(() ->
                                    new UsernameNotFoundException(
                                            "Hospital profile not found"
                                    ));

            if (profile.getLocation() == null) {
                throw new RuntimeException(
                        "Hospital location not found"
                );
            }

            searchLocation = profile.getLocation();
        }

        double radiusMeters = radiusKm * 1000;

        List<UserProfile> donors =
                userProfileRepository.findNearbyDonors(
                        searchLocation,
                        radiusMeters,
                        loggedInUser.getId(),
                        requiredBloodGroup != null
                                ? requiredBloodGroup.name()
                                : null
                );

        BloodRequest finalRequest = request;
        Point finalSearchLocation = searchLocation;

        return donors.stream()
                .map(profile -> {

                    DonarResponseDto dto = mapToDto(profile);

                    double distanceKm =
                            calculateDistanceKm(
                                    finalSearchLocation,
                                    profile.getLocation()
                            );

                    dto.setDistanceKm(distanceKm);

                    // Save donor match only for blood requests
                    if (finalRequest != null) {

                        boolean exists =
                                donorRequestMatchRepository
                                        .existsByRequest_IdAndDonor_Id(
                                                finalRequest.getId(),
                                                profile.getUser().getId()
                                        );

                        if (!exists) {

                            DonorRequestMatch match = new DonorRequestMatch();

                            match.setRequest(finalRequest);
                            match.setDonor(profile.getUser());
                            match.setDistanceKm(distanceKm);
                            match.setNotifiedAt(LocalDateTime.now());

                            donorRequestMatchRepository.save(match);
                        }
                    }

                    return dto;
                })
                .toList();
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

                    String initials = Arrays.stream(donor.getFullName().split(" "))
                            .map(word -> String.valueOf(word.charAt(0)))
                            .collect(Collectors.joining());

                    String location = donor.getCity() + ", " + donor.getState();

                    String lastDonated = donor.getLastDonationDate() == null
                            ? "Never"
                            : getTimeAgo(donor.getLastDonationDate());

                    return new DonorTableDto(
                            initials,
                            donor.getFullName(),
                            donor.getBloodGroup().toString(),
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
            return period.getYears() + " years ago";
        }

        if (period.getMonths() > 0) {
            return period.getMonths() + " months ago";
        }

        return period.getDays() + " days ago";
    }

    private DonarResponseDto mapToDto(UserProfile profile) {

        DonarResponseDto dto = new DonarResponseDto();

        dto.setId(profile.getUser().getId());
        dto.setName(profile.getFullName());
        dto.setBloodGroup(profile.getBloodGroup());
        dto.setCity(profile.getCity());
        dto.setDistrict(profile.getDistrict());
        dto.setState(profile.getState());
        dto.setAvailable(profile.isAvailable());
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

    public List<DonarResponseDto> searchDonors(
            String email,
            BloodGroup bloodGroup,
            Double radiusKm,
            String city,
            Boolean available
    ) {

        Hospital hospital = hospitalProfileRepository
                .findByUserEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("Hospital not found"));

        Users loggedInUser = hospital.getUser();

        List<UserProfile> donors;

        // CASE 1 -> Radius search
        if (radiusKm != null) {

            Hospital loggedInProfile =
            hospitalProfileRepository.findByUserEmail(email)
                            .orElseThrow(() ->
                                    new UsernameNotFoundException(
                                            "Hospital profile not found"
                                    ));

            Point searchLocation =
                    loggedInProfile.getLocation();

            donors = userProfileRepository.findNearbyDonors(
                    searchLocation,
                    radiusKm * 1000,
                    loggedInUser.getId(),
                    bloodGroup != null
                            ? bloodGroup.name()
                            : null
            );

            return donors.stream()

                    .filter(profile ->
                            city == null ||
                                    profile.getCity().equalsIgnoreCase(city)
                    )

                    .filter(profile ->
                            available == null ||
                                    profile.isAvailable() == available
                    )

                    .map(profile -> {

                        DonarResponseDto dto =
                                mapToDto(profile);

                        double distanceKm =
                                calculateDistanceKm(
                                        searchLocation,
                                        profile.getLocation()
                                );

                        dto.setDistanceKm(distanceKm);

                        return dto;
                    })

                    .toList();
        }

        // CASE 2 -> No radius search
        donors = userProfileRepository
                .searchDonorsWithoutRadius(
                        loggedInUser.getId(),
                        bloodGroup != null
                                ? bloodGroup.name()
                                : null
                );

        return donors.stream()

                .filter(profile ->
                        city == null ||
                                profile.getCity().equalsIgnoreCase(city)
                )

                .filter(profile ->
                        available == null ||
                                profile.isAvailable() == available
                )

                .map(this::mapToDto)

                .toList();
    }
}