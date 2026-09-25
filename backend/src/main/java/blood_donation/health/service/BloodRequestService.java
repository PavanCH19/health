package blood_donation.health.service;

import blood_donation.health.DTO.BloodReqDto;
import blood_donation.health.DTO.NearbyBloodRequestDto;
import blood_donation.health.DTO.NearbyBloodRequestProjection;
import blood_donation.health.Entity.BloodRequest;
import blood_donation.health.Entity.Enum.BloodGroup;
import blood_donation.health.Entity.Enum.RequestStatus;
import blood_donation.health.Entity.Enum.UrgencyLevel;
import blood_donation.health.Entity.Hospital;
import blood_donation.health.Entity.UserProfile;
import blood_donation.health.Entity.Users;
import blood_donation.health.Utils.BusinessRuleException;
import blood_donation.health.Utils.DonationRules;
import blood_donation.health.Utils.ResourceNotFoundException;
import blood_donation.health.repository.BloodRequestRepository;
import blood_donation.health.repository.HospitalProfileRepository;
import blood_donation.health.repository.UserProfileRepository;
import blood_donation.health.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static blood_donation.health.Entity.Enum.RequestStatus.*;

@Service
@RequiredArgsConstructor
public class BloodRequestService {

    // Allowed manual status transitions. FULFILLED and CANCELLED are final.
    private static final Map<RequestStatus, Set<RequestStatus>> ALLOWED_TRANSITIONS =
            new EnumMap<>(RequestStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(OPEN, Set.of(MATCHING, FULFILLED, CANCELLED));
        ALLOWED_TRANSITIONS.put(MATCHING, Set.of(OPEN, FULFILLED, CANCELLED));
        ALLOWED_TRANSITIONS.put(FULFILLED, Set.of());
        ALLOWED_TRANSITIONS.put(CANCELLED, Set.of());
    }

    private final BloodRequestRepository bloodRequestRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final HospitalProfileRepository hospitalProfileRepository;

    @Transactional
    public Long createBloodRequest(BloodReqDto bloodReqDto, String email) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found with email: " + email)
                );

        // Only admin-verified hospitals may raise blood requests
        Hospital hospital = hospitalProfileRepository.findByUserEmail(email)
                .orElseThrow(() ->
                        new BusinessRuleException(HttpStatus.FORBIDDEN,
                                "Complete your hospital profile before creating blood requests"));

        if (!hospital.isVerifiedByAdmin()) {
            throw new BusinessRuleException(HttpStatus.FORBIDDEN,
                    "Your hospital must be verified by an admin before creating blood requests");
        }

        DonationRules.validateCoordinates(
                bloodReqDto.getLatitude(), bloodReqDto.getLongitude());

        LocalDateTime now = LocalDateTime.now();

        if (bloodReqDto.getRequiredBefore() != null
                && !bloodReqDto.getRequiredBefore().isAfter(now)) {
            throw new IllegalArgumentException("requiredBefore must be in the future");
        }

        BloodRequest bloodRequest = new BloodRequest();

        bloodRequest.setRequestedBy(user);
        bloodRequest.setBloodGroup(bloodReqDto.getBloodGroup());
        bloodRequest.setUnitsRequired(bloodReqDto.getUnitsRequired());
        bloodRequest.setUrgency(bloodReqDto.getUrgency());
        bloodRequest.setPatientName(bloodReqDto.getPatientName());
        bloodRequest.setContactName(bloodReqDto.getContactName());
        bloodRequest.setContactPhone(bloodReqDto.getContactPhone());
        bloodRequest.setHospitalName(bloodReqDto.getHospitalName());
        bloodRequest.setNotes(bloodReqDto.getNotes());
        bloodRequest.setCity(bloodReqDto.getCity());
        bloodRequest.setDistrict(bloodReqDto.getDistrict());
        bloodRequest.setState(bloodReqDto.getState());
        bloodRequest.setRequiredBefore(bloodReqDto.getRequiredBefore());

        // A new request always starts OPEN - the client must not pick the status
        bloodRequest.setStatus(OPEN);

        bloodRequest.setCreatedAt(now);
        bloodRequest.setUpdatedAt(now);

        GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        Point point = geometryFactory.createPoint(
                new Coordinate(
                        bloodReqDto.getLongitude(),
                        bloodReqDto.getLatitude()
                )
        );
        point.setSRID(4326);
        bloodRequest.setLocation(point);

        return bloodRequestRepository.save(bloodRequest).getId();
    }

    @Transactional
    public List<BloodReqDto> getMyRequests(String email) {

        userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found"));

        return bloodRequestRepository
                .findByRequestedByEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    private BloodReqDto mapToDto(BloodRequest request) {

        BloodReqDto dto = new BloodReqDto();

        dto.setId(request.getId());
        dto.setRequestedById(request.getRequestedBy().getId());

        dto.setBloodGroup(request.getBloodGroup());
        dto.setUnitsRequired(request.getUnitsRequired());
        dto.setUrgency(request.getUrgency());

        dto.setPatientName(request.getPatientName());

        dto.setContactName(request.getContactName());
        dto.setContactPhone(request.getContactPhone());

        dto.setHospitalName(request.getHospitalName());
        dto.setNotes(request.getNotes());

        dto.setCity(request.getCity());
        dto.setDistrict(request.getDistrict());
        dto.setState(request.getState());

        dto.setStatus(request.getStatus());

        dto.setRequiredBefore(request.getRequiredBefore());

        dto.setCreatedAt(request.getCreatedAt());
        dto.setUpdatedAt(request.getUpdatedAt());

        if (request.getLocation() != null) {
            dto.setLatitude(request.getLocation().getY());
            dto.setLongitude(request.getLocation().getX());
        }

        return dto;
    }

    @Transactional
    public void updateRequestStatus(
            Long requestId,
            RequestStatus newStatus,
            String email
    ) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found"));

        BloodRequest request = bloodRequestRepository
                .findById(requestId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Blood request not found"));

        if (!request.getRequestedBy().getId().equals(user.getId())) {
            throw new BusinessRuleException(HttpStatus.FORBIDDEN,
                    "You are not allowed to update this request");
        }

        RequestStatus current = request.getStatus();

        if (current == newStatus) {
            return; // idempotent
        }

        if (!ALLOWED_TRANSITIONS.getOrDefault(current, Set.of()).contains(newStatus)) {
            throw new BusinessRuleException(HttpStatus.CONFLICT,
                    "Cannot change request status from " + current + " to " + newStatus);
        }

        request.setStatus(newStatus);
        request.setUpdatedAt(LocalDateTime.now());

        bloodRequestRepository.save(request);
    }

    /**
     * Cancels every OPEN/MATCHING request of a user. Used when a hospital
     * account is deactivated or blocked so donors are not sent to it.
     */
    @Transactional
    public void cancelActiveRequestsOf(Long userId) {

        List<BloodRequest> active = bloodRequestRepository
                .findByRequestedBy_IdAndStatusIn(userId, DonationRules.ACTIVE_REQUEST_STATUSES);

        LocalDateTime now = LocalDateTime.now();

        for (BloodRequest request : active) {
            request.setStatus(CANCELLED);
            request.setUpdatedAt(now);
        }

        bloodRequestRepository.saveAll(active);
    }

    /**
     * Requests near the donor that the donor's blood group can actually serve.
     */
    public List<NearbyBloodRequestDto> getNearbyRequests(
            double radiusKm,
            String email
    ) {

        DonationRules.validateRadius(radiusKm);

        UserProfile profile = userProfileRepository
                .findByUserEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Profile not found. Please complete your profile first."));

        if (profile.getBloodGroup() == null) {
            throw new IllegalArgumentException(
                    "Add your blood group to your profile to see matching requests");
        }

        Point userLocation = profile.getLocation();

        if (userLocation == null) {
            throw new IllegalArgumentException(
                    "Add your location to your profile to see nearby requests");
        }

        List<String> servableGroups = DonationRules.names(
                DonationRules.recipientsFor(profile.getBloodGroup()));

        List<NearbyBloodRequestProjection> requests =
                bloodRequestRepository.findNearbyRequests(
                        userLocation,
                        radiusKm,
                        servableGroups,
                        LocalDateTime.now()
                );

        return requests.stream()
                .map(this::mapProjectionToDto)
                .toList();
    }

    private NearbyBloodRequestDto mapProjectionToDto(
            NearbyBloodRequestProjection p
    ) {

        NearbyBloodRequestDto dto = new NearbyBloodRequestDto();

        dto.setId(p.getId());
        dto.setHospitalName(p.getHospitalName());
        dto.setBloodGroup(BloodGroup.valueOf(p.getBloodGroup()));
        dto.setUnits(p.getUnitsRequired());
        dto.setRecipientName(p.getPatientName());
        dto.setUrgency(UrgencyLevel.valueOf(p.getUrgency()));
        dto.setStatus(RequestStatus.valueOf(p.getStatus()));
        dto.setCity(p.getCity());
        dto.setDistrict(p.getDistrict());
        dto.setState(p.getState());
        dto.setLat(p.getLat());
        dto.setLng(p.getLng());
        dto.setDistanceKm(p.getDistanceKm());
        dto.setCreatedAt(p.getCreatedAt());
        dto.setContactName(p.getContactName());
        dto.setContactPhone(p.getContactPhone());
        dto.setRequiredBefore(p.getRequiredBefore());

        return dto;
    }
}
