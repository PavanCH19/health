package blood_donation.health.service;

import blood_donation.health.DTO.ProfileRequestDto;
import blood_donation.health.DTO.ProfileResponseDto;
import blood_donation.health.Entity.UserProfile;
import blood_donation.health.Entity.Users;
import blood_donation.health.Utils.BusinessRuleException;
import blood_donation.health.Utils.DonationRules;
import blood_donation.health.Utils.UserAlreadyExistsException;
import blood_donation.health.repository.UserProfileRepository;
import blood_donation.health.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Transactional
@RequiredArgsConstructor
public class ProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    // ─── CREATE ───────────────────────────────────────────────────────────────
    public void completeProfile(ProfileRequestDto dto, String email) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        validateForCreate(dto);

        if (userProfileRepository.existsByPhone(dto.getPhone())) {
            throw new UserAlreadyExistsException("Phone number already registered");
        }

        if (user.getProfile() != null) {
            throw new UserAlreadyExistsException("Profile already exists for this user");
        }

        UserProfile profile = new UserProfile();
        mapDtoToEntity(dto, profile);
        profile.setAvailable(dto.getAvailable() == null || dto.getAvailable());
        profile.setUser(user);
        user.setProfile(profile);

        userProfileRepository.save(profile);
    }

    // ─── READ ─────────────────────────────────────────────────────────────────
    @Transactional(Transactional.TxType.SUPPORTS)
    public ProfileResponseDto getMyProfile(String email) {

        UserProfile profile = userProfileRepository.findByUserEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Profile not found for: " + email));

        return mapEntityToDto(profile);
    }

    // ─── UPDATE (PATCH) ───────────────────────────────────────────────────────
    public String updateProfile(ProfileRequestDto dto, String email) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        UserProfile profile = user.getProfile();

        if (profile == null) {
            throw new UsernameNotFoundException(
                    "Profile not found. Please complete your profile first.");
        }

        applyPatch(dto, profile);

        profile.setUpdatedAt(LocalDateTime.now());

        userProfileRepository.save(profile);

        return "Profile updated successfully";
    }

    // ─── DELETE (soft) ────────────────────────────────────────────────────────
    public String deleteProfile(String email) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        user.setActive(false);

        // a deactivated donor must never show up in searches / matching
        if (user.getProfile() != null) {
            user.getProfile().setAvailable(false);
        }

        userRepository.save(user);

        return "Profile deactivated successfully";
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private void validateForCreate(ProfileRequestDto dto) {

        requireText(dto.getName(), "Full name");
        requireText(dto.getPhone(), "Phone");
        requireText(dto.getCity(), "City");
        requireText(dto.getDistrict(), "District");
        requireText(dto.getState(), "State");

        if (dto.getBloodGroup() == null) {
            throw new IllegalArgumentException("Blood group is required");
        }

        DonationRules.validateDonorAge(dto.getBirthDate());
        DonationRules.validateCoordinates(dto.getLat(), dto.getLon());
    }

    private void requireText(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(label + " is required");
        }
    }

    // Full mapping for CREATE
    private void mapDtoToEntity(ProfileRequestDto dto, UserProfile profile) {
        profile.setFullName(dto.getName().trim());
        profile.setPhone(dto.getPhone().trim());
        profile.setCity(dto.getCity().trim());
        profile.setDistrict(dto.getDistrict().trim());
        profile.setVillage(dto.getVillage());
        profile.setState(dto.getState().trim());
        profile.setBloodGroup(dto.getBloodGroup());
        profile.setDateOfBirth(dto.getBirthDate());
        setLocation(dto.getLat(), dto.getLon(), profile);
    }

    /**
     * PATCH: only non-null fields are applied. Done explicitly because the
     * DTO's names (name, birthDate) differ from the entity's (fullName,
     * dateOfBirth) - a generic mapper silently skipped those two.
     */
    private void applyPatch(ProfileRequestDto dto, UserProfile profile) {

        if (dto.getName() != null) {
            requireText(dto.getName(), "Full name");
            profile.setFullName(dto.getName().trim());
        }

        if (dto.getPhone() != null) {
            requireText(dto.getPhone(), "Phone");
            String phone = dto.getPhone().trim();
            if (!phone.equals(profile.getPhone())) {
                if (userProfileRepository.existsByPhone(phone)) {
                    throw new UserAlreadyExistsException("Phone number already registered");
                }
                profile.setPhone(phone);
            }
        }

        if (dto.getCity() != null) {
            requireText(dto.getCity(), "City");
            profile.setCity(dto.getCity().trim());
        }

        if (dto.getDistrict() != null) {
            requireText(dto.getDistrict(), "District");
            profile.setDistrict(dto.getDistrict().trim());
        }

        if (dto.getState() != null) {
            requireText(dto.getState(), "State");
            profile.setState(dto.getState().trim());
        }

        if (dto.getVillage() != null) {
            profile.setVillage(dto.getVillage());
        }

        if (dto.getBloodGroup() != null && dto.getBloodGroup() != profile.getBloodGroup()) {
            // blood group is medical fact used for matching - lock it once donations exist
            if (profile.getBloodGroup() != null && profile.getLastDonationDate() != null) {
                throw new BusinessRuleException(HttpStatus.CONFLICT,
                        "Blood group cannot be changed after a donation has been recorded");
            }
            profile.setBloodGroup(dto.getBloodGroup());
        }

        if (dto.getBirthDate() != null) {
            DonationRules.validateDonorAge(dto.getBirthDate());
            profile.setDateOfBirth(dto.getBirthDate());
        }

        if (dto.getAvailable() != null) {
            profile.setAvailable(dto.getAvailable());
        }

        if (dto.getLat() != null || dto.getLon() != null) {
            // location is only updated when both values are supplied
            DonationRules.validateCoordinates(dto.getLat(), dto.getLon());
            setLocation(dto.getLat(), dto.getLon(), profile);
        }
    }

    private void setLocation(Double lat, Double lon, UserProfile profile) {
        DonationRules.validateCoordinates(lat, lon);
        profile.setLat(lat);
        profile.setLon(lon);
        Point point = geometryFactory.createPoint(new Coordinate(lon, lat));
        point.setSRID(4326);
        profile.setLocation(point);
    }

    private ProfileResponseDto mapEntityToDto(UserProfile profile) {
        ProfileResponseDto dto = new ProfileResponseDto();
        dto.setId(profile.getId());
        dto.setName(profile.getFullName());
        dto.setPhone(profile.getPhone());
        dto.setCity(profile.getCity());
        dto.setDistrict(profile.getDistrict());
        dto.setState(profile.getState());
        dto.setEmail(profile.getUser().getEmail());
        dto.setVillage(profile.getVillage());
        dto.setBloodGroup(profile.getBloodGroup());
        dto.setBirthDate(profile.getDateOfBirth());
        dto.setCreatedAt(profile.getCreatedAt());
        dto.setLat(profile.getLat());
        dto.setLng(profile.getLon());
        dto.setAvailable(profile.isAvailable());
        dto.setLastDonationDate(profile.getLastDonationDate());
        return dto;
    }
}
