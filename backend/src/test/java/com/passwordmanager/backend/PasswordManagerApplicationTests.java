package com.passwordmanager.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Basic application context test to ensure the application starts correctly.
 */
@SpringBootTest
@ActiveProfiles("test")
class PasswordManagerApplicationTests {

    @Test
    void contextLoads() {
        // This test verifies that the Spring application context loads successfully
    }
}
