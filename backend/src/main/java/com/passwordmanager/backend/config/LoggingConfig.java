package com.passwordmanager.backend.config;

import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.core.ConsoleAppender;
import ch.qos.logback.core.rolling.RollingFileAppender;
import ch.qos.logback.core.rolling.TimeBasedRollingPolicy;
import net.logstash.logback.encoder.LogstashEncoder;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Configuration for structured logging with JSON format.
 * Configures different logging patterns for different environments.
 */
@Configuration
public class LoggingConfig {

    @Value("${spring.application.name}")
    private String applicationName;

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    /**
     * Configure JSON logging for production environment
     */
    @Bean
    @Profile("prod")
    public LogstashEncoder logstashEncoder() {
        LogstashEncoder encoder = new LogstashEncoder();
        encoder.setIncludeContext(true);
        encoder.setIncludeMdc(true);
        encoder.setCustomFields("{\"application\":\"" + applicationName + "\",\"environment\":\"" + activeProfile + "\"}");
        return encoder;
    }

    /**
     * Configure structured logging appender for production
     */
    @Bean
    @Profile("prod")
    public RollingFileAppender<?> structuredFileAppender() {
        LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();
        
        RollingFileAppender<ch.qos.logback.classic.spi.ILoggingEvent> appender = 
                new RollingFileAppender<>();
        appender.setContext(context);
        appender.setName("STRUCTURED_FILE");
        appender.setFile("/var/log/password-manager/application.json");
        
        // Configure rolling policy
        TimeBasedRollingPolicy<ch.qos.logback.classic.spi.ILoggingEvent> rollingPolicy = 
                new TimeBasedRollingPolicy<>();
        rollingPolicy.setContext(context);
        rollingPolicy.setParent(appender);
        rollingPolicy.setFileNamePattern("/var/log/password-manager/application.%d{yyyy-MM-dd}.%i.json.gz");
        rollingPolicy.setMaxHistory(30);
        rollingPolicy.setTotalSizeCap(ch.qos.logback.core.util.FileSize.valueOf("1GB"));
        rollingPolicy.start();
        
        appender.setRollingPolicy(rollingPolicy);
        appender.setEncoder(logstashEncoder());
        appender.start();
        
        return appender;
    }

    /**
     * Configure console logging with JSON format for staging
     */
    @Bean
    @Profile("staging")
    public ConsoleAppender<?> structuredConsoleAppender() {
        LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();
        
        ConsoleAppender<ch.qos.logback.classic.spi.ILoggingEvent> appender = 
                new ConsoleAppender<>();
        appender.setContext(context);
        appender.setName("STRUCTURED_CONSOLE");
        
        LogstashEncoder encoder = new LogstashEncoder();
        encoder.setIncludeContext(true);
        encoder.setIncludeMdc(true);
        encoder.setCustomFields("{\"application\":\"" + applicationName + "\",\"environment\":\"" + activeProfile + "\"}");
        
        appender.setEncoder(encoder);
        appender.start();
        
        return appender;
    }

    /**
     * Configure human-readable console logging for development
     */
    @Bean
    @Profile("dev")
    public ConsoleAppender<?> developmentConsoleAppender() {
        LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();
        
        ConsoleAppender<ch.qos.logback.classic.spi.ILoggingEvent> appender = 
                new ConsoleAppender<>();
        appender.setContext(context);
        appender.setName("DEV_CONSOLE");
        
        PatternLayoutEncoder encoder = new PatternLayoutEncoder();
        encoder.setContext(context);
        encoder.setPattern("%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level [%X{correlationId:-}] [%X{userId:-}] %logger{36} - %msg%n");
        encoder.start();
        
        appender.setEncoder(encoder);
        appender.start();
        
        return appender;
    }
}