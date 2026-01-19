package com.passwordmanager.backend.repository;

import com.passwordmanager.backend.entity.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for UserSettings entity operations.
 * 
 * Provides data access methods for user settings management.
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */
@Repository
public interface UserSettingsRepository extends JpaRepository<UserSettings, UUID> {

    /**
     * Finds user settings by user ID.
     * 
     * @param userId the user ID to search for
     * @return Optional containing the user settings if found
     */
    @Query("SELECT s FROM UserSettings s WHERE s.user.id = :userId")
    Optional<UserSettings> findByUserId(@Param("userId") UUID userId);

    /**
     * Checks if user settings exist for a given user ID.
     * 
     * @param userId the user ID to check
     * @return true if settings exist, false otherwise
     */
    @Query("SELECT COUNT(s) > 0 FROM UserSettings s WHERE s.user.id = :userId")
    boolean existsByUserId(@Param("userId") UUID userId);

    /**
     * Deletes user settings by user ID.
     * 
     * @param userId the user ID whose settings to delete
     */
    @Query("DELETE FROM UserSettings s WHERE s.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}