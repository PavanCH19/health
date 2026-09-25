package blood_donation.health.repository;

import blood_donation.health.DTO.NearbyBloodRequestProjection;
import blood_donation.health.Entity.BloodRequest;
import blood_donation.health.Entity.Enum.RequestStatus;
import org.locationtech.jts.geom.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface BloodRequestRepository extends JpaRepository<BloodRequest, Long> {

    List<BloodRequest> findByRequestedByEmail(String email);

    List<BloodRequest> findByRequestedByEmailOrderByCreatedAtDesc(String email);

    long countByRequestedByEmailAndStatusIn(String email, Collection<RequestStatus> statuses);

    List<BloodRequest> findByRequestedBy_IdAndStatusIn(Long userId, Collection<RequestStatus> statuses);

    /**
     * Requests still needing donors (OPEN or MATCHING), not expired,
     * for recipient groups the caller's blood group can actually donate to.
     */
    @Query(value = """
    SELECT
        br.id as id,
        br.hospital_name as hospitalName,
        br.blood_group as bloodGroup,
        br.units_required as unitsRequired,
        br.patient_name as patientName,
        br.urgency as urgency,
        br.status as status,
        br.city as city,
        br.district as district,
        br.state as state,

        ST_Y(br.location::geometry) as lat,
        ST_X(br.location::geometry) as lng,

        ROUND(
            (
                ST_Distance(
                    CAST(br.location AS geography),
                    CAST(:location AS geography)
                ) / 1000
            )::numeric,
            2
        ) as distanceKm,

        br.created_at as createdAt,

        br.contact_name as contactName,
        br.contact_phone as contactPhone,
        br.required_before as requiredBefore

    FROM blood_requests br

    WHERE ST_DWithin(
        CAST(br.location AS geography),
        CAST(:location AS geography),
        :radiusKm * 1000
    )

    AND br.status IN ('OPEN', 'MATCHING')

    AND br.blood_group IN (:bloodGroups)

    AND (br.required_before IS NULL OR br.required_before > :now)

    ORDER BY ST_Distance(
        CAST(br.location AS geography),
        CAST(:location AS geography)
    )
    """, nativeQuery = true)
    List<NearbyBloodRequestProjection> findNearbyRequests(
            @Param("location") Point location,
            @Param("radiusKm") double radiusKm,
            @Param("bloodGroups") List<String> bloodGroups,
            @Param("now") LocalDateTime now
    );

}
