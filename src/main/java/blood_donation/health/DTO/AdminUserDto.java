package blood_donation.health.DTO;

import blood_donation.health.Entity.Enum.Role;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Set;

@Getter
@Setter
public class AdminUserDto {

    private Long id;

    private String email;

    private Set<Role> roles;

    private boolean active;

    private boolean verified;

    private LocalDateTime createdAt;
}