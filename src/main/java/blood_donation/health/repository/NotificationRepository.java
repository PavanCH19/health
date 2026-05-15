package blood_donation.health.repository;

import blood_donation.health.Entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUser_idOrderByCreatedAtDesc(
            Long userId
    );

    Optional<Notification> findByIdAndUser_id(
            Long id,
            Long userId
    );

    long countByUser_idAndIsReadFalse(
            Long userId
    );
}