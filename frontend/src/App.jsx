import { useState } from "react";

function App() {
  const [transcript, setTranscript] = useState("");

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      
      <h1>Supervisor Feedback Analyzer</h1>

      <p>Paste supervisor transcript below:</p>

      <textarea
        rows="10"
        cols="80"
        placeholder="Paste transcript here..."
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
      />

      <br /><br />

      <button>Run Analysis</button>

    </div>
  );
}

export default App;