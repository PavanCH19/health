package blood_donation.health.Utils;

import blood_donation.health.Entity.Enum.BloodGroup;
import blood_donation.health.Entity.Enum.RequestStatus;

import java.time.LocalDate;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static blood_donation.health.Entity.Enum.BloodGroup.*;

/**
 * Single place for the blood-donation business rules so every service
 * applies exactly the same logic.
 */
public final class DonationRules {

    private DonationRules() {
    }

    /** Minimum gap between two whole-blood donations. */
    public static final int COOLDOWN_DAYS = 90;

    public static final int MIN_DONOR_AGE = 18;
    public static final int MAX_DONOR_AGE = 65;

    public static final double MAX_SEARCH_RADIUS_KM = 500;

    /** Requests that still need donors. */
    public static final List<RequestStatus> ACTIVE_REQUEST_STATUSES =
            List.of(RequestStatus.OPEN, RequestStatus.MATCHING);

    // donor group -> recipient groups it can give red cells to
    private static final Map<BloodGroup, Set<BloodGroup>> CAN_DONATE_TO =
            new EnumMap<>(BloodGroup.class);

    static {
        CAN_DONATE_TO.put(O_NEG, EnumSet.allOf(BloodGroup.class));
        CAN_DONATE_TO.put(O_POS, EnumSet.of(O_POS, A_POS, B_POS, AB_POS));
        CAN_DONATE_TO.put(A_NEG, EnumSet.of(A_NEG, A_POS, AB_NEG, AB_POS));
        CAN_DONATE_TO.put(A_POS, EnumSet.of(A_POS, AB_POS));
        CAN_DONATE_TO.put(B_NEG, EnumSet.of(B_NEG, B_POS, AB_NEG, AB_POS));
        CAN_DONATE_TO.put(B_POS, EnumSet.of(B_POS, AB_POS));
        CAN_DONATE_TO.put(AB_NEG, EnumSet.of(AB_NEG, AB_POS));
        CAN_DONATE_TO.put(AB_POS, EnumSet.of(AB_POS));
    }

    /** Recipient groups a donor of this group can help. */
    public static Set<BloodGroup> recipientsFor(BloodGroup donor) {
        return Collections.unmodifiableSet(CAN_DONATE_TO.get(donor));
    }

    /** Donor groups that can give to a recipient of this group. */
    public static Set<BloodGroup> donorsFor(BloodGroup recipient) {
        return CAN_DONATE_TO.entrySet().stream()
                .filter(e -> e.getValue().contains(recipient))
                .map(Map.Entry::getKey)
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(BloodGroup.class)));
    }

    public static boolean canDonate(BloodGroup donor, BloodGroup recipient) {
        return donor != null && recipient != null
                && CAN_DONATE_TO.get(donor).contains(recipient);
    }

    public static List<String> names(Collection<BloodGroup> groups) {
        return groups.stream().map(Enum::name).toList();
    }

    public static List<String> allGroupNames() {
        return names(EnumSet.allOf(BloodGroup.class));
    }

    // ───────────── eligibility ─────────────

    /** Donors whose last donation is on/before this date are eligible again. */
    public static LocalDate eligibleBefore(LocalDate today) {
        return today.minusDays(COOLDOWN_DAYS);
    }

    public static boolean isEligible(LocalDate lastDonation, LocalDate today) {
        return lastDonation == null || !lastDonation.isAfter(eligibleBefore(today));
    }

    public static long daysUntilEligible(LocalDate lastDonation, LocalDate today) {
        if (lastDonation == null) {
            return 0;
        }
        return Math.max(0,
                ChronoUnit.DAYS.between(today, lastDonation.plusDays(COOLDOWN_DAYS)));
    }

    // ───────────── validation helpers ─────────────

    public static void validateRadius(double radiusKm) {
        if (!(radiusKm > 0) || radiusKm > MAX_SEARCH_RADIUS_KM) {
            throw new IllegalArgumentException(
                    "radiusKm must be greater than 0 and at most " + (int) MAX_SEARCH_RADIUS_KM);
        }
    }

    public static void validateCoordinates(Double lat, Double lon) {
        if (lat == null || lon == null) {
            throw new IllegalArgumentException("Both latitude and longitude are required");
        }
        if (lat < -90 || lat > 90) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90");
        }
        if (lon < -180 || lon > 180) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180");
        }
    }

    public static void validateDonorAge(LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            throw new IllegalArgumentException("Date of birth is required");
        }
        LocalDate today = LocalDate.now();
        if (dateOfBirth.isAfter(today)) {
            throw new IllegalArgumentException("Date of birth cannot be in the future");
        }
        int age = Period.between(dateOfBirth, today).getYears();
        if (age < MIN_DONOR_AGE || age > MAX_DONOR_AGE) {
            throw new IllegalArgumentException(
                    "Donors must be between " + MIN_DONOR_AGE + " and " + MAX_DONOR_AGE + " years old");
        }
    }
}
