package com.siddharth.analyzer.repository;

import com.siddharth.analyzer.model.ActionPlan;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActionPlanRepository extends JpaRepository<ActionPlan, Long> {
    List<ActionPlan> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<ActionPlan> findByIdAndUserId(Long id, Long userId);
}
