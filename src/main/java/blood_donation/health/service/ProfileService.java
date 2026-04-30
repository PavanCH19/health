package blood_donation.health.service;

import blood_donation.health.DTO.ProfileRequestDto;
import blood_donation.health.DTO.ProfileResponseDto;
import blood_donation.health.Entity.User;
import blood_donation.health.Entity.UserProfile;
import blood_donation.health.repository.UserProfileRepository;
import blood_donation.health.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
@Transactional
public class ProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;

    // CREATE PROFILE
    public String completeProfile(ProfileRequestDto dto, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if (user.getProfile() != null) {
            throw new RuntimeException("Profile already exists for this user");
        }

        UserProfile profile = new UserProfile();
        mapDtoToEntity(dto, profile);

        // SET BOTH SIDES (IMPORTANT)
        profile.setUser(user);
        user.setProfile(profile);

        userProfileRepository.save(profile);

        return "Profile created successfully";
    }

    // GET PROFILE
    @Transactional(Transactional.TxType.SUPPORTS)
    public ProfileResponseDto getMyProfile(String email) {

        UserProfile profile = userProfileRepository.findByUserEmail(email)
                .orElseThrow(() -> new RuntimeException("Profile not found for email: " + email));

        return mapEntityToDto(profile);
    }

    // UPDATE PROFILE
    public String updateProfile(ProfileRequestDto dto, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        UserProfile profile = user.getProfile();

        if (profile == null) {
            throw new RuntimeException("Profile not found. Please complete profile first.");
        }

        mapDtoToEntity(dto, profile);

        return "Profile updated successfully";
    }

    // DELETE PROFILE (DELETE USER + PROFILE)
    public String deleteProfile(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        userRepository.delete(user); // cascade will delete profile

        return "Profile deleted successfully";
    }

    // =========================
    // MAPPING METHODS (CLEAN CODE)
    // =========================
    private void mapDtoToEntity(ProfileRequestDto dto, UserProfile profile) {
        profile.setName(dto.getName());
        profile.setPhone(dto.getPhone());
        profile.setCity(dto.getCity());
        profile.setDistrict(dto.getDistrict());
        profile.setState(dto.getState());
    }

    private ProfileResponseDto mapEntityToDto(UserProfile profile) {

        ProfileResponseDto dto = new ProfileResponseDto();

        dto.setId(profile.getId());
        dto.setName(profile.getName());
        dto.setPhone(profile.getPhone());
        dto.setCity(profile.getCity());
        dto.setDistrict(profile.getDistrict());
        dto.setState(profile.getState());
        dto.setEmail(profile.getUser().getEmail());

        return dto;
    }
}