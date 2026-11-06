package com.siddharth.analyzer.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "action_plans")
public class ActionPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(nullable = false, length = 180)
    private String goal;

    @Column(nullable = false, length = 2000)
    private String nextStep;

    private LocalDate dueDate;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(nullable = false)
    private Instant createdAt;

    protected ActionPlan() {
    }

    public ActionPlan(AppUser user, String goal, String nextStep, LocalDate dueDate, String status) {
        this.user = user;
        this.goal = goal;
        this.nextStep = nextStep;
        this.dueDate = dueDate;
        this.status = status;
        this.createdAt = Instant.now();
    }

    public void update(String goal, String nextStep, LocalDate dueDate, String status) {
        this.goal = goal;
        this.nextStep = nextStep;
        this.dueDate = dueDate;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public String getGoal() {
        return goal;
    }

    public String getNextStep() {
        return nextStep;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public String getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
