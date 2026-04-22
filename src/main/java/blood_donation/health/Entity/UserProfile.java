package blood_donation.health.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users_profile")
public class UserProfile {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private String name;
        private String phone;

        @OneToOne
        @JoinColumn(name = "user_id")
        private User user;
}
