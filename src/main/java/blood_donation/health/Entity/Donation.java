package blood_donation.health.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor

@Entity
@Table(
        name = "donations",
        indexes = {
                @Index(
                        name = "idx_donation_date",
                        columnList = "donationDate"
                )
        }
)
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "donor_id",
            nullable = false
    )
    private Users donor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "request_id")
    private BloodRequest request;

    private String recipientName;

    private String hospitalName;

    @Min(value = 1, message = "Units must be at least 1")
    private int units = 1;

    @Column(nullable = false)
    private LocalDateTime donationDate;

    private String certificateUrl;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}