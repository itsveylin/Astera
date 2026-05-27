import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { formatINR } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — Lumen" }] }),
  component: Assistant,
});

type Msg = { role: "user" | "ai"; text: string; cards?: { k: string; v: string }[] };

const seed: Msg[] = [
  { role: "ai", text: "Hi Aanya ✨ I'm Lumen. Ask me anything about your money — spending, savings, what-ifs." },
  { role: "user", text: "How much did I spend on food this month?" },
  { role: "ai", text: `You spent ${formatINR(5840)} on Food this month, 18% more than last month.`, cards: [{ k: "Top merchant", v: "Zomato ₹2,340" }, { k: "Suggestion", v: "Cook 2 dinners in to save ~₹1,200" }] },
];

const prompts = [
  "Show my biggest unnecessary expenses",
  "Can I save ₹10,000 in 3 months?",
  "Forecast my spending for next month",
  "Which subscriptions should I cancel?",
];

function Assistant() {
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);

  const send = (t: string) => {
    if (!t.trim()) return;
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setText("");
    setTyping(true);
    setTimeout(() => {
      setMsgs((m) => [...m, {
        role: "ai",
        text: "Based on the last 90 days, here's what I'd do:",
        cards: [
          { k: "Cut", v: "Adobe CC + Notion AI · save ₹4,200/mo" },
          { k: "Shift", v: "₹3,000/mo from Shopping → SIP" },
          { k: "Result", v: "You'd hit your ₹10,000/mo savings goal in 2.5 months." },
        ],
      }]);
      setTyping(false);
    }, 1200);
  };

  return (
    <div>
      <Topbar title="AI Assistant" subtitle="Your money, in plain language." />

      <div className="glass-strong rounded-[2rem] p-6 flex flex-col h-[70vh]">
        <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4 pr-2">
          {msgs.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "ai" && (
                <div className="size-8 rounded-2xl gradient-primary grid place-items-center shrink-0">
                  <Sparkles className="size-4 text-primary-foreground" />
                </div>
              )}
              <div className={`max-w-[80%] ${m.role === "user" ? "text-right" : ""}`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm inline-block ${
                  m.role === "user" ? "gradient-primary text-primary-foreground" : "glass"
                }`}>{m.text}</div>
                {m.cards && (
                  <div className="mt-2 grid sm:grid-cols-3 gap-2">
                    {m.cards.map((c, k) => (
                      <div key={k} className="glass rounded-2xl p-3 text-left">
                        <div className="text-[10px] uppercase text-muted-foreground tracking-wider">{c.k}</div>
                        <div className="text-xs mt-1">{c.v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {typing && (
            <div className="flex gap-3 items-center">
              <div className="size-8 rounded-2xl gradient-primary grid place-items-center"><Sparkles className="size-4 text-primary-foreground" /></div>
              <div className="glass rounded-2xl px-4 py-3 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="size-1.5 rounded-full bg-foreground/60"
                    animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {prompts.map((p) => (
            <button key={p} onClick={() => send(p)} className="text-xs glass rounded-full px-3 py-1.5 hover:bg-accent/40">{p}</button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="mt-3 glass rounded-2xl px-4 py-2.5 flex items-center gap-2">
          <Sparkles className="size-4 text-muted-foreground" />
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask anything..." className="bg-transparent outline-none flex-1 text-sm" />
          <button type="submit" className="size-9 rounded-xl gradient-primary text-primary-foreground grid place-items-center"><Send className="size-4" /></button>
        </form>
      </div>
    </div>
  );
}
