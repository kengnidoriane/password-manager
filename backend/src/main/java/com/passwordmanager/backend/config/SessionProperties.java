package com.passwordmanager.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for session management.
 * Binds properties from application.yml with prefix 'session'.
 */
@Configuration
@ConfigurationProperties(prefix = "session")
public class SessionProperties {

    /**
     * Session timeout in minutes.
     * Default: 15 minutes
     */
    private int timeoutMinutes = 15;

    /**
     * Maximum number of concurrent sessions per user.
     * Default: 3
     */
    private int maxConcurrentSessions = 3;

    public int getTimeoutMinutes() {
        return timeoutMinutes;
    }

    public void setTimeoutMinutes(int timeoutMinutes) {
        this.timeoutMinutes = timeoutMinutes;
    }

    public int getMaxConcurrentSessions() {
        return maxConcurrentSessions;
    }

    public void setMaxConcurrentSessions(int maxConcurrentSessions) {
        this.maxConcurrentSessions = maxConcurrentSessions;
    }
}
