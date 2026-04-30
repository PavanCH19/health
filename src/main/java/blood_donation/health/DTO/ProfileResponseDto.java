package blood_donation.health.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProfileResponseDto {
    private Long id;
    private String name;
    private long phone;
    private String city;
    private String district;
    private String state;
    private String email; // from User
}