package blood_donation.health.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DonorTableDto {

    private String initials;
    private String fullName;
    private String bloodGroup;
    private String location;
    private String lastDonated;
    private boolean available;
}