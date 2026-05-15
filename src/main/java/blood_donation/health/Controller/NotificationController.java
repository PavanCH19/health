package blood_donation.health.Controller;

import blood_donation.health.DTO.ApiResponse;
import blood_donation.health.DTO.NotificationDto;
import blood_donation.health.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // GET MY NOTIFICATIONS
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationDto>>>
    getNotifications(
            Authentication authentication
    ) {

        String email = authentication.getName();

        List<NotificationDto> notifications =
                notificationService.getMyNotifications(
                        email
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Notifications fetched successfully",
                        notifications
                )
        );
    }

    // MARK AS READ
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<String>>
    markAsRead(
            @PathVariable Long id,
            Authentication authentication
    ) {

        String email = authentication.getName();

        String response =
                notificationService.markAsRead(
                        id,
                        email
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        response,
                        null
                )
        );
    }

    // UNREAD COUNT
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>>
    unreadCount(
            Authentication authentication
    ) {

        String email = authentication.getName();

        long count =
                notificationService.getUnreadCount(
                        email
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Unread count fetched successfully",
                        Map.of("count", count)
                )
        );
    }
}