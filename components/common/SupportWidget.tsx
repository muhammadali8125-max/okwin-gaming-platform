"use client";

import React, { useState } from "react";
import {
  Headphones,
  X,
  MessageCircle,
  Send,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Bot,
  ExternalLink
} from "lucide-react";
import { sounds } from "@/lib/soundEngine";

interface SupportAnswer {
  q: string;
  a: string;
}

const FAQS: SupportAnswer[] = [
  {
    q: "How to deposit via JazzCash or EasyPaisa?",
    a: "Tap Deposit at the top right, select JazzCash or EasyPaisa, copy the merchant account number, transfer funds from your banking app, and paste your 11-digit TID for instant credit.",
  },
  {
    q: "How long do withdrawals take to arrive?",
    a: "JazzCash and EasyPaisa withdrawals are processed within 5 to 15 minutes 24/7. Bank transfers take up to 30 minutes.",
  },
  {
    q: "How to claim the ₨ 888 Welcome Bonus?",
    a: "Create a new account or spin the Daily Lucky Fortune Wheel on the home screen to claim instant free cash and streak rewards.",
  },
  {
    q: "How does the Agent Referral commission work?",
    a: "Share your unique referral code from the 'Promote' page. You earn up to 30% direct commission on your invited players' bet turnover daily.",
  },
];

export const SupportWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedFaq, setSelectedFaq] = useState<SupportAnswer | null>(null);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    {
      sender: "bot",
      text: "👋 Welcome to Okwin 24/7 Support! How can we assist you today?",
    },
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatInput("");
    sounds.playClick();

    setChatHistory((prev) => [...prev, { sender: "user", text: userText }]);

    // Simulated instant agent reply
    setTimeout(() => {
      let botReply = "Thank you for reaching out! A dedicated VIP customer support representative is reviewing your account. You can also chat directly on WhatsApp.";
      const lower = userText.toLowerCase();
      if (lower.includes("deposit") || lower.includes("recharge")) {
        botReply = "For deposits, please ensure you submit your 11-digit SMS TID after transferring funds via JazzCash or EasyPaisa. Funds are credited instantly.";
      } else if (lower.includes("withdraw") || lower.includes("payout")) {
        botReply = "Withdrawals are dispatched within 5-15 minutes. Check your Wallet history for real-time status.";
      } else if (lower.includes("bonus") || lower.includes("wheel")) {
        botReply = "Don't forget to spin the Lucky Fortune Wheel on the home screen every 24 hours for free PKR!";
      }

      setChatHistory((prev) => [...prev, { sender: "bot", text: botReply }]);
    }, 600);
  };

  return (
    <>
      {/* Floating Action Bubble */}
      <button
        onClick={() => {
          sounds.playClick();
          setIsOpen(true);
        }}
        className="fixed bottom-16 right-4 z-40 p-3 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-black shadow-[0_4px_20px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
        title="24/7 VIP Support"
      >
        <Headphones size={22} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-black animate-pulse" />
      </button>

      {/* Support Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 text-white">
          <div className="bg-[#141414] border border-[#262626] rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Drawer Header */}
            <div className="p-4 bg-[#1b1b1b] border-b border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Headphones size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    OKWIN 24/7 VIP SUPPORT
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-medium">Online • Average reply time &lt; 1 min</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full bg-[#242424] hover:bg-[#333333] text-jjwin-textMuted hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Contact Buttons */}
            <div className="p-3 grid grid-cols-2 gap-2 bg-[#181818] border-b border-[#262626]">
              <a
                href="https://wa.me/923001234567?text=Hello%20Okwin%20Support,%20I%20need%20help%20with%20my%20account"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 flex items-center gap-2 text-emerald-300 font-bold text-xs transition"
              >
                <span className="text-lg">💬</span>
                <div>
                  <div className="leading-tight">WhatsApp VIP</div>
                  <div className="text-[9px] text-emerald-400/80">Direct Chat</div>
                </div>
              </a>

              <a
                href="https://t.me/okwin_official_pk"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-500/40 hover:bg-blue-900/60 flex items-center gap-2 text-blue-300 font-bold text-xs transition"
              >
                <span className="text-lg">✈️</span>
                <div>
                  <div className="leading-tight">Telegram Group</div>
                  <div className="text-[9px] text-blue-400/80">Official Channel</div>
                </div>
              </a>
            </div>

            {/* Content Area: FAQ or Live Chat */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin">
              {/* FAQ Section */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle size={13} className="text-amber-400" />
                  <span>Frequently Asked Questions</span>
                </div>

                <div className="space-y-1.5">
                  {FAQS.map((faq, i) => (
                    <div
                      key={i}
                      className="rounded-xl bg-[#1a1a1a] border border-[#262626] overflow-hidden"
                    >
                      <button
                        onClick={() => setSelectedFaq(selectedFaq?.q === faq.q ? null : faq)}
                        className="w-full p-2.5 text-left font-bold text-slate-200 hover:text-white flex items-center justify-between text-xs transition"
                      >
                        <span>{faq.q}</span>
                        <ChevronRight
                          size={14}
                          className={`text-slate-500 transition-transform ${
                            selectedFaq?.q === faq.q ? "rotate-90 text-amber-400" : ""
                          }`}
                        />
                      </button>
                      {selectedFaq?.q === faq.q && (
                        <div className="p-2.5 pt-0 text-[11px] text-slate-400 border-t border-white/5 leading-relaxed bg-black/40">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* In-App Live Chat Assistant */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Bot size={13} className="text-emerald-400" />
                  <span>Instant Help Assistant</span>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto p-2 rounded-xl bg-black/50 border border-[#262626]">
                  {chatHistory.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl text-xs max-w-[85%] ${
                        m.sender === "user"
                          ? "ml-auto bg-emerald-600 text-black font-semibold"
                          : "mr-auto bg-[#222222] text-slate-200"
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSend}
              className="p-3 bg-[#181818] border-t border-[#262626] flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask support a question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-[#121212] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-jjwin-primary"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
