package blood_donation.health.DTO;

import blood_donation.health.Entity.BloodGroup;
import blood_donation.health.Entity.Urgency;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class BloodReqDto {
    @NotNull
    private BloodGroup bloodGroup;

    @Min(1)
    private int quantity;

    @NotNull
    private Urgency urgency;

    @NotBlank
    private String city;
}
