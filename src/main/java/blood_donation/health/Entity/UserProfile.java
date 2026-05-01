package blood_donation.health.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users_profile")
@NoArgsConstructor
@Getter
@Setter
public class UserProfile {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private String name;
        private long phone;
        private String city;
        private String district;
        private String state;

        @OneToOne
        @JoinColumn(name = "user_id", unique = true)
        private User user;
}