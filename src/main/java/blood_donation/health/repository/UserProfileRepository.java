package blood_donation.health.repository;

import blood_donation.health.Entity.UserProfile;
import org.springframework.context.annotation.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Integer> {
//    Optional<Profile> findByEmail(String email);
}
