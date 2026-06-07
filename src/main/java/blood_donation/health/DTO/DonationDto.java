package blood_donation.health.DTO;

import blood_donation.health.Entity.Enum.BloodGroup;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class DonationDto {

    // COMMON
    private Long id;

    // CREATE DONATION
    private Long requestId;

    private String recipientName;

    // BOTH
    private String hospitalName;

    private int units;

    private LocalDateTime donationDate;

    // RESPONSE ONLY
    private BloodGroup bloodGroup;

    private String status;

    private boolean certificateAvailable;

    private String certificateUrl;
}