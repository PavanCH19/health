package blood_donation.health.DTO;

import blood_donation.health.Entity.Enum.BloodGroup;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ProfileRequestDto {
    private String name;
    private String phone;
    private String village;
    private String city;
    private String district;
    private String state;
    private  BloodGroup bloodGroup;
    private LocalDate birthDate;
    private Double lat;
    private Double lon;
}