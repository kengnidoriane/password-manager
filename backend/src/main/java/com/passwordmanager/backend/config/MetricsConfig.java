package com.passwordmanager.backend.config;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.config.MeterFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.autoconfigure.metrics.MeterRegistryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for custom metrics and Prometheus integration.
 * Sets up common tags and filters for all metrics.
 */
@Configuration
public class MetricsConfig {

    @Value("${spring.application.name}")
    private String applicationName;

    @Value("${spring.profiles.active:dev}")
    private String environment;

    /**
     * Customize meter registry with common tags
     */
    @Bean
    public MeterRegistryCustomizer<MeterRegistry> metricsCommonTags() {
        return registry -> {
            registry.config()
                    .commonTags("application", applicationName)
                    .commonTags("environment", environment)
                    .meterFilter(MeterFilter.deny(id -> {
                        // Filter out some noisy metrics
                        String name = id.getName();
                        return name.startsWith("jvm.gc.pause") ||
                               name.startsWith("jvm.gc.concurrent.phase.time") ||
                               name.startsWith("tomcat.sessions");
                    }));
        };
    }

    /**
     * Custom meter filter for sensitive endpoints
     */
    @Bean
    public MeterFilter sensitiveEndpointFilter() {
        return MeterFilter.replaceTagValues("uri", uri -> {
            // Mask sensitive endpoints in metrics
            if (uri.contains("/api/v1/auth/")) {
                return "/api/v1/auth/**";
            }
            if (uri.contains("/api/v1/vault/")) {
                return "/api/v1/vault/**";
            }
            if (uri.matches(".*/(\\d+|[a-f0-9-]{36}).*")) {
                // Replace UUIDs and IDs with placeholder
                return uri.replaceAll("/(\\d+|[a-f0-9-]{36})", "/{id}");
            }
            return uri;
        });
    }
}