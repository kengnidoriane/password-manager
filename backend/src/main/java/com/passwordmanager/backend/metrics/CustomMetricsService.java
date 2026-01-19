package com.passwordmanager.backend.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Service for tracking custom application metrics.
 * Provides counters, timers, and gauges for monitoring vault operations,
 * authentication events, and application performance.
 */
@Service
@Slf4j
public class CustomMetricsService {

    private final MeterRegistry meterRegistry;
    
    // Authentication metrics
    private final Counter loginAttemptsCounter;
    private final Counter loginSuccessCounter;
    private final Counter loginFailureCounter;
    private final Counter twoFactorAttemptsCounter;
    private final Counter registrationCounter;
    private final Timer authenticationTimer;
    
    // Vault operation metrics
    private final Counter vaultReadCounter;
    private final Counter vaultWriteCounter;
    private final Counter vaultDeleteCounter;
    private final Counter syncOperationsCounter;
    private final Timer vaultOperationTimer;
    private final Timer syncTimer;
    
    // Security metrics
    private final Counter securityAnalysisCounter;
    private final Counter breachCheckCounter;
    private final Counter exportOperationsCounter;
    private final Counter importOperationsCounter;
    
    // Application metrics
    private final AtomicLong activeSessionsGauge = new AtomicLong(0);
    private final AtomicLong totalUsersGauge = new AtomicLong(0);
    private final AtomicLong totalCredentialsGauge = new AtomicLong(0);

    public CustomMetricsService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        
        // Initialize authentication metrics
        this.loginAttemptsCounter = Counter.builder("auth.login.attempts")
                .description("Total number of login attempts")
                .register(meterRegistry);
        
        this.loginSuccessCounter = Counter.builder("auth.login.success")
                .description("Number of successful login attempts")
                .register(meterRegistry);
        
        this.loginFailureCounter = Counter.builder("auth.login.failure")
                .description("Number of failed login attempts")
                .register(meterRegistry);
        
        this.twoFactorAttemptsCounter = Counter.builder("auth.twofactor.attempts")
                .description("Number of 2FA verification attempts")
                .register(meterRegistry);
        
        this.registrationCounter = Counter.builder("auth.registration.total")
                .description("Total number of user registrations")
                .register(meterRegistry);
        
        this.authenticationTimer = Timer.builder("auth.duration")
                .description("Time taken for authentication operations")
                .register(meterRegistry);
        
        // Initialize vault operation metrics
        this.vaultReadCounter = Counter.builder("vault.operations.read")
                .description("Number of vault read operations")
                .register(meterRegistry);
        
        this.vaultWriteCounter = Counter.builder("vault.operations.write")
                .description("Number of vault write operations")
                .register(meterRegistry);
        
        this.vaultDeleteCounter = Counter.builder("vault.operations.delete")
                .description("Number of vault delete operations")
                .register(meterRegistry);
        
        this.syncOperationsCounter = Counter.builder("vault.sync.operations")
                .description("Number of vault sync operations")
                .register(meterRegistry);
        
        this.vaultOperationTimer = Timer.builder("vault.operations.duration")
                .description("Time taken for vault operations")
                .register(meterRegistry);
        
        this.syncTimer = Timer.builder("vault.sync.duration")
                .description("Time taken for sync operations")
                .register(meterRegistry);
        
        // Initialize security metrics
        this.securityAnalysisCounter = Counter.builder("security.analysis.total")
                .description("Number of security analysis operations")
                .register(meterRegistry);
        
        this.breachCheckCounter = Counter.builder("security.breach.checks")
                .description("Number of password breach checks")
                .register(meterRegistry);
        
        this.exportOperationsCounter = Counter.builder("vault.export.operations")
                .description("Number of vault export operations")
                .register(meterRegistry);
        
        this.importOperationsCounter = Counter.builder("vault.import.operations")
                .description("Number of vault import operations")
                .register(meterRegistry);
        
        // Initialize gauges
        Gauge.builder("sessions.active", activeSessionsGauge, AtomicLong::doubleValue)
                .description("Number of active user sessions")
                .register(meterRegistry);
        
        Gauge.builder("users.total", totalUsersGauge, AtomicLong::doubleValue)
                .description("Total number of registered users")
                .register(meterRegistry);
        
        Gauge.builder("credentials.total", totalCredentialsGauge, AtomicLong::doubleValue)
                .description("Total number of stored credentials")
                .register(meterRegistry);
    }

    // Authentication metrics methods
    public void recordLoginAttempt() {
        loginAttemptsCounter.increment();
    }

    public void recordLoginSuccess() {
        loginSuccessCounter.increment();
    }

    public void recordLoginFailure(String reason) {
        Counter.builder("auth.login.failure")
                .description("Number of failed login attempts")
                .tag("reason", reason)
                .register(meterRegistry)
                .increment();
    }

    public void recordTwoFactorAttempt() {
        twoFactorAttemptsCounter.increment();
    }

    public void recordRegistration() {
        registrationCounter.increment();
    }

    public Timer.Sample startAuthenticationTimer() {
        return Timer.start(meterRegistry);
    }

    public void recordAuthenticationTime(Timer.Sample sample, String operation) {
        sample.stop(Timer.builder("auth.duration")
                .tag("operation", operation)
                .register(meterRegistry));
    }

    // Vault operation metrics methods
    public void recordVaultRead(String operation) {
        Counter.builder("vault.operations.read")
                .description("Number of vault read operations")
                .tag("operation", operation)
                .register(meterRegistry)
                .increment();
    }

    public void recordVaultWrite(String operation) {
        Counter.builder("vault.operations.write")
                .description("Number of vault write operations")
                .tag("operation", operation)
                .register(meterRegistry)
                .increment();
    }

    public void recordVaultDelete(String operation) {
        Counter.builder("vault.operations.delete")
                .description("Number of vault delete operations")
                .tag("operation", operation)
                .register(meterRegistry)
                .increment();
    }

    public void recordSyncOperation(String type) {
        Counter.builder("vault.sync.operations")
                .description("Number of vault sync operations")
                .tag("type", type)
                .register(meterRegistry)
                .increment();
    }

    public Timer.Sample startVaultOperationTimer() {
        return Timer.start(meterRegistry);
    }

    public void recordVaultOperationTime(Timer.Sample sample, String operation) {
        sample.stop(Timer.builder("vault.operations.duration")
                .tag("operation", operation)
                .register(meterRegistry));
    }

    public Timer.Sample startSyncTimer() {
        return Timer.start(meterRegistry);
    }

    public void recordSyncTime(Timer.Sample sample, String type) {
        sample.stop(Timer.builder("vault.sync.duration")
                .tag("type", type)
                .register(meterRegistry));
    }

    // Security metrics methods
    public void recordSecurityAnalysis() {
        securityAnalysisCounter.increment();
    }

    public void recordBreachCheck() {
        breachCheckCounter.increment();
    }

    public void recordExportOperation(String format) {
        Counter.builder("vault.export.operations")
                .description("Number of vault export operations")
                .tag("format", format)
                .register(meterRegistry)
                .increment();
    }

    public void recordImportOperation(String format) {
        Counter.builder("vault.import.operations")
                .description("Number of vault import operations")
                .tag("format", format)
                .register(meterRegistry)
                .increment();
    }

    public void recordImportOperation(String format, int imported, int errors) {
        Counter.builder("vault.import.operations")
                .description("Number of vault import operations")
                .tag("format", format)
                .register(meterRegistry)
                .increment();
        
        Counter.builder("vault.import.entries.imported")
                .description("Number of entries successfully imported")
                .tag("format", format)
                .register(meterRegistry)
                .increment(imported);
        
        Counter.builder("vault.import.entries.errors")
                .description("Number of entries with import errors")
                .tag("format", format)
                .register(meterRegistry)
                .increment(errors);
    }

    // Gauge update methods
    public void updateActiveSessionsCount(long count) {
        activeSessionsGauge.set(count);
    }

    public void updateTotalUsersCount(long count) {
        totalUsersGauge.set(count);
    }

    public void updateTotalCredentialsCount(long count) {
        totalCredentialsGauge.set(count);
    }
}