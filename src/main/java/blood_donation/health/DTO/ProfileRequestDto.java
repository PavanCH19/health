package blood_donation.health.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProfileRequestDto {
    private String name;
    private long phone;
    private String city;
    private String district;
    private String state;
}