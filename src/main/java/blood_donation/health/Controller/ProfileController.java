package blood_donation.health.Controller;

import blood_donation.health.DTO.ProfileRequestDto;
import blood_donation.health.DTO.ProfileResponseDto;
import blood_donation.health.DTO.ApiResponse;
import blood_donation.health.service.ProfileService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/Profile")
@AllArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @PostMapping("/CompleteProfile")
    public ResponseEntity<ApiResponse<Void>> completeProfile(@Valid @RequestBody ProfileRequestDto dto,
                                                             Authentication authentication) {
        String email = authentication.getName();
        profileService.completeProfile(dto, email);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created("Profile created successfully", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<ProfileResponseDto>> getMyProfile(Authentication authentication) {
        String email = authentication.getName();
        ProfileResponseDto profile = profileService.getMyProfile(email);

        return ResponseEntity
                .ok(ApiResponse.success("Profile fetched successfully", profile));
    }

    @PatchMapping("/updateProfile")
    public ResponseEntity<ApiResponse<Void>> updateProfile(@RequestBody ProfileRequestDto dto,
                                                           Authentication authentication) {
        String email = authentication.getName();
        profileService.updateProfile(dto, email);

        return ResponseEntity
                .ok(ApiResponse.success("Profile updated successfully", null));
    }

    @DeleteMapping("/deleteProfile")
    public ResponseEntity<ApiResponse<Void>> deleteProfile(Authentication authentication) {
        String email = authentication.getName();
        profileService.deleteProfile(email);

        return ResponseEntity
                .ok(ApiResponse.success("Profile deleted successfully", null));
    }
}