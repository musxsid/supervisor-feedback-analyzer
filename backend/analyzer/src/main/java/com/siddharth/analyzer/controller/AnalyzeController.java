package com.siddharth.analyzer.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AnalyzeController {

    @PostMapping("/analyze")
    public String analyzeTranscript(@RequestBody String transcript) {
        System.out.println("Received transcript: " + transcript);

        return "Transcript received successfully";
    }
}