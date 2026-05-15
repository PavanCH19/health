package blood_donation.health.repository;

import blood_donation.health.Entity.Users;
import blood_donation.health.Entity.UserProfile;
import org.locationtech.jts.geom.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    Optional<UserProfile> findByUserEmail(String email);

    @Query(value = """
    SELECT *
    FROM user_profiles u
    WHERE ST_DWithin(
        CAST(u.location AS geography),
        CAST(:location AS geography),
        :radiusMeters
    )
    AND u.available = true
    AND u.user_id != :excludeUserId
    AND (
        :bloodGroup IS NULL
        OR u.blood_group = :bloodGroup
    )
    ORDER BY ST_Distance(
        CAST(u.location AS geography),
        CAST(:location AS geography)
    )
    """, nativeQuery = true)
    List<UserProfile> findNearbyDonors(
            @Param("location") Point location,
            @Param("radiusMeters") double radiusMeters,
            @Param("excludeUserId") Long excludeUserId,
            @Param("bloodGroup") String bloodGroup
    );

    @Query(value = """
    SELECT *
    FROM user_profiles u
    WHERE u.user_id != :excludeUserId
    AND (
        :bloodGroup IS NULL
        OR u.blood_group = :bloodGroup
    )
    """, nativeQuery = true)
    List<UserProfile> searchDonorsWithoutRadius(
            @Param("excludeUserId") Long excludeUserId,
            @Param("bloodGroup") String bloodGroup
    );

    boolean existsByPhone(String phone);
    long countByAvailableTrue();
}
