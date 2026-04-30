import { useState, useEffect } from "react";

function App() {
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔥 Add spinner animation once
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      alert("Please enter a transcript");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("http://localhost:8080/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(transcript)
      });

      if (!response.ok) {
        throw new Error("HTTP error: " + response.status);
      }

      const data = await response.text();
      console.log("RAW RESPONSE:", data);

      let parsed;

      try {
        parsed = JSON.parse(data);
      } catch (e) {
        console.error("Invalid JSON:", data);
        alert("Invalid JSON from backend");
        setLoading(false);
        return;
      }

      setResult(parsed);

    } catch (error) {
      console.error("FETCH ERROR:", error);
      alert("Error: " + error.message);
    }

    setLoading(false);
  };

  // 🎨 Card style
  const cardStyle = {
    backgroundColor: "#1f2937",
    padding: "16px",
    borderRadius: "12px",
    marginTop: "15px",
    border: "1px solid #374151",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
  };

  // 🔄 Loader style
  const loaderStyle = {
    width: "40px",
    height: "40px",
    border: "4px solid #374151",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "20px auto"
  };

 return (
  <div style={{
    backgroundColor: "#111827",
    minHeight: "100vh",
    width: "100%"
  }}>
    
    <div style={{
      maxWidth: "900px",
      margin: "0 auto",
      padding: "24px",
      fontFamily: "Arial",
      color: "#e5e7eb"
    }}>
      
      <h1 style={{ textAlign: "center", marginBottom: "10px" }}>
        Supervisor Feedback Analyzer
      </h1>

      <p style={{ textAlign: "center", opacity: 0.7 }}>
        Paste supervisor transcript below
      </p>

      <textarea
        rows="8"
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "10px",
          border: "1px solid #374151",
          marginTop: "10px",
          fontSize: "14px",
          backgroundColor: "#111827",
          color: "#e5e7eb"
        }}
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
      />

      <div style={{ textAlign: "center", marginTop: "15px" }}>
        <button onClick={handleAnalyze}>
          {loading ? "Analyzing..." : "Run Analysis"}
        </button>
      </div>

      {/* Loader */}
      {loading && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <div style={loaderStyle}></div>
          <p>Analyzing transcript...</p>
        </div>
      )}

      <hr style={{ margin: "25px 0", opacity: 0.3 }} />

      {/* Results */}
      {result && (
        <div>
          <div style={cardStyle}>
            <h2>Score: {result.score}</h2>
          </div>

          <div style={cardStyle}>
            <h3>Justification</h3>
            <p>{result.justification}</p>
          </div>

          <div style={cardStyle}>
            <h3>Evidence</h3>
            <ul>
              {result.evidence?.map((e, i) => (
                <li key={i}>
                  "{e.quote}" — <b>{e.tag}</b>
                </li>
              ))}
            </ul>
          </div>

          <div style={cardStyle}>
            <h3>KPIs</h3>
            <ul>
              {result.kpis?.map((k, i) => (
                <li key={i}>{k}</li>
              ))}
            </ul>
          </div>

          <div style={cardStyle}>
            <h3>Gap Analysis</h3>
            <ul>
              {result.gaps?.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>

          <div style={cardStyle}>
            <h3>Follow-up Questions</h3>
            <ul>
              {result.questions?.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

    </div>
  </div>
);
}

export default App;