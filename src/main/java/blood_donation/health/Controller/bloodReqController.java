package blood_donation.health.Controller;

import blood_donation.health.DTO.BloodReqDto;
import blood_donation.health.service.BloodRequestService;
import lombok.AllArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/requestBlood")
@AllArgsConstructor
public class bloodReqController {

    private final BloodRequestService bloodRequestService;

    @PostMapping()
    public Long request(@RequestBody BloodReqDto bloodReqDto, Authentication authentication) {

        String email = authentication.getName();

        return bloodRequestService.createBloodRequest(bloodReqDto, email);
    }
}
