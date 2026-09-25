package blood_donation.health.Entity;


import blood_donation.health.DTO.BloodReqDto;
import blood_donation.health.Entity.Enum.BloodGroup;
import blood_donation.health.Entity.Enum.RequestStatus;
import blood_donation.health.Entity.Enum.UrgencyLevel;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor

@Entity
@Table(
        name = "blood_requests",
        indexes = {

                @Index(
                        name = "idx_request_status",
                        columnList = "status"
                ),

                @Index(
                        name = "idx_request_blood_group",
                        columnList = "bloodGroup"
                ),

                @Index(
                        name = "idx_request_created_at",
                        columnList = "createdAt"
                )
        }
)
public class BloodRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "requested_by",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_request_user")
    )
    private Users requestedBy;

    @NotNull(message = "Blood group is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BloodGroup bloodGroup;

    @Min(value = 1, message = "Minimum blood unit should be 1")
    @Column(nullable = false)
    private int unitsRequired;

    @NotNull(message = "Urgency level is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UrgencyLevel urgency;

    private String patientName;

    private String contactName;

    private String contactPhone;

    private String hospitalName;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(
            columnDefinition = "GEOGRAPHY(Point,4326)",
            nullable = false
    )
    private Point location;

    private String city;

    private String district;

    private String state;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.OPEN;

    private LocalDateTime requiredBefore;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;
}