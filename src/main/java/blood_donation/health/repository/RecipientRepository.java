package blood_donation.health.repository;

import blood_donation.health.Entity.Recipient;
import blood_donation.health.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RecipientRepository extends JpaRepository<Recipient, Long> {
    Optional<Recipient> findByUser(User user);
}
