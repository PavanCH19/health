package blood_donation.health.Controller;

import blood_donation.health.DTO.ApiResponse;
import blood_donation.health.DTO.DonationDto;
import blood_donation.health.service.DonationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/donations")
@PreAuthorize("hasRole('DONOR')")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;

    // CREATE
    @PostMapping
    public ResponseEntity<ApiResponse<Long>> createDonation(
            @Valid  @RequestBody  DonationDto dto, Authentication authentication ) {

        String email = authentication.getName();

        Long donationId = donationService.createDonation( dto, email );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created("Donation added successfully", donationId));
    }

    // GET MY DONATIONS
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<DonationDto>>> getMyDonations( Authentication authentication ) {

        String email = authentication.getName();

        List<DonationDto> donations = donationService.getMyDonations( email );

        return ResponseEntity
                .ok(ApiResponse.success("Donations fetched successfully", donations ));
    }
}