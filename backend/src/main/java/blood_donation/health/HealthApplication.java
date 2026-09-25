package blood_donation.health;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class HealthApplication {

	public static void main(String[] args) {

		BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

		String password = "Password@123";

		System.out.println("================================");
		System.out.println("Password: " + password);
		System.out.println("Hash: " + encoder.encode(password));
		System.out.println("================================");

		SpringApplication.run(HealthApplication.class, args);
	}

}
