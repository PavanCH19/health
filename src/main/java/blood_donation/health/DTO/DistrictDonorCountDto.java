package blood_donation.health.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DistrictDonorCountDto {
    private String district;
    private Long donorCount;
}