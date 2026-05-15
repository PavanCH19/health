package blood_donation.health.DTO;

import blood_donation.health.DTO.DonarResponseDto;
import blood_donation.health.DTO.NotificationDto;
import blood_donation.health.DTO.ProfileResponseDto;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class DonorDashboardDto {

    private ProfileResponseDto profile;

    private DonationEligibilityDto donationEligibility;

    private List<NearbyRequestDto> nearbyRequests;

    private DonationStatsDto donationStats;

    private List<NotificationDto> notifications;
}