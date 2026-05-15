package blood_donation.health.Entity;

import blood_donation.health.Entity.Enum.MatchStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor

@Entity
@Table(
        name = "donor_request_matches",

        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_request_donor",
                        columnNames = {
                                "request_id",
                                "donor_id"
                        }
                )
        }
)
public class DonorRequestMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "request_id",
            nullable = false
    )
    private BloodRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "donor_id",
            nullable = false
    )
    private Users donor;

    private Double distanceKm;

    @Enumerated(EnumType.STRING)
    private MatchStatus status = MatchStatus.PENDING;

    private LocalDateTime notifiedAt;

    private LocalDateTime respondedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}