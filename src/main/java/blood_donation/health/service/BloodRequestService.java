package blood_donation.health.service;

import blood_donation.health.DTO.BloodReqDto;
import blood_donation.health.Entity.BloodRequest;
import blood_donation.health.Entity.Recipient;
import blood_donation.health.Entity.RequestStatus;
import blood_donation.health.Entity.User;
import blood_donation.health.repository.BloodRequestRepository;
import blood_donation.health.repository.RecipientRepository;
import blood_donation.health.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
@Transactional
public class BloodRequestService {

    private final BloodRequestRepository bloodRequestRepository;
    private final RecipientRepository recipientRepository;
    private final UserRepository userRepository;

    public Long createBloodRequest(BloodReqDto dto, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Recipient recipient = recipientRepository.findByUser(user)
                .orElseGet(() -> {
                    Recipient newRecipient = new Recipient();
                    newRecipient.setUser(user);
                    newRecipient.setBloodGroup(dto.getBloodGroup());
                    return recipientRepository.save(newRecipient);
                });

        BloodRequest request = new BloodRequest();
        request.setBloodGroup(dto.getBloodGroup());
        request.setQuantity(dto.getQuantity());
        request.setUrgency(dto.getUrgency());
        request.setCity(dto.getCity());
        request.setRecipient(recipient);

        BloodRequest saved = bloodRequestRepository.save(request);

        return saved.getId();
    }
}