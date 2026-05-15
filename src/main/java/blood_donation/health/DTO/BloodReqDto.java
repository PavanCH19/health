package blood_donation.health.DTO;

import blood_donation.health.Entity.Enum.BloodGroup;
import blood_donation.health.Entity.Enum.RequestStatus;
import blood_donation.health.Entity.Enum.UrgencyLevel;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter
public class BloodReqDto {

    // User ID who created the request
    @NotNull(message = "Requested user ID is required")
    private Long requestedById;

    @NotNull(message = "Blood group is required")
    private BloodGroup bloodGroup;

    @Min(value = 1, message = "Minimum blood unit should be 1")
    private int unitsRequired;

    @NotNull(message = "Urgency level is required")
    private UrgencyLevel urgency;

    @NotBlank(message = "Patient name is required")
    private String patientName;

    @NotBlank(message = "Contact name is required")
    private String contactName;

    @NotBlank(message = "Contact phone is required")
    private String contactPhone;

    @NotBlank(message = "Hospital name is required")
    private String hospitalName;

    private String notes;

    // Latitude & Longitude instead of Point object
    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    private String city;

    private String district;

    private String state;

    private RequestStatus status;

    private LocalDateTime requiredBefore;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;


}
