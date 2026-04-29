package blood_donation.health.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "admins")
public class Admin {

    @Id
    private Long userId;

    private String adminLevel;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;
}
