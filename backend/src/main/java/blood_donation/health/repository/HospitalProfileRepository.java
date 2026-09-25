package blood_donation.health.repository;

import blood_donation.health.Entity.Hospital;
import blood_donation.health.Entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HospitalProfileRepository extends JpaRepository<Hospital, Long> {

    Optional<Hospital> findByUser(Users user);

    Optional<Hospital> findByUserEmail(String email);

    List<Hospital> findByVerifiedByAdminFalse();

    List<Hospital> findByVerifiedByAdminFalseAndUser_ActiveTrue();

    boolean existsByLicenseNumber(String licenseNumber);

}