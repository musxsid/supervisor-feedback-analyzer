package com.siddharth.analyzer.controller;

import com.siddharth.analyzer.service.OllamaService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AnalyzeController {

    private final OllamaService ollamaService;

    public AnalyzeController(OllamaService ollamaService) {
        this.ollamaService = ollamaService;
    }

    @PostMapping("/analyze")
    public String analyzeTranscript(@RequestBody String transcript) {

        String prompt = """
You are an expert evaluator analyzing supervisor feedback about an employee.

Analyze the transcript below and return ONLY valid JSON (no explanation, no extra text).

Transcript:
""" + transcript + """

Return JSON in this exact format:

{
  "evidence": [
    {
      "quote": "exact quote from transcript",
      "tag": "positive | negative | neutral"
    }
  ],
  "score": 1-10,
  "justification": "one paragraph explaining the score using evidence",
  "kpis": ["list of relevant KPIs"],
  "gaps": ["what is missing in the feedback"],
  "questions": ["3-5 follow-up questions"]
}

Rules:
- Output must be STRICT JSON
- No markdown
- No explanation outside JSON
- Use exact field names
""";

        String result = ollamaService.callOllama(prompt);

        return result;
    }
}