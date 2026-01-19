package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * DTO for paginated audit log response.
 * 
 * Contains a page of audit logs with pagination metadata.
 * 
 * Requirements: 18.2
 */
@Schema(description = "Paginated audit log response with metadata")
public class AuditLogPageResponse {

    @Schema(description = "List of audit log entries")
    private List<AuditLogResponse> logs;

    @Schema(description = "Current page number (0-indexed)", example = "0")
    private int page;

    @Schema(description = "Number of items per page", example = "20")
    private int size;

    @Schema(description = "Total number of pages", example = "5")
    private int totalPages;

    @Schema(description = "Total number of audit log entries", example = "100")
    private long totalElements;

    @Schema(description = "Whether this is the first page", example = "true")
    private boolean first;

    @Schema(description = "Whether this is the last page", example = "false")
    private boolean last;

    // Default constructor
    public AuditLogPageResponse() {}

    // Constructor from Page
    public static AuditLogPageResponse fromPage(Page<AuditLogResponse> page) {
        AuditLogPageResponse response = new AuditLogPageResponse();
        response.setLogs(page.getContent());
        response.setPage(page.getNumber());
        response.setSize(page.getSize());
        response.setTotalPages(page.getTotalPages());
        response.setTotalElements(page.getTotalElements());
        response.setFirst(page.isFirst());
        response.setLast(page.isLast());
        return response;
    }

    // Getters and setters
    public List<AuditLogResponse> getLogs() {
        return logs;
    }

    public void setLogs(List<AuditLogResponse> logs) {
        this.logs = logs;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }

    public boolean isFirst() {
        return first;
    }

    public void setFirst(boolean first) {
        this.first = first;
    }

    public boolean isLast() {
        return last;
    }

    public void setLast(boolean last) {
        this.last = last;
    }
}
