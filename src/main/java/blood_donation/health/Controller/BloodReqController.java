package blood_donation.health.Controller;

import blood_donation.health.DTO.BloodReqDto;
import blood_donation.health.DTO.ApiResponse;
import blood_donation.health.DTO.DonarResponseDto;
import blood_donation.health.DTO.NearbyBloodRequestDto;
import blood_donation.health.Entity.Enum.BloodGroup;
import blood_donation.health.Entity.Enum.RequestStatus;
import blood_donation.health.service.BloodRequestService;
import blood_donation.health.service.DonarService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/requestBlood")
@AllArgsConstructor
public class BloodReqController {

    private final BloodRequestService bloodRequestService;
    private final DonarService donorService;

    @PostMapping
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> request(
            @Valid @RequestBody BloodReqDto bloodReqDto,
            Authentication authentication) {

        String email = authentication.getName();
        Long requestId = bloodRequestService.createBloodRequest(bloodReqDto, email);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created(
                        "Blood request created successfully",
                        Map.of("requestId", requestId)
                ));
    }

    @GetMapping("/nearby")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<ApiResponse<List<DonarResponseDto>>> nearByDonar(
            @RequestParam double radiusKm,
            @RequestParam(required = false) Long bloodReqId,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Nearby donors fetched successfully",
                        donorService.getNearbyDonors(
                                bloodReqId,
                                radiusKm,
                                email
                        )
                )
        );
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<ApiResponse<List<BloodReqDto>>> myBloodReq(Authentication authentication) {

        String email = authentication.getName();
        List<BloodReqDto> myRequests = bloodRequestService.getMyRequests(email);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success("Requests fetched successfully", myRequests));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<ApiResponse<Void>> bloodReqStatus(
            @PathVariable Long id,
            @RequestParam RequestStatus status,
            Authentication authentication
    ) {

        String email = authentication.getName();

        bloodRequestService.updateRequestStatus(
                id,
                status,
                email
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Blood request status updated successfully",
                        null
                )
        );
    }

    @GetMapping("/nearby-requests")
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<
            ApiResponse<List<NearbyBloodRequestDto>>
            > nearbyRequests(

            @RequestParam double radiusKm,
            Authentication authentication
    ) {

        String email = authentication.getName();

        List<NearbyBloodRequestDto> requests =
                bloodRequestService.getNearbyRequests(
                        radiusKm,
                        email
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Nearby blood requests fetched successfully",
                        requests
                )
        );
    }
}