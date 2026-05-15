package blood_donation.health.service;

import blood_donation.health.DTO.HospitalProfileDto;
import blood_donation.health.Entity.Hospital;
import blood_donation.health.Entity.Users;
import blood_donation.health.Utils.UserAlreadyExistsException;
import blood_donation.health.repository.HospitalProfileRepository;
import blood_donation.health.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@Transactional
@RequiredArgsConstructor
public class HospitalService {

    private final HospitalProfileRepository hospitalProfileRepository;
    private final UserRepository userRepository;

    // PATCH mapper → skips null values automatically
    private final ModelMapper patchMapper = new ModelMapper();
    {
        patchMapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STRICT)
                .setSkipNullEnabled(true);
    }

    public void completeHospitalDetails(
            String email,
            HospitalProfileDto dto
    ) {
        Users user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found: " + email
                        ));

        // Check existing profile
        if (hospitalProfileRepository.findByUser(user).isPresent()) {
            throw new UserAlreadyExistsException(
                    "Hospital profile already exists"
            );
        }

        Hospital hospital = new Hospital();

        mapDtoToEntity(dto, hospital);

        // Relationship mapping
        hospital.setUser(user);

        hospitalProfileRepository.save(hospital);
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public HospitalProfileDto getHospitalProfile(String email) {

        Hospital hospital = hospitalProfileRepository
                .findByUserEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "Hospital profile not found"
                        ));

        return mapEntityToDto(hospital);
    }


    public String updateHospitalProfile(
            String email,
            HospitalProfileDto dto
    ) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found"
                        ));

        Hospital hospital = hospitalProfileRepository
                .findByUser(user)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "Hospital profile not found"
                        ));

        // Auto skips null values
        patchMapper.map(dto, hospital);

        hospitalProfileRepository.save(hospital);

        return "Hospital profile updated successfully";
    }

    public String deleteHospitalProfile(String email) {

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found"
                        ));

        Hospital hospital = hospitalProfileRepository
                .findByUser(user)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "Hospital profile not found"
                        ));

        hospitalProfileRepository.delete(hospital);

        return "Hospital profile deleted successfully";
    }

    private void mapDtoToEntity(
            HospitalProfileDto dto,
            Hospital hospital
    ) {

        hospital.setHospitalName(dto.getHospitalName());
        hospital.setLicenseNumber(dto.getLicenseNumber());
        hospital.setEmergencyContact(dto.getEmergencyContact());
        hospital.setWebsite(dto.getWebsite());

        // Default false until admin verification
        hospital.setVerifiedByAdmin(false);
    }

    private HospitalProfileDto mapEntityToDto(Hospital hospital) {

        HospitalProfileDto dto = new HospitalProfileDto();

        dto.setHospitalName(hospital.getHospitalName());
        dto.setLicenseNumber(hospital.getLicenseNumber());
        dto.setEmergencyContact(hospital.getEmergencyContact());
        dto.setWebsite(hospital.getWebsite());

        return dto;
    }
}