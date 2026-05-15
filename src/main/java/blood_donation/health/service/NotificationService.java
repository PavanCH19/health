package blood_donation.health.service;

import blood_donation.health.DTO.NotificationDto;
import blood_donation.health.Entity.Notification;
import blood_donation.health.Entity.Users;
import blood_donation.health.repository.NotificationRepository;
import blood_donation.health.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    // GET MY NOTIFICATIONS
    public List<NotificationDto> getMyNotifications(
            String email
    ) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found"
                        ));

        List<Notification> notifications =
                notificationRepository
                        .findByUser_idOrderByCreatedAtDesc(
                                user.getId()
                        );

        return notifications.stream()
                .map(this::mapToDto)
                .toList();
    }

    // MARK AS READ
    public String markAsRead(
            Long notificationId,
            String email
    ) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found"
                        ));

        Notification notification =
                notificationRepository
                        .findByIdAndUser_id(
                                notificationId,
                                user.getId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Notification not found"
                                ));

        notification.setRead(true);

        notificationRepository.save(notification);

        return "Notification marked as read";
    }

    // CREATE NOTIFICATION (internal use)
    public void createNotification(
            Users user,
            String title,
            String body,
            blood_donation.health.Entity.Enum.NotificationType type
    ) {

        Notification notification =
                new Notification();

        notification.setUser(user);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setType(type);

        notificationRepository.save(notification);
    }

    // UNREAD COUNT
    public long getUnreadCount(String email) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found"
                        ));

        return notificationRepository
                .countByUser_idAndIsReadFalse(
                        user.getId()
                );
    }

    private NotificationDto mapToDto(
            Notification notification
    ) {

        NotificationDto dto =
                new NotificationDto();

        dto.setId(notification.getId());
        dto.setType(notification.getType());
        dto.setTitle(notification.getTitle());
        dto.setBody(notification.getBody());
        dto.setRead(notification.isRead());
        dto.setCreatedAt(notification.getCreatedAt());

        return dto;
    }
}