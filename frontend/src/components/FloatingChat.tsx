import { useState } from "react";
import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const prompts = [
  "Create a 3-day itinerary",
  "Best places under Rs 10,000",
  "Hidden gems in Mysore",
];

const FloatingChat = () => {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<{ role: "ai" | "user"; text: string }[]>([
    {
      role: "ai",
      text: "Hi, I am your AI travel advisor. Ask for itineraries, local food ideas, hidden gems, or a cheaper version of a trip.",
    },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) {
      return;
    }

    setMsgs((current) => [
      ...current,
      { role: "user", text: input },
      {
        role: "ai",
        text: "Great. Start with the planner to connect live destination data, weather, maps, and budget context, then I can help refine the saved trip.",
      },
    ]);
    setInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="mb-3 flex h-[28rem] w-[min(22rem,calc(100vw-2rem))] animate-scale-in flex-col overflow-hidden rounded-2xl border border-white/60 bg-card/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between bg-foreground px-4 py-3 text-background">
            <span className="inline-flex items-center gap-2 font-heading text-sm font-bold">
              <Bot className="h-4 w-4 text-primary" />
              AI Travel Advisor
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close AI advisor">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="border-b border-border p-3">
            <div className="flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {msgs.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-muted text-foreground"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Travel context ready
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-t border-border p-3">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && send()}
              placeholder="Ask about your trip..."
              className="h-9 rounded-full text-sm"
            />
            <Button size="icon" onClick={send} className="h-9 w-9 shrink-0 rounded-full" aria-label="Send message">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
        aria-label="Open AI travel advisor"
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <span className="relative">
            <MessageCircle className="h-5 w-5" />
            <Sparkles className="absolute -right-2 -top-2 h-3.5 w-3.5" />
          </span>
        )}
      </button>
    </div>
  );
};

export default FloatingChat;
