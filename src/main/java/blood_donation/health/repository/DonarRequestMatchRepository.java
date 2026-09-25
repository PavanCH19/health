package blood_donation.health.repository;

import blood_donation.health.Entity.DonorRequestMatch;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DonarRequestMatchRepository
        extends JpaRepository<DonorRequestMatch, Long> {

    java.util.Optional<DonorRequestMatch> findByRequest_IdAndDonor_Id(
            Long requestId,
            Long donorId
    );

    boolean existsByRequest_IdAndDonor_Id(
            Long requestId,
            Long donorId
    );
}