package blood_donation.health.service;

import blood_donation.health.DTO.*;
import blood_donation.health.Entity.Hospital;
import blood_donation.health.Entity.UserProfile;
import blood_donation.health.Entity.Users;
import blood_donation.health.Utils.DonationRules;
import blood_donation.health.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final double DASHBOARD_RADIUS_KM = 25;
    private static final int DASHBOARD_MAX_REQUESTS = 5;
    private static final int LIVES_PER_DONATION = 3;

    private final UserRepository userRepository;

    private final ProfileService profileService;
    private final NotificationService notificationService;
    private final BloodRequestService bloodRequestService;

    private final DonationRepository donationRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final UserProfileRepository userProfileRepository;
    private final HospitalProfileRepository hospitalProfileRepository;

    // DONOR DASHBOARD
    public DonorDashboardDto donorDashboard(String email) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        UserProfile profile = userProfileRepository.findByUserEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Profile not found"));

        DonorDashboardDto dto = new DonorDashboardDto();

        dto.setProfile(profileService.getMyProfile(email));

        // ELIGIBILITY (cooldown since last donation)
        LocalDate today = LocalDate.now();
        DonationEligibilityDto eligibility = new DonationEligibilityDto();
        eligibility.setEligible(
                DonationRules.isEligible(profile.getLastDonationDate(), today));
        eligibility.setDaysUntilEligible(
                DonationRules.daysUntilEligible(profile.getLastDonationDate(), today));
        dto.setDonationEligibility(eligibility);

        // NEARBY REQUESTS this donor can actually serve
        dto.setNearbyRequests(loadNearbyRequests(email));

        // DONATION STATS
        DonationStatsDto stats = new DonationStatsDto();
        long totalDonations = donationRepository.countByDonor_id(user.getId());
        stats.setTotalDonations(totalDonations);
        stats.setLivesSaved(totalDonations * LIVES_PER_DONATION);
        dto.setDonationStats(stats);

        // NOTIFICATIONS
        dto.setNotifications(notificationService.getMyNotifications(email));

        dto.setCreatedAt(user.getCreatedAt());

        return dto;
    }

    private List<NearbyRequestDto> loadNearbyRequests(String email) {

        try {
            return bloodRequestService
                    .getNearbyRequests(DASHBOARD_RADIUS_KM, email)
                    .stream()
                    .limit(DASHBOARD_MAX_REQUESTS)
                    .map(r -> {
                        NearbyRequestDto n = new NearbyRequestDto();
                        n.setRequestId(r.getId());
                        n.setBloodGroup(r.getBloodGroup());
                        n.setHospitalName(r.getHospitalName());
                        n.setCity(r.getCity());
                        n.setUrgency(r.getUrgency());
                        n.setDistanceKm(r.getDistanceKm());
                        return n;
                    })
                    .toList();
        } catch (IllegalArgumentException ex) {
            // profile without blood group / location yet - dashboard still loads
            return List.of();
        }
    }

    // HOSPITAL DASHBOARD
    public HospitalDashboardDto hospitalDashboard(String email) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        HospitalDashboardDto dto = new HospitalDashboardDto();
        DashboardSummaryDto summary = new DashboardSummaryDto();

        // only requests still needing donors
        summary.setActiveRequests(
                bloodRequestRepository.countByRequestedByEmailAndStatusIn(
                        email, DonationRules.ACTIVE_REQUEST_STATUSES));

        Hospital hospital = hospitalProfileRepository.findByUserEmail(email).orElse(null);

        long donorsNearby;
        if (hospital != null && hospital.getLocation() != null) {
            donorsNearby = userProfileRepository.countNearbyAvailableDonors(
                    hospital.getLocation(),
                    DASHBOARD_RADIUS_KM * 1000,
                    user.getId(),
                    DonationRules.eligibleBefore(LocalDate.now()));
        } else {
            donorsNearby = userProfileRepository.countActiveAvailable();
        }
        summary.setAvailableDonorsNearby(donorsNearby);

        dto.setDashboardSummary(summary);
        dto.setNotifications(notificationService.getMyNotifications(email));

        return dto;
    }
}
