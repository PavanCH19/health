package blood_donation.health.service;

import blood_donation.health.DTO.AdminHospitalDto;
import blood_donation.health.DTO.AdminUserDto;
import blood_donation.health.Entity.Hospital;
import blood_donation.health.Entity.Users;
import blood_donation.health.repository.HospitalProfileRepository;
import blood_donation.health.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final HospitalProfileRepository hospitalRepository;

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
                .findByVerifiedByAdminFalse()
                .stream()
                .map(this::mapHospitalToDto)
                .toList();
    }

    // VERIFY HOSPITAL
    public String verifyHospital(
            Long hospitalId
    ) {

        Hospital hospital =
                hospitalRepository.findById(hospitalId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Hospital not found"
                                ));

        hospital.setVerifiedByAdmin(true);

        hospitalRepository.save(hospital);

        return "Hospital verified successfully";
    }

    // BLOCK USER
    public String blockUser(Long userId) {

        Users user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found"
                        ));

        user.setActive(false);

        userRepository.save(user);

        return "User blocked successfully";
    }

    // UNBLOCK USER
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