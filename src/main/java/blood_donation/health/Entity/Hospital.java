package blood_donation.health.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.locationtech.jts.geom.Point;

@Getter
@Setter
@NoArgsConstructor

@Entity
@Table(
        name = "hospitals",
        indexes = {

                @Index(
                        name = "idx_hospital_name",
                        columnList = "hospitalName"
                )
        }
)
public class Hospital {

    @Id
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(
            name = "user_id",
            foreignKey = @ForeignKey(name = "fk_hospital_user")
    )
    private Users user;

    @NotBlank(message = "Hospital name is required")
    @Column(nullable = false)
    private String hospitalName;

    @Column(unique = true)
    private String licenseNumber;

    private String emergencyContact;

    private String website;

    // ================= LOCATION FIELDS =================

    private String city;

    private String district;

    private String state;

    private String addressLine;

    private Double lat;

    private Double lon;

    @Column(
            columnDefinition = "GEOGRAPHY(Point,4326)"
    )
    private Point location;

    // ===================================================

    @Column(nullable = false)
    private boolean verifiedByAdmin = false;
}