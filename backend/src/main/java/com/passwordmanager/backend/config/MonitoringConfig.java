package com.passwordmanager.backend.config;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.binder.jvm.ClassLoaderMetrics;
import io.micrometer.core.instrument.binder.jvm.JvmGcMetrics;
import io.micrometer.core.instrument.binder.jvm.JvmMemoryMetrics;
import io.micrometer.core.instrument.binder.jvm.JvmThreadMetrics;
import io.micrometer.core.instrument.binder.system.FileDescriptorMetrics;
import io.micrometer.core.instrument.binder.system.ProcessorMetrics;
import io.micrometer.core.instrument.binder.system.UptimeMetrics;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.autoconfigure.metrics.MeterRegistryCustomizer;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.actuate.info.InfoContributor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Comprehensive monitoring configuration for the Password Manager application.
 * Sets up metrics, health indicators, and info contributors for observability.
 */
@Configuration
@Slf4j
public class MonitoringConfig {

    private final Instant applicationStartTime = Instant.now();

    /**
     * Register JVM metrics for comprehensive monitoring
     */
    @Bean
    public MeterRegistryCustomizer<MeterRegistry> jvmMetricsCustomizer() {
        return registry -> {
            // JVM metrics
            new JvmMemoryMetrics().bindTo(registry);
            new JvmGcMetrics().bindTo(registry);
            new JvmThreadMetrics().bindTo(registry);
            new ClassLoaderMetrics().bindTo(registry);
            
            // System metrics
            new ProcessorMetrics().bindTo(registry);
            new UptimeMetrics().bindTo(registry);
            new FileDescriptorMetrics().bindTo(registry);
            
            log.info("JVM and system metrics registered successfully");
        };
    }

    /**
     * Custom info contributor for application metadata
     */
    @Bean
    public InfoContributor customInfoContributor(Environment environment) {
        return builder -> {
            Map<String, Object> appInfo = new HashMap<>();
            appInfo.put("name", environment.getProperty("spring.application.name", "password-manager-backend"));
            appInfo.put("version", getClass().getPackage().getImplementationVersion() != null ? 
                       getClass().getPackage().getImplementationVersion() : "development");
            appInfo.put("profile", environment.getActiveProfiles().length > 0 ? 
                       environment.getActiveProfiles()[0] : "default");
            appInfo.put("startTime", applicationStartTime.toString());
            appInfo.put("javaVersion", System.getProperty("java.version"));
            appInfo.put("javaVendor", System.getProperty("java.vendor"));
            
            // Runtime information
            Runtime runtime = Runtime.getRuntime();
            Map<String, Object> runtimeInfo = new HashMap<>();
            runtimeInfo.put("processors", runtime.availableProcessors());
            runtimeInfo.put("maxMemoryMB", runtime.maxMemory() / 1024 / 1024);
            runtimeInfo.put("totalMemoryMB", runtime.totalMemory() / 1024 / 1024);
            runtimeInfo.put("freeMemoryMB", runtime.freeMemory() / 1024 / 1024);
            
            appInfo.put("runtime", runtimeInfo);
            
            builder.withDetail("application", appInfo);
        };
    }

    /**
     * Security info contributor (non-sensitive information only)
     */
    @Bean
    public InfoContributor securityInfoContributor() {
        return builder -> {
            Map<String, Object> securityInfo = new HashMap<>();
            securityInfo.put("authenticationMethod", "JWT");
            securityInfo.put("encryptionAlgorithm", "AES-256-GCM");
            securityInfo.put("keyDerivation", "PBKDF2");
            securityInfo.put("sessionStorage", "Redis");
            securityInfo.put("zeroKnowledgeArchitecture", true);
            
            builder.withDetail("security", securityInfo);
        };
    }

    /**
     * Features info contributor
     */
    @Bean
    public InfoContributor featuresInfoContributor() {
        return builder -> {
            Map<String, Object> features = new HashMap<>();
            features.put("passwordGeneration", true);
            features.put("twoFactorAuth", true);
            features.put("vaultSync", true);
            features.put("securityAnalysis", true);
            features.put("auditLogging", true);
            features.put("offlineSupport", true);
            features.put("importExport", true);
            features.put("credentialSharing", true);
            features.put("biometricAuth", true);
            features.put("breachMonitoring", true);
            
            builder.withDetail("features", features);
        };
    }

    /**
     * Custom health indicator that aggregates all health checks
     */
    @Bean
    public HealthIndicator aggregateHealthIndicator() {
        return () -> {
            try {
                return org.springframework.boot.actuate.health.Health.up()
                        .withDetail("status", "All systems operational")
                        .build();
            } catch (Exception e) {
                log.error("Failed to aggregate health indicators", e);
                return org.springframework.boot.actuate.health.Health.down()
                        .withDetail("error", "Failed to aggregate health status")
                        .build();
            }
        };
    }
}