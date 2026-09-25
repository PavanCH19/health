package blood_donation.health.service;

import blood_donation.health.DTO.HospitalProfileDto;
import blood_donation.health.Entity.Hospital;
import blood_donation.health.Entity.Users;
import blood_donation.health.Utils.DonationRules;
import blood_donation.health.Utils.UserAlreadyExistsException;
import blood_donation.health.repository.HospitalProfileRepository;
import blood_donation.health.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
@Transactional
@RequiredArgsConstructor
public class HospitalService {

    private final HospitalProfileRepository hospitalProfileRepository;
    private final UserRepository userRepository;
    private final BloodRequestService bloodRequestService;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public void completeHospitalDetails(
            String email,
            HospitalProfileDto dto
    ) {
        Users user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found: " + email));

        if (hospitalProfileRepository.findByUser(user).isPresent()) {
            throw new UserAlreadyExistsException("Hospital profile already exists");
        }

        // location drives donor search, so it is mandatory
        DonationRules.validateCoordinates(dto.getLat(), dto.getLon());

        String license = normalize(dto.getLicenseNumber());
        if (license != null && hospitalProfileRepository.existsByLicenseNumber(license)) {
            throw new UserAlreadyExistsException("License number already registered");
        }

        Hospital hospital = new Hospital();

        hospital.setHospitalName(dto.getHospitalName().trim());
        hospital.setLicenseNumber(license);
        hospital.setEmergencyContact(dto.getEmergencyContact());
        hospital.setWebsite(dto.getWebsite());
        hospital.setCity(dto.getCity());
        hospital.setDistrict(dto.getDistrict());
        hospital.setState(dto.getState());
        hospital.setAddressLine(dto.getAddressLine());
        setLocation(dto.getLat(), dto.getLon(), hospital);

        // every new hospital must be verified by an admin
        hospital.setVerifiedByAdmin(false);

        hospital.setUser(user);

        hospitalProfileRepository.save(hospital);
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public HospitalProfileDto getHospitalProfile(String email) {

        Hospital hospital = hospitalProfileRepository
                .findByUserEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("Hospital profile not found"));

        return mapEntityToDto(hospital);
    }

    public String updateHospitalProfile(
            String email,
            HospitalProfileDto dto
    ) {

        Hospital hospital = hospitalProfileRepository
                .findByUserEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("Hospital profile not found"));

        boolean identityChanged = false;

        if (dto.getHospitalName() != null) {
            if (dto.getHospitalName().isBlank()) {
                throw new IllegalArgumentException("Hospital name cannot be blank");
            }
            String name = dto.getHospitalName().trim();
            identityChanged |= !name.equals(hospital.getHospitalName());
            hospital.setHospitalName(name);
        }

        if (dto.getLicenseNumber() != null) {
            String license = normalize(dto.getLicenseNumber());
            if (!Objects.equals(license, hospital.getLicenseNumber())) {
                if (license != null && hospitalProfileRepository.existsByLicenseNumber(license)) {
                    throw new UserAlreadyExistsException("License number already registered");
                }
                identityChanged = true;
                hospital.setLicenseNumber(license);
            }
        }

        if (dto.getEmergencyContact() != null) hospital.setEmergencyContact(dto.getEmergencyContact());
        if (dto.getWebsite() != null) hospital.setWebsite(dto.getWebsite());
        if (dto.getCity() != null) hospital.setCity(dto.getCity());
        if (dto.getDistrict() != null) hospital.setDistrict(dto.getDistrict());
        if (dto.getState() != null) hospital.setState(dto.getState());
        if (dto.getAddressLine() != null) hospital.setAddressLine(dto.getAddressLine());

        if (dto.getLat() != null || dto.getLon() != null) {
            // keep lat/lon and the PostGIS point in sync
            DonationRules.validateCoordinates(dto.getLat(), dto.getLon());
            setLocation(dto.getLat(), dto.getLon(), hospital);
        }

        // changing name / license invalidates the admin's earlier verification
        if (identityChanged) {
            hospital.setVerifiedByAdmin(false);
        }

        hospitalProfileRepository.save(hospital);

        return identityChanged
                ? "Hospital profile updated. Re-verification by an admin is required"
                : "Hospital profile updated successfully";
    }

    public String deleteHospitalProfile(String email) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found"));

        Hospital hospital = hospitalProfileRepository
                .findByUser(user)
                .orElseThrow(() ->
                        new UsernameNotFoundException("Hospital profile not found"));

        hospital.setVerifiedByAdmin(false);
        user.setActive(false);

        hospitalProfileRepository.save(hospital);
        userRepository.save(user);

        // don't leave open requests pointing donors to a closed account
        bloodRequestService.cancelActiveRequestsOf(user.getId());

        return "Hospital account deactivated successfully";
    }

    private void setLocation(Double lat, Double lon, Hospital hospital) {
        hospital.setLat(lat);
        hospital.setLon(lon);
        Point point = geometryFactory.createPoint(new Coordinate(lon, lat));
        point.setSRID(4326);
        hospital.setLocation(point);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private HospitalProfileDto mapEntityToDto(Hospital hospital) {

        HospitalProfileDto dto = new HospitalProfileDto();

        dto.setHospitalName(hospital.getHospitalName());
        dto.setLicenseNumber(hospital.getLicenseNumber());
        dto.setEmergencyContact(hospital.getEmergencyContact());
        dto.setWebsite(hospital.getWebsite());

        dto.setCity(hospital.getCity());
        dto.setDistrict(hospital.getDistrict());
        dto.setState(hospital.getState());
        dto.setAddressLine(hospital.getAddressLine());

        dto.setLat(hospital.getLat());
        dto.setLon(hospital.getLon());
        dto.setVerifiedByAdmin(hospital.isVerifiedByAdmin());

        return dto;
    }
}
