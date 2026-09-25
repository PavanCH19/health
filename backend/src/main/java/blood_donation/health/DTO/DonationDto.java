package blood_donation.health.DTO;

import blood_donation.health.Entity.Enum.BloodGroup;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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

    @Min(value = 1, message = "Units must be at least 1")
    @Max(value = 2, message = "A single donation cannot exceed 2 units")
    private Integer units;

    @NotNull(message = "Donation date is required")
    private LocalDateTime donationDate;

    // RESPONSE ONLY
    private BloodGroup bloodGroup;

    private String status;

    private boolean certificateAvailable;

    private String certificateUrl;
}