"use client";

import React, { useState, useEffect } from "react";
import { Users, Flame, Trophy, MessageSquare, Send, Sparkles } from "lucide-react";

interface SimulatedBet {
  id: string;
  user: string;
  amount: number;
  targetMultiplier: number;
  cashedOut: boolean;
  cashoutAmount?: number;
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  isBigWin?: boolean;
}

interface AviatorMultiplayerFeedProps {
  currentMultiplier: number;
  gameState: "waiting" | "flying" | "crashed";
}

const INITIAL_NAMES = [
  "Hamza_99", "Ali_Raza", "Khan_Vip", "Malik_786", "Zubair_K",
  "Babar_56", "Rizwan_PK", "Sultan_007", "Shahid_Afridi", "Usman_G",
  "Tariq_Pro", "Faizan_88", "Waqas_VIP", "Imran_King", "Bilal_Rawal"
];

export const AviatorMultiplayerFeed: React.FC<AviatorMultiplayerFeedProps> = ({
  currentMultiplier,
  gameState,
}) => {
  const [activeTab, setActiveTab] = useState<"bets" | "top" | "chat">("bets");
  const [bets, setBets] = useState<SimulatedBet[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "1", user: "Hamza_99", text: "Today Aviator is giving huge multipliers! 🚀", time: "12:15" },
    { id: "2", user: "Ali_Raza", text: "Targeting 5x this round 🔥", time: "12:16" },
    { id: "3", user: "SYSTEM", text: "Khan_Vip just cashed out ₨ 18,500 at 7.40x!", time: "12:17", isBigWin: true },
  ]);
  const [inputMsg, setInputMsg] = useState("");

  // Re-generate fresh round bets when gameState transitions to "waiting" or on initial load
  useEffect(() => {
    if (gameState === "waiting" || bets.length === 0) {
      const generated: SimulatedBet[] = INITIAL_NAMES.map((name, i) => {
        const amount = [100, 200, 500, 1000, 2000, 5000][Math.floor(Math.random() * 6)];
        // Random cashout target between 1.2x and 18.0x
        const targetMultiplier = Math.round((1.2 + Math.random() * 8.5) * 100) / 100;
        return {
          id: `b_${i}_${Date.now()}`,
          user: name,
          amount,
          targetMultiplier,
          cashedOut: false,
        };
      });
      setBets(generated);
    }
  }, [gameState]);

  // When flying, check who cashed out dynamically
  useEffect(() => {
    if (gameState === "flying") {
      setBets((prev) =>
        prev.map((bet) => {
          if (!bet.cashedOut && currentMultiplier >= bet.targetMultiplier) {
            return {
              ...bet,
              cashedOut: true,
              cashoutAmount: Math.round(bet.amount * bet.targetMultiplier),
            };
          }
          return bet;
        })
      );
    }
  }, [currentMultiplier, gameState]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      user: "You (Winner_007)",
      text: inputMsg.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev.slice(-25), newMsg]);
    setInputMsg("");
  };

  const totalPot = bets.reduce((acc, b) => acc + b.amount, 0);

  return (
    <div className="w-full bg-[#111111] border border-[#262626] rounded-2xl flex flex-col overflow-hidden text-xs">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-[#262626] bg-[#161616] p-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("bets")}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === "bets"
                ? "bg-jjwin-primary text-black font-black"
                : "text-jjwin-textMuted hover:text-white"
            }`}
          >
            <Users size={13} />
            <span>All Bets ({bets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("top")}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === "top"
                ? "bg-jjwin-primary text-black font-black"
                : "text-jjwin-textMuted hover:text-white"
            }`}
          >
            <Trophy size={13} />
            <span>Top Wins</span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === "chat"
                ? "bg-jjwin-primary text-black font-black"
                : "text-jjwin-textMuted hover:text-white"
            }`}
          >
            <MessageSquare size={13} />
            <span>Live Chat</span>
          </button>
        </div>

        <div className="text-[10px] font-mono text-amber-400 font-black pr-2">
          Pot: ₨ {totalPot.toLocaleString()}
        </div>
      </div>

      {/* Tab 1: Live All Bets */}
      {activeTab === "bets" && (
        <div className="p-2 max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
          {bets.map((bet) => (
            <div
              key={bet.id}
              className={`p-2 rounded-xl flex items-center justify-between font-mono text-[11px] transition-all ${
                bet.cashedOut
                  ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                  : gameState === "crashed"
                  ? "bg-red-950/30 border border-red-500/20 text-slate-400"
                  : "bg-[#181818] border border-white/5 text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-sans font-bold text-amber-400">
                  {bet.user[0]}
                </div>
                <span className="font-sans font-semibold text-white">{bet.user}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-400">₨ {bet.amount.toLocaleString()}</span>
                {bet.cashedOut ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                    {bet.targetMultiplier}x (+₨ {bet.cashoutAmount?.toLocaleString()})
                  </span>
                ) : gameState === "crashed" ? (
                  <span className="text-red-400/80 text-[10px] font-semibold">Flew Away</span>
                ) : (
                  <span className="text-amber-400 text-[10px] animate-pulse">Flying...</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Top Wins */}
      {activeTab === "top" && (
        <div className="p-2 max-h-48 overflow-y-auto space-y-1.5">
          {[
            { user: "Sultan_VIP", mult: "84.20x", bet: "₨ 2,000", win: "₨ 168,400" },
            { user: "Lahore_Falcon", mult: "52.10x", bet: "₨ 1,000", win: "₨ 52,100" },
            { user: "Karachi_King", mult: "34.50x", bet: "₨ 5,000", win: "₨ 172,500" },
            { user: "Winner_007", mult: "18.80x", bet: "₨ 500", win: "₨ 9,400" },
          ].map((item, i) => (
            <div
              key={i}
              className="p-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 flex items-center justify-between font-mono text-[11px]"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                  #{i + 1}
                </span>
                <span className="font-sans font-bold text-white">{item.user}</span>
              </div>
              <div className="text-right">
                <span className="text-amber-400 font-black mr-2">{item.mult}</span>
                <span className="text-emerald-400 font-bold">{item.win}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Community Live Chat */}
      {activeTab === "chat" && (
        <div className="flex flex-col h-48">
          <div className="flex-1 p-2 overflow-y-auto space-y-2 scrollbar-thin text-[11px]">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-1.5 rounded-xl ${
                  msg.isBigWin
                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-200 font-bold"
                    : "bg-[#181818] border border-white/5"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-jjwin-textMuted">
                  <span className="font-bold text-jjwin-primary">{msg.user}</span>
                  <span>{msg.time}</span>
                </div>
                <div className="text-slate-200 mt-0.5">{msg.text}</div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="p-2 bg-[#161616] border-t border-[#262626] flex items-center gap-2">
            <input
              type="text"
              placeholder="Type message..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="flex-1 bg-black/60 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-jjwin-primary"
            />
            <button
              type="submit"
              className="p-1.5 rounded-xl bg-jjwin-primary hover:bg-emerald-400 text-black transition"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
