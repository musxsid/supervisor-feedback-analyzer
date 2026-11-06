package com.siddharth.analyzer;

import com.siddharth.analyzer.repository.AppUserRepository;
import com.siddharth.analyzer.repository.ActionPlanRepository;
import com.siddharth.analyzer.repository.FeedbackReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AnalyzerApplicationTests {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AppUserRepository users;

    @Autowired
    private ActionPlanRepository plans;

    @Autowired
    private FeedbackReportRepository reports;

    @BeforeEach
    void clearUsers() {
        plans.deleteAll();
        reports.deleteAll();
        users.deleteAll();
    }

    @Test
    void accountsCanSignInAndOnlySeeTheirOwnPlans() throws Exception {
        register("Avery", "avery@example.com", "a-strong-password");
        assertNotEquals(
                "a-strong-password",
                users.findByEmailIgnoreCase("avery@example.com").orElseThrow().getPasswordHash());
        MockHttpSession averySession = login("avery@example.com", "a-strong-password");

        mockMvc.perform(get("/api/plans").session(averySession))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));

        mockMvc.perform(post("/api/plans")
                        .session(averySession)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"goal":"Share risks earlier","nextStep":"Add a weekly risk check-in","dueDate":null,"status":"planned"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.goal", is("Share risks earlier")));

        register("Blake", "blake@example.com", "another-strong-password");
        MockHttpSession blakeSession = login("blake@example.com", "another-strong-password");
        mockMvc.perform(get("/api/plans").session(blakeSession))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void workspaceDataRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/reports"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/plans"))
                .andExpect(status().isUnauthorized());
    }

    private void register(String name, String email, String password) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"%s","email":"%s","password":"%s"}
                                """.formatted(name, email, password)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is(email)));
    }

    private MockHttpSession login(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }
}
