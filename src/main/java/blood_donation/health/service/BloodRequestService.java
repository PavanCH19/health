package blood_donation.health.service;

import blood_donation.health.DTO.BloodReqDto;
import blood_donation.health.Entity.BloodRequest;
import blood_donation.health.Entity.Enum.RequestStatus;
import blood_donation.health.Entity.Users;
import blood_donation.health.repository.BloodRequestRepository;
import blood_donation.health.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BloodRequestService {

    private final BloodRequestRepository bloodRequestRepository;
    private final UserRepository userRepository;

    public Long createBloodRequest(BloodReqDto bloodReqDto, String email) {

        // Fetch logged-in user
        Users user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found with email: " + email)
                );

        // Create BloodRequest object
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

        // Default status
        bloodRequest.setStatus(
                bloodReqDto.getStatus() != null
                        ? bloodReqDto.getStatus()
                        : RequestStatus.OPEN
        );

        // Set timestamps
        bloodRequest.setCreatedAt(LocalDateTime.now());
        bloodRequest.setUpdatedAt(LocalDateTime.now());

        // Convert latitude & longitude to Point
        GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        Point point = geometryFactory.createPoint(
                new Coordinate(
                        bloodReqDto.getLongitude(),
                        bloodReqDto.getLatitude()
                )
        );

        point.setSRID(4326);
        bloodRequest.setLocation(point);

        // Save
        BloodRequest savedRequest =
                bloodRequestRepository.save(bloodRequest);

        return savedRequest.getId();
    }

    public List<BloodReqDto> getMyRequests(String email) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found"
                        ));

        List<BloodRequest> requests =
                bloodRequestRepository.findByRequestedByEmail(email);

        return requests.stream()
                .map(this::mapToDto)
                .toList();
    }

    private BloodReqDto mapToDto(BloodRequest request) {

        BloodReqDto dto = new BloodReqDto();

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

        return dto;
    }

    @Transactional
    public void updateRequestStatus(
            Long requestId,
            RequestStatus status,
            String email
    ) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found"
                        ));

        BloodRequest request = bloodRequestRepository
                .findById(requestId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Blood request not found"
                        ));

        // Security check
        if (!request.getRequestedBy().getId()
                .equals(user.getId())) {
            throw new RuntimeException(
                    "You are not allowed to update this request"
            );
        }

        request.setStatus(status);
        request.setUpdatedAt(LocalDateTime.now());

        bloodRequestRepository.save(request);
    }
}