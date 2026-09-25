package blood_donation.health.service;

import blood_donation.health.DTO.DonationDto;
import blood_donation.health.Entity.BloodRequest;
import blood_donation.health.Entity.Donation;
import blood_donation.health.Entity.Enum.MatchStatus;
import blood_donation.health.Entity.Enum.NotificationType;
import blood_donation.health.Entity.Enum.RequestStatus;
import blood_donation.health.Entity.UserProfile;
import blood_donation.health.Entity.Users;
import blood_donation.health.Utils.BusinessRuleException;
import blood_donation.health.Utils.DonationRules;
import blood_donation.health.Utils.ResourceNotFoundException;
import blood_donation.health.repository.BloodRequestRepository;
import blood_donation.health.repository.DonarRequestMatchRepository;
import blood_donation.health.repository.DonationRepository;
import blood_donation.health.repository.UserProfileRepository;
import blood_donation.health.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DonationService {

    private final DonationRepository donationRepository;
    private final UserRepository userRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final UserProfileRepository userProfileRepository;
    private final DonarRequestMatchRepository donorRequestMatchRepository;
    private final NotificationService notificationService;

    // CREATE DONATION
    @Transactional
    public Long createDonation(DonationDto dto, String email) {

        Users donor = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        UserProfile profile = userProfileRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Complete your donor profile before recording a donation"));

        LocalDateTime now = LocalDateTime.now();

        // small tolerance for client clock skew
        if (dto.getDonationDate().isAfter(now.plusMinutes(5))) {
            throw new IllegalArgumentException("Donation date cannot be in the future");
        }

        LocalDate donationDay = dto.getDonationDate().toLocalDate();

        // Cooldown: no two donations closer than COOLDOWN_DAYS (before or after)
        for (Donation existing : donationRepository.findByDonor_id(donor.getId())) {
            long gapDays = Math.abs(ChronoUnit.DAYS.between(
                    existing.getDonationDate().toLocalDate(), donationDay));
            if (gapDays < DonationRules.COOLDOWN_DAYS) {
                throw new BusinessRuleException(HttpStatus.CONFLICT,
                        "A donation is already recorded within "
                                + DonationRules.COOLDOWN_DAYS
                                + " days of this date. Donors must wait "
                                + DonationRules.COOLDOWN_DAYS + " days between donations");
            }
        }

        BloodRequest request = null;

        if (dto.getRequestId() != null) {

            request = bloodRequestRepository.findById(dto.getRequestId())
                    .orElseThrow(() -> new ResourceNotFoundException("Blood request not found"));

            if (!DonationRules.ACTIVE_REQUEST_STATUSES.contains(request.getStatus())) {
                throw new BusinessRuleException(HttpStatus.CONFLICT,
                        "This blood request is already " + request.getStatus());
            }

            if (!DonationRules.canDonate(profile.getBloodGroup(), request.getBloodGroup())) {
                throw new IllegalArgumentException(
                        "Your blood group (" + profile.getBloodGroup()
                                + ") is not compatible with the requested group ("
                                + request.getBloodGroup() + ")");
            }
        }

        Donation donation = new Donation();

        donation.setDonor(donor);
        donation.setRequest(request);
        donation.setUnits(dto.getUnits() != null ? dto.getUnits() : 1);
        donation.setDonationDate(dto.getDonationDate());

        donation.setRecipientName(
                dto.getRecipientName() != null || request == null
                        ? dto.getRecipientName()
                        : request.getPatientName());

        donation.setHospitalName(
                dto.getHospitalName() != null || request == null
                        ? dto.getHospitalName()
                        : request.getHospitalName());

        Donation saved = donationRepository.save(donation);

        // Keep the donor's cooldown date current (never move it backwards)
        LocalDate last = profile.getLastDonationDate();
        if (last == null || donationDay.isAfter(last)) {
            profile.setLastDonationDate(donationDay);
            profile.setUpdatedAt(now);
            userProfileRepository.save(profile);
        }

        if (request != null) {
            completeRequestProgress(request, donor, saved, now);
        }

        return saved.getId();
    }

    /** Marks the donor's match COMPLETED, fulfils the request when enough units
     *  are donated, and tells the requester. */
    private void completeRequestProgress(
            BloodRequest request, Users donor, Donation donation, LocalDateTime now) {

        donorRequestMatchRepository
                .findByRequest_IdAndDonor_Id(request.getId(), donor.getId())
                .ifPresent(match -> {
                    match.setStatus(MatchStatus.COMPLETED);
                    match.setRespondedAt(now);
                    donorRequestMatchRepository.save(match);
                });

        long donatedUnits = donationRepository.sumUnitsByRequestId(request.getId());

        boolean fulfilled = donatedUnits >= request.getUnitsRequired();

        if (fulfilled) {
            request.setStatus(RequestStatus.FULFILLED);
            request.setUpdatedAt(now);
            bloodRequestRepository.save(request);
        }

        notificationService.createNotification(
                request.getRequestedBy(),
                fulfilled ? "Blood request fulfilled" : "Donation received",
                donation.getUnits() + " unit(s) of blood donated for " + request.getBloodGroup()
                        + " request. " + Math.min(donatedUnits, request.getUnitsRequired())
                        + "/" + request.getUnitsRequired() + " units collected.",
                NotificationType.REQUEST_ACCEPTED
        );
    }

    // GET MY DONATIONS
    public List<DonationDto> getMyDonations(String email) {

        Users donor = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return donationRepository
                .findByDonor_idOrderByDonationDateDesc(donor.getId())
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    private DonationDto mapToDto(Donation donation) {

        DonationDto dto = new DonationDto();

        dto.setId(donation.getId());
        dto.setDonationDate(donation.getDonationDate());
        dto.setHospitalName(donation.getHospitalName());
        dto.setUnits(donation.getUnits());
        dto.setRecipientName(donation.getRecipientName());
        dto.setCertificateUrl(donation.getCertificateUrl());
        dto.setCertificateAvailable(
                donation.getCertificateUrl() != null &&
                        !donation.getCertificateUrl().isBlank()
        );

        if (donation.getRequest() != null) {
            dto.setRequestId(donation.getRequest().getId());
            dto.setBloodGroup(donation.getRequest().getBloodGroup());
            dto.setStatus(donation.getRequest().getStatus().name());
        }

        return dto;
    }
}
