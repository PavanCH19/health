package blood_donation.health.Controller;

import blood_donation.health.DTO.ProfileRequestDto;
import blood_donation.health.DTO.ProfileResponseDto;
import blood_donation.health.service.ProfileService;
import lombok.AllArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/Profile")
@AllArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @PostMapping("/CompleteProfile")
    public String completeProfile(@RequestBody ProfileRequestDto dto,
                                  Authentication authentication) {

        String email = authentication.getName(); // from JWT

        return profileService.completeProfile(dto, email);
    }

    @GetMapping("/me")
    public ProfileResponseDto getMyProfile(Authentication authentication) {

        String email = authentication.getName();

        return profileService.getMyProfile(email);
    }

    @PatchMapping("/updateProfile")
    public String updateProfile(@RequestBody ProfileRequestDto dto,
                                Authentication authentication) {

        String email = authentication.getName();

        return profileService.updateProfile(dto, email);
    }

    @DeleteMapping("/deleteProfile")
    public String deleteProfile(Authentication authentication) {

        String email = authentication.getName();

        return profileService.deleteProfile(email);
    }
}