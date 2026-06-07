package blood_donation.health.service;

import blood_donation.health.DTO.DonationDto;
import blood_donation.health.Entity.BloodRequest;
import blood_donation.health.Entity.Donation;
import blood_donation.health.Entity.Users;
import blood_donation.health.repository.BloodRequestRepository;
import blood_donation.health.repository.DonationRepository;
import blood_donation.health.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DonationService {

    private final DonationRepository donationRepository;
    private final UserRepository userRepository;
    private final BloodRequestRepository bloodRequestRepository;

    // CREATE DONATION
    public Long createDonation( DonationDto dto, String email ) {

        Users donor = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException( "User not found" ));

        BloodRequest request = null;

        if (dto.getRequestId() != null) {

            request = bloodRequestRepository.findById(dto.getRequestId())
                    .orElseThrow(() -> new RuntimeException( "Blood request not found" ));
        }

        Donation donation = new Donation();

        donation.setDonor(donor);
        donation.setRequest(request);
        donation.setRecipientName(dto.getRecipientName());
        donation.setHospitalName(dto.getHospitalName());
        donation.setUnits(dto.getUnits());
        donation.setDonationDate(dto.getDonationDate());

        Donation saved = donationRepository.save(donation);

        return saved.getId();
    }

    // GET MY DONATIONS
    public List<DonationDto> getMyDonations( String email ) {

        Users donor = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException( "User not found" ));

        List<Donation> donations = donationRepository.findByDonor_id( donor.getId() );

        return donations.stream()
                .map(this::mapToDto)
                .toList();
    }

    private DonationDto mapToDto(Donation donation) {

        DonationDto dto = new DonationDto();

        dto.setId(donation.getId());

        dto.setDonationDate(donation.getDonationDate());

        dto.setHospitalName(donation.getHospitalName());

        dto.setUnits(donation.getUnits());

        dto.setRecipientName(
                donation.getRecipientName()
        );

        dto.setCertificateUrl(
                donation.getCertificateUrl()
        );

        dto.setCertificateAvailable(
                donation.getCertificateUrl() != null &&
                        !donation.getCertificateUrl().isBlank()
        );

        // Request related data
        if (donation.getRequest() != null) {

            dto.setRequestId(
                    donation.getRequest().getId()
            );

            dto.setBloodGroup(
                    donation.getRequest().getBloodGroup()
            );

            dto.setStatus(
                    donation.getRequest().getStatus().name()
            );
        }

        return dto;
    }
}