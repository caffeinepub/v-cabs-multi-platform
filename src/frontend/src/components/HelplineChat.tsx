import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Bot, Loader2, Phone, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { User as VCabsUser } from "../types/vcabs";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  ts: number;
}

interface HelplineChatProps {
  user: VCabsUser;
  onBack: () => void;
}

function getBotResponse(text: string, userName: string): string {
  const t = text.toLowerCase();
  if (/(ride|book|cancel|trip)/.test(t))
    return "For ride issues, please try booking again from the home screen. If the driver doesn't arrive, you can cancel and re-book. Our drivers are usually within 5km of your location.";
  if (/(payment|money|coin|fare|refund|charge|price)/.test(t))
    return "For payment questions: V Coins (VC) can be used at a rate of 1 VC = ₹5. For refund requests, please call 1800-VCB-HELP and our team will resolve within 24 hours.";
  if (/(driver|behavior|rude|bad|complaint|abuse)/.test(t))
    return "We take driver behavior seriously. Please share your ride ID and we'll investigate within 24 hours. You can also rate your driver after each trip. Your safety is our top priority.";
  if (/(otp|start|verify|code|4829)/.test(t))
    return "The OTP is shown on your ride screen. Share it with your driver to start the trip. For demo purposes, the test OTP is 4829.";
  if (/(sos|emergency|danger|safe|help|unsafe)/.test(t))
    return "If you're in danger, please use the SOS button immediately (accessible from the menu). It will alert our safety team and show emergency contacts (Police 100, Ambulance 108).";
  if (/(account|login|password|profile|sign)/.test(t))
    return "For account issues, go to the Profile section in the sidebar menu. You can update your name, email, city, and saved addresses there.";
  if (/(location|pickup|detect|gps|address)/.test(t))
    return "Use the blue Navigation button next to the pickup field to auto-detect your current location. You can also search for any address and save frequently used places.";
  if (/(city|area|zone|region)/.test(t))
    return "V Cabs is available in Mumbai, Bengaluru, Delhi, and more Indian cities. Make sure your city is set correctly in your profile for accurate driver matching.";
  return `Thanks for reaching out, ${userName}. I'll connect you with our support team. Please call 1800-VCB-HELP or email support@vcabs.in — we'll respond within 2 hours.`;
}

export default function HelplineChat({ user, onBack }: HelplineChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "bot-0",
      text: `Hi ${user.name}! 👋 How can I help you today? Ask about ride issues, payments, safety, SOS, or anything else.`,
      sender: "bot",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on any message change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      text,
      sender: "user",
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      const botMsg: Message = {
        id: `b-${Date.now()}`,
        text: getBotResponse(text, user.name),
        sender: "bot",
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-primary text-primary-foreground shadow">
        <button
          type="button"
          onClick={onBack}
          className="text-primary-foreground/80 hover:text-primary-foreground"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Bot className="w-7 h-7" />
        <div className="flex-1">
          <p className="font-bold text-sm">V Cabs Helpline</p>
          <p className="text-xs text-primary-foreground/70">
            AI Support Assistant
          </p>
        </div>
        <a
          href="tel:1800-VCB-HELP"
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
        >
          <Phone className="w-3.5 h-3.5" />
          1800-VCB-HELP
        </a>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            data-ocid={`helpline.message.item.${idx + 1}`}
            className={`flex gap-2 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.sender === "bot" && (
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm"
              }`}
            >
              {msg.text}
            </div>
            {msg.sender === "user" && (
              <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-foreground" />
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Typing...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
        {[
          "Ride issue",
          "Payment help",
          "Driver complaint",
          "OTP problem",
          "SOS / Safety",
        ].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => {
              setInput(q);
            }}
            className="shrink-0 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1.5 hover:bg-primary/20 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-2 flex gap-2 border-t border-border bg-background">
        <Input
          data-ocid="helpline.input"
          placeholder="Type your question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          className="flex-1"
        />
        <Button
          data-ocid="helpline.send_button"
          type="button"
          onClick={sendMessage}
          disabled={!input.trim() || isTyping}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
