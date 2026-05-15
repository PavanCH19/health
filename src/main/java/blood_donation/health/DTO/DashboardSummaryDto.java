package blood_donation.health.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DashboardSummaryDto {

    private long activeRequests;

    private long availableDonorsNearby;
}