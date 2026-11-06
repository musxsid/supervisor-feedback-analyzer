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

@Entity
@Table(name = "feedback_reports")
public class FeedbackReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(nullable = false, length = 2000000)
    private String transcript;

    @Column(nullable = false, length = 32000)
    private String resultJson;

    @Column(nullable = false)
    private Instant createdAt;

    protected FeedbackReport() {
    }

    public FeedbackReport(AppUser user, String transcript, String resultJson) {
        this.user = user;
        this.transcript = transcript;
        this.resultJson = resultJson;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public String getTranscript() {
        return transcript;
    }

    public String getResultJson() {
        return resultJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
