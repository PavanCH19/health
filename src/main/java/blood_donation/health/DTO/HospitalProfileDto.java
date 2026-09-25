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

    // LOCATION

    private String city;

    private String district;

    private String state;

    private String addressLine;

    private Double lat;

    private Double lon;

    // response only - ignored when the client sends it
    private boolean verifiedByAdmin;
}