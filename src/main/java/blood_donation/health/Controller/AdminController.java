package blood_donation.health.Controller;

import blood_donation.health.DTO.ApiResponse;
import blood_donation.health.DTO.AdminHospitalDto;
import blood_donation.health.DTO.AdminUserDto;
import blood_donation.health.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // GET ALL USERS
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AdminUserDto>>> getAllUsers() {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Users fetched successfully",
                        adminService.getAllUsers()
                )
        );
    }

    // GET PENDING HOSPITALS
    @GetMapping("/hospitals/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AdminHospitalDto>>> getPendingHospitals() {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Pending hospitals fetched successfully",
                        adminService.getPendingHospitals()
                )
        );
    }

    // VERIFY HOSPITAL
    @PatchMapping("/hospitals/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> verifyHospital(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        adminService.verifyHospital(id),
                        null
                )
        );
    }

    // BLOCK USER
    @PatchMapping("/users/{id}/block")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>>
    blockUser(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        adminService.blockUser(id),
                        null
                )
        );
    }

    // UNBLOCK USER
    @PatchMapping("/users/{id}/unblock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>>
    unblockUser(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        adminService.unblockUser(id),
                        null
                )
        );
    }
}