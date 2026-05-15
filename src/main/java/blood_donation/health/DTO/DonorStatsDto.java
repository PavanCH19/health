package blood_donation.health.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DonorStatsDto {

    private long totalDonors;

    private long availableDonors;

    private long matchedDonors;
}