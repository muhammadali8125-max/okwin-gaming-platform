"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wallet,
  Volume2,
  VolumeX,
  ShieldCheck,
  Hammer,
  Coins,
  Sparkles,
  Flame,
  Info,
  ChevronDown,
  Target,
} from "lucide-react";
import confetti from "canvas-confetti";
import { wallet } from "@/lib/walletStore";
import { sounds } from "@/lib/soundEngine";
import { formatPKR } from "@/lib/utils";
import {
  calculatePiggyHit,
  HAMMERS,
  HammerType,
  MAX_PIGGY_WIN_CAP,
} from "@/lib/games/piggyBankEngine";
import { UserProfile } from "@/lib/types";
import { ProvablyFairModal } from "@/components/common/ProvablyFairModal";

interface FloatingCoin {
  id: number;
  text: string;
  x: number;
  y: number;
}

export default function PiggyBankGamePage() {
  const [user, setUser] = useState<UserProfile>(wallet.getDefaultUser());
  const [isMuted, setIsMuted] = useState(false);
  const [isProvablyFairOpen, setIsProvablyFairOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Game configuration & bet state
  const [betAmount, setBetAmount] = useState<number>(200);
  const [hammer, setHammer] = useState<HammerType>("silver");
  const [autoCashout, setAutoCashout] = useState<boolean>(false);
  const [autoCashoutTarget, setAutoCashoutTarget] = useState<number>(2.0);

  // Active round state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [hitCount, setHitCount] = useState<number>(0);
  const [crackStage, setCrackStage] = useState<0 | 1 | 2 | 3>(0);
  const [isShattered, setIsShattered] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [wonAmount, setWonAmount] = useState<number>(0);

  // Visual effects
  const [isHammerSwinging, setIsHammerSwinging] = useState<boolean>(false);
  const [piggyShake, setPiggyShake] = useState<boolean>(false);
  const [floatingCoins, setFloatingCoins] = useState<FloatingCoin[]>([]);
  const [history, setHistory] = useState<Array<{ mult: number; isCrack: boolean }>>([
    { mult: 2.35, isCrack: false },
    { mult: 1.25, isCrack: true },
    { mult: 4.8, isCrack: false },
    { mult: 1.85, isCrack: false },
    { mult: 1.1, isCrack: true },
    { mult: 8.5, isCrack: false },
  ]);

  useEffect(() => {
    setUser(wallet.getUser());
    setIsMuted(sounds.getMuted());
    const handleUpdate = () => setUser(wallet.getUser());
    window.addEventListener("jjwin_user_updated", handleUpdate);
    return () => window.removeEventListener("jjwin_user_updated", handleUpdate);
  }, []);

  const currentPayout = Math.min(
    MAX_PIGGY_WIN_CAP,
    Math.round(betAmount * multiplier)
  );

  const startRound = () => {
    if (user.balance < betAmount) {
      alert("Insufficient balance! Please deposit to play.");
      return;
    }

    const ok = wallet.placeBet(betAmount, "Piggy Bank");
    if (!ok) return;

    sounds.playCoin();
    setMultiplier(1.0);
    setHitCount(0);
    setCrackStage(0);
    setIsShattered(false);
    setIsWon(false);
    setWonAmount(0);
    setFloatingCoins([]);
    setIsPlaying(true);
  };

  const handleSmash = () => {
    if (!isPlaying || isShattered || isWon) return;

    // Trigger visual hammer strike & shake
    setIsHammerSwinging(true);
    setPiggyShake(true);
    sounds.playHammer();
    setTimeout(() => setIsHammerSwinging(false), 200);
    setTimeout(() => setPiggyShake(false), 250);

    const nextHits = hitCount + 1;
    setHitCount(nextHits);

    // Calculate hit result from engine
    const result = calculatePiggyHit(betAmount, multiplier, hammer, nextHits);

    if (result.isCrack) {
      sounds.playCrash();
      setCrackStage(3);
      setIsShattered(true);
      setIsPlaying(false);
      setHistory((prev) => [{ mult: multiplier, isCrack: true }, ...prev.slice(0, 7)]);
    } else {
      sounds.playPiggyJingle();
      setMultiplier(result.newMultiplier);
      setCrackStage(result.crackStage);

      // Add floating text
      const newCoin: FloatingCoin = {
        id: Date.now() + Math.random(),
        text: `+${result.multiplierGain.toFixed(2)}x`,
        x: (Math.random() - 0.5) * 60,
        y: -10 - Math.random() * 20,
      };
      setFloatingCoins((prev) => [...prev.slice(-3), newCoin]);

      // Check auto-cashout
      if (autoCashout && result.newMultiplier >= autoCashoutTarget) {
        handleCashOut(result.newMultiplier);
      }
    }
  };

  const handleCashOut = (targetMult?: number) => {
    const finalMult = targetMult || multiplier;
    if (!isPlaying || finalMult <= 1.0) return;

    const payout = Math.min(MAX_PIGGY_WIN_CAP, Math.round(betAmount * finalMult));

    wallet.creditWin(payout, `Piggy Bank (${finalMult.toFixed(2)}x)`);
    sounds.playWin();

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#FFAA09", "#78E02C", "#ffffff", "#ffd700"],
      });
    } catch {}

    setIsWon(true);
    setWonAmount(payout);
    setIsPlaying(false);
    setHistory((prev) => [{ mult: finalMult, isCrack: false }, ...prev.slice(0, 7)]);
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#111111] text-white pb-6 select-none min-h-screen">
      {/* Okwin Standard Mobile Header */}
      <div className="bg-[#181818] border-b border-[#262626] px-3 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            onClick={() => sounds.playClick()}
            className="w-8 h-8 rounded-xl bg-[#242424] hover:bg-[#333333] flex items-center justify-center text-white transition border border-[#333333]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-[#FFAA09] text-sm tracking-tight">
              PIGGY BANK
            </span>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#EA4E3D]/30 text-[#EA4E3D] border border-[#EA4E3D]/40">
              SMASH!
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#1c1c1c] border border-[#333333] rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-inner">
            <Wallet className="w-3 h-3 text-[#FFAA09]" />
            <span suppressHydrationWarning className="font-mono font-bold text-xs text-white">
              {formatPKR(user.balance)}
            </span>
          </div>

          <button
            onClick={() => setIsProvablyFairOpen(true)}
            title="Provably Fair Cryptographic Verification"
            className="w-8 h-8 rounded-xl bg-[#242424] hover:bg-[#78E02C]/20 text-[#888888] hover:text-[#78E02C] flex items-center justify-center transition border border-[#333333]"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const muted = sounds.toggleMute();
              setIsMuted(muted);
            }}
            className="w-8 h-8 rounded-xl bg-[#242424] border border-[#333333] flex items-center justify-center text-[#888888] hover:text-white"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-[#EA4E3D]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#78E02C]" />
            )}
          </button>
        </div>
      </div>

      {/* Multiplier History Ribbon */}
      <div className="bg-[#141414] border-b border-[#262626] px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[9px] font-bold text-[#888888] uppercase shrink-0">
          History:
        </span>
        {history.map((h, i) => (
          <span
            key={i}
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black shrink-0 ${
              h.isCrack
                ? "bg-[#EA4E3D]/20 text-[#EA4E3D] border border-[#EA4E3D]/40 line-through"
                : h.mult >= 5.0
                ? "bg-[#FFAA09]/20 text-[#FFAA09] border border-[#FFAA09]/50 shadow-[0_0_8px_rgba(255,170,9,0.3)]"
                : "bg-[#78E02C]/15 text-[#78E02C] border border-[#78E02C]/30"
            }`}
          >
            {h.mult.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* Main Game Stage Area */}
      <div className="p-3 w-full flex-1 flex flex-col items-center justify-between space-y-3">
        {/* 3D Casino Arena Card */}
        <div className="relative w-full max-w-[420px] aspect-[4/3] bg-gradient-to-b from-[#1c1c1c] via-[#161616] to-[#0f0f0f] border-2 border-[#FFAA09]/30 rounded-3xl p-4 shadow-2xl flex flex-col items-center justify-between overflow-hidden">
          {/* Ambient Lighting */}
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#FFAA09]/15 to-transparent pointer-events-none" />

          {/* Current Multiplier Header */}
          <div className="w-full flex items-center justify-between z-10">
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-[#333333] px-2.5 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-[#FFAA09] animate-spin" />
              <span className="text-[10px] font-bold text-gray-300 uppercase">
                Hits: <strong className="text-white font-mono">{hitCount}</strong>
              </span>
            </div>

            <div className="text-center">
              <span className="text-3xl font-black font-mono tracking-tight text-[#FFAA09] drop-shadow-[0_0_12px_rgba(255,170,9,0.5)]">
                {multiplier.toFixed(2)}x
              </span>
              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">
                Current Multiplier
              </span>
            </div>

            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm border border-[#333333] px-2.5 py-1 rounded-full">
              <Flame className="w-3 h-3 text-[#EA4E3D]" />
              <span className="text-[10px] font-bold text-gray-300">
                {crackStage === 0 ? "Pristine" : crackStage === 1 ? "Hairline" : "Critical!"}
              </span>
            </div>
          </div>

          {/* Central 3D Golden Piggy Bank Display with Shake & Hammer Animation */}
          <div className="relative my-auto flex items-center justify-center">
            {/* Animated Hammer Indicator */}
            {isHammerSwinging && (
              <div className="absolute -top-12 -right-8 z-30 animate-bounce">
                <div className="w-16 h-16 bg-gradient-to-tr from-[#FFAA09] to-[#ffd700] rounded-2xl flex items-center justify-center shadow-lg border-2 border-white rotate-[-45deg] scale-110 transition-transform">
                  <Hammer className="w-10 h-10 text-black" />
                </div>
              </div>
            )}

            {/* Floating Multiplier Gain Badges */}
            {floatingCoins.map((coin) => (
              <div
                key={coin.id}
                style={{ transform: `translate(${coin.x}px, ${coin.y}px)` }}
                className="absolute top-4 z-40 bg-[#FFAA09] text-black font-black font-mono text-xs px-2.5 py-1 rounded-full shadow-lg border border-yellow-200 animate-fade-up pointer-events-none"
              >
                {coin.text}
              </div>
            ))}

            {/* Hyper-realistic 3D Golden Piggy Character Image on Circular Pedestal */}
            <div
              className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full transition-transform duration-100 flex items-center justify-center ${
                piggyShake ? "scale-105 rotate-2 brightness-125" : ""
              } ${isShattered ? "opacity-40 grayscale scale-90" : ""}`}
            >
              {/* Outer Glow Halo */}
              <div
                className={`absolute inset-0 rounded-full blur-2xl transition-opacity duration-300 ${
                  crackStage === 0
                    ? "bg-[#FFAA09]/20"
                    : crackStage === 1
                    ? "bg-[#FFAA09]/40"
                    : crackStage === 2
                    ? "bg-[#EA4E3D]/50 animate-pulse"
                    : "bg-transparent"
                }`}
              />

              {/* 3D Photorealistic Golden Piggy Image */}
              <img
                src="/images/piggy_character.jpg"
                alt="Golden Piggy Bank"
                className="w-full h-full object-cover rounded-full shadow-2xl border-2 border-[#FFAA09]/50"
              />

              {/* Crack Overlay Texture when damaged */}
              {crackStage >= 1 && !isShattered && (
                <div className="absolute inset-0 rounded-full border-2 border-[#EA4E3D]/60 pointer-events-none flex items-center justify-center bg-red-950/25">
                  <span className="text-[10px] font-black uppercase text-red-300 bg-black/80 px-2.5 py-1 rounded-full border border-red-500/50 animate-pulse">
                    ⚠️ {crackStage === 1 ? "Hairline Crack" : "Deep Fracture!"}
                  </span>
                </div>
              )}

              {/* Shatter Overlay */}
              {isShattered && (
                <div className="absolute inset-0 bg-red-950/85 rounded-full border-2 border-red-600 flex flex-col items-center justify-center p-3 text-center animate-shake">
                  <span className="text-4xl">💥</span>
                  <span className="font-black text-sm text-red-300 uppercase tracking-wider mt-1">
                    PIGGY SHATTERED!
                  </span>
                  <span className="text-[10px] text-gray-300 mt-0.5">
                    Cracked before cashout. Bet lost.
                  </span>
                </div>
              )}

              {/* Win Cashout Overlay */}
              {isWon && (
                <div className="absolute inset-0 bg-[#0f2413]/90 rounded-full border-2 border-[#78E02C] flex flex-col items-center justify-center p-3 text-center shadow-[0_0_20px_rgba(120,224,44,0.4)]">
                  <span className="text-4xl">🎉</span>
                  <span className="font-black text-sm text-[#78E02C] uppercase tracking-wider mt-1">
                    CASHED OUT!
                  </span>
                  <span className="text-lg font-black font-mono text-yellow-300">
                    +{formatPKR(wonAmount)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Live Potential Payout */}
          <div className="w-full bg-black/50 backdrop-blur-md rounded-xl p-2.5 flex items-center justify-between border border-white/10 z-10">
            <span className="text-[10px] font-bold text-gray-400 uppercase">
              Current Smash Value:
            </span>
            <span className="text-sm font-black font-mono text-[#FFAA09]">
              {formatPKR(currentPayout)}
            </span>
          </div>
        </div>

        {/* Action Controls Card */}
        <div className="w-full max-w-[420px] bg-[#181818] border border-[#262626] rounded-2xl p-3 space-y-2.5 shadow-lg">
          {/* Hammer Tool Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-[10px] font-bold text-gray-400 uppercase">
              <span className="flex items-center gap-1">
                <Hammer size={12} className="text-[#FFAA09]" />
                Select Hammer
              </span>
              <span className="text-[#FFAA09] font-mono">
                {HAMMERS[hammer].riskLabel}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(["bronze", "silver", "gold"] as HammerType[]).map((hId) => {
                const cfg = HAMMERS[hId];
                const isSelected = hammer === hId;
                return (
                  <button
                    key={hId}
                    disabled={isPlaying}
                    onClick={() => {
                      sounds.playClick();
                      setHammer(hId);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? "bg-[#FFAA09]/20 border-[#FFAA09] shadow-sm"
                        : "bg-[#212121] border-[#333333] hover:border-gray-500 disabled:opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-white truncate">
                        {hId === "bronze" ? "🥉 Bronze" : hId === "silver" ? "🥈 Silver" : "🥇 Gold"}
                      </span>
                    </div>
                    <div className="text-[9px] text-gray-400 font-mono mt-0.5">
                      +{cfg.minGain}x ~ {cfg.maxGain}x
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bet Amount Selector */}
          <div>
            <div className="flex items-center justify-between mb-1 text-[10px] font-bold text-gray-400 uppercase">
              <span>Bet Amount</span>
              <span className="text-gray-400 font-mono">Min ₨ 50</span>
            </div>

            <div className="bg-[#121212] border border-[#333333] rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-[#888888] font-mono font-bold">₨</span>
              <input
                type="number"
                disabled={isPlaying}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(50, Number(e.target.value)))}
                className="w-full bg-transparent text-right font-mono font-bold text-sm text-white focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Quick Chips */}
            <div className="grid grid-cols-5 gap-1.5 mt-1.5">
              {[50, 100, 200, 500, 1000].map((chip) => (
                <button
                  key={chip}
                  disabled={isPlaying}
                  onClick={() => {
                    sounds.playClick();
                    setBetAmount(chip);
                  }}
                  className={`py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                    betAmount === chip
                      ? "bg-[#78E02C]/20 border-[#78E02C] text-[#78E02C]"
                      : "bg-[#212121] border-[#333333] text-gray-300 hover:border-gray-500"
                  }`}
                >
                  +{chip}
                </button>
              ))}
            </div>
          </div>

          {/* Auto Cashout Config */}
          <div className="flex items-center justify-between bg-[#141414] border border-[#262626] rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoCash"
                disabled={isPlaying}
                checked={autoCashout}
                onChange={(e) => setAutoCashout(e.target.checked)}
                className="rounded bg-[#212121] text-[#78E02C] accent-[#78E02C] cursor-pointer"
              />
              <label htmlFor="autoCash" className="text-[10px] font-bold text-gray-300 cursor-pointer flex items-center gap-1">
                <Target className="w-3 h-3 text-[#78E02C]" />
                Auto Cash Out
              </label>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                min="1.1"
                max="50"
                disabled={isPlaying || !autoCashout}
                value={autoCashoutTarget}
                onChange={(e) => setAutoCashoutTarget(parseFloat(e.target.value) || 2.0)}
                className="w-16 bg-[#212121] border border-[#333333] rounded-lg px-2 py-1 text-right font-mono font-bold text-xs text-[#78E02C] focus:outline-none disabled:opacity-40"
              />
              <span className="text-xs text-gray-500 font-mono">x</span>
            </div>
          </div>

          {/* Main Action Trigger Buttons */}
          <div className="pt-1">
            {isPlaying ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSmash}
                  className="w-full py-3.5 bg-gradient-to-r from-[#FFAA09] to-[#d98200] hover:from-[#ffba33] hover:to-[#FFAA09] text-black rounded-xl font-black text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(255,170,9,0.35)] flex items-center justify-center gap-2 active:scale-95 transition"
                >
                  <Hammer size={18} />
                  <span>SMASH!</span>
                </button>

                <button
                  disabled={multiplier <= 1.0}
                  onClick={() => handleCashOut()}
                  className="w-full py-3.5 bg-gradient-to-r from-[#78E02C] to-[#5cb320] hover:from-[#8af736] hover:to-[#78E02C] disabled:opacity-40 text-black rounded-xl font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(120,224,44,0.35)] flex flex-col items-center justify-center animate-pulse transition"
                >
                  <span>CASH OUT</span>
                  <span className="font-mono text-[10px] font-bold leading-none">
                    {formatPKR(currentPayout)}
                  </span>
                </button>
              </div>
            ) : (
              <button
                onClick={startRound}
                className="w-full py-4 jjwin-btn rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition shadow-[0_0_20px_rgba(120,224,44,0.35)]"
              >
                <Coins size={20} />
                <span>Start Smash ({formatPKR(betAmount)})</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Info Panel */}
        <div className="w-full max-w-[420px]">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#181818] border border-[#262626] rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-wider hover:border-[#333333] transition"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#FFAA09]" />
              Game Rules & Multipliers
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showInfo ? "rotate-180" : ""}`}
            />
          </button>

          {showInfo && (
            <div className="mt-1.5 bg-[#141414] border border-[#262626] rounded-xl p-3 space-y-2 text-xs text-gray-300">
              <p>• Pick your hammer: Bronze (low risk), Silver (balanced), or Gold (high volatility).</p>
              <p>• Smash the Golden Gullak to increment your multiplier on each successful strike.</p>
              <p>• Cash out before the piggy shatters to lock in your profit!</p>
              <p>• Max single win cap: <strong className="text-[#FFAA09]">₨ 50,000</strong>. RTP: <strong className="text-[#78E02C]">96.5%</strong>.</p>
            </div>
          )}
        </div>
      </div>

      <ProvablyFairModal
        isOpen={isProvablyFairOpen}
        onClose={() => setIsProvablyFairOpen(false)}
        gameType="piggy-bank"
      />
    </div>
  );
}
