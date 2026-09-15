"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, Volume2, VolumeX, HelpCircle, Trophy, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { wallet } from "@/lib/walletStore";
import { sounds } from "@/lib/soundEngine";
import { formatPKR } from "@/lib/utils";
import { SYMBOLS, SPECIAL_REEL_ITEMS, spinSlot, SlotSymbol, SpinResult } from "@/lib/games/slotEngine";
import { UserProfile } from "@/lib/types";

export default function SlotGamePage() {
  const [user, setUser] = useState<UserProfile>(wallet.getDefaultUser());
  const [isMuted, setIsMuted] = useState(false);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);

  const [reel1, setReel1] = useState<SlotSymbol>(SYMBOLS[0]);
  const [reel2, setReel2] = useState<SlotSymbol>(SYMBOLS[1]);
  const [reel3, setReel3] = useState<SlotSymbol>(SYMBOLS[2]);
  const [specialReel, setSpecialReel] = useState<typeof SPECIAL_REEL_ITEMS[0]>(SPECIAL_REEL_ITEMS[1]);

  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [winCelebration, setWinCelebration] = useState<{ active: boolean; amount: number; isJackpot: boolean }>({
    active: false,
    amount: 0,
    isJackpot: false,
  });

  useEffect(() => {
    setUser(wallet.getUser());
    setIsMuted(sounds.getMuted());
    const handleUpdate = () => setUser(wallet.getUser());
    window.addEventListener("jjwin_user_updated", handleUpdate);
    return () => window.removeEventListener("jjwin_user_updated", handleUpdate);
  }, []);

  const handleSpin = () => {
    if (isSpinning) return;

    if (user.balance < betAmount) {
      alert("Insufficient balance! Please deposit.");
      return;
    }

    const ok = wallet.placeBet(betAmount, "Crazy 777");
    if (!ok) return;

    setIsSpinning(true);
    setWinCelebration({ active: false, amount: 0, isJackpot: false });
    sounds.playCoin();

    const spinInterval = setInterval(() => {
      setReel1(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      setReel2(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      setReel3(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      setSpecialReel(SPECIAL_REEL_ITEMS[Math.floor(Math.random() * SPECIAL_REEL_ITEMS.length)]);
      sounds.playReelClick();
    }, 70);

    const outcome = spinSlot(betAmount);

    setTimeout(() => {
      clearInterval(spinInterval);
      setReel1(outcome.reels[0]);
      setReel2(outcome.reels[1]);
      setReel3(outcome.reels[2]);
      setSpecialReel(outcome.specialItem);
      setIsSpinning(false);
      setLastResult(outcome);

      if (outcome.isWin) {
        wallet.creditWin(outcome.winAmount, `Crazy 777 (${outcome.totalMultiplier}x)`);

        if (outcome.isJackpot || outcome.totalMultiplier >= 50) {
          sounds.playJackpot();
          setWinCelebration({
            active: true,
            amount: outcome.winAmount,
            isJackpot: true,
          });
          try {
            confetti({
              particleCount: 150,
              spread: 90,
              origin: { y: 0.5 },
            });
          } catch {}
        } else {
          sounds.playWin();
          setWinCelebration({
            active: true,
            amount: outcome.winAmount,
            isJackpot: false,
          });
        }
      }
    }, 1300);
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#0d0d0d] text-white pb-6 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />

      {/* Mobile Header */}
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
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 text-base tracking-tight leading-none drop-shadow-sm">CRAZY 777</span>
            <span className="text-[9px] font-bold text-gray-400 tracking-wider">JILI • RTP 96.5%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPaytable(!showPaytable)}
            className="text-[10px] bg-[#222] hover:bg-[#333] border border-[#444] px-2.5 py-1 rounded-full flex items-center gap-1 text-gray-300 transition-colors shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Rules</span>
          </button>

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
        {/* Jackpot Header Ribbon */}
        <div className="w-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 text-black font-black text-center py-2.5 px-3 rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.5)] tracking-widest uppercase flex items-center justify-center gap-2 border border-yellow-300">
          <Trophy className="w-4 h-4 fill-black shrink-0" />
          <span className="text-sm font-black drop-shadow-sm">JACKPOT: ₨ 5,420,890</span>
          <Trophy className="w-4 h-4 fill-black shrink-0" />
        </div>

        {/* Slot Cabinet Frame */}
        <div className="w-full bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#111] border-[3px] border-[#444] rounded-3xl p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden ring-1 ring-black">
          {/* Inner cabinet glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
          
          {/* Payline Laser */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.8)] pointer-events-none z-20 flex items-center justify-between px-1">
            <div className="w-2 h-3 bg-red-400 rounded-sm shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
            <div className="w-2 h-3 bg-red-400 rounded-sm shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
          </div>

          {/* Reels */}
          <div className="grid grid-cols-4 gap-2 my-3 relative z-10">
            {/* Reel 1 */}
            <div className="bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] border-2 border-[#333] rounded-xl h-28 flex flex-col items-center justify-center shadow-[inset_0_10px_20px_rgba(0,0,0,0.8)] relative overflow-hidden">
              <span
                className="text-4xl font-black font-mono tracking-tighter drop-shadow-lg transform transition-transform"
                style={{ color: reel1.color }}
              >
                {reel1.iconText}
              </span>
            </div>

            {/* Reel 2 */}
            <div className="bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] border-2 border-[#333] rounded-xl h-28 flex flex-col items-center justify-center shadow-[inset_0_10px_20px_rgba(0,0,0,0.8)] relative overflow-hidden">
              <span
                className="text-4xl font-black font-mono tracking-tighter drop-shadow-lg transform transition-transform"
                style={{ color: reel2.color }}
              >
                {reel2.iconText}
              </span>
            </div>

            {/* Reel 3 */}
            <div className="bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] border-2 border-[#333] rounded-xl h-28 flex flex-col items-center justify-center shadow-[inset_0_10px_20px_rgba(0,0,0,0.8)] relative overflow-hidden">
              <span
                className="text-4xl font-black font-mono tracking-tighter drop-shadow-lg transform transition-transform"
                style={{ color: reel3.color }}
              >
                {reel3.iconText}
              </span>
            </div>

            {/* Special 4th Multiplier Reel */}
            <div className="bg-gradient-to-b from-amber-950 via-[#2a1a0a] to-amber-950 border-2 border-amber-600/60 rounded-xl h-28 flex flex-col items-center justify-center shadow-[inset_0_10px_20px_rgba(0,0,0,0.8),0_0_15px_rgba(245,158,11,0.2)] relative overflow-hidden">
              <span className="text-3xl font-black font-mono text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]">
                {specialReel.text}
              </span>
              <span className="absolute bottom-1 text-[8px] bg-amber-400 text-black px-1.5 py-0.5 rounded font-black uppercase shadow-sm">
                BONUS
              </span>
            </div>
          </div>

          {/* Win Result Status */}
          <div className="bg-black/60 border border-[#333] rounded-xl py-2 px-4 flex items-center justify-between text-xs font-mono backdrop-blur-sm">
            <span className="text-gray-400 uppercase font-bold text-[10px] tracking-widest">Last Win</span>
            <span className={`text-base font-black ${lastResult?.isWin ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 'text-gray-500'}`}>
              {lastResult?.isWin ? `+${formatPKR(lastResult.winAmount)} (${lastResult.totalMultiplier}x)` : "₨ 0.00"}
            </span>
          </div>
        </div>

        {/* Win Celebration Alert */}
        {winCelebration.active && (
          <div className="w-full bg-gradient-to-r from-purple-900 via-pink-900 to-purple-900 border-2 border-pink-400 rounded-2xl p-3 text-center shadow-[0_0_30px_rgba(236,72,153,0.5)] animate-bounce relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/sparkles.svg')] opacity-30 mix-blend-screen" />
            <span className="text-xs font-black uppercase tracking-widest text-pink-300 drop-shadow-md">
              {winCelebration.isJackpot ? "🔥 MEGA JACKPOT! 🔥" : "🎉 BIG WIN! 🎉"}
            </span>
            <div className="text-3xl font-black font-mono text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] mt-1">
              +{formatPKR(winCelebration.amount)}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="w-full bg-gradient-to-b from-[#1f1f1f] to-[#151515] border border-[#333] rounded-2xl p-4 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-widest mb-0.5">
                Total Bet
              </span>
              <span className="text-lg font-black font-mono text-white">
                {formatPKR(betAmount)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {[50, 100, 250, 500].map((chip) => (
                <button
                  key={chip}
                  disabled={isSpinning}
                  onClick={() => {
                    sounds.playClick();
                    setBetAmount(chip);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all shadow-sm ${
                    betAmount === chip
                      ? "bg-gradient-to-b from-purple-500 to-purple-700 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                      : "bg-[#252525] text-gray-400 border-[#333] hover:bg-[#303030]"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={isSpinning}
            onClick={handleSpin}
            className={`w-full py-4 rounded-xl font-black text-base uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${
              isSpinning 
                ? "bg-gradient-to-b from-gray-700 to-gray-800 text-gray-400 border border-gray-600" 
                : "bg-gradient-to-b from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white border border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.4)]"
            }`}
          >
            <RotateCcw className={`w-5 h-5 ${isSpinning ? "animate-spin" : ""}`} />
            <span>{isSpinning ? "SPINNING..." : "SPIN NOW"}</span>
          </button>
        </div>

        {/* Paytable Rules */}
        {showPaytable && (
          <div className="w-full bg-[#181818] border border-[#333] rounded-2xl p-4 space-y-3 shadow-xl">
            <h4 className="text-xs font-black uppercase text-amber-400 border-b border-[#333] pb-2 tracking-widest">
              Paytable (3 matching symbols)
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              {SYMBOLS.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-[#222] border border-[#333]">
                  <span style={{ color: s.color }} className="font-bold text-sm drop-shadow-sm">{s.iconText}</span>
                  <span className="text-white font-black bg-black/50 px-2 py-0.5 rounded">{s.payout3}x</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
