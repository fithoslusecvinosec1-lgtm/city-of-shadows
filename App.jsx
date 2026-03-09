import React, { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are the narrator of a noir detective text adventure game set in 1940s Los Angeles. The player is a hardboiled private detective named Jack Malone.

Rules:
- Write atmospheric, noir-style prose (2-4 sentences max per response)
- Always end with either a question, a dramatic moment, or 2-3 numbered choices
- React to ANYTHING the player types — treat it as an action or dialogue
- Keep track of the story context from the conversation history
- Include classic noir elements: femme fatales, corrupt cops, dark alleys, smoky bars, secrets
- If the player does something that would end the case (solved or failed), wrap up dramatically
- Never break character. Never mention AI or that this is a game.
- Keep responses concise and punchy — this is noir, not a novel`;

const OPENING = `The rain hammers your office window like a guilty conscience. It's 11pm and you're nursing your third bourbon when she walks in — legs that go all the way up and trouble written all over her red dress.

"Mr. Malone," she says, voice like smoke and velvet. "My husband is missing. The police won't help." She slides an envelope across your desk. Inside: a photograph of a man, a matchbook from The Blue Parrot club, and five crisp hundred-dollar bills.

"His name is Victor Crane. He vanished three nights ago." Her eyes dart to the window. "I think someone powerful had him killed."

What do you do?

1. Ask her name and how she knew Victor
2. Pocket the money and head straight to The Blue Parrot
3. Tell her to start from the beginning`;

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

export default function App() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: OPENING }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (!API_KEY) {
      setError("No API key found. Add VITE_GEMINI_API_KEY to your Vercel environment variables.");
      return;
    }

    setError(null);
    setInput("");

    const newMessages = [...messages, { role: "assistant", content: text }];
    setMessages([...messages, { role: "user", content: text }]);
    setLoading(true);

    // Build Gemini conversation history
    const history = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            ...history,
            { role: "user", parts: [{ text }] }
          ],
          generationConfig: { maxOutputTokens: 1000 },
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
        || "The darkness swallows your action whole. Try something else.";

      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Static crackles across the line. Something went wrong — check your API key and try again."
      }]);
      setError(err.message || "API error. Check your Gemini API key.");
    }
    setLoading(false);
  };

  const restart = () => {
    setMessages([{ role: "assistant", content: OPENING }]);
    setInput("");
    setError(null);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0d0b08",
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: "'Courier New', monospace", color: "#c9b882", padding: "24px 16px",
    }}>
      <div style={{ textAlign: "center", marginBottom: 24, width: "100%", maxWidth: 680 }}>
        <h1 style={{
          fontSize: "clamp(20px, 4vw, 36px)", fontWeight: 900,
          letterSpacing: "0.15em", margin: "0 0 4px",
          color: "#c9b882", textShadow: "0 0 20px rgba(201,184,130,0.4)",
        }}>CITY OF SHADOWS</h1>
        <p style={{ color: "#444", fontSize: 11, letterSpacing: "0.3em", margin: 0 }}>
          A NOIR DETECTIVE ADVENTURE
        </p>
      </div>

      {error && (
        <div style={{
          width: "100%", maxWidth: 680, marginBottom: 16,
          padding: "12px 16px", borderRadius: 6,
          border: "1px solid #5a2020", background: "rgba(90,32,32,0.2)",
          color: "#ff6b6b", fontSize: 12, letterSpacing: "0.05em",
        }}>
          ⚠ {error}
        </div>
      )}

      <div style={{
        width: "100%", maxWidth: 680, flex: 1,
        background: "#0a0907", border: "1px solid #2a2418",
        borderRadius: 8, padding: "20px", marginBottom: 16,
        minHeight: 420, maxHeight: "60vh", overflowY: "auto",
        boxShadow: "inset 0 0 40px rgba(0,0,0,0.5)",
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 20 }}>
            {msg.role === "user" ? (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: "#5a6e5a", fontSize: 12, whiteSpace: "nowrap", marginTop: 1 }}>{">"}</span>
                <p style={{ margin: 0, color: "#7a9a7a", fontSize: 13, lineHeight: 1.7, fontStyle: "italic" }}>
                  {msg.content}
                </p>
              </div>
            ) : (
              <p style={{
                margin: 0, color: "#c9b882", fontSize: 13, lineHeight: 1.9,
                whiteSpace: "pre-wrap",
              }}>
                {msg.content}
              </p>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ color: "#5a4a2a", fontSize: 13, fontStyle: "italic" }}>
            The city thinks...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ width: "100%", maxWidth: 680, display: "flex", gap: 10 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: "#5a6e5a", fontSize: 14, pointerEvents: "none",
          }}>{">"}</span>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Type an action or choice..."
            disabled={loading}
            style={{
              width: "100%", padding: "12px 12px 12px 28px",
              background: "#0a0907", border: "1px solid #2a2418",
              borderRadius: 6, color: "#c9b882", fontSize: 13,
              fontFamily: "'Courier New', monospace",
              outline: "none", boxSizing: "border-box",
              opacity: loading ? 0.5 : 1,
            }}
          />
        </div>
        <button onClick={send} disabled={loading || !input.trim()} style={{
          padding: "12px 20px", fontSize: 11, letterSpacing: "0.2em",
          cursor: loading || !input.trim() ? "not-allowed" : "pointer",
          border: "1px solid #2a2418", borderRadius: 6,
          background: "rgba(201,184,130,0.06)", color: "#c9b882",
          fontFamily: "'Courier New', monospace", transition: "all 0.2s",
          opacity: loading || !input.trim() ? 0.4 : 1,
        }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "rgba(201,184,130,0.14)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(201,184,130,0.06)"; }}
        >SEND</button>
        <button onClick={restart} style={{
          padding: "12px 16px", fontSize: 11, letterSpacing: "0.2em",
          cursor: "pointer", border: "1px solid #2a2418", borderRadius: 6,
          background: "transparent", color: "#444",
          fontFamily: "'Courier New', monospace", transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "#c9b882"; e.currentTarget.style.borderColor = "#5a4a2a"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#444"; e.currentTarget.style.borderColor = "#2a2418"; }}
        >NEW CASE</button>
      </div>

      <p style={{ color: "#2a2418", fontSize: 10, letterSpacing: "0.2em", marginTop: 12 }}>
        TYPE ANYTHING — ACTIONS, DIALOGUE, OR PICK A NUMBERED CHOICE
      </p>
    </div>
  );
}
