package blood_donation.health.Controller;

import blood_donation.health.DTO.ApiResponse;
import blood_donation.health.DTO.DonorDashboardDto;
import blood_donation.health.DTO.HospitalDashboardDto;
import blood_donation.health.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    // DONOR DASHBOARD
    @GetMapping("/donor")
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<ApiResponse<DonorDashboardDto>>
    donorDashboard(
            Authentication authentication
    ) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Donor dashboard fetched successfully",
                        dashboardService.donorDashboard(email)
                )
        );
    }

    // HOSPITAL DASHBOARD
    @GetMapping("/hospital")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<ApiResponse<HospitalDashboardDto>>
    hospitalDashboard(
            Authentication authentication
    ) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Hospital dashboard fetched successfully",
                        dashboardService.hospitalDashboard(email)
                )
        );
    }
}