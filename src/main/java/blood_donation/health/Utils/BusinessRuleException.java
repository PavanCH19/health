package blood_donation.health.Utils;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a request is well-formed but violates a business rule
 * (wrong state, not allowed, not verified, ...). Carries the HTTP status to return.
 */
public class BusinessRuleException extends RuntimeException {

    private final HttpStatus status;

    public BusinessRuleException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
