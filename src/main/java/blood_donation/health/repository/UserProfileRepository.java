package blood_donation.health.repository;

import blood_donation.health.Entity.UserProfile;
import org.locationtech.jts.geom.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    Optional<UserProfile> findByUserEmail(String email);

    /**
     * Donors around a point. Always excludes deactivated/blocked accounts.
     *
     * @param bloodGroups  donor groups to include (never empty - pass all groups for "any")
     * @param availableOnly only donors who marked themselves available
     * @param eligibleOnly  only donors past the donation cooldown
     * @param eligibleBefore last-donation cutoff date (see DonationRules.eligibleBefore)
     */
    @Query(value = """
    SELECT u.*
    FROM user_profiles u
    JOIN users usr ON usr.id = u.user_id
    WHERE ST_DWithin(
        CAST(u.location AS geography),
        CAST(:location AS geography),
        :radiusMeters
    )
    AND usr.active = true
    AND u.user_id <> :excludeUserId
    AND u.blood_group IN (:bloodGroups)
    AND (:availableOnly = false OR u.available = true)
    AND (
        :eligibleOnly = false
        OR u.last_donation_date IS NULL
        OR u.last_donation_date <= :eligibleBefore
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
            @Param("bloodGroups") List<String> bloodGroups,
            @Param("availableOnly") boolean availableOnly,
            @Param("eligibleOnly") boolean eligibleOnly,
            @Param("eligibleBefore") LocalDate eligibleBefore
    );

    @Query(value = """
    SELECT COUNT(*)
    FROM user_profiles u
    JOIN users usr ON usr.id = u.user_id
    WHERE ST_DWithin(
        CAST(u.location AS geography),
        CAST(:location AS geography),
        :radiusMeters
    )
    AND usr.active = true
    AND u.available = true
    AND u.user_id <> :excludeUserId
    AND (u.last_donation_date IS NULL OR u.last_donation_date <= :eligibleBefore)
    """, nativeQuery = true)
    long countNearbyAvailableDonors(
            @Param("location") Point location,
            @Param("radiusMeters") double radiusMeters,
            @Param("excludeUserId") Long excludeUserId,
            @Param("eligibleBefore") LocalDate eligibleBefore
    );

    @Query(value = """
    SELECT u.*
    FROM user_profiles u
    JOIN users usr ON usr.id = u.user_id
    WHERE usr.active = true
    AND u.user_id <> :excludeUserId
    AND u.blood_group IN (:bloodGroups)
    ORDER BY u.created_at DESC
    """, nativeQuery = true)
    List<UserProfile> searchDonorsWithoutRadius(
            @Param("excludeUserId") Long excludeUserId,
            @Param("bloodGroups") List<String> bloodGroups
    );

    @Query("""
            SELECT d.district, COUNT(d)
            FROM UserProfile d
            WHERE d.user.active = true
            GROUP BY d.district
            ORDER BY COUNT(d) DESC
           """)
    List<Object[]> getDonorCountByDistrict();

    @Query("""
       SELECT u
       FROM UserProfile u
       WHERE u.user.active = true
       ORDER BY u.createdAt DESC
       """)
    List<UserProfile> getAllDonors();

    boolean existsByPhone(String phone);

    @Query("SELECT COUNT(p) FROM UserProfile p WHERE p.available = true AND p.user.active = true")
    long countActiveAvailable();
}
