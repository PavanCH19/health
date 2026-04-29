package blood_donation.health.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "recipients")
public class Recipient {

    @Id
    private Long userId;

    private String requiredBloodGroup;
    private int requiredUnits;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;
}
