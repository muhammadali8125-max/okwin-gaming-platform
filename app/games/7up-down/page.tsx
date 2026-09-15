"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, Volume2, VolumeX, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { wallet } from "@/lib/walletStore";
import { sounds } from "@/lib/soundEngine";
import { formatPKR } from "@/lib/utils";
import { UserProfile } from "@/lib/types";

type BetZone = "down" | "seven" | "up";
const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export default function SevenUpDownPage() {
  const [user, setUser] = useState<UserProfile>(wallet.getDefaultUser());
  const [isMuted, setIsMuted] = useState(false);
  const [selectedZone, setSelectedZone] = useState<BetZone>("up");
  const [betAmount, setBetAmount] = useState<number>(200);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  const [die1, setDie1] = useState<number>(3);
  const [die2, setDie2] = useState<number>(4);
  const [lastTotal, setLastTotal] = useState<number>(7);
  const [winStatus, setWinStatus] = useState<string | null>(null);

  useEffect(() => {
    setUser(wallet.getUser());
    setIsMuted(sounds.getMuted());
    const handleUpdate = () => setUser(wallet.getUser());
    window.addEventListener("jjwin_user_updated", handleUpdate);
    return () => window.removeEventListener("jjwin_user_updated", handleUpdate);
  }, []);

  const handleRoll = () => {
    if (isRolling) return;
    if (user.balance < betAmount) {
      alert("Insufficient balance! Please deposit.");
      return;
    }

    const ok = wallet.placeBet(betAmount, "7 Up Down");
    if (!ok) return;

    setIsRolling(true);
    setWinStatus(null);
    sounds.playCoin();

    const rollInterval = setInterval(() => {
      setDie1(Math.floor(Math.random() * 6) + 1);
      setDie2(Math.floor(Math.random() * 6) + 1);
      sounds.playReelClick();
    }, 80);

    setTimeout(() => {
      clearInterval(rollInterval);
      const final1 = Math.floor(Math.random() * 6) + 1;
      const final2 = Math.floor(Math.random() * 6) + 1;
      const total = final1 + final2;

      setDie1(final1);
      setDie2(final2);
      setLastTotal(total);
      setIsRolling(false);

      let isWin = false;
      let multiplier = 0;

      if (selectedZone === "down" && total < 7) {
        isWin = true;
        multiplier = 2;
      } else if (selectedZone === "seven" && total === 7) {
        isWin = true;
        multiplier = 5;
      } else if (selectedZone === "up" && total > 7) {
        isWin = true;
        multiplier = 2;
      }

      if (isWin) {
        const winAmount = betAmount * multiplier;
        wallet.creditWin(winAmount, `7 Up Down (${multiplier}x)`);
        sounds.playWin();
        setWinStatus(`🎉 WON ${formatPKR(winAmount)}! (${multiplier}x)`);
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch {}
      } else {
        sounds.playCrash();
        setWinStatus(`Dice rolled ${total}. Better luck next!`);
      }
    }, 1100);
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#0d0d0d] text-white pb-6 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />

      {/* Mobile Top Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#121212] border-b border-[#2a2a2a] px-3 py-2.5 flex items-center justify-between shadow-md relative z-10">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            onClick={() => sounds.playClick()}
            className="w-8 h-8 rounded-full bg-[#242424] hover:bg-[#333] flex items-center justify-center text-white transition-all shadow-inner"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 text-base tracking-tight leading-none drop-shadow-sm">7 UP DOWN</span>
            <span className="text-[9px] font-bold text-gray-400 tracking-wider">Kingmaker • Table Game</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-amber-900/40 to-yellow-900/20 border border-yellow-600/30 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm">
            <Wallet className="w-3.5 h-3.5 text-yellow-500" />
            <span suppressHydrationWarning className="font-mono font-bold text-xs text-yellow-100">
              {formatPKR(user.balance)}
            </span>
          </div>

          <button
            onClick={() => {
              const muted = sounds.toggleMute();
              setIsMuted(muted);
            }}
            className="w-8 h-8 rounded-full bg-[#242424] hover:bg-[#333] flex items-center justify-center text-gray-400 transition-all shadow-inner"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-3 w-full space-y-4 flex-1 flex flex-col justify-center relative z-10">
        {/* Dice Table */}
        <div className="w-full bg-gradient-to-b from-[#1a2f1a] to-[#0f1a0f] border-2 border-emerald-600/50 rounded-3xl p-5 shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center relative overflow-hidden ring-1 ring-white/5">
          {/* Table felt texture overlay */}
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

          <div className="flex items-center justify-center gap-6 my-4 relative z-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-white to-gray-200 text-red-600 rounded-2xl flex items-center justify-center text-6xl sm:text-7xl shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_-4px_8px_rgba(0,0,0,0.2)] border-2 border-gray-300 select-none transform -rotate-3 transition-transform">
              {DICE_FACES[die1 - 1]}
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">+</div>
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-white to-gray-200 text-red-600 rounded-2xl flex items-center justify-center text-6xl sm:text-7xl shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_-4px_8px_rgba(0,0,0,0.2)] border-2 border-gray-300 select-none transform rotate-6 transition-transform">
              {DICE_FACES[die2 - 1]}
            </div>
          </div>

          <div className="text-[12px] font-mono uppercase tracking-widest text-emerald-300 font-bold bg-black/40 px-4 py-1.5 rounded-full border border-emerald-500/30 backdrop-blur-sm relative z-10">
            Total Score: <span className="text-xl font-black text-white ml-1.5 drop-shadow-md">{lastTotal}</span>
          </div>
        </div>

        {/* Win / Loss Notice */}
        {winStatus && (
          <div className={`w-full border rounded-xl p-3 text-center text-sm font-bold shadow-lg animate-pulse ${
            winStatus.includes("WON") 
              ? "bg-gradient-to-r from-emerald-900 to-emerald-950 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              : "bg-gradient-to-r from-red-900 to-red-950 border-red-500 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
          }`}>
            {winStatus}
          </div>
        )}

        {/* Betting Zones */}
        <div className="w-full grid grid-cols-3 gap-2.5">
          {/* 7 Down */}
          <button
            disabled={isRolling}
            onClick={() => {
              sounds.playClick();
              setSelectedZone("down");
            }}
            className={`p-3 rounded-2xl border-2 flex flex-col items-center transition-all ${
              selectedZone === "down"
                ? "bg-gradient-to-b from-blue-900 to-blue-950 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-105"
                : "bg-gradient-to-b from-[#1f1f1f] to-[#151515] border-[#333] text-gray-400 hover:border-gray-500"
            }`}
          >
            <span className={`text-[10px] uppercase font-bold tracking-widest ${selectedZone === "down" ? "text-blue-200" : "text-blue-400"}`}>2 - 6</span>
            <span className={`text-base font-black mt-1 ${selectedZone === "down" ? "text-white" : "text-gray-300"}`}>DOWN</span>
            <span className="text-[10px] font-mono bg-black/50 px-2 py-0.5 rounded text-blue-300 font-bold mt-1.5">2.0X</span>
          </button>

          {/* Lucky 7 */}
          <button
            disabled={isRolling}
            onClick={() => {
              sounds.playClick();
              setSelectedZone("seven");
            }}
            className={`p-3 rounded-2xl border-2 flex flex-col items-center transition-all ${
              selectedZone === "seven"
                ? "bg-gradient-to-b from-amber-600 to-amber-800 border-yellow-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105"
                : "bg-gradient-to-b from-[#1f1f1f] to-[#151515] border-[#333] text-gray-400 hover:border-gray-500"
            }`}
          >
            <span className={`text-[10px] uppercase font-bold tracking-widest ${selectedZone === "seven" ? "text-yellow-200" : "text-amber-400"}`}>EXACT</span>
            <span className={`text-base font-black mt-1 ${selectedZone === "seven" ? "text-white" : "text-gray-300"}`}>LUCKY 7</span>
            <span className="text-[10px] font-mono bg-black/50 px-2 py-0.5 rounded text-yellow-300 font-bold mt-1.5">5.0X</span>
          </button>

          {/* 7 Up */}
          <button
            disabled={isRolling}
            onClick={() => {
              sounds.playClick();
              setSelectedZone("up");
            }}
            className={`p-3 rounded-2xl border-2 flex flex-col items-center transition-all ${
              selectedZone === "up"
                ? "bg-gradient-to-b from-red-600 to-red-800 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-105"
                : "bg-gradient-to-b from-[#1f1f1f] to-[#151515] border-[#333] text-gray-400 hover:border-gray-500"
            }`}
          >
            <span className={`text-[10px] uppercase font-bold tracking-widest ${selectedZone === "up" ? "text-red-200" : "text-red-400"}`}>8 - 12</span>
            <span className={`text-base font-black mt-1 ${selectedZone === "up" ? "text-white" : "text-gray-300"}`}>7 UP</span>
            <span className="text-[10px] font-mono bg-black/50 px-2 py-0.5 rounded text-red-300 font-bold mt-1.5">2.0X</span>
          </button>
        </div>

        {/* Bet Chips & Roll Button */}
        <div className="w-full bg-gradient-to-b from-[#1f1f1f] to-[#151515] border border-[#333] rounded-2xl p-4 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-gray-400 tracking-widest">
              Bet: <span className="text-white font-mono text-sm ml-1 bg-[#111] px-2 py-1 rounded border border-[#333]">{formatPKR(betAmount)}</span>
            </span>
            <div className="flex items-center gap-1.5">
              {[100, 200, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  disabled={isRolling}
                  onClick={() => {
                    sounds.playClick();
                    setBetAmount(amt);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all shadow-sm ${
                    betAmount === amt
                      ? "bg-gradient-to-b from-blue-500 to-blue-700 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                      : "bg-[#252525] text-gray-400 border-[#333] hover:bg-[#303030]"
                  }`}
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={isRolling}
            onClick={handleRoll}
            className={`w-full py-4 rounded-xl font-black text-base uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${
              isRolling 
                ? "bg-gradient-to-b from-gray-700 to-gray-800 text-gray-400 border border-gray-600" 
                : "bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white border border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            }`}
          >
            <RotateCcw className={`w-5 h-5 ${isRolling ? "animate-spin" : ""}`} />
            <span>{isRolling ? "ROLLING..." : "ROLL DICE"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
