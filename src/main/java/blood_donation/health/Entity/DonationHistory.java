package blood_donation.health.Entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "donation_history")
public class DonationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate donationDate;

    @ManyToOne
    private Donor donor;

    @ManyToOne
    private Recipient recipient;
}
