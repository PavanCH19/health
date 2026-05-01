package blood_donation.health.DTO;

import blood_donation.health.Entity.BloodGroup;
import blood_donation.health.Entity.RequestStatus;
import blood_donation.health.Entity.Urgency;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class BloodRequestResponseDto {

    private Long id;
    private BloodGroup bloodGroup;
    private int quantity;
    private Urgency urgency;
    private String city;
    private RequestStatus status;

    private Long recipientId;

    private String recipientName;
    private String contactNumber;
}