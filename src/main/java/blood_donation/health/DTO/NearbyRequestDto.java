package blood_donation.health.DTO;

import blood_donation.health.Entity.Enum.BloodGroup;
import blood_donation.health.Entity.Enum.UrgencyLevel;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NearbyRequestDto {

    private Long requestId;

    private BloodGroup bloodGroup;

    private String hospitalName;

    private String city;

    private UrgencyLevel urgency;

    private double distanceKm;
}