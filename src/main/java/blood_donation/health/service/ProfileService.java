package blood_donation.health.service;

import blood_donation.health.DTO.ProfileRequestDto;
import blood_donation.health.DTO.ProfileResponseDto;
import blood_donation.health.Entity.UserProfile;
import blood_donation.health.Entity.Users;
import blood_donation.health.Utils.UserAlreadyExistsException;
import blood_donation.health.repository.UserProfileRepository;
import blood_donation.health.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Transactional
public class ProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    // ModelMapper configured to skip null fields (perfect for PATCH)
    private final ModelMapper patchMapper;

    public ProfileService(UserProfileRepository userProfileRepository,
                          UserRepository userRepository) {
        this.userProfileRepository = userProfileRepository;
        this.userRepository = userRepository;

        this.patchMapper = new ModelMapper();
        patchMapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STRICT)
                .setSkipNullEnabled(true); // ← this replaces all the if-else null checks
    }

    // ─── CREATE ───────────────────────────────────────────────────────────────
    public void completeProfile(ProfileRequestDto dto, String email) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        if (userProfileRepository.existsByPhone(dto.getPhone())) {
            throw new UserAlreadyExistsException(
                    "Phone number already registered"
            );
        }

        if (user.getProfile() != null) {
            throw new UserAlreadyExistsException("Profile already exists for this user");
        }

        UserProfile profile = new UserProfile();
        mapDtoToEntity(dto, profile);
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
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found: " + email
                        )
                );

        UserProfile profile = user.getProfile();

        if (profile == null) {
            throw new UsernameNotFoundException(
                    "Profile not found. Please complete your profile first."
            );
        }

        // Auto-map non-null fields
        patchMapper.map(dto, profile);

        // Update PostGIS location point separately
        if (dto.getLat() != null && dto.getLon() != null) {

            profile.setLat(dto.getLat());
            profile.setLon(dto.getLon());

            GeometryFactory geometryFactory = new GeometryFactory();

            Point point = geometryFactory.createPoint(
                    new Coordinate(
                            dto.getLon(), // X = longitude
                            dto.getLat()  // Y = latitude
                    )
            );

            point.setSRID(4326);

            profile.setLocation(point);
        }

        profile.setUpdatedAt(LocalDateTime.now());

        userProfileRepository.save(profile);

        return "Profile updated successfully";
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────
    public String deleteProfile(String email) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found: " + email
                        ));

        user.setActive(false);

        userRepository.save(user);

        return "Profile deactivated successfully";
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    // Full mapping for CREATE (all fields required)
    private void mapDtoToEntity(ProfileRequestDto dto, UserProfile profile) {
        profile.setFullName(dto.getName());
        profile.setPhone(dto.getPhone());
        profile.setCity(dto.getCity());
        profile.setDistrict(dto.getDistrict());
        profile.setVillage(dto.getVillage());
        profile.setState(dto.getState());
        profile.setBloodGroup(dto.getBloodGroup());
        profile.setDateOfBirth(dto.getBirthDate());
        setLocation(dto.getLat(), dto.getLon(), profile);
    }

    // Only updates location when both lat and lon are explicitly provided
    private void updateLocationIfProvided(ProfileRequestDto dto, UserProfile profile) {
        if (dto.getLat() != null && dto.getLon() != null) {
            setLocation(dto.getLat(), dto.getLon(), profile);
        }
    }

    private void setLocation(Double lat, Double lon, UserProfile profile) {
        if (lat == null || lon == null) return;
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
        return dto;
    }
}