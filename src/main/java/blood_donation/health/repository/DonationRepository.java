package blood_donation.health.repository;

import blood_donation.health.Entity.Donation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonationRepository extends JpaRepository<Donation,Long> {
    List<Donation> findByDonor_id(Long userId);
    long countByDonor_id(Long userId);
}
