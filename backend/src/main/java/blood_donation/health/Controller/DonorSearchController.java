package blood_donation.health.Controller;

import blood_donation.health.DTO.ApiResponse;
import blood_donation.health.DTO.DistrictDonorCountDto;
import blood_donation.health.DTO.DonarResponseDto;
import blood_donation.health.DTO.DonorTableDto;
import blood_donation.health.Entity.Enum.BloodGroup;
import blood_donation.health.service.DonarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<ApiResponse<List<DonarResponseDto>>> searchBloodReq(
            @RequestParam(required = false) BloodGroup bloodGroup,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) BloodGroup forRecipient,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            Authentication authentication
    ){

        String email = authentication.getName();
        List<DonarResponseDto> availableDonors = donorService.searchDonors(email, bloodGroup, radiusKm, city, available, forRecipient, lat, lon);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success("Donor fetched successfully", availableDonors));
    }

    @GetMapping("/district-count")
    public ResponseEntity<ApiResponse<List<DistrictDonorCountDto>>> getDonorCountByDistrict() {

        List<DistrictDonorCountDto> data = donorService.getDonorCountByDistrict();

        return ResponseEntity.ok(
                ApiResponse.success(
                        "District wise donor count fetched successfully",
                        data
                )
        );
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('HOSPITAL', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<DonorTableDto>>> getAllDonors() {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Donors fetched successfully",
                        donorService.getAllDonorsForTable()
                )
        );
    }
}
