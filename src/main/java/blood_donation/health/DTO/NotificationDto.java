package blood_donation.health.DTO;

import blood_donation.health.Entity.Enum.NotificationType;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class NotificationDto {

    private Long id;

    private NotificationType type;

    private String title;

    private String body;

    private boolean read;

    private LocalDateTime createdAt;
}