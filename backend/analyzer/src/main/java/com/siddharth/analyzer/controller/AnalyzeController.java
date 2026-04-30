package com.siddharth.analyzer.controller;

import com.siddharth.analyzer.service.OllamaService;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api")
public class AnalyzeController {

    private final OllamaService ollamaService;

    public AnalyzeController(OllamaService ollamaService) {
        this.ollamaService = ollamaService;
    }

    @PostMapping("/analyze")
    public String analyzeTranscript(@RequestBody String transcript) {

        String prompt = """
You are an expert evaluator analyzing supervisor feedback.

STRICT INSTRUCTIONS:
- Return ONLY valid JSON
- Do NOT include explanations
- Do NOT include text before or after JSON
- Output must start with { and end with }

Transcript:
""" + transcript + """

Return this JSON format exactly:

{
  "evidence": [
    {
      "quote": "text",
      "tag": "positive | negative | neutral"    }
  ],
  "score": 1-10,
  "justification": "text",
  "kpis": ["text"],
  "gaps": ["text"],
  "questions": ["text"]
}
""";

        String result = ollamaService.callOllama(prompt);

        return result;
    }
}