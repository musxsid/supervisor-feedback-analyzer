package com.siddharth.analyzer.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.*;
import org.springframework.core.ParameterizedTypeReference;
import java.time.Duration;

import java.util.HashMap;
import java.util.Map;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.core.JacksonException;

@Service
public class OllamaService {

    private final String ollamaUrl;
    private final String model;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public OllamaService(
            ObjectMapper objectMapper,
            @Value("${ollama.url:http://localhost:11434/api/generate}") String ollamaUrl,
            @Value("${ollama.model:llama3.2}") String model) {
        this.ollamaUrl = ollamaUrl;
        this.model = model;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofMinutes(3));
        this.restTemplate = new RestTemplate(requestFactory);
        this.objectMapper = objectMapper;
    }

    public String callOllama(String prompt) {
        String rawResponse = generate(prompt);
        int startIndex = rawResponse.indexOf("{");
        int endIndex = rawResponse.lastIndexOf("}");
        if (startIndex < 0 || endIndex < startIndex) {
            throw new IllegalStateException("Ollama did not return a JSON report.");
        }
        String cleanJson = rawResponse.substring(startIndex, endIndex + 1);
        try {
            objectMapper.readTree(cleanJson);
            return cleanJson;
        } catch (JacksonException exception) {
            throw new IllegalStateException("Ollama returned invalid JSON.", exception);
        }
    }

    public String generateText(String prompt) {
        String response = generate(prompt).trim();
        if (response.isEmpty()) {
            throw new IllegalStateException("Ollama returned an empty response.");
        }
        return response;
    }

    private String generate(String prompt) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("prompt", prompt);
        requestBody.put("stream", false);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                ollamaUrl,
                HttpMethod.POST,
                request,
                new ParameterizedTypeReference<>() {});
        if (response.getBody() == null || !(response.getBody().get("response") instanceof String text)) {
            throw new IllegalStateException("Ollama returned an unexpected response.");
        }
        return text;
    }
}