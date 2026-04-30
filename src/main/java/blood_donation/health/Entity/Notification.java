package blood_donation.health.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String message;
    private boolean readStatus;

    @ManyToOne
    @JoinColumn(name = "donor_id")
    private Donor donor;
}
