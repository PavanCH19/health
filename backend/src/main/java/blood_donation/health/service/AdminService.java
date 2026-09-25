package blood_donation.health.service;

import blood_donation.health.DTO.AdminHospitalDto;
import blood_donation.health.DTO.AdminUserDto;
import blood_donation.health.Entity.Hospital;
import blood_donation.health.Entity.Users;
import blood_donation.health.repository.HospitalProfileRepository;
import blood_donation.health.repository.UserRepository;
import blood_donation.health.Entity.Enum.Role;
import blood_donation.health.Utils.BusinessRuleException;
import blood_donation.health.Utils.ResourceNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final HospitalProfileRepository hospitalRepository;
    private final BloodRequestService bloodRequestService;

    // GET ALL USERS
    public List<AdminUserDto> getAllUsers() {

        return userRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapUserToDto)
                .toList();
    }

    // GET UNVERIFIED HOSPITALS
    public List<AdminHospitalDto> getPendingHospitals() {

        return hospitalRepository
                .findByVerifiedByAdminFalseAndUser_ActiveTrue()
                .stream()
                .map(this::mapHospitalToDto)
                .toList();
    }

    // VERIFY HOSPITAL
    @Transactional
    public String verifyHospital(
            Long hospitalId
    ) {

        Hospital hospital =
                hospitalRepository.findById(hospitalId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Hospital not found"
                                ));

        hospital.setVerifiedByAdmin(true);

        hospitalRepository.save(hospital);

        return "Hospital verified successfully";
    }

    // BLOCK USER
    @Transactional
    public String blockUser(Long userId) {

        Users user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found"
                        ));

        // an admin must not lock out admins (including themselves)
        if (user.getRoles().contains(Role.ADMIN)) {
            throw new BusinessRuleException(
                    HttpStatus.FORBIDDEN, "Admin accounts cannot be blocked");
        }

        user.setActive(false);

        // a blocked donor must disappear from search / matching
        if (user.getProfile() != null) {
            user.getProfile().setAvailable(false);
        }

        userRepository.save(user);

        // a blocked hospital must not keep requests open
        bloodRequestService.cancelActiveRequestsOf(userId);

        return "User blocked successfully";
    }

    // UNBLOCK USER
    @Transactional
    public String unblockUser(Long userId) {

        Users user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found"
                        ));

        user.setActive(true);

        userRepository.save(user);

        return "User unblocked successfully";
    }

    // =========================================================
    // MAPPERS
    // =========================================================

    private AdminUserDto mapUserToDto(
            Users user
    ) {

        AdminUserDto dto =
                new AdminUserDto();

        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setRoles(user.getRoles());
        dto.setActive(user.isActive());
        dto.setVerified(user.isVerified());
        dto.setCreatedAt(user.getCreatedAt());

        return dto;
    }

    private AdminHospitalDto mapHospitalToDto(
            Hospital hospital
    ) {

        AdminHospitalDto dto =
                new AdminHospitalDto();

        dto.setId(hospital.getUser().getId());

        dto.setHospitalName(
                hospital.getHospitalName()
        );

        dto.setLicenseNumber(
                hospital.getLicenseNumber()
        );

        dto.setEmergencyContact(
                hospital.getEmergencyContact()
        );

        dto.setWebsite(
                hospital.getWebsite()
        );

        dto.setVerifiedByAdmin(
                hospital.isVerifiedByAdmin()
        );

        dto.setEmail(
                hospital.getUser().getEmail()
        );

        return dto;
    }
}