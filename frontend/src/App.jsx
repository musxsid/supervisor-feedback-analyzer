import { useEffect, useRef, useState } from "react";
import "./App.css";

const HISTORY_KEY = "feedback-analyzer-history";
const THEME_KEY = "feedback-analyzer-theme";
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const SAMPLE_TRANSCRIPT =
  "Supervisor: You delivered the onboarding refresh ahead of schedule and kept the team informed throughout. The new flow reduced support requests by 18%. One opportunity is to share risks earlier when a deadline may shift. What support would help you build confidence presenting project updates to stakeholders?";

const iconPaths = {
  activity: "M3 12h4l3-9 4 18 3-9h4",
  arrow: "M5 12h14m-7-7 7 7-7 7",
  check: "m5 12 4 4L19 6",
  chevron: "m9 18 6-6-6-6",
  clock: "M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  close: "M18 6 6 18M6 6l12 12",
  copy: "M8 8V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-3M5 8h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6M8 13h8m-8 4h8",
  moon: "M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z",
  plus: "M12 5v14m-7-7h14",
  search: "m21 21-4.3-4.3M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z",
  sparkle: "m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Zm7 11 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z",
  sun: "M12 3v2m0 14v2M5.6 5.6 7 7m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4 7 17m10-10 1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  trash: "M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5-5 5 5m-5-5v12",
};

function Icon({ name, size = 18 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

function readHistory() {
  const saved = localStorage.getItem(HISTORY_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not read saved report history:", error);
    return [];
  }
}

function reportTitle(transcript) {
  const firstLine = transcript.trim().split(/\r?\n/)[0];
  return firstLine.length > 52 ? `${firstLine.slice(0, 52)}…` : firstLine;
}

function createBriefing(result) {
  const evidence = Array.isArray(result.evidence)
    ? result.evidence.map(({ quote, tag }) => `- "${quote}" (${tag})`).join("\n")
    : "";
  const list = (items) =>
    Array.isArray(items) ? items.map((item) => `- ${item}`).join("\n") : "";

  return [
    "SUPERVISOR FEEDBACK BRIEFING",
    "",
    `Overall score: ${result.score ?? "Not provided"} / 10`,
    "",
    "Summary",
    result.justification || "No summary was provided.",
    "",
    "Evidence",
    evidence || "- No evidence provided.",
    "",
    "Key performance indicators",
    list(result.kpis) || "- None provided.",
    "",
    "Areas to develop",
    list(result.gaps) || "- None provided.",
    "",
    "Suggested follow-up questions",
    list(result.questions) || "- None provided.",
  ].join("\n");
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function App() {
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_KEY) || "light",
  );
  const [history, setHistory] = useState(readHistory);
  const [page, setPage] = useState("new");
  const [historySearch, setHistorySearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeId, setActiveId] = useState(null);
  const fileInput = useRef(null);
  const transcriptInput = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const saveHistory = (nextHistory) => {
    setHistory(nextHistory);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
    } catch (storageError) {
      console.error("Could not save report history:", storageError);
      setError("Your report was generated, but could not be saved in browser history.");
    }
  };

  const startNewReport = () => {
    setPage("new");
    setTranscript("");
    setResult(null);
    setActiveId(null);
    setError("");
    setNotice("");
  };

  const openReport = (report) => {
    setPage("new");
    setTranscript(report.transcript);
    setResult(report.result);
    setActiveId(report.id);
    setError("");
    setNotice("");
  };

  const loadFile = async (file) => {
    if (!file) return;
    const supported = /\.(txt|md|csv)$/i.test(file.name);
    if (!supported) {
      setError("Choose a .txt, .md, or .csv file to import.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("That file is over 2 MB. Choose a smaller transcript.");
      return;
    }

    try {
      const contents = await file.text();
      if (!contents.trim()) {
        setError("This file is empty. Choose a file with transcript text.");
        return;
      }
      setTranscript(contents);
      setResult(null);
      setActiveId(null);
      setError("");
      setNotice(`${file.name} is ready to analyze.`);
      setPage("new");
    } catch (fileError) {
      console.error("Could not read transcript file:", fileError);
      setError("The file could not be read. Try saving it as plain text.");
    }
  };

  const handleAnalyze = async (event) => {
    event.preventDefault();
    if (!transcript.trim()) {
      setError("Add a transcript or upload a file before running the analysis.");
      transcriptInput.current?.focus();
      return;
    }

    setLoading(true);
    setResult(null);
    setActiveId(null);
    setError("");
    setNotice("");

    try {
      const response = await fetch("http://localhost:8080/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transcript),
      });

      if (!response.ok) {
        throw new Error(`The analysis service returned ${response.status}.`);
      }

      const data = await response.text();
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch {
        throw new Error("The analysis service returned an invalid report. Please try again.");
      }

      setResult(parsed);
      const record = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        transcript,
        result: parsed,
      };
      saveHistory([record, ...history]);
      setActiveId(record.id);
      setNotice("Your feedback report is ready.");
    } catch (requestError) {
      console.error("Analysis request failed:", requestError);
      setError(
        requestError instanceof TypeError
          ? "Could not connect to the analysis service. Check that the backend and Ollama are running, then try again."
          : requestError.message,
      );
    } finally {
      setLoading(false);
    }
  };

  const copyBriefing = async () => {
    try {
      await navigator.clipboard.writeText(createBriefing(result));
      setNotice("Briefing copied to clipboard.");
    } catch (clipboardError) {
      console.error("Could not copy briefing:", clipboardError);
      setError("Clipboard access was blocked. You can still download the briefing.");
    }
  };

  const downloadBriefing = () => {
    const blob = new Blob([createBriefing(result)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `feedback-briefing-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Briefing downloaded.");
  };

  const removeReport = (id) => {
    const remaining = history.filter((report) => report.id !== id);
    saveHistory(remaining);
    if (activeId === id) {
      setResult(null);
      setTranscript("");
      setActiveId(null);
    }
  };

  const filteredHistory = history.filter((report) =>
    report.transcript.toLowerCase().includes(historySearch.toLowerCase()),
  );
  const score = Number(result?.score);
  const scorePercent = Number.isFinite(score) ? Math.min(100, Math.max(0, score * 10)) : 0;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); startNewReport(); }}>
          <span className="brand-mark"><Icon name="activity" size={21} /></span>
          <span className="brand-copy">
            <strong>Clearpoint</strong>
            <small>Feedback intelligence</small>
          </span>
        </a>

        <button className="new-report-button" onClick={startNewReport}>
          <Icon name="plus" size={18} />
          <span>New report</span>
        </button>

        <p className="sidebar-label">WORKSPACE</p>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={page === "new" ? "nav-link active" : "nav-link"} onClick={startNewReport}>
            <Icon name="file" />
            <span>Analysis</span>
          </button>
          <button className={page === "history" ? "nav-link active" : "nav-link"} onClick={() => { setPage("history"); setError(""); setNotice(""); }}>
            <Icon name="clock" />
            <span>Report history</span>
            {history.length > 0 && <span className="nav-count">{history.length}</span>}
          </button>
        </nav>

        <div className="sidebar-divider" />
        <div className="recent-heading">
          <p className="sidebar-label">RECENT REPORTS</p>
          {history.length > 0 && <button className="text-button" onClick={() => setPage("history")}>View all</button>}
        </div>
        {history.length === 0 ? (
          <p className="sidebar-empty">Your saved reports will appear here.</p>
        ) : (
          <div className="recent-list">
            {history.slice(0, 5).map((report) => (
              <button
                className={`recent-item${activeId === report.id ? " selected" : ""}`}
                key={report.id}
                onClick={() => openReport(report)}
                title={reportTitle(report.transcript)}
              >
                <span className="recent-dot" />
                <span className="recent-title">{reportTitle(report.transcript) || "Untitled report"}</span>
              </button>
            ))}
          </div>
        )}

        <div className="sidebar-footer">
          <span className="privacy-indicator"><span /> Stored on this device</span>
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <Icon name={theme === "light" ? "moon" : "sun"} size={18} />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={15} /><strong>{page === "history" ? "Report history" : "Analysis"}</strong></div>
          <div className="topbar-right">
            <span className="service-status"><span className="status-dot" /> Local analysis</span>
            <button
              className="mobile-theme-button icon-button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            ><Icon name={theme === "light" ? "moon" : "sun"} /></button>
          </div>
        </header>

        <div className="content-wrap">
          {error && <div className="alert alert-error" role="alert"><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError("")}><Icon name="close" size={16} /></button></div>}
          {notice && !error && <div className="alert alert-success" role="status"><Icon name="check" size={17} /><span>{notice}</span><button aria-label="Dismiss notification" onClick={() => setNotice("")}><Icon name="close" size={16} /></button></div>}

          {page === "history" ? (
            <section className="history-page">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">YOUR WORKSPACE</p>
                  <h1>Report history</h1>
                  <p className="page-description">Revisit, review, and export your previous feedback analyses.</p>
                </div>
                <button className="primary-button" onClick={startNewReport}><Icon name="plus" size={17} /> New report</button>
              </div>
              <label className="history-search">
                <Icon name="search" size={18} />
                <input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Search reports by transcript text" />
              </label>
              {filteredHistory.length === 0 ? (
                <div className="empty-history">
                  <span className="empty-icon"><Icon name={history.length === 0 ? "clock" : "search"} size={23} /></span>
                  <h2>{history.length === 0 ? "No reports yet" : "No matching reports"}</h2>
                  <p>{history.length === 0 ? "Your completed analyses will be saved here on this device." : "Try another search term."}</p>
                  {history.length === 0 && <button className="primary-button" onClick={startNewReport}><Icon name="plus" size={17} /> Create your first report</button>}
                </div>
              ) : (
                <div className="history-list">
                  {filteredHistory.map((report) => (
                    <article className="history-card" key={report.id}>
                      <button className="history-card-main" onClick={() => openReport(report)}>
                        <span className="history-file-icon"><Icon name="file" size={19} /></span>
                        <span className="history-card-copy"><strong>{reportTitle(report.transcript) || "Untitled report"}</strong><small>{formatDate(report.createdAt)} <span>·</span> {report.transcript.trim().split(/\s+/).length} words</small></span>
                        <span className="history-score"><strong>{report.result?.score ?? "—"}</strong><small>/ 10</small></span>
                        <Icon name="chevron" size={18} />
                      </button>
                      <button className="icon-button delete-report" aria-label="Delete report" title="Delete report" onClick={() => removeReport(report.id)}><Icon name="trash" size={17} /></button>
                    </article>
                  ))}
                </div>
              )}
              {history.length > 0 && <button className="clear-history-button" onClick={() => {
                if (window.confirm("Delete all saved reports from this device? This cannot be undone.")) {
                  saveHistory([]);
                  setResult(null);
                  setTranscript("");
                  setActiveId(null);
                }
              }}><Icon name="trash" size={16} /> Clear all history</button>}
            </section>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">FEEDBACK INTELLIGENCE</p>
                  <h1>Turn feedback into <span>forward motion.</span></h1>
                  <p className="page-description">Understand what’s working, uncover growth opportunities, and make every conversation count.</p>
                </div>
                <div className="heading-badge"><Icon name="sparkle" size={16} /> Thoughtful insights, locally analyzed</div>
              </div>

              <form className="analysis-card" onSubmit={handleAnalyze}>
                <div className="card-heading">
                  <div className="section-icon"><Icon name="file" size={18} /></div>
                  <div><h2>Start with a conversation</h2><p>Paste a supervisor transcript or bring in a text file.</p></div>
                </div>
                <div
                  className={`drop-zone${isDragging ? " is-dragging" : ""}`}
                  onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
                  onDrop={(event) => { event.preventDefault(); setIsDragging(false); loadFile(event.dataTransfer.files[0]); }}
                >
                  <textarea
                    ref={transcriptInput}
                    value={transcript}
                    onChange={(event) => { setTranscript(event.target.value); setResult(null); setActiveId(null); setError(""); setNotice(""); }}
                    placeholder="Paste the feedback conversation here…&#10;&#10;Include the supervisor’s feedback, examples, goals, and any follow-up discussion for a more useful analysis."
                    aria-label="Supervisor feedback transcript"
                    spellCheck="true"
                  />
                  {!transcript && (
                    <div className="drop-prompt">
                      <span className="upload-icon"><Icon name="upload" size={20} /></span>
                      <span><strong>Drop a transcript file here</strong><small>or <button type="button" className="inline-link" onClick={() => fileInput.current?.click()}>browse files</button></small></span>
                      <small className="file-types">TXT, MD, CSV · Up to 2 MB</small>
                    </div>
                  )}
                  {transcript && (
                    <div className="drop-footer">
                      <button type="button" className="text-button" onClick={() => fileInput.current?.click()}><Icon name="upload" size={15} /> Upload another</button>
                      <span>{transcript.trim().split(/\s+/).filter(Boolean).length} words <span className="meta-separator">·</span> {transcript.length.toLocaleString()} characters</span>
                    </div>
                  )}
                  <input
                    ref={fileInput}
                    className="visually-hidden"
                    type="file"
                    accept=".txt,.md,.csv,text/plain,text/markdown,text/csv"
                    onChange={(event) => { loadFile(event.target.files[0]); event.target.value = ""; }}
                    aria-label="Upload transcript file"
                  />
                </div>
                <div className="form-footer">
                  <button type="button" className="sample-button" onClick={() => { setTranscript(SAMPLE_TRANSCRIPT); setResult(null); setActiveId(null); setError(""); setNotice(""); }}><Icon name="sparkle" size={16} /> Try a sample</button>
                  <button className="primary-button analyze-button" type="submit" disabled={loading || !transcript.trim()}>
                    {loading ? <><span className="button-spinner" /> Analyzing feedback…</> : <><Icon name="sparkle" size={17} /> Generate report <Icon name="arrow" size={16} /></>}
                  </button>
                </div>
              </form>

              {loading && <div className="loading-state"><span className="loading-orbit"><Icon name="sparkle" size={19} /></span><strong>Finding the meaningful moments</strong><span>Reviewing evidence, strengths, and growth opportunities…</span></div>}

              {result ? (
                <section className="results-section">
                  <div className="results-heading">
                    <div><p className="eyebrow">ANALYSIS COMPLETE</p><h2>Your feedback report</h2></div>
                    <div className="result-actions">
                      <button className="secondary-button" onClick={copyBriefing}><Icon name="copy" size={16} /> Copy briefing</button>
                      <button className="secondary-button" onClick={downloadBriefing}><Icon name="download" size={16} /> Export .txt</button>
                    </div>
                  </div>
                  <div className="result-overview">
                    <div className="score-panel">
                      <span className="score-label">OVERALL SCORE</span>
                      <div className="score-value">{Number.isFinite(score) ? score : "—"}<span>/10</span></div>
                      <div className="score-track"><span style={{ width: `${scorePercent}%` }} /></div>
                      <span className="score-context">Based on the feedback provided</span>
                    </div>
                    <div className="summary-panel"><div className="summary-label"><Icon name="sparkle" size={16} /> EXECUTIVE SUMMARY</div><p>{result.justification || "No summary was provided for this report."}</p></div>
                  </div>
                  <div className="insights-grid">
                    <article className="insight-card evidence-card">
                      <div className="insight-heading"><span className="insight-icon green"><Icon name="activity" size={17} /></span><div><h3>Evidence</h3><p>Specific moments from the conversation</p></div><span className="item-count">{Array.isArray(result.evidence) ? result.evidence.length : 0}</span></div>
                      {Array.isArray(result.evidence) && result.evidence.length > 0 ? <ul className="evidence-list">{result.evidence.map((item, index) => <li key={`${item.quote}-${index}`}><blockquote>“{item.quote}”</blockquote><span className={`tag tag-${String(item.tag || "neutral").toLowerCase()}`}>{item.tag || "neutral"}</span></li>)}</ul> : <p className="empty-insight">No evidence items in this report.</p>}
                    </article>
                    <article className="insight-card">
                      <div className="insight-heading"><span className="insight-icon blue"><Icon name="activity" size={17} /></span><div><h3>Key performance indicators</h3><p>Outcomes and measurable signals</p></div></div>
                      {Array.isArray(result.kpis) && result.kpis.length > 0 ? <ul className="bullet-list">{result.kpis.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="empty-insight">No KPIs identified.</p>}
                    </article>
                    <article className="insight-card">
                      <div className="insight-heading"><span className="insight-icon amber"><Icon name="activity" size={17} /></span><div><h3>Growth opportunities</h3><p>Potential areas to explore</p></div></div>
                      {Array.isArray(result.gaps) && result.gaps.length > 0 ? <ul className="bullet-list">{result.gaps.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="empty-insight">No growth areas identified.</p>}
                    </article>
                    <article className="insight-card">
                      <div className="insight-heading"><span className="insight-icon violet"><Icon name="sparkle" size={17} /></span><div><h3>Questions to continue the conversation</h3><p>Prompts for a meaningful follow-up</p></div></div>
                      {Array.isArray(result.questions) && result.questions.length > 0 ? <ul className="question-list">{result.questions.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="empty-insight">No follow-up questions suggested.</p>}
                    </article>
                  </div>
                </section>
              ) : !loading && (
                <div className="bottom-note"><span className="privacy-icon"><Icon name="check" size={15} /></span><span><strong>Your conversations stay yours.</strong> Reports and history are saved only in this browser.</span><button className="sample-note-button" onClick={() => { setTranscript(SAMPLE_TRANSCRIPT); transcriptInput.current?.focus(); }}>See a sample <Icon name="arrow" size={14} /></button></div>
              )}
            </>
          )}
        </div>
        <footer className="app-footer"><span>Clearpoint <span className="footer-dot">·</span> Supervisor Feedback Analyzer</span><span>Private by design</span></footer>
      </main>
    </div>
  );
}

export default App;
