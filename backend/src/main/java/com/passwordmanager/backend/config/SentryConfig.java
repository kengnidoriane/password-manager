package com.passwordmanager.backend.config;

// Sentry configuration temporarily disabled - requires sentry dependency in pom.xml
// import io.sentry.Sentry;
// import io.sentry.SentryOptions;
// import io.sentry.spring.jakarta.EnableSentry;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Sentry Error Tracking Configuration
 * 
 * Configures Sentry for error tracking and performance monitoring.
 * Only enabled in non-local environments.
 * 
 * NOTE: Currently disabled - requires adding Sentry dependency to pom.xml:
 * <dependency>
 *     <groupId>io.sentry</groupId>
 *     <artifactId>sentry-spring-boot-starter-jakarta</artifactId>
 *     <version>6.x.x</version>
 * </dependency>
 */
@Configuration
// @EnableSentry(dsn = "${sentry.dsn:}")
@Profile("!local")
public class SentryConfig {

    @Value("${sentry.dsn:}")
    private String sentryDsn;

    @Value("${sentry.environment:production}")
    private String environment;

    @Value("${sentry.traces-sample-rate:0.1}")
    private Double tracesSampleRate;

    @Value("${sentry.send-default-pii:false}")
    private Boolean sendDefaultPii;

    @Value("${spring.application.name:password-manager}")
    private String applicationName;

    @PostConstruct
    public void init() {
        // Sentry initialization disabled - requires sentry dependency
        /*
        if (sentryDsn != null && !sentryDsn.isEmpty()) {
            Sentry.init(options -> {
                options.setDsn(sentryDsn);
                options.setEnvironment(environment);
                options.setTracesSampleRate(tracesSampleRate);
                options.setSendDefaultPii(sendDefaultPii);
                options.setRelease(applicationName + "@" + getVersion());
                options.setAttachStacktrace(true);
                options.setEnableTracing(true);
                
                // Set before send callback to filter sensitive data
                options.setBeforeSend((event, hint) -> {
                    // Remove sensitive headers
                    if (event.getRequest() != null && event.getRequest().getHeaders() != null) {
                        event.getRequest().getHeaders().remove("Authorization");
                        event.getRequest().getHeaders().remove("Cookie");
                    }
                    
                    // Remove sensitive data from extra
                    if (event.getExtras() != null) {
                        event.getExtras().remove("password");
                        event.getExtras().remove("masterPassword");
                        event.getExtras().remove("encryptionKey");
                        event.getExtras().remove("authKey");
                    }
                    
                    return event;
                });
                
                // Configure tags
                options.setTag("application", applicationName);
                options.setTag("environment", environment);
            });
        }
        */
    }

    private String getVersion() {
        // Get version from manifest or default
        Package pkg = getClass().getPackage();
        String version = pkg != null ? pkg.getImplementationVersion() : null;
        return version != null ? version : "unknown";
    }
}
