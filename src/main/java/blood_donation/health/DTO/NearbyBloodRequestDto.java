package blood_donation.health.DTO;

import blood_donation.health.Entity.Enum.BloodGroup;
import blood_donation.health.Entity.Enum.RequestStatus;
import blood_donation.health.Entity.Enum.UrgencyLevel;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class NearbyBloodRequestDto {

    private Long id;

    private String hospitalName;

    private BloodGroup bloodGroup;

    private int units;

    private String recipientName;

    private UrgencyLevel urgency;

    private RequestStatus status;

    private String city;

    private String district;

    private String state;

    private double lat;

    private double lng;

    private double distanceKm;

    private LocalDateTime createdAt;

    private String contactName;

    private String contactPhone;

    private LocalDateTime requiredBefore;
}