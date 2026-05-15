package blood_donation.health.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminHospitalDto {

    private Long id;

    private String hospitalName;

    private String licenseNumber;

    private String emergencyContact;

    private String website;

    private boolean verifiedByAdmin;

    private String email;
}