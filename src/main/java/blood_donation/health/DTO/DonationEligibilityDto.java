package blood_donation.health.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DonationEligibilityDto {

    private boolean eligible;

    private long daysUntilEligible;
}