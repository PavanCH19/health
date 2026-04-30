package blood_donation.health.repository;

import blood_donation.health.Entity.User;
import blood_donation.health.Entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByUser(User user);

    Optional<UserProfile> findByUserEmail(String email);
}
