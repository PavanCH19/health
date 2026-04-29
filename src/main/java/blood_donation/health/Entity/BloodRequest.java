package blood_donation.health.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "blood_requests")
public class BloodRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String bloodGroup;
    private int quantity;
    private String urgency; // HIGH, MEDIUM, LOW

    private String city;
    private String status; // OPEN, ACCEPTED, COMPLETED

    @ManyToOne
    @JoinColumn(name = "recipient_id")
    private Recipient recipient;
}
