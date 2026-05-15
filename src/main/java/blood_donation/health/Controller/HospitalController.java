package blood_donation.health.Controller;

import blood_donation.health.DTO.ApiResponse;
import blood_donation.health.DTO.HospitalProfileDto;
import blood_donation.health.service.HospitalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/hospital")
@RequiredArgsConstructor
public class HospitalController {

    private final HospitalService hospitalService;


    @PostMapping("/completeHospitalDetails")
    public ResponseEntity<ApiResponse<Void>> completeHospitalDetails(
            @Valid @RequestBody HospitalProfileDto hospitalProfileDto,
            Authentication authentication
    ) {
        String email = authentication.getName();

        hospitalService.completeHospitalDetails(
                email,
                hospitalProfileDto
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        ApiResponse.created(
                                "Hospital Profile created successfully",
                                null
                        )
                );
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<HospitalProfileDto>>
    getHospitalProfile(Authentication authentication) {

        String email = authentication.getName();

        HospitalProfileDto hospitalProfile =
                hospitalService.getHospitalProfile(email);

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                "Hospital Profile retrieved successfully",
                                hospitalProfile
                        )
                );
    }

    @PatchMapping("/update")
    public ResponseEntity<ApiResponse<String>> updateHospitalProfile(
            @RequestBody HospitalProfileDto dto,
            Authentication authentication
    ) {

        String email = authentication.getName();

        String response = hospitalService.updateHospitalProfile(
                email,
                dto
        );

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                response,
                                null
                        )
                );
    }

    @DeleteMapping("/delete")
    public ResponseEntity<ApiResponse<String>> deleteHospitalProfile(
            Authentication authentication
    ) {

        String email = authentication.getName();

        String response =
                hospitalService.deleteHospitalProfile(email);

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                response,
                                null
                        )
                );
    }
}