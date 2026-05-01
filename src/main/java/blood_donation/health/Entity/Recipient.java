package blood_donation.health.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "recipients")
@Getter @Setter
public class Recipient {

    @Id
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BloodGroup bloodGroup;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Optional but recommended
    @OneToMany(mappedBy = "recipient", cascade = CascadeType.PERSIST)
    private List<BloodRequest> requests;
}