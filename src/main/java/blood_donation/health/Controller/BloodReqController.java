package blood_donation.health.Controller;

import blood_donation.health.DTO.BloodReqDto;
import blood_donation.health.DTO.ApiResponse;
import blood_donation.health.service.BloodRequestService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/requestBlood")
@AllArgsConstructor
public class BloodReqController {

    private final BloodRequestService bloodRequestService;

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Long>>> request(
            @RequestBody BloodReqDto bloodReqDto,
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
}