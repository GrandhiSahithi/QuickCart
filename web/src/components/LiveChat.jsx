import { useState } from "react";

const GREETING = "Hi! I'm QuickCart Support. How can I help?";

const QUICK_REPLIES = [
  { label: "Track my order", text: "I want to track my order" },
  { label: "Payment issue", text: "I have a payment issue" },
  { label: "Cancel / refund", text: "I want to cancel or get a refund" },
  { label: "Talk to a human", text: "I'd like to talk to a human" }
];

function cannedReply(text) {
  const lower = text.toLowerCase();
  if (lower.includes("order") || lower.includes("track")) {
    return "You can watch any order move live on the map from the Orders tab — tap an order to open tracking.";
  }
  if (lower.includes("refund") || lower.includes("cancel")) {
    return "Orders can be cancelled before a store confirms them. After that, let us know the order number and we'll sort out a refund — most land back on your card within 3-5 business days.";
  }
  if (lower.includes("payment")) {
    return "All payments are encrypted at checkout. If a charge looks wrong, send over the order number and we'll take a look.";
  }
  if (lower.includes("human") || lower.includes("agent") || lower.includes("person")) {
    return "Got it — I've flagged this for our team. We typically reply within a few minutes during business hours.";
  }
  return "Thanks for reaching out! Our team will get back to you shortly. In the meantime, the Orders tab has live tracking and Profile has account help.";
}

export default function LiveChat() {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const [messages, setMessages] = useState([{ from: "bot", text: GREETING }]);
  const [input, setInput] = useState("");

  function toggleOpen() {
    setOpen((o) => !o);
    setEverOpened(true);
  }

  function send(text) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { from: "bot", text: cannedReply(text) }]);
    }, 500);
  }

  function handleSubmit(e) {
    e.preventDefault();
    send(input);
  }

  return (
    <>
      {open && (
        <div className="live-chat-panel">
          <div className="live-chat-header">
            <div>
              <strong>QuickCart Support</strong>
              <span>Usually replies in a few minutes</span>
            </div>
            <button type="button" className="live-chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
              ✕
            </button>
          </div>

          <div className="live-chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`live-chat-bubble live-chat-bubble-${m.from}`}>
                {m.text}
              </div>
            ))}
          </div>

          <div className="live-chat-quick-replies">
            {QUICK_REPLIES.map((q) => (
              <button key={q.label} type="button" onClick={() => send(q.text)}>
                {q.label}
              </button>
            ))}
          </div>

          <form className="live-chat-input-row" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              aria-label="Message"
            />
            <button type="submit" aria-label="Send">➤</button>
          </form>
        </div>
      )}

      <button type="button" className="live-chat-fab" onClick={toggleOpen} aria-label="Open live chat">
        💬
        {!everOpened && <span className="live-chat-fab-dot" />}
      </button>
    </>
  );
}
