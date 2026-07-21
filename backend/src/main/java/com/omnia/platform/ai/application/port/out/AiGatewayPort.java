package com.omnia.platform.ai.application.port.out;

import java.util.List;

/**
 * Provider-agnostic text-generation port (ADR-009). The default adapter is deterministic; a Claude
 * adapter can replace it without touching use cases. Prompts must never contain another tenant's
 * data.
 */
public interface AiGatewayPort {

    /** Whether a real LLM backs this gateway (vs the deterministic fallback). */
    boolean isLive();

    /** Generates text for the given instruction and context lines. */
    String generate(String instruction, List<String> context);
}
