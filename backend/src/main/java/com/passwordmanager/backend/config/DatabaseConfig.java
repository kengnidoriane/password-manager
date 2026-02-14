package com.passwordmanager.backend.config;

import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

/**
 * Database configuration to handle Render.com DATABASE_URL format
 * Converts postgres:// to jdbc:postgresql://
 */
@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        String databaseUrl = System.getenv("DATABASE_URL");
        
        if (databaseUrl != null && databaseUrl.startsWith("postgres://")) {
            // Convert Render's postgres:// to JDBC format
            databaseUrl = databaseUrl.replace("postgres://", "jdbc:postgresql://");
            
            // Extract username and password from URL if present
            String username = System.getenv("SPRING_DATASOURCE_USERNAME");
            String password = System.getenv("SPRING_DATASOURCE_PASSWORD");
            
            return DataSourceBuilder
                    .create()
                    .url(databaseUrl)
                    .username(username)
                    .password(password)
                    .build();
        }
        
        // Fallback to Spring Boot's default DataSource configuration
        return DataSourceBuilder.create().build();
    }
}
