package blood_donation.health.Entity;

import blood_donation.health.Entity.Enum.BloodGroup;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.locationtech.jts.geom.Point;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "user_profiles",

        indexes = {

                @Index(
                        name = "idx_profile_city",
                        columnList = "city"
                ),

                @Index(
                        name = "idx_profile_blood_group",
                        columnList = "blood_group"
                ),

                @Index(
                        name = "idx_profile_available",
                        columnList = "available"
                )
        }
)
public class UserProfile {

    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_profile_user")
    )
    private Users user;

    @NotBlank(message = "Full name is required")
    @Column(nullable = false, length = 120)
    private String fullName;

    @Pattern(
            regexp = "^[6-9]\\d{9}$",
            message = "Invalid Indian phone number"
    )
    @Column(nullable = false, unique = true, length = 10)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private BloodGroup bloodGroup;

    @NotNull(message = "Date of birth is required")
    @Column(nullable = false)
    private LocalDate dateOfBirth;

    @Column(length = 20)
    private String gender;

    private String profileImage;

    @Column(columnDefinition = "TEXT")
    private String addressLine;

    @Column(length = 100)
    private String village;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 100)
    private String district;

    @Column(nullable = false, length = 100)
    private String state;

    @Column(length = 10)
    private String pincode;

    @Column(
            columnDefinition = "GEOGRAPHY(Point,4326)",
            nullable = false
    )
    private Point location;

    @Column(nullable = false)
    private boolean available = true;

    private LocalDate lastDonationDate;

    private double lat;
    private double lon;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

}