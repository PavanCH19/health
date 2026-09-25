package blood_donation.health.repository;

import blood_donation.health.Entity.Enum.Role;
import blood_donation.health.Entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<Users, Long> {
    Optional<Users> findByEmail(String username);


    List<Users> findAllByOrderByCreatedAtDesc();
}
