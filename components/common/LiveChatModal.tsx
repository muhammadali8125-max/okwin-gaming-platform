"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Headphones,
  Sparkles,
  CheckCircle2,
  Clock,
  HelpCircle,
  Phone,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { wallet } from "@/lib/walletStore";
import { sounds } from "@/lib/soundEngine";

interface LiveChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: "agent" | "user";
  text: string;
  time: string;
  actionUrl?: string;
  actionLabel?: string;
}

const FAQ_CHIPS = [
  {
    q: "Where do I find my 11-Digit TID?",
    a: "After sending money via EasyPaisa or JazzCash, you receive an instant confirmation SMS (from 3737 or 8558). Look for the 11-digit number labeled 'Trx ID' or 'TID'. Enter this number in the deposit verification form!",
  },
  {
    q: "How long do withdrawals take?",
    a: "Withdrawals via EasyPaisa, JazzCash, and Raast are audited and cleared 24/7. Normal arrival time is between 5 to 15 minutes directly to your Pakistani account.",
  },
  {
    q: "How to claim ₨ 888 Welcome Gift?",
    a: "Simply sign up with your Pakistani mobile number! The ₨ 888 Free Bonus is credited automatically to your bonus balance upon account registration.",
  },
  {
    q: "Can I deposit via Raast Bank Transfer?",
    a: "Yes! Choose 'Bank & Raast' in the deposit screen. You can transfer from Meezan, HBL, UBL, Alfalah, or any bank using our 0% fee Raast ID: 0300 1234567.",
  },
  {
    q: "Connect with WhatsApp Agent",
    a: "Our Senior VIP Account Manager is available 24/7 on WhatsApp for custom recharges, large payouts, and instant VIP upgrades.",
    actionUrl: "https://wa.me/923001234567?text=Hello%20Okwin%20VIP%20Support,%20I%20need%20assistance.",
    actionLabel: "Open WhatsApp VIP Chat",
  },
];

export const LiveChatModal: React.FC<LiveChatModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m_1",
      sender: "agent",
      text: "Hello! Welcome to Okwin 24/7 VIP Financial Desk. How can we help with your deposit, withdrawal, or account today?",
      time: "Just now",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const user = wallet.getUser();

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    try { sounds.playClick(); } catch {}

    const newMsg: ChatMessage = {
      id: "u_" + Date.now(),
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    // Simulate smart agent response
    setTimeout(() => {
      let replyText = "Thank you for reaching out! Our Pakistani finance desk is processing transactions 24/7. Your account is active and in good standing.";
      let actionUrl: string | undefined;
      let actionLabel: string | undefined;

      const lower = text.toLowerCase();
      if (lower.includes("tid") || lower.includes("transaction") || lower.includes("deposit")) {
        replyText = "Deposits are automatically verified once your 11-digit TID is submitted. If your TID is pending over 15 minutes, please send your screenshot to our WhatsApp cashier for 1-minute manual release!";
        actionUrl = `https://wa.me/923001234567?text=Player%20${user.id}%20Deposit%20TID%20Assistance`;
        actionLabel = "Send Screenshot to WhatsApp";
      } else if (lower.includes("withdraw") || lower.includes("cashout")) {
        replyText = `Withdrawals are processed around the clock. Your current balance is ₨ ${user.balance.toLocaleString()}. Remember to meet your turnover requirement before requesting cashout.`;
      } else if (lower.includes("bonus") || lower.includes("888")) {
        replyText = "New registered members receive ₨ 888 Free Bonus! You can also spin the Daily Lucky Wheel for up to ₨ 1,888 free cash every 24 hours.";
      } else if (lower.includes("whatsapp") || lower.includes("human") || lower.includes("manager")) {
        replyText = "Connecting you directly to our Senior VIP Manager on WhatsApp:";
        actionUrl = `https://wa.me/923001234567?text=Player%20${user.id}%20VIP%20Assistance`;
        actionLabel = "Open WhatsApp VIP Manager";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: "a_" + Date.now(),
          sender: "agent",
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          actionUrl,
          actionLabel,
        },
      ]);
      try { sounds.playCoin(); } catch {}
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-0 sm:p-4 text-white animate-in fade-in duration-200">
      <div className="relative w-full h-full sm:h-[620px] sm:max-w-[440px] bg-[#0d0e11] sm:border sm:border-[#26272e] sm:rounded-3xl shadow-2xl flex flex-col font-sans select-none overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-[#14151a] border-b border-[#232429] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#22c55e] to-[#16a34a] text-black flex items-center justify-center shadow-md">
                <Headphones size={18} />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#22c55e] ring-2 ring-[#14151a]" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Okwin VIP Support</span>
                <span className="text-[9px] bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40 px-1.5 py-0.2 rounded font-mono font-bold">
                  24/7 LIVE
                </span>
              </div>
              <div className="text-[10px] text-gray-400">
                Avg Response: &lt; 1 min • Player ID: <span className="font-mono text-gray-300 font-bold">{user.id}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick FAQ Chips Bar */}
        <div className="bg-[#101116] border-b border-[#1f2026] px-3 py-2 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
          {FAQ_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(chip.q)}
              className="px-2.5 py-1 rounded-full bg-[#18191f] border border-[#28292e] hover:border-[#22c55e]/60 text-[10px] font-bold text-gray-300 whitespace-nowrap active:scale-95 transition flex items-center gap-1 hover:text-white"
            >
              <HelpCircle size={10} className="text-[#22c55e]" />
              <span>{chip.q}</span>
            </button>
          ))}
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  m.sender === "user"
                    ? "bg-[#22c55e] text-black font-medium rounded-tr-none shadow-md"
                    : "bg-[#18191f] text-gray-200 border border-[#28292e] rounded-tl-none shadow-sm"
                }`}
              >
                <p>{m.text}</p>
                {m.actionUrl && (
                  <a
                    href={m.actionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-black font-black text-[11px] shadow-sm hover:brightness-105 active:scale-95 transition"
                  >
                    <MessageCircle size={13} />
                    <span>{m.actionLabel || "Open Support"}</span>
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
              <span className="text-[9px] text-gray-500 font-mono mt-0.5 px-1">{m.time}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="bg-[#14151a] border-t border-[#232429] p-3 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type your question or issue..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            className="flex-1 bg-[#0d0e11] border border-[#28292e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#22c55e] transition"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            className="p-2.5 rounded-xl bg-[#22c55e] text-black font-bold hover:bg-[#16a34a] active:scale-95 transition shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
