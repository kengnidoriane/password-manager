package com.passwordmanager.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing a tag for categorizing vault entries.
 * 
 * Tags provide flexible categorization of credentials and secure notes,
 * allowing multiple tags per entry as per requirement 7.2.
 * 
 * Tag metadata (name, color) is stored unencrypted to enable efficient
 * filtering and display without requiring decryption.
 * 
 * Requirements: 7.2, 7.5
 */
@Entity
@Table(name = "tags")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tag {

    /**
     * Unique identifier for the tag.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Reference to the user who owns this tag.
     * 
     * Tags are user-specific and cannot be shared between users.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User is required")
    private UserAccount user;

    /**
     * Display name of the tag.
     * 
     * Must be unique per user to avoid confusion.
     * Stored unencrypted for efficient filtering and display.
     */
    @Column(nullable = false, length = 100)
    @NotBlank(message = "Tag name is required")
    @Size(min = 1, max = 100, message = "Tag name must be between 1 and 100 characters")
    private String name;

    /**
     * Hex color code for visual representation of the tag.
     * 
     * Used in the UI to provide visual distinction between tags.
     * Must be a valid 6-digit hex color code (e.g., "#FF5733").
     */
    @Column(length = 7)
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Color must be a valid hex color code (e.g., #FF5733)")
    @Builder.Default
    private String color = "#6B7280"; // Default gray color

    /**
     * Optional description of the tag's purpose or usage.
     */
    @Column(length = 500)
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    /**
     * Display order for tag sorting.
     * 
     * Lower values appear first. Allows users to customize tag ordering
     * in dropdowns and filter lists.
     */
    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    /**
     * Timestamp when the tag was created.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the tag was last updated.
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Soft delete timestamp.
     * 
     * When a tag is deleted, this field is set to the current timestamp.
     * The tag is removed from all vault entries before deletion.
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * Checks if this tag is currently deleted.
     * 
     * @return true if the tag is soft-deleted, false otherwise
     */
    public boolean isDeleted() {
        return deletedAt != null;
    }

    /**
     * Checks if this tag is active (not deleted).
     * 
     * @return true if the tag is not deleted, false otherwise
     */
    public boolean isActive() {
        return deletedAt == null;
    }

    /**
     * Soft deletes this tag.
     * 
     * The tag will be removed from all vault entries that reference it.
     */
    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    /**
     * Restores this tag from trash.
     * 
     * Note: This does not automatically re-add the tag to vault entries
     * that previously had it. Those associations are lost when the tag is deleted.
     */
    public void restore() {
        this.deletedAt = null;
    }

    /**
     * Gets the user ID for this tag.
     * 
     * @return the UUID of the owning user
     */
    public UUID getUserId() {
        return user != null ? user.getId() : null;
    }

    /**
     * Validates that the color is a proper hex color code.
     * 
     * @return true if the color is valid, false otherwise
     */
    public boolean isValidColor() {
        return color != null && color.matches("^#[0-9A-Fa-f]{6}$");
    }

    /**
     * Gets the color as an RGB integer value.
     * 
     * @return the RGB color value, or null if color is invalid
     */
    public Integer getColorAsRgb() {
        if (!isValidColor()) {
            return null;
        }
        
        try {
            return Integer.parseInt(color.substring(1), 16);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Sets the color from an RGB integer value.
     * 
     * @param rgb the RGB color value (0x000000 to 0xFFFFFF)
     */
    public void setColorFromRgb(int rgb) {
        if (rgb < 0 || rgb > 0xFFFFFF) {
            throw new IllegalArgumentException("RGB value must be between 0x000000 and 0xFFFFFF");
        }
        
        this.color = String.format("#%06X", rgb);
    }

    /**
     * Gets a display-friendly version of the tag name.
     * 
     * Trims whitespace and capitalizes the first letter.
     * 
     * @return formatted tag name
     */
    public String getDisplayName() {
        if (name == null || name.trim().isEmpty()) {
            return "";
        }
        
        String trimmed = name.trim();
        return trimmed.substring(0, 1).toUpperCase() + trimmed.substring(1).toLowerCase();
    }

    /**
     * Creates a normalized version of the tag name for comparison.
     * 
     * Converts to lowercase and removes extra whitespace for case-insensitive
     * uniqueness checking.
     * 
     * @return normalized tag name
     */
    public String getNormalizedName() {
        return name != null ? name.trim().toLowerCase() : "";
    }

    /**
     * Checks if this tag has the same normalized name as another tag.
     * 
     * Used for preventing duplicate tag names per user.
     * 
     * @param other the other tag to compare with
     * @return true if the normalized names match, false otherwise
     */
    public boolean hasSameNameAs(Tag other) {
        if (other == null) {
            return false;
        }
        
        return getNormalizedName().equals(other.getNormalizedName());
    }

    /**
     * Checks if this tag matches a search query.
     * 
     * Performs case-insensitive matching against name and description.
     * 
     * @param query the search query
     * @return true if the tag matches the query, false otherwise
     */
    public boolean matchesQuery(String query) {
        if (query == null || query.trim().isEmpty()) {
            return true;
        }
        
        String lowerQuery = query.trim().toLowerCase();
        String lowerName = name != null ? name.toLowerCase() : "";
        String lowerDescription = description != null ? description.toLowerCase() : "";
        
        return lowerName.contains(lowerQuery) || lowerDescription.contains(lowerQuery);
    }
}