package blood_donation.health.repository;

import blood_donation.health.Entity.Donation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonationRepository extends JpaRepository<Donation,Long> {
    List<Donation> findByDonor_id(Long userId);
    long countByDonor_id(Long userId);

    List<Donation> findByDonor_idOrderByDonationDateDesc(Long userId);

    @Query("SELECT COALESCE(SUM(d.units), 0L) FROM Donation d WHERE d.request.id = :requestId")
    Long sumUnitsByRequestId(@Param("requestId") Long requestId);
}
