package com.omnia.platform.shared.tenancy;

import com.zaxxer.hikari.HikariDataSource;
import javax.sql.DataSource;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
@EnableConfigurationProperties(DataSourceProperties.class)
public class TenancyConfiguration {

    /**
     * Wraps the pooled application DataSource so each checkout carries the current tenant into the
     * PostgreSQL session (consumed by RLS policies). Flyway uses its own connection with the
     * schema-owner role and is not affected by this wrapper.
     */
    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties) {
        HikariDataSource pool = properties
                .initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
        return new TenantAwareDataSource(pool);
    }
}
