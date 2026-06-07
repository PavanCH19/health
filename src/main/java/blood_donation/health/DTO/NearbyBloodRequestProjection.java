package blood_donation.health.DTO;

public interface NearbyBloodRequestProjection {

    Long getId();

    String getHospitalName();

    String getBloodGroup();

    Integer getUnitsRequired();

    String getPatientName();

    String getUrgency();

    String getStatus();

    String getCity();

    String getDistrict();

    String getState();

    Double getLat();

    Double getLng();

    Double getDistanceKm();

    java.time.LocalDateTime getCreatedAt();
}