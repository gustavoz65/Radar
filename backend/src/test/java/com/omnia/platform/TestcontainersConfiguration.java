package com.omnia.platform;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.DynamicPropertyRegistrar;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Real PostgreSQL for integration tests (ADR-010: H2 would lie about RLS and SQL).
 *
 * <p>The container superuser plays the {@code omnia_owner} role (runs Flyway); the application
 * datasource uses {@code omnia_app} created by migration V1 — matching production topology.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    @Bean
    PostgreSQLContainer<?> postgresContainer() {
        return new PostgreSQLContainer<>("postgres:16-alpine")
                .withDatabaseName("omnia")
                .withUsername("omnia_owner")
                .withPassword("omnia_local_dev");
    }

    @Bean
    DynamicPropertyRegistrar databaseProperties(PostgreSQLContainer<?> container) {
        return registry -> {
            registry.add("spring.datasource.url", container::getJdbcUrl);
            registry.add("spring.datasource.username", () -> "omnia_app");
            registry.add("spring.datasource.password", () -> "omnia_app_local_dev");
            registry.add("spring.flyway.url", container::getJdbcUrl);
            registry.add("spring.flyway.user", container::getUsername);
            registry.add("spring.flyway.password", container::getPassword);
            // Redis is not started for integration tests yet; disable its health indicator noise.
            registry.add("management.health.redis.enabled", () -> "false");
        };
    }
}
