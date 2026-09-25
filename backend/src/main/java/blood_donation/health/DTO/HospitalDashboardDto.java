package blood_donation.health.DTO;

import blood_donation.health.DTO.BloodReqDto;
import blood_donation.health.DTO.NotificationDto;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class HospitalDashboardDto {

    private DashboardSummaryDto dashboardSummary;

    private List<BloodReqDto> bloodRequests;

    private DonorStatsDto donorStats;

    private List<NotificationDto> notifications;

}