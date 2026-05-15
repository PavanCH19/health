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


}
