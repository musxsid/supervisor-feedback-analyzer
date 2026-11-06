package com.siddharth.analyzer.controller;

import com.siddharth.analyzer.service.OllamaService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assist")
public class AssistController {
    private final OllamaService ollamaService;

    public AssistController(OllamaService ollamaService) {
        this.ollamaService = ollamaService;
    }

    @PostMapping
    public AssistResponse assist(@Valid @RequestBody AssistRequest request) {
        String task = switch (request.mode()) {
            case "draft" -> """
                    Help a supervisor turn their notes into clear, specific, respectful performance feedback.
                    Use observable behavior, concrete examples, impact, and a constructive next step.
                    Preserve the author's meaning, do not invent facts, avoid labeling the person, and keep the tone human.
                    Return polished feedback followed by a short "Review before sharing" checklist.
                    """;
            case "prepare" -> """
                    Prepare a practical one-to-one feedback conversation using the context supplied.
                    Return a short agenda, a thoughtful opening, questions to ask, likely topics to clarify,
                    and a supportive close. Do not invent facts or assume the employee's perspective.
                    """;
            case "plan" -> """
                    Turn the supplied feedback and goals into a practical 30-day development plan.
                    Include a focused outcome, weekly actions, observable evidence of progress,
                    support the supervisor can offer, and a check-in question. Make goals realistic and collaborative.
                    """;
            default -> throw new IllegalArgumentException("Choose draft, prepare, or plan.");
        };
        return new AssistResponse(ollamaService.generateText(task + "\n\nContext:\n" + request.context()));
    }

    public record AssistRequest(
            @NotBlank @Size(max = 16000) String context,
            @NotBlank @Pattern(regexp = "draft|prepare|plan") String mode) {
    }

    public record AssistResponse(String content) {
    }
}
