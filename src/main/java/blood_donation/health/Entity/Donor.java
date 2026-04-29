package blood_donation.health.Entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "donors")
public class Donor {

    @Id
    private Long userId; // SAME as User ID

    private String bloodGroup;
    private boolean available;

    private LocalDate lastDonationDate;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;
}
