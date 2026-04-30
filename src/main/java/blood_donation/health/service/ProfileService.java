package blood_donation.health.service;

import blood_donation.health.DTO.ProfileDto;
import blood_donation.health.Entity.User;
import blood_donation.health.Entity.UserProfile;
import blood_donation.health.repository.UserProfileRepository;
import blood_donation.health.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class ProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;

    public String CompleteProfile(ProfileDto profileDto, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfile userProfile = new UserProfile(
                profileDto.getName(),
                profileDto.getPhone(),
                profileDto.getCity(),
                profileDto.getDistrict(),
                profileDto.getState()
        );

        userProfile.setUser(user);

        userProfileRepository.save(userProfile);

        return "Profile successfully completed";
    }
}
