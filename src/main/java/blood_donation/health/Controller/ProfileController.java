package blood_donation.health.Controller;

import blood_donation.health.DTO.ProfileDto;
import blood_donation.health.service.ProfileService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/Profile")
@AllArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @PostMapping("/CompleteProfile")
    public String CompleteProfile(@RequestBody ProfileDto profileDto) {
        return profileService.CompleteProfile(profileDto, "user@gmail.com");
    }
}
