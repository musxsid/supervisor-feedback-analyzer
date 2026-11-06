package com.siddharth.analyzer.repository;

import com.siddharth.analyzer.model.FeedbackReport;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedbackReportRepository extends JpaRepository<FeedbackReport, Long> {
    List<FeedbackReport> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<FeedbackReport> findByIdAndUserId(Long id, Long userId);
}
