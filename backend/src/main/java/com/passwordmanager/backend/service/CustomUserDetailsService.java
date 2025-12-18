package com.passwordmanager.backend.service;

import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.repository.UserRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Collections;

/**
 * Custom implementation of Spring Security's UserDetailsService.
 * 
 * This service loads user-specific data for authentication and authorization.
 * It integrates the UserAccount entity with Spring Security's authentication mechanism.
 * 
 * The service follows the Single Responsibility Principle (SRP) by focusing solely
 * on loading user details for Spring Security authentication.
 * 
 * Requirements: 1.1, 2.1
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Constructor injection for UserRepository.
     * 
     * @param userRepository Repository for user data access
     */
    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Loads user details by email address (username).
     * 
     * This method is called by Spring Security during authentication to retrieve
     * user information. It converts our UserAccount entity into Spring Security's
     * UserDetails interface.
     * 
     * Note: In our zero-knowledge architecture, the password field in UserDetails
     * contains the BCrypt hash of the derived authentication key, NOT the master password.
     * 
     * @param email The email address (username) of the user
     * @return UserDetails object containing user information
     * @throws UsernameNotFoundException if the user is not found
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserAccount userAccount = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with email: " + email));

        return buildUserDetails(userAccount);
    }

    /**
     * Builds a Spring Security UserDetails object from our UserAccount entity.
     * 
     * This method encapsulates the conversion logic and can be extended
     * to include additional user attributes or authorities.
     * 
     * @param userAccount The user account entity
     * @return UserDetails object for Spring Security
     */
    private UserDetails buildUserDetails(UserAccount userAccount) {
        return User.builder()
                .username(userAccount.getEmail())
                .password(userAccount.getAuthKeyHash())
                .authorities(getAuthorities(userAccount))
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(!userAccount.getEmailVerified())
                .build();
    }

    /**
     * Gets the authorities (roles) for a user.
     * 
     * Currently, all users have the ROLE_USER authority.
     * This can be extended in the future to support different user roles
     * (e.g., ROLE_ADMIN, ROLE_PREMIUM) if needed.
     * 
     * @param userAccount The user account entity
     * @return Collection of granted authorities
     */
    private Collection<? extends GrantedAuthority> getAuthorities(UserAccount userAccount) {
        // For now, all users have the same role
        // This can be extended to support multiple roles from a roles table
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
    }

    /**
     * Loads user details by user ID.
     * 
     * This is a custom method (not part of UserDetailsService interface)
     * that can be used when we have the user ID from a JWT token.
     * 
     * @param userId The user's UUID
     * @return UserDetails object containing user information
     * @throws UsernameNotFoundException if the user is not found
     */
    @Transactional(readOnly = true)
    public UserDetails loadUserById(String userId) throws UsernameNotFoundException {
        UserAccount userAccount = userRepository.findById(java.util.UUID.fromString(userId))
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with id: " + userId));

        return buildUserDetails(userAccount);
    }

    /**
     * Checks if a user exists by email.
     * 
     * This is a convenience method for registration validation.
     * 
     * @param email The email address to check
     * @return true if a user with this email exists, false otherwise
     */
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}
