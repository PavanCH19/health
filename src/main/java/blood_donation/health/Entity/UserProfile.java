package blood_donation.health.Entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users_profile")
public class UserProfile {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private String name;
        private String phone;
        private String city;
        private String district;
        private String state;

        @OneToOne
        @JoinColumn(name = "user_id", unique = true)
        private User user;
}