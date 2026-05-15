package blood_donation.health.Controller;

import blood_donation.health.DTO.ApiResponse;
import blood_donation.health.DTO.DonarResponseDto;
import blood_donation.health.Entity.Enum.BloodGroup;
import blood_donation.health.service.DonarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/donors")
@RequiredArgsConstructor
public class DonorSearchController {

    private final DonarService donorService;

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<DonarResponseDto>>> searchBloodReq(
            @RequestParam(required = false) BloodGroup bloodGroup,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Boolean available,
            Authentication authentication
    ){

        String email = authentication.getName();
        List<DonarResponseDto> availableDonors = donorService.searchDonors(email, bloodGroup, radiusKm, city, available);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success("Donor fetched successfully", availableDonors));
    }
}
