package com.siddharth.analyzer.controller;

import com.siddharth.analyzer.model.ActionPlan;
import com.siddharth.analyzer.model.AppUser;
import com.siddharth.analyzer.repository.ActionPlanRepository;
import com.siddharth.analyzer.repository.AppUserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/plans")
public class ActionPlanController {
    private final ActionPlanRepository plans;
    private final AppUserRepository users;

    public ActionPlanController(ActionPlanRepository plans, AppUserRepository users) {
        this.plans = plans;
        this.users = users;
    }

    @GetMapping
    public List<PlanResponse> list(@AuthenticationPrincipal UserDetails principal) {
        return plans.findAllByUserIdOrderByCreatedAtDesc(currentUser(principal).getId()).stream()
                .map(ActionPlanController::toResponse)
                .toList();
    }

    @PostMapping
    public PlanResponse create(
            @Valid @RequestBody PlanRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        return toResponse(plans.save(new ActionPlan(
                currentUser(principal),
                request.goal().trim(),
                request.nextStep().trim(),
                request.dueDate(),
                request.status())));
    }

    @PutMapping("/{id}")
    public PlanResponse update(
            @PathVariable Long id,
            @Valid @RequestBody PlanRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        ActionPlan plan = plans.findByIdAndUserId(id, currentUser(principal).getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        plan.update(request.goal().trim(), request.nextStep().trim(), request.dueDate(), request.status());
        return toResponse(plans.save(plan));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails principal) {
        ActionPlan plan = plans.findByIdAndUserId(id, currentUser(principal).getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        plans.delete(plan);
    }

    private AppUser currentUser(UserDetails principal) {
        return users.findByEmailIgnoreCase(principal.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private static PlanResponse toResponse(ActionPlan plan) {
        return new PlanResponse(
                plan.getId(), plan.getGoal(), plan.getNextStep(), plan.getDueDate(), plan.getStatus(), plan.getCreatedAt());
    }

    public record PlanRequest(
            @NotBlank @Size(max = 180) String goal,
            @NotBlank @Size(max = 2000) String nextStep,
            LocalDate dueDate,
            @NotBlank @Pattern(regexp = "planned|in_progress|done") String status) {
    }

    public record PlanResponse(Long id, String goal, String nextStep, LocalDate dueDate, String status, Instant createdAt) {
    }
}
