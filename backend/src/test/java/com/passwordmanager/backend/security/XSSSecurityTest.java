package com.passwordmanager.backend.security;

import com.passwordmanager.backend.BaseIntegrationTest;
import com.passwordmanager.backend.dto.CredentialRequest;
import com.passwordmanager.backend.dto.SecureNoteRequest;
import com.passwordmanager.backend.dto.FolderRequest;
import com.passwordmanager.backend.dto.TagRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Security tests for XSS (Cross-Site Scripting) vulnerabilities.
 * Tests that malicious scripts in user input are properly sanitized.
 */
public class XSSSecurityTest extends BaseIntegrationTest {

    private static final String[] XSS_PAYLOADS = {
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert('XSS')>",
        "<svg onload=alert('XSS')>",
        "javascript:alert('XSS')",
        "<iframe src='javascript:alert(\"XSS\")'></iframe>",
        "<body onload=alert('XSS')>",
        "<input onfocus=alert('XSS') autofocus>",
        "<select onfocus=alert('XSS') autofocus>",
        "<textarea onfocus=alert('XSS') autofocus>",
        "<marquee onstart=alert('XSS')>",
        "<div style=\"background:url('javascript:alert(XSS)')\">",
        "';alert('XSS');//",
        "\"><script>alert('XSS')</script>",
        "<ScRiPt>alert('XSS')</ScRiPt>",
        "%3Cscript%3Ealert('XSS')%3C/script%3E"
    };

    @Test
    @WithMockUser(username = "test@example.com")
    public void testCredentialTitleXSSPrevention() throws Exception {
        for (String xssPayload : XSS_PAYLOADS) {
            CredentialRequest request = new CredentialRequest();
            request.setTitle(xssPayload);
            request.setUsername("testuser");
            request.setPassword("encryptedPassword123");
            request.setUrl("https://example.com");
            request.setEncryptedData("encrypted");
            request.setIv("iv123");
            request.setAuthTag("tag123");

            MvcResult result = mockMvc.perform(post("/api/v1/vault/credential")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().is4xxClientError())
                    .andReturn();

            String response = result.getResponse().getContentAsString();
            // Verify that the XSS payload is either rejected or sanitized
            assertThat(response).doesNotContain("<script>");
            assertThat(response).doesNotContain("javascript:");
            assertThat(response).doesNotContain("onerror=");
            assertThat(response).doesNotContain("onload=");
        }
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void testSecureNoteContentXSSPrevention() throws Exception {
        for (String xssPayload : XSS_PAYLOADS) {
            SecureNoteRequest request = new SecureNoteRequest();
            request.setTitle("Test Note");
            request.setContent(xssPayload);
            request.setEncryptedData("encrypted");
            request.setIv("iv123");
            request.setAuthTag("tag123");

            MvcResult result = mockMvc.perform(post("/api/v1/vault/note")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().is4xxClientError())
                    .andReturn();

            String response = result.getResponse().getContentAsString();
            assertThat(response).doesNotContain("<script>");
            assertThat(response).doesNotContain("javascript:");
        }
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void testFolderNameXSSPrevention() throws Exception {
        FolderRequest request = new FolderRequest();
        request.setName("<script>alert('XSS')</script>");

        MvcResult result = mockMvc.perform(post("/api/v1/vault/folder")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is4xxClientError())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        assertThat(response).doesNotContain("<script>");
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void testTagNameXSSPrevention() throws Exception {
        TagRequest request = new TagRequest();
        request.setName("<img src=x onerror=alert('XSS')>");
        request.setColor("#FF0000");

        MvcResult result = mockMvc.perform(post("/api/v1/vault/tag")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is4xxClientError())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        assertThat(response).doesNotContain("onerror=");
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void testURLXSSPrevention() throws Exception {
        CredentialRequest request = new CredentialRequest();
        request.setTitle("Test Credential");
        request.setUsername("testuser");
        request.setPassword("encryptedPassword123");
        request.setUrl("javascript:alert('XSS')");
        request.setEncryptedData("encrypted");
        request.setIv("iv123");
        request.setAuthTag("tag123");

        mockMvc.perform(post("/api/v1/vault/credential")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void testHTMLEntityEncodingInResponses() throws Exception {
        // Create a credential with special characters
        CredentialRequest request = new CredentialRequest();
        request.setTitle("Test & <Company>");
        request.setUsername("user@example.com");
        request.setPassword("encryptedPassword123");
        request.setUrl("https://example.com");
        request.setNotes("Notes with <special> & \"characters\"");
        request.setEncryptedData("encrypted");
        request.setIv("iv123");
        request.setAuthTag("tag123");

        MvcResult result = mockMvc.perform(post("/api/v1/vault/credential")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        // If successful, verify response doesn't contain unencoded HTML
        if (result.getResponse().getStatus() == 201) {
            String response = result.getResponse().getContentAsString();
            // JSON should escape special characters
            assertThat(response).doesNotContain("<Company>");
        }
    }
}
