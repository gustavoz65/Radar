/**
 * AI module: assistant features (customer summary, message drafting). Access to LLMs goes through
 * {@code AiGatewayPort} (ADR-009); a deterministic implementation ships by default so the product
 * works with no API key (AI is a layer, never a hard dependency). Consumes customer/scheduling data
 * only via their public APIs.
 */
package com.omnia.platform.ai;
