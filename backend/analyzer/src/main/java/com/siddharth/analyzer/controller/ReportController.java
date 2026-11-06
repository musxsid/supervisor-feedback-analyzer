package com.siddharth.analyzer.controller;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.siddharth.analyzer.model.AppUser;
import com.siddharth.analyzer.model.FeedbackReport;
import com.siddharth.analyzer.repository.AppUserRepository;
import com.siddharth.analyzer.repository.FeedbackReportRepository;
import tools.jackson.core.JacksonException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final FeedbackReportRepository reports;
    private final AppUserRepository users;
    private final ObjectMapper objectMapper;

    public ReportController(FeedbackReportRepository reports, AppUserRepository users, ObjectMapper objectMapper) {
        this.reports = reports;
        this.users = users;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public List<ReportResponse> list(@AuthenticationPrincipal UserDetails principal) {
        Long userId = currentUser(principal).getId();
        return reports.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    public ReportResponse create(
            @Valid @RequestBody CreateReportRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        String resultJson;
        try {
            resultJson = objectMapper.writeValueAsString(request.result());
        } catch (JacksonException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The report could not be saved.", exception);
        }
        return toResponse(reports.save(new FeedbackReport(
                currentUser(principal), request.transcript().trim(), resultJson)));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails principal) {
        FeedbackReport report = reports.findByIdAndUserId(id, currentUser(principal).getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        reports.delete(report);
    }

    private AppUser currentUser(UserDetails principal) {
        return users.findByEmailIgnoreCase(principal.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private ReportResponse toResponse(FeedbackReport report) {
        try {
            return new ReportResponse(
                    report.getId(),
                    report.getTranscript(),
                    objectMapper.readTree(report.getResultJson()),
                    report.getCreatedAt());
        } catch (JacksonException exception) {
            throw new IllegalStateException("A saved report contains invalid JSON.", exception);
        }
    }

    public record CreateReportRequest(
            @NotBlank @Size(max = 2000000) String transcript,
            @NotNull JsonNode result) {
    }

    public record ReportResponse(Long id, String transcript, JsonNode result, Instant createdAt) {
    }
}
