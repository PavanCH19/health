package blood_donation.health.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DonationStatsDto {

    private long totalDonations;

    private long livesSaved;
}