package com.omnia.platform.shared.domain;

/**
 * Base exception for business-rule violations. Carries a stable machine-readable {@code code}
 * (catalogued per module, e.g. {@code appointment.overlap}) surfaced to clients via RFC 9457
 * Problem Details.
 */
public class DomainException extends RuntimeException {

    private final String code;

    public DomainException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String code() {
        return code;
    }
}
