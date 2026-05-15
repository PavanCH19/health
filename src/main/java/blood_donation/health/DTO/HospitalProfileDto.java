package blood_donation.health.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HospitalProfileDto {

    @NotBlank(message = "Hospital name is required")
    private String hospitalName;

    private String licenseNumber;

    private String emergencyContact;

    private String website;
}