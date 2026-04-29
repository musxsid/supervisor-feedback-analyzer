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

        String prompt = "Analyze this transcript: " + transcript;

        String result = ollamaService.callOllama(prompt);

        return result;
    }
}