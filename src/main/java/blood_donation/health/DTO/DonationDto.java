package blood_donation.health.DTO;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class DonationDto {

    private Long donationId;

    private Long requestId;

    @NotBlank
    private String recipientName;

    @NotBlank
    private String hospitalName;

    @Min(1)
    private int units;

    @NotNull
    private LocalDateTime donationDate;
}