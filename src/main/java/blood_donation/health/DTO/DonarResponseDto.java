package blood_donation.health.DTO;

import blood_donation.health.Entity.Enum.BloodGroup;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;


@Getter @Setter
public class DonarResponseDto {
    private Long id;

    private String name;

    private BloodGroup bloodGroup;

    private String city;

    private String district;

    private String state;

    private Double distanceKm;

    private Boolean available;

    // false while the donor is inside the post-donation cooldown
    private Boolean eligible;

    // only returned by endpoints restricted to verified hospitals
    private String phone;

    private Double lat;

    private Double lon;


}
