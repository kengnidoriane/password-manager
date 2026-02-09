package com.passwordmanager.backend;

import com.passwordmanager.backend.config.TestConfig;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/**
 * Base class for integration tests.
 * Automatically imports TestConfig which provides mock beans for Redis and rate limiting.
 * All integration tests should extend this class to ensure proper test configuration.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestConfig.class)
public abstract class BaseIntegrationTest {
    // This class provides common test configuration for all integration tests
}
