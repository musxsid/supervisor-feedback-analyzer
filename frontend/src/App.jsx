import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "";
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const SAMPLE_TRANSCRIPT =
  "Supervisor: You delivered the onboarding refresh ahead of schedule and kept the team informed throughout. The new flow reduced support requests by 18%. One opportunity is to share risks earlier when a deadline may shift. What support would help you build confidence presenting project updates to stakeholders?";

const templates = [
  {
    title: "Situation · Behavior · Impact",
    category: "Clear, specific feedback",
    prompt: "Use the Situation, Behavior, Impact structure. Describe the context, the observable action, and its impact. Add one constructive next step.",
  },
  {
    title: "Start · Stop · Continue",
    category: "Balanced review",
    prompt: "Organize my notes into three sections: Start (a helpful behavior to begin), Stop (a behavior to reconsider, with care), and Continue (a strength to build on).",
  },
  {
    title: "Recognition that resonates",
    category: "Celebrate a contribution",
    prompt: "Write a concise, sincere recognition note grounded in the specific contribution and its impact. Avoid generic praise and do not invent details.",
  },
  {
    title: "Coaching conversation",
    category: "Support development",
    prompt: "Shape these notes into a coaching conversation opener. Keep it curious and collaborative, acknowledge evidence, and invite the employee's perspective.",
  },
];

const navItems = [
  { id: "analyze", label: "Analyze feedback", icon: "sparkle" },
  { id: "write", label: "Write feedback", icon: "edit" },
  { id: "prepare", label: "Prepare a 1:1", icon: "calendar" },
  { id: "plans", label: "Growth plans", icon: "target" },
  { id: "templates", label: "Templates", icon: "grid" },
  { id: "progress", label: "Progress", icon: "chart" },
  { id: "history", label: "Report history", icon: "clock" },
];

const iconPaths = {
  activity: "M3 12h4l3-9 4 18 3-9h4",
  arrow: "M5 12h14m-7-7 7 7-7 7",
  calendar: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z",
  check: "m5 12 4 4L19 6",
  chevron: "m9 18 6-6-6-6",
  clock: "M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  close: "M18 6 6 18M6 6l12 12",
  copy: "M8 8V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-3M5 8h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z",
  chart: "M3 3v18h18M8 14l4-4 4 3 5-7",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3",
  edit: "m16 4 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15v5Z",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6M8 13h8m-8 4h8",
  grid: "M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z",
  lock: "M5 11h14v10H5zm3 0V7a4 4 0 1 1 8 0v4",
  moon: "M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z",
  plus: "M12 5v14m-7-7h14",
  search: "m21 21-4.3-4.3M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z",
  sparkle: "m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Zm7 11 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z",
  sun: "M12 3v2m0 14v2M5.6 5.6 7 7m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4 7 17m10-10 1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  target: "M12 22a10 10 0 1 0-10-10m10 6a6 6 0 1 0-6-6m6 2a2 2 0 1 0-2-2m2 0 7-7",
  trash: "M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5-5 5 5m-5-5v12",
};

function Icon({ name, size = 18 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={iconPaths[name] || iconPaths.sparkle} />
    </svg>
  );
}

function readCookie(name) {
  const cookie = document.cookie.split("; ").find((item) => item.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : "";
}

async function getCsrfToken() {
  let response;
  try {
    response = await fetch(`${API_URL}/api/auth/csrf`, { credentials: "include" });
  } catch (requestError) {
    if (requestError instanceof TypeError) {
      throw new Error(`Cannot reach the backend${API_URL ? ` at ${API_URL}` : " through the Vite API proxy"}. Start Spring Boot and check the API port.`, { cause: requestError });
    }
    throw requestError;
  }
  if (!response.ok) {
    const message = response.status === 502 || response.status === 504
      ? "The API proxy cannot reach Spring Boot. Check the backend port shown in the Vite terminal and restart the frontend if the port changed."
      : `Could not initialize a secure connection to the workspace (HTTP ${response.status}).`;
    throw new Error(message);
  }
  const data = await response.json();
  return readCookie("XSRF-TOKEN") || data.token;
}

async function api(path, options = {}) {
  const method = options.method || "GET";
  const headers = { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers };
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers["X-XSRF-TOKEN"] = readCookie("XSRF-TOKEN") || await getCsrfToken();
  }
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      method,
      headers,
      credentials: "include",
    });
  } catch (requestError) {
    if (requestError instanceof TypeError) {
      throw new Error(`Cannot reach the backend${API_URL ? ` at ${API_URL}` : " through the Vite API proxy"}. Start Spring Boot and check the API port.`, { cause: requestError });
    }
    throw requestError;
  }
  if (!response.ok) {
    let message = `The service returned ${response.status}.`;
    try {
      const body = await response.json();
      message = body.detail || body.message || message;
    } catch {
      if (response.status === 401) message = "Your session has expired. Please sign in again.";
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? response.json() : response.text();
}

function formatDate(value) {
  if (!value) return "No date set";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function reportTitle(transcript) {
  const line = (transcript || "").trim().split(/\r?\n/)[0];
  return line.length > 58 ? `${line.slice(0, 58)}…` : line || "Untitled report";
}

function createBriefing(report) {
  const result = report.result || {};
  const evidence = (result.evidence || []).map((item) => `- "${item.quote}" (${item.tag})`);
  const list = (items) => (items || []).map((item) => `- ${item}`);
  return [
    "CLEARPOINT · FEEDBACK BRIEFING",
    `Created: ${formatDate(report.createdAt)}`,
    `Conversation signal: ${result.score ?? "Not provided"} / 10`,
    "",
    "Summary",
    result.justification || "No summary provided.",
    "",
    "Evidence",
    ...evidence,
    "",
    "Strengths & outcomes",
    ...list(result.kpis),
    "",
    "Growth opportunities",
    ...list(result.gaps),
    "",
    "Follow-up questions",
    ...list(result.questions),
  ].join("\n");
}

function LoginPage({ onAuthenticated, theme, toggleTheme, initialError }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError || "");
  const [googleNotice, setGoogleNotice] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await getCsrfToken();
      if (mode === "signup") {
        await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
      }
      const user = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await getCsrfToken();
      await onAuthenticated(user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-atmosphere"><span /><span /><span /></div>
      <button className="auth-theme" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
        <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
      </button>
      <div className="auth-layout">
        <section className="auth-story">
          <a className="brand auth-brand" href="#home">
            <span className="brand-mark"><Icon name="activity" size={21} /></span>
            <span className="brand-copy"><strong>Clearpoint</strong><small>Feedback intelligence</small></span>
          </a>
          <div className="story-content">
            <div className="story-kicker"><span className="live-pulse" /> A better way to grow together</div>
            <h1>Make every<br />conversation <em>count.</em></h1>
            <p>Turn thoughtful feedback into clearer conversations, meaningful goals, and progress people can feel.</p>
            <div className="story-proof">
              <div className="proof-avatars"><span>J</span><span>A</span><span>M</span><b>+</b></div>
              <div><strong>Built for better 1:1s</strong><small>Private, thoughtful, and grounded in evidence</small></div>
            </div>
          </div>
          <div className="story-footer"><span>Designed for people, not performance scores.</span><span>© 2026 Clearpoint</span></div>
        </section>

        <section className="auth-form-side">
          <div className="auth-form-wrap">
            <div className="auth-mobile-brand"><span className="brand-mark"><Icon name="activity" size={20} /></span><strong>Clearpoint</strong></div>
            <div className="auth-heading">
              <span className="auth-welcome-icon"><Icon name={mode === "login" ? "lock" : "sparkle"} size={20} /></span>
              <p className="eyebrow">{mode === "login" ? "YOUR PRIVATE WORKSPACE" : "START YOUR WORKSPACE"}</p>
              <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
              <p>{mode === "login" ? "Sign in to pick up where you left off." : "A more thoughtful feedback practice starts here."}</p>
            </div>
            <div className="auth-tabs" role="tablist" aria-label="Account options">
              <button className={mode === "login" ? "selected" : ""} onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
              <button className={mode === "signup" ? "selected" : ""} onClick={() => { setMode("signup"); setError(""); }}>Create account</button>
            </div>
            <button
              className="google-signin"
              type="button"
              onClick={() => setGoogleNotice("Google sign-in will be available after Keycloak and Google OAuth are configured.")}
            >
              <GoogleMark />
              <span>Continue with Google</span>
            </button>
            {googleNotice && <p className="google-notice" role="status">{googleNotice}</p>}
            <div className="auth-divider"><span>or continue with email</span></div>
            <form className="auth-form" onSubmit={submit}>
              {mode === "signup" && <label>Your name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Jordan Lee" required maxLength={100} /></label>}
              <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required maxLength={254} /></label>
              <label>Password<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "signup" ? "At least 10 characters" : "Enter your password"} required minLength={mode === "signup" ? 10 : 1} maxLength={72} /></label>
              {(error || initialError) && <div className="inline-error" role="alert">{error || initialError}</div>}
              <button className="auth-submit" type="submit" disabled={busy}>{busy ? <><span className="button-spinner" /> Securing your workspace…</> : <>{mode === "login" ? "Sign in to Clearpoint" : "Create secure account"} <Icon name="arrow" size={17} /></>}</button>
            </form>
            <div className="auth-assurance"><Icon name="lock" size={14} /><span>Your feedback stays private to your account.</span></div>
            <p className="auth-disclaimer">AI suggestions are starting points. Review and personalize before sharing with your team.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" width="17" height="17" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 4)" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94a11.05 11.05 0 0 1-4.8 7.24l7.73 5.99c4.51-4.18 7.11-10.33 7.11-17.7Z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.92 23.92 0 0 0 0 21.56l7.98-6.19Z" transform="translate(0 4)" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-5.99c-2.14 1.44-4.89 2.29-8.17 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 -4)" />
    </svg>
  );
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("clearpoint-theme") || "dark");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState("analyze");
  const [reports, setReports] = useState([]);
  const [plans, setPlans] = useState([]);
  const [transcript, setTranscript] = useState("");
  const [report, setReport] = useState(null);
  const [draftNotes, setDraftNotes] = useState("");
  const [draftResult, setDraftResult] = useState("");
  const [meetingContext, setMeetingContext] = useState("");
  const [meetingResult, setMeetingResult] = useState("");
  const [planContext, setPlanContext] = useState("");
  const [planResult, setPlanResult] = useState("");
  const [planAiOpen, setPlanAiOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ goal: "", nextStep: "", dueDate: "", status: "planned" });
  const [planEditing, setPlanEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef(null);
  const transcriptInput = useRef(null);
  const activeNav = navItems.find((item) => item.id === page);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("clearpoint-theme", theme);
  }, [theme]);

  const refreshWorkspace = useCallback(async () => {
    const [savedReports, savedPlans] = await Promise.all([
      api("/api/reports"),
      api("/api/plans"),
    ]);
    setReports(savedReports);
    setPlans(savedPlans);
  }, []);

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      try {
        await getCsrfToken();
        const currentUser = await api("/api/auth/me");
        if (mounted) {
          setUser(currentUser);
          await refreshWorkspace();
        }
      } catch (requestError) {
        if (requestError.status !== 401 && mounted) setError(requestError.message);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };
    initialize();
    return () => { mounted = false; };
  }, [refreshWorkspace]);

  const showError = (message) => {
    setError(message);
    setNotice("");
  };

  const runAssistant = async (mode, context) => {
    if (!context.trim()) {
      showError("Add some context before generating suggestions.");
      return "";
    }
    setBusyAction(mode);
    setError("");
    setNotice("");
    try {
      const result = await api("/api/assist", {
        method: "POST",
        body: JSON.stringify({ mode, context }),
      });
      return result.content;
    } catch (requestError) {
      showError(requestError.message);
      return "";
    } finally {
      setBusyAction("");
    }
  };

  const analyze = async (event) => {
    event.preventDefault();
    if (!transcript.trim()) {
      showError("Add a conversation or upload a file before running the analysis.");
      transcriptInput.current?.focus();
      return;
    }
    if (new Blob([transcript]).size > MAX_FILE_SIZE) {
      showError("Keep the conversation under 2 MB before running an analysis.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    setReport(null);
    try {
      const response = await api("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transcript),
      });
      const result = typeof response === "string" ? JSON.parse(response) : response;
      const saved = await api("/api/reports", {
        method: "POST",
        body: JSON.stringify({ transcript, result }),
      });
      setReport(saved);
      setReports((current) => [saved, ...current]);
      setNotice("Your report is ready and saved to your private workspace.");
    } catch (requestError) {
      showError(requestError.message.includes("JSON")
        ? "The analysis service returned an invalid report. Please try again."
        : requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const loadFile = async (file) => {
    if (!file) return;
    if (!/\.(txt|md|csv)$/i.test(file.name)) {
      showError("Choose a .txt, .md, or .csv file to import.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showError("That file is over 2 MB. Choose a smaller transcript.");
      return;
    }
    try {
      const text = await file.text();
      if (!text.trim()) throw new Error("This file is empty. Choose a file with transcript text.");
      setTranscript(text);
      setReport(null);
      setError("");
      setNotice(`${file.name} is ready to analyze.`);
    } catch (fileError) {
      showError(fileError.message || "The file could not be read. Try saving it as plain text.");
    }
  };

  const openReport = (saved) => {
    setTranscript(saved.transcript);
    setReport(saved);
    setPage("analyze");
    setError("");
    setNotice("");
  };

  const deleteReport = async (id) => {
    try {
      await api(`/api/reports/${id}`, { method: "DELETE" });
      setReports((current) => current.filter((item) => item.id !== id));
      if (report?.id === id) setReport(null);
      setNotice("Report deleted from your workspace.");
    } catch (requestError) {
      showError(requestError.message);
    }
  };

  const savePlan = async (event) => {
    event.preventDefault();
    setBusyAction("save-plan");
    try {
      const body = { ...planForm, dueDate: planForm.dueDate || null };
      const saved = planEditing
        ? await api(`/api/plans/${planEditing}`, { method: "PUT", body: JSON.stringify(body) })
        : await api("/api/plans", { method: "POST", body: JSON.stringify(body) });
      setPlans((current) => planEditing
        ? current.map((plan) => plan.id === saved.id ? saved : plan)
        : [saved, ...current]);
      setPlanForm({ goal: "", nextStep: "", dueDate: "", status: "planned" });
      setPlanEditing(null);
      setNotice(planEditing ? "Growth plan updated." : "Growth plan saved.");
      setError("");
    } catch (requestError) {
      showError(requestError.message);
    } finally {
      setBusyAction("");
    }
  };

  const editPlan = (plan) => {
    setPlanEditing(plan.id);
    setPlanForm({ goal: plan.goal, nextStep: plan.nextStep, dueDate: plan.dueDate || "", status: plan.status });
    document.querySelector(".plan-editor")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const deletePlan = async (id) => {
    try {
      await api(`/api/plans/${id}`, { method: "DELETE" });
      setPlans((current) => current.filter((plan) => plan.id !== id));
      setNotice("Growth plan deleted.");
    } catch (requestError) {
      showError(requestError.message);
    }
  };

  const signOut = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
      await getCsrfToken();
      setUser(null);
      setReports([]);
      setPlans([]);
      setReport(null);
      setTranscript("");
    } catch (requestError) {
      showError(requestError.message);
    }
  };

  const filteredReports = useMemo(() => reports.filter((item) =>
    item.transcript.toLowerCase().includes(search.toLowerCase())), [reports, search]);
  const avgScore = reports.length
    ? reports.reduce((sum, item) => sum + (Number(item.result?.score) || 0), 0) / reports.length
    : 0;
  const completedPlans = plans.filter((item) => item.status === "done").length;
  const upcomingPlans = plans.filter((item) => {
    if (!item.dueDate || item.status === "done") return false;
    const daysUntil = (new Date(`${item.dueDate}T00:00:00`) - new Date(new Date().toDateString())) / 86400000;
    return daysUntil >= 0 && daysUntil <= 7;
  });
  const themes = useMemo(() => {
    const counts = new Map();
    reports.forEach((item) => (item.result?.gaps || []).forEach((gap) => {
      const label = String(gap).trim();
      if (label) counts.set(label, (counts.get(label) || 0) + 1);
    }));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [reports]);

  const applyTemplate = (template) => {
    setDraftNotes(`${template.prompt}\n\nMy notes:\n`);
    setDraftResult("");
    setPage("write");
  };

  const generatePlanFromAI = async () => {
    const content = await runAssistant("plan", planContext);
    if (content) setPlanResult(content);
  };

  const downloadReport = () => {
    if (!report?.result) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([createBriefing(report)], { type: "text/plain;charset=utf-8" }));
    link.download = `clearpoint-briefing-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(createBriefing(report));
      setNotice("Briefing copied to clipboard.");
    } catch (clipboardError) {
      console.error("Could not copy briefing:", clipboardError);
      showError("Clipboard access was blocked. You can still export the briefing.");
    }
  };

  if (authLoading) {
    return <main className="boot-screen"><span className="boot-mark"><Icon name="activity" size={22} /></span><span>Opening your private workspace…</span></main>;
  }

  if (!user) {
    return <LoginPage
      theme={theme}
      initialError={error}
      toggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")}
      onAuthenticated={async (authenticatedUser) => {
        setUser(authenticatedUser);
        try {
          await refreshWorkspace();
          setError("");
        } catch (requestError) {
          showError(requestError.message);
        }
      }}
    />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#workspace" onClick={(event) => event.preventDefault()}>
          <span className="brand-mark"><Icon name="activity" size={21} /></span>
          <span className="brand-copy"><strong>Clearpoint</strong><small>Feedback intelligence</small></span>
        </a>
        <button className="new-report-button" onClick={() => { setPage("analyze"); setTranscript(""); setReport(null); }}><Icon name="plus" size={18} /> New analysis</button>
        <p className="sidebar-label">YOUR WORKSPACE</p>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button key={item.id} className={`nav-link${page === item.id ? " active" : ""}`} onClick={() => { setPage(item.id); setError(""); setNotice(""); }}>
              <Icon name={item.icon} size={17} /><span>{item.label}</span>
              {item.id === "plans" && plans.length > 0 && <span className="nav-count">{plans.filter((plan) => plan.status !== "done").length}</span>}
              {item.id === "history" && reports.length > 0 && <span className="nav-count">{reports.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="recent-heading"><p className="sidebar-label">RECENT REPORTS</p>{reports.length > 0 && <button className="text-button" onClick={() => setPage("history")}>All reports</button>}</div>
        <div className="recent-list">
          {reports.slice(0, 4).map((item) => (
            <button className={`recent-item${report?.id === item.id ? " selected" : ""}`} key={item.id} onClick={() => openReport(item)}>
              <span className="recent-dot" /><span className="recent-title">{reportTitle(item.transcript)}</span>
            </button>
          ))}
          {reports.length === 0 && <p className="sidebar-empty">Your private reports appear here.</p>}
        </div>
        <div className="sidebar-footer">
          <button className="profile-button" onClick={signOut} title="Sign out">
            <span className="profile-avatar">{(user.name || user.email).slice(0, 1).toUpperCase()}</span>
            <span className="profile-info"><strong>{user.name}</strong><small>Personal workspace</small></span>
            <Icon name="arrow" size={15} />
          </button>
          <button className="theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}><Icon name={theme === "dark" ? "sun" : "moon"} size={17} /></button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={14} /><strong>{activeNav?.label || "Workspace"}</strong></div>
          <div className="topbar-right"><span className="service-status"><span className="status-dot" /> Local AI · private account</span></div>
        </header>
        <div className="content-wrap">
          {error && <div className="alert alert-error" role="alert"><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError("")}><Icon name="close" size={16} /></button></div>}
          {notice && !error && <div className="alert alert-success" role="status"><Icon name="check" size={16} /><span>{notice}</span><button aria-label="Dismiss notification" onClick={() => setNotice("")}><Icon name="close" size={16} /></button></div>}

          {page === "analyze" && (
            <section className="page-enter">
              <div className="page-heading">
                <div><p className="eyebrow">FEEDBACK INTELLIGENCE</p><h1>Turn feedback into <span>forward motion.</span></h1><p className="page-description">Find the useful signal in a conversation and make the next step easier to see.</p></div>
                <div className="heading-badge"><Icon name="lock" size={14} /> Private to your account</div>
              </div>
              <form className="analysis-card" onSubmit={analyze}>
                <div className="card-heading"><div className="section-icon"><Icon name="file" size={18} /></div><div><h2>Analyze a conversation</h2><p>Ground insights in what was actually said—not assumptions.</p></div></div>
                <div className={`drop-zone${dragging ? " is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); loadFile(event.dataTransfer.files[0]); }}>
                  <textarea ref={transcriptInput} value={transcript} onChange={(event) => { setTranscript(event.target.value); setReport(null); }} placeholder={"Paste a supervisor feedback conversation…\n\nInclude specific examples, outcomes, development goals, or follow-up discussion."} aria-label="Supervisor feedback transcript" spellCheck="true" />
                  {!transcript && <div className="drop-prompt"><span className="upload-icon"><Icon name="upload" size={19} /></span><span><strong>Drop a transcript here</strong><small>or <button type="button" className="inline-link" onClick={() => fileInput.current?.click()}>browse files</button></small></span><small className="file-types">TXT, MD, CSV · Up to 2 MB</small></div>}
                  {transcript && <div className="drop-footer"><button type="button" className="text-button" onClick={() => fileInput.current?.click()}><Icon name="upload" size={15} /> Upload another</button><span>{transcript.trim().split(/\s+/).filter(Boolean).length} words · {transcript.length.toLocaleString()} characters</span></div>}
                  <input ref={fileInput} className="visually-hidden" type="file" accept=".txt,.md,.csv,text/plain,text/markdown,text/csv" onChange={(event) => { loadFile(event.target.files[0]); event.target.value = ""; }} aria-label="Upload transcript" />
                </div>
                <div className="form-footer"><button type="button" className="sample-button" onClick={() => { setTranscript(SAMPLE_TRANSCRIPT); setReport(null); setError(""); }}><Icon name="sparkle" size={15} /> Try a sample</button><button className="primary-button analyze-button" type="submit" disabled={busy || !transcript.trim()}>{busy ? <><span className="button-spinner" /> Finding meaningful moments…</> : <>Generate report <Icon name="arrow" size={16} /></>}</button></div>
              </form>
              {busy && <div className="loading-state"><span className="loading-orbit"><Icon name="sparkle" size={19} /></span><strong>Reading the conversation with care</strong><span>Looking for evidence, strengths, and helpful next questions…</span></div>}
              {report?.result && <ReportView report={report} onDownload={downloadReport} onCopy={copyReport} />}
              {!report && !busy && <div className="feature-strip"><span><Icon name="check" size={15} /> Evidence-led insights</span><span><Icon name="check" size={15} /> Actionable growth ideas</span><span><Icon name="check" size={15} /> Saved to your private workspace</span></div>}
            </section>
          )}

          {page === "write" && (
            <section className="page-enter">
              <PageHeader eyebrow="WRITING STUDIO" title={<>Feedback that is <span>clear and human.</span></>} description="Shape your notes into specific, balanced feedback. Keep your voice; improve the structure." />
              <div className="workspace-grid">
                <div className="analysis-card">
                  <div className="card-heading"><div className="section-icon"><Icon name="edit" size={18} /></div><div><h2>Your notes and direction</h2><p>Include examples and impact. Clearpoint will not invent missing details.</p></div></div>
                  <textarea className="workspace-textarea" value={draftNotes} onChange={(event) => setDraftNotes(event.target.value)} placeholder="What happened? What specific behavior did you observe? What was the impact? What would you like to encourage next?" />
                  <div className="form-footer"><span className="subtle-copy">A human review is always recommended.</span><button className="primary-button" disabled={busyAction === "draft"} onClick={async () => { const content = await runAssistant("draft", draftNotes); if (content) setDraftResult(content); }}>{busyAction === "draft" ? <><span className="button-spinner" /> Shaping your notes…</> : <>Draft feedback <Icon name="arrow" size={16} /></>}</button></div>
                </div>
                <aside className="side-tip"><span className="tip-icon"><Icon name="sparkle" size={17} /></span><h3>Specific beats sweeping</h3><p>“You’re great at communication” is kind—but hard to act on. Add a moment, a behavior, and the difference it made.</p><div className="tip-example"><small>TRY THIS FRAME</small><strong>When <em>[situation]</em>, I noticed <em>[behavior]</em>. It helped <em>[impact]</em>.</strong></div></aside>
              </div>
              {draftResult && <GeneratedResult title="Your feedback draft" content={draftResult} onCopy={async () => { try { await navigator.clipboard.writeText(draftResult); setNotice("Draft copied to clipboard."); } catch { showError("Clipboard access was blocked."); } }} />}
            </section>
          )}

          {page === "prepare" && (
            <section className="page-enter">
              <PageHeader eyebrow="CONVERSATION PREP" title={<>Walk into your next 1:1 <span>with clarity.</span></>} description="Build a thoughtful agenda and useful questions around the real context." />
              <div className="analysis-card prep-card">
                <div className="card-heading"><div className="section-icon"><Icon name="calendar" size={18} /></div><div><h2>What would you like to discuss?</h2><p>Add relevant feedback, recent work, and what you hope to learn or agree together.</p></div></div>
                <textarea className="workspace-textarea tall" value={meetingContext} onChange={(event) => setMeetingContext(event.target.value)} placeholder="For example: We need to discuss a project handoff that was delayed. The employee is strong at customer communication; I'd like to understand the blockers and agree on a clearer escalation plan." />
                <div className="form-footer"><span className="subtle-copy">Includes an opening, agenda, questions, and close.</span><button className="primary-button" disabled={busyAction === "prepare"} onClick={async () => { const content = await runAssistant("prepare", meetingContext); if (content) setMeetingResult(content); }}>{busyAction === "prepare" ? <><span className="button-spinner" /> Preparing…</> : <>Prepare conversation <Icon name="arrow" size={16} /></>}</button></div>
              </div>
              {meetingResult && <GeneratedResult title="Your 1:1 conversation guide" content={meetingResult} onCopy={async () => { try { await navigator.clipboard.writeText(meetingResult); setNotice("Conversation guide copied."); } catch { showError("Clipboard access was blocked."); } }} />}
            </section>
          )}

          {page === "plans" && (
            <section className="page-enter">
              <PageHeader eyebrow="TURN INSIGHT INTO ACTION" title={<>Small steps. <span>Real growth.</span></>} description="Capture a shared goal, a next step, and a check-in date. Progress should feel supportive—not punitive." />
              {upcomingPlans.length > 0 && <div className="reminder-banner"><Icon name="calendar" size={16} /><span><strong>{upcomingPlans.length} upcoming check-in{upcomingPlans.length === 1 ? "" : "s"}</strong> · {upcomingPlans.map((plan) => plan.goal).join(" · ")}</span></div>}
              <div className="plan-layout">
                <div className="plan-column">
                  <div className="section-title-row"><div><h2>Your growth plans</h2><p>{plans.length ? `${completedPlans} of ${plans.length} completed` : "A little momentum starts with one next step."}</p></div><span className="plan-count">{plans.length} total</span></div>
                  {plans.length ? <div className="plan-list">{plans.map((plan) => <article className={`plan-card status-${plan.status}`} key={plan.id}>
                    <div className="plan-card-top"><span className={`status-pill ${plan.status}`}>{plan.status.replace("_", " ")}</span>{plan.dueDate && <span className="plan-date"><Icon name="calendar" size={13} /> {formatDate(plan.dueDate)}</span>}</div>
                    <h3>{plan.goal}</h3><p>{plan.nextStep}</p>
                    <div className="plan-actions"><button className="text-button" onClick={() => editPlan(plan)}><Icon name="edit" size={14} /> Edit</button>{plan.status !== "done" && <button className="text-button" onClick={async () => { try { const updated = await api(`/api/plans/${plan.id}`, { method: "PUT", body: JSON.stringify({ ...plan, status: plan.status === "planned" ? "in_progress" : "done" }) }); setPlans((current) => current.map((item) => item.id === plan.id ? updated : item)); } catch (requestError) { showError(requestError.message); } }}>{plan.status === "planned" ? "Start plan" : "Mark complete"} <Icon name="arrow" size={13} /></button>}<button className="icon-button small-icon-button" aria-label="Delete growth plan" onClick={() => deletePlan(plan.id)}><Icon name="trash" size={14} /></button></div>
                  </article>)}</div> : <div className="empty-panel"><span className="empty-icon"><Icon name="target" size={22} /></span><h3>No plans yet</h3><p>Create a focused, manageable next step from feedback or a development conversation.</p></div>}
                </div>
                <div className="plan-side">
                  <form className="analysis-card plan-editor" onSubmit={savePlan}>
                    <div className="card-heading"><div className="section-icon"><Icon name="plus" size={18} /></div><div><h2>{planEditing ? "Edit growth plan" : "Create a growth plan"}</h2><p>Keep it specific, collaborative, and achievable.</p></div></div>
                    <label className="field-label">Goal<input value={planForm.goal} onChange={(event) => setPlanForm({ ...planForm, goal: event.target.value })} placeholder="Share project risks earlier" maxLength={180} required /></label>
                    <label className="field-label">First next step<textarea value={planForm.nextStep} onChange={(event) => setPlanForm({ ...planForm, nextStep: event.target.value })} placeholder="Add a 10-minute risk review to the weekly project check-in." maxLength={2000} required /></label>
                    <div className="form-two-col"><label className="field-label">Check-in date<input type="date" value={planForm.dueDate} onChange={(event) => setPlanForm({ ...planForm, dueDate: event.target.value })} /></label><label className="field-label">Status<select value={planForm.status} onChange={(event) => setPlanForm({ ...planForm, status: event.target.value })}><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="done">Complete</option></select></label></div>
                    <div className="form-footer"><button type="button" className="text-button" onClick={() => { setPlanContext(report?.transcript || ""); setPlanResult(""); setPlanAiOpen((open) => !open); }}>Draft with AI</button><button className="primary-button" type="submit" disabled={busyAction === "save-plan"}>{planEditing ? "Save changes" : "Save growth plan"} <Icon name="arrow" size={15} /></button></div>
                    {planAiOpen && <div className="ai-plan-box"><label className="field-label">Context for your 30-day plan<textarea value={planContext} onChange={(event) => setPlanContext(event.target.value)} placeholder="Paste feedback or a development goal…" /></label><button type="button" className="secondary-button" disabled={busyAction === "plan"} onClick={generatePlanFromAI}>{busyAction === "plan" ? "Generating…" : "Generate suggestions"}</button>{planResult && <div className="generated-inline"><strong>Suggested plan</strong><p>{planResult}</p><button type="button" className="text-button" onClick={() => { setPlanForm({ ...planForm, goal: planResult.split("\n").find(Boolean)?.slice(0, 180) || "", nextStep: planResult }); setPlanContext(""); setPlanAiOpen(false); }}>Use in plan form</button></div>}</div>}
                  </form>
                </div>
              </div>
            </section>
          )}

          {page === "templates" && (
            <section className="page-enter">
              <PageHeader eyebrow="A THOUGHTFUL PLACE TO START" title={<>Good feedback has a <span>shape.</span></>} description="Choose a framework to help make your message specific, balanced, and easier to act on." />
              <div className="template-grid">{templates.map((template, index) => <button className="template-card" key={template.title} onClick={() => applyTemplate(template)}><span className={`template-number n-${index + 1}`}>0{index + 1}</span><span className="template-category">{template.category}</span><h2>{template.title}</h2><p>{template.prompt}</p><span className="template-cta">Use this template <Icon name="arrow" size={15} /></span></button>)}</div>
              <div className="template-note"><Icon name="lock" size={16} /><p><strong>Templates are prompts, not scripts.</strong> Adapt the language to the person and situation; only share what you can support with real examples.</p></div>
            </section>
          )}

          {page === "progress" && (
            <section className="page-enter">
              <PageHeader eyebrow="REFLECT, DON'T RANK" title={<>Notice the themes. <span>Support the person.</span></>} description="A private view of your feedback practice over time. Scores are directional—not a performance verdict." />
              <div className="stat-grid"><article className="stat-card"><span className="stat-icon"><Icon name="file" size={17} /></span><span className="stat-label">CONVERSATIONS REVIEWED</span><strong>{reports.length}</strong><small>Saved to your workspace</small></article><article className="stat-card"><span className="stat-icon"><Icon name="activity" size={17} /></span><span className="stat-label">AVERAGE SIGNAL SCORE</span><strong>{reports.length ? avgScore.toFixed(1) : "—"}<small>/ 10</small></strong><small>AI-generated, review alongside evidence</small></article><article className="stat-card"><span className="stat-icon"><Icon name="target" size={17} /></span><span className="stat-label">GROWTH PLANS COMPLETED</span><strong>{completedPlans}<small> / {plans.length}</small></strong><small>Progress is a conversation</small></article></div>
              <div className="progress-grid"><article className="analysis-card trend-card"><div className="section-title-row"><div><h2>Recent conversation signals</h2><p>Scores are one input—not the whole story.</p></div></div>{reports.length ? <div className="trend-list">{reports.slice(0, 8).map((item) => { const score = Math.max(0, Math.min(10, Number(item.result?.score) || 0)); return <button key={item.id} className="trend-row" onClick={() => openReport(item)}><span className="trend-date">{formatDate(item.createdAt)}</span><span className="trend-title">{reportTitle(item.transcript)}</span><span className="trend-track"><i style={{ width: `${score * 10}%` }} /></span><strong>{score.toFixed(1)}</strong></button>; })}</div> : <p className="empty-copy">Analyze a conversation to start seeing themes here.</p>}</article><article className="analysis-card themes-card"><div className="section-title-row"><div><h2>Recurring growth themes</h2><p>From areas to explore across your reports.</p></div></div>{themes.length ? <ul className="theme-list">{themes.map(([text, count]) => <li key={text}><span>{text}</span><b>{count} {count === 1 ? "mention" : "mentions"}</b></li>)}</ul> : <p className="empty-copy">Themes will appear as you save more reports. Treat these as prompts for a conversation, not labels.</p>}</article></div>
              <p className="safety-note"><Icon name="lock" size={14} /> Your workspace trends are private to your account. AI scores can be imperfect and should never be used as the sole basis for employment decisions.</p>
            </section>
          )}

          {page === "history" && (
            <section className="page-enter">
              <PageHeader eyebrow="YOUR PRIVATE WORKSPACE" title={<>Conversation <span>library.</span></>} description="Search, reopen, and export your previous feedback analyses." />
              <label className="history-search"><Icon name="search" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports by transcript text" /></label>
              {filteredReports.length ? <div className="history-list">{filteredReports.map((item) => <article className="history-card" key={item.id}><button className="history-card-main" onClick={() => openReport(item)}><span className="history-file-icon"><Icon name="file" size={18} /></span><span className="history-card-copy"><strong>{reportTitle(item.transcript)}</strong><small>{formatDate(item.createdAt)} · {item.transcript.trim().split(/\s+/).filter(Boolean).length} words</small></span><span className="history-score"><strong>{item.result?.score ?? "—"}</strong><small>/ 10</small></span><Icon name="chevron" size={17} /></button><button className="icon-button delete-report" aria-label="Delete report" onClick={() => deleteReport(item.id)}><Icon name="trash" size={16} /></button></article>)}</div> : <div className="empty-panel"><span className="empty-icon"><Icon name="search" size={22} /></span><h3>{reports.length ? "No matching reports" : "No reports yet"}</h3><p>{reports.length ? "Try a different search term." : "Your analyzed conversations will be saved here."}</p><button className="primary-button" onClick={() => setPage("analyze")}>Analyze a conversation <Icon name="arrow" size={15} /></button></div>}
            </section>
          )}
        </div>
        <footer className="app-footer"><span>Clearpoint <span className="footer-dot">·</span> Thoughtful feedback, forward motion</span><span><Icon name="lock" size={13} /> Private workspace</span></footer>
      </main>
    </div>
  );
}

function PageHeader({ eyebrow, title, description }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div></div>;
}

function ReportView({ report, onDownload, onCopy }) {
  const result = report.result || {};
  const score = Number(result.score);
  const scorePercent = Number.isFinite(score) ? Math.min(100, Math.max(0, score * 10)) : 0;
  return (
    <section className="results-section">
      <div className="results-heading"><div><p className="eyebrow">ANALYSIS COMPLETE</p><h2>Your feedback report</h2></div><div className="result-actions"><button className="secondary-button" onClick={onCopy}><Icon name="copy" size={15} /> Copy briefing</button><button className="secondary-button" onClick={onDownload}><Icon name="download" size={15} /> Export briefing</button></div></div>
      <div className="result-overview"><div className="score-panel"><span className="score-label">CONVERSATION SIGNAL</span><div className="score-value">{Number.isFinite(score) ? score : "—"}<span>/10</span></div><div className="score-track"><span style={{ width: `${scorePercent}%` }} /></div><span className="score-context">A prompt for reflection, not a verdict</span></div><div className="summary-panel"><div className="summary-label"><Icon name="sparkle" size={15} /> CONVERSATION SUMMARY</div><p>{result.justification || "No summary was provided."}</p></div></div>
      <div className="insights-grid">
        <article className="insight-card evidence-card"><div className="insight-heading"><span className="insight-icon green"><Icon name="activity" size={16} /></span><div><h3>Evidence</h3><p>Specific moments from the conversation</p></div><span className="item-count">{result.evidence?.length || 0}</span></div>{result.evidence?.length ? <ul className="evidence-list">{result.evidence.map((item, index) => <li key={`${item.quote}-${index}`}><blockquote>“{item.quote}”</blockquote><span className={`tag tag-${String(item.tag || "neutral").toLowerCase()}`}>{item.tag || "neutral"}</span></li>)}</ul> : <p className="empty-insight">No evidence items in this report.</p>}</article>
        <InsightCard title="Strengths & outcomes" subtitle="What seems to be working" items={result.kpis} icon="chart" />
        <InsightCard title="Growth opportunities" subtitle="Potential areas to explore" items={result.gaps} icon="target" />
        <InsightCard title="Questions for next time" subtitle="Keep the conversation open" items={result.questions} icon="calendar" />
      </div>
      <p className="safety-note"><Icon name="lock" size={14} /> AI-generated insights can miss context. Review each point with your own judgment and the original conversation.</p>
    </section>
  );
}

function InsightCard({ title, subtitle, items, icon }) {
  return <article className="insight-card"><div className="insight-heading"><span className="insight-icon blue"><Icon name={icon} size={16} /></span><div><h3>{title}</h3><p>{subtitle}</p></div></div>{items?.length ? <ul className="bullet-list">{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="empty-insight">Nothing identified yet.</p>}</article>;
}

function GeneratedResult({ title, content, onCopy }) {
  return <article className="generated-result"><div className="generated-heading"><div><p className="eyebrow">AI-ASSISTED · REVIEW BEFORE SHARING</p><h2>{title}</h2></div><button className="secondary-button" onClick={onCopy}><Icon name="copy" size={15} /> Copy</button></div><div className="generated-content">{content}</div><p className="safety-note"><Icon name="lock" size={14} /> Treat this as a first draft. Verify all examples and personalize the language.</p></article>;
}

export default App;
