package blood_donation.health.service;

import blood_donation.health.DTO.*;
import blood_donation.health.Entity.Users;
import blood_donation.health.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;

    private final ProfileService profileService;
    private final NotificationService notificationService;

    private final DonationRepository donationRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final UserProfileRepository userProfileRepository;
    private final DonarRequestMatchRepository donorRequestMatchRepository;

    // DONOR DASHBOARD
    public DonorDashboardDto donorDashboard(
            String email
    ) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found"
                        ));

        DonorDashboardDto dto =
                new DonorDashboardDto();

        // PROFILE
        dto.setProfile(
                profileService.getMyProfile(email)
        );

        // DONATION STATS
        DonationStatsDto stats =
                new DonationStatsDto();

        long totalDonations =
                donationRepository
                        .findByDonor_id(user.getId())
                        .size();

        stats.setTotalDonations(
                totalDonations
        );

        stats.setLivesSaved(
                totalDonations * 3
        );

        dto.setDonationStats(stats);

        // NOTIFICATIONS
        dto.setNotifications(
                notificationService
                        .getMyNotifications(email)
        );

        return dto;
    }

    // HOSPITAL DASHBOARD
    public HospitalDashboardDto hospitalDashboard(
            String email
    ) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found"
                        ));

        HospitalDashboardDto dto =
                new HospitalDashboardDto();

        DashboardSummaryDto summary =
                new DashboardSummaryDto();

        long activeRequests =
                bloodRequestRepository
                        .findByRequestedByEmail(email)
                        .size();

        summary.setActiveRequests(
                activeRequests
        );

        summary.setAvailableDonorsNearby(
                userProfileRepository.count()
        );

        dto.setDashboardSummary(summary);

        dto.setNotifications(
                notificationService
                        .getMyNotifications(email)
        );

        return dto;
    }
}