package com.omnia.platform.ai.adapter.out;

import com.omnia.platform.ai.application.port.out.AiGatewayPort;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Deterministic fallback gateway — no external calls, no API key. Echoes a structured composition of
 * the instruction and context so features degrade gracefully when no LLM is configured. Replace by
 * providing another {@link AiGatewayPort} bean (e.g. a Claude adapter).
 */
@Configuration
class DeterministicAiGateway {

    @Bean
    @ConditionalOnMissingBean(AiGatewayPort.class)
    AiGatewayPort deterministicAiGateway() {
        return new AiGatewayPort() {
            @Override
            public boolean isLive() {
                return false;
            }

            @Override
            public String generate(String instruction, List<String> context) {
                StringBuilder sb = new StringBuilder(instruction.trim());
                if (!context.isEmpty()) {
                    sb.append("\n\n");
                    context.forEach(line -> sb.append("• ").append(line).append('\n'));
                }
                return sb.toString().trim();
            }
        };
    }
}
