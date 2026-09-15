"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, Volume2, VolumeX, History, Users, ShieldCheck } from "lucide-react";
import { wallet } from "@/lib/walletStore";
import { sounds } from "@/lib/soundEngine";
import { formatPKR } from "@/lib/utils";
import { generateCrashPoint, generateSimulatedPlayers, LivePlayerBet } from "@/lib/games/aviatorEngine";
import { UserProfile } from "@/lib/types";
import { ProvablyFairModal } from "@/components/common/ProvablyFairModal";
import { AviatorMultiplayerFeed } from "@/components/games/AviatorMultiplayerFeed";

export default function AviatorGamePage() {
  const [user, setUser] = useState<UserProfile>(wallet.getDefaultUser());
  const [isMuted, setIsMuted] = useState(false);
  const [isProvablyFairOpen, setIsProvablyFairOpen] = useState(false);

  // Round states: "waiting" | "flying" | "crashed"
  const [gameState, setGameState] = useState<"waiting" | "flying" | "crashed">("waiting");
  const [countdown, setCountdown] = useState<number>(5);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [history, setHistory] = useState<number[]>([1.42, 3.85, 1.15, 12.4, 2.05, 1.02, 6.78, 18.2]);

  // Active Bet Panel Tab on Mobile: 1 or 2
  const [activeTab, setActiveTab] = useState<1 | 2>(1);

  // Dual Bets State
  const [bet1, setBet1] = useState<number>(200);
  const [hasBet1, setHasBet1] = useState<boolean>(false);
  const [cashedOut1, setCashedOut1] = useState<boolean>(false);
  const [autoCashout1, setAutoCashout1] = useState<boolean>(false);
  const [autoTarget1, setAutoTarget1] = useState<number>(2.0);

  const [bet2, setBet2] = useState<number>(500);
  const [hasBet2, setHasBet2] = useState<boolean>(false);
  const [cashedOut2, setCashedOut2] = useState<boolean>(false);
  const [autoCashout2, setAutoCashout2] = useState<boolean>(false);
  const [autoTarget2, setAutoTarget2] = useState<number>(3.0);

  const [players, setPlayers] = useState<LivePlayerBet[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const planeImageRef = useRef<HTMLImageElement | null>(null);
  const crashPointRef = useRef<number>(2.0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const img = new Image();
    img.src = "/images/plane.jpg";
    img.onload = () => {
      planeImageRef.current = img;
    };
  }, []);

  useEffect(() => {
    setUser(wallet.getUser());
    setIsMuted(sounds.getMuted());
    const handleUpdate = () => setUser(wallet.getUser());
    window.addEventListener("jjwin_user_updated", handleUpdate);
    return () => window.removeEventListener("jjwin_user_updated", handleUpdate);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === "waiting") {
      setPlayers(generateSimulatedPlayers());
      let count = 5;
      setCountdown(count);

      timer = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(timer);
          startRound();
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameState]);

  const startRound = () => {
    crashPointRef.current = generateCrashPoint();
    setGameState("flying");
    setCurrentMultiplier(1.0);
    setCashedOut1(false);
    setCashedOut2(false);
    startTimeRef.current = Date.now();
    sounds.playTakeoff();
  };

  useEffect(() => {
    if (gameState !== "flying") return;

    let isRunning = true;
    const tick = () => {
      if (!isRunning) return;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const current = Math.round(Math.exp(0.08 * elapsed) * 100) / 100;
      setCurrentMultiplier(current);

      if (hasBet1 && !cashedOut1 && autoCashout1 && current >= autoTarget1) {
        cashOut(1, current);
      }
      if (hasBet2 && !cashedOut2 && autoCashout2 && current >= autoTarget2) {
        cashOut(2, current);
      }

      setPlayers((prev) =>
        prev.map((p) => {
          if (!p.cashoutMultiplier && Math.random() < 0.04 && current > 1.2) {
            return {
              ...p,
              cashoutMultiplier: current,
              winAmount: Math.round(p.betAmount * current),
            };
          }
          return p;
        })
      );

      if (current >= crashPointRef.current) {
        handleCrash(crashPointRef.current);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      isRunning = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState, hasBet1, cashedOut1, autoCashout1, autoTarget1, hasBet2, cashedOut2, autoCashout2, autoTarget2]);

  const handleCrash = (finalMultiplier: number) => {
    setGameState("crashed");
    setCurrentMultiplier(finalMultiplier);
    sounds.playCrash();
    setHistory((prev) => [finalMultiplier, ...prev.slice(0, 11)]);
    setHasBet1(false);
    setHasBet2(false);

    setTimeout(() => {
      setGameState("waiting");
    }, 2800);
  };

  const placeBet = (panel: 1 | 2) => {
    const betAmount = panel === 1 ? bet1 : bet2;
    if (user.balance < betAmount) {
      alert("Insufficient balance! Please deposit.");
      return;
    }
    const ok = wallet.placeBet(betAmount, "Aviator");
    if (ok) {
      sounds.playCoin();
      if (panel === 1) setHasBet1(true);
      if (panel === 2) setHasBet2(true);
    }
  };

  const cashOut = (panel: 1 | 2, multiplier: number) => {
    const betAmount = panel === 1 ? bet1 : bet2;
    const MAX_WIN_CAP = 50000; // Operator bankroll protection cap
    const win = Math.min(MAX_WIN_CAP, Math.round(betAmount * multiplier));
    wallet.creditWin(win, `Aviator (${multiplier}x)`);
    sounds.playWin();

    if (panel === 1) {
      setCashedOut1(true);
      setHasBet1(false);
    } else {
      setCashedOut2(true);
      setHasBet2(false);
    }
  };

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 230);

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 35) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (gameState === "waiting") {
      const pulse = (Math.sin(Date.now() / 250) + 1) * 0.5;
      ctx.fillStyle = `rgba(234, 78, 61, ${0.03 + pulse * 0.05})`;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 60 + pulse * 15, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const progress = Math.min(1, (currentMultiplier - 1) / Math.max(2, crashPointRef.current - 1));
    const startX = 25;
    const startY = height - 25;
    const endX = startX + (width - 80) * progress;
    const endY = startY - (height - 70) * Math.pow(progress, 0.85);

    const gradient = ctx.createLinearGradient(0, endY, 0, height);
    gradient.addColorStop(0, "rgba(234, 78, 61, 0.4)");
    gradient.addColorStop(1, "rgba(234, 78, 61, 0.0)");

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(startX + (endX - startX) * 0.5, startY, endX, endY);
    ctx.lineTo(endX, startY);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowColor = "#EA4E3D";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(startX + (endX - startX) * 0.5, startY, endX, endY);
    ctx.strokeStyle = gameState === "crashed" ? "#555555" : "#EA4E3D";
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (gameState === "flying") {
      ctx.save();
      ctx.translate(endX, endY);
      ctx.rotate(-0.25);

      const planeImg = planeImageRef.current;
      if (planeImg && planeImg.complete) {
        const pSize = 68;
        ctx.drawImage(planeImg, -pSize / 2, -pSize / 2, pSize, pSize);
      } else {
        ctx.fillStyle = "#EA4E3D";
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(-14, -8);
        ctx.lineTo(-8, 0);
        ctx.lineTo(-14, 8);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }, [gameState, currentMultiplier]);

  const activeBetAmount = activeTab === 1 ? bet1 : bet2;
  const setCurBet = (amt: number) => (activeTab === 1 ? setBet1(amt) : setBet2(amt));
  const hasCurBet = activeTab === 1 ? hasBet1 : hasBet2;
  const cashedOutCur = activeTab === 1 ? cashedOut1 : cashedOut2;
  const autoCashoutCur = activeTab === 1 ? autoCashout1 : autoCashout2;
  const setAutoCashoutCur = (val: boolean) =>
    activeTab === 1 ? setAutoCashout1(val) : setAutoCashout2(val);
  const autoTargetCur = activeTab === 1 ? autoTarget1 : autoTarget2;
  const setAutoTargetCur = (val: number) =>
    activeTab === 1 ? setAutoTarget1(val) : setAutoTarget2(val);

  return (
    <div className="w-full flex-1 flex flex-col bg-[#0d0d0d] text-white pb-4 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-red-900/10 to-transparent pointer-events-none" />

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
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 text-base tracking-tight leading-none drop-shadow-sm">AVIATOR</span>
            <span className="text-[9px] font-bold text-gray-400 tracking-wider">Spribe • RTP 97%</span>
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
            onClick={() => setIsProvablyFairOpen(true)}
            title="Provably Fair Cryptographic Verification"
            className="w-8 h-8 rounded-full bg-[#242424] hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 flex items-center justify-center transition-all border border-white/5 shadow-inner"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

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

      {/* Round History Multiplier Bar */}
      <div className="bg-[#121212] border-b border-[#222] px-2 py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5 relative z-10 shadow-inner">
        <History className="w-3.5 h-3.5 text-gray-500 shrink-0 mr-1" />
        {history.map((val, idx) => {
          let colorClass = "bg-[#1a2332] text-blue-400 border-blue-500/30";
          if (val >= 2.0 && val < 10.0) {
            colorClass = "bg-[#2a1b38] text-purple-400 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.2)]";
          } else if (val >= 10.0) {
            colorClass = "bg-gradient-to-r from-amber-900/50 to-orange-900/50 text-amber-300 border-amber-500/50 font-black shadow-[0_0_10px_rgba(245,158,11,0.3)]";
          }
          return (
            <span
              key={idx}
              className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${colorClass} shrink-0 font-bold transition-all hover:scale-105`}
            >
              {val.toFixed(2)}x
            </span>
          );
        })}
      </div>

      {/* Main Game Screen */}
      <div className="p-3 space-y-3 flex-1 flex flex-col z-10">
        {/* Canvas Flight Viewport */}
        <div className="relative w-full h-56 sm:h-64 bg-gradient-to-b from-[#1a1a1a] via-[#0f0f0f] to-[#050505] border border-[#333] rounded-2xl overflow-hidden flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

          <div className="z-10 text-center pointer-events-none select-none">
            {gameState === "waiting" && (
              <div className="space-y-2">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-red-500/80 drop-shadow-md">
                  NEXT ROUND IN
                </div>
                <div className="text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-lg">
                  {countdown}s
                </div>
                <div className="w-32 h-2 bg-[#252525] rounded-full mx-auto overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                    style={{ width: `${(countdown / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {gameState === "flying" && (
              <div className="text-6xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                {currentMultiplier.toFixed(2)}
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-orange-400 text-4xl ml-1">x</span>
              </div>
            )}

            {gameState === "crashed" && (
              <div className="space-y-1 scale-110 transition-transform duration-300">
                <div className="text-sm font-black uppercase tracking-widest text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                  FLEW AWAY!
                </div>
                <div className="text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-800 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                  {currentMultiplier.toFixed(2)}x
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bet Panel Tabs (Bet 1 & Bet 2) */}
        <div className="bg-gradient-to-b from-[#1f1f1f] to-[#151515] border border-[#333] rounded-2xl p-3 space-y-3 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between border-b border-[#333] pb-2 relative z-10">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab(1);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all shadow-sm ${
                  activeTab === 1
                    ? "bg-gradient-to-b from-[#333] to-[#222] text-white border border-[#444] shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                    : "bg-[#1a1a1a] text-gray-500 border border-transparent hover:text-gray-300"
                }`}
              >
                Bet 1 {hasBet1 && <span className="text-red-500 ml-1">●</span>}
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab(2);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all shadow-sm ${
                  activeTab === 2
                    ? "bg-gradient-to-b from-[#333] to-[#222] text-white border border-[#444] shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                    : "bg-[#1a1a1a] text-gray-500 border border-transparent hover:text-gray-300"
                }`}
              >
                Bet 2 {hasBet2 && <span className="text-red-500 ml-1">●</span>}
              </button>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-gray-400 text-[11px] font-bold hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={autoCashoutCur}
                onChange={(e) => setAutoCashoutCur(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-[#222] border-[#444] text-red-500 focus:ring-red-500 focus:ring-offset-[#1a1a1a]"
              />
              <span>Auto Cashout</span>
            </label>
          </div>

          {/* Amount input & auto-multiplier */}
          <div className="flex items-center gap-2 relative z-10">
            <div className="flex-1 bg-[#111] border border-[#333] focus-within:border-red-500/50 focus-within:shadow-[0_0_10px_rgba(239,68,68,0.2)] transition-all rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-mono">₨</span>
              <input
                type="number"
                disabled={hasCurBet}
                value={activeBetAmount}
                onChange={(e) => setCurBet(Math.max(50, Number(e.target.value)))}
                className="w-full bg-transparent text-right font-mono font-bold text-base text-white focus:outline-none placeholder-gray-700"
              />
            </div>

            {autoCashoutCur && (
              <div className="w-24 bg-[#111] border border-[#333] focus-within:border-red-500/50 transition-all rounded-xl px-2 py-2 flex items-center justify-between">
                <input
                  type="number"
                  step="0.1"
                  value={autoTargetCur}
                  onChange={(e) => setAutoTargetCur(Math.max(1.1, Number(e.target.value)))}
                  className="w-full bg-transparent text-right font-mono font-bold text-sm text-red-400 focus:outline-none"
                />
                <span className="text-xs text-gray-500 ml-1">x</span>
              </div>
            )}
          </div>

          {/* Chips */}
          <div className="grid grid-cols-4 gap-2 relative z-10">
            {[100, 200, 500, 1000].map((chip) => (
              <button
                key={chip}
                disabled={hasCurBet}
                onClick={() => {
                  sounds.playClick();
                  setCurBet(chip);
                }}
                className="py-1.5 bg-[#2a2a2a] hover:bg-[#383838] border border-[#444] rounded-lg text-[11px] font-mono font-bold text-gray-300 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                +{chip}
              </button>
            ))}
          </div>

          {/* Primary Action Button */}
          <div className="pt-1 relative z-10">
          {hasCurBet ? (
            gameState === "flying" && !cashedOutCur ? (
              <button
                onClick={() => cashOut(activeTab, currentMultiplier)}
                className="w-full py-4 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black border border-amber-300 rounded-xl font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all active:scale-[0.98]"
              >
                Cash Out {formatPKR(Math.round(activeBetAmount * currentMultiplier))}
              </button>
            ) : cashedOutCur ? (
              <div className="w-full py-4 bg-gradient-to-b from-emerald-800 to-emerald-950 border border-emerald-500/50 rounded-xl font-black text-sm text-emerald-400 text-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                CASHED OUT!
              </div>
            ) : (
              <div className="w-full py-4 bg-gradient-to-b from-red-900 to-red-950 border border-red-500/50 rounded-xl font-black text-sm text-red-400 text-center shadow-[0_0_15px_rgba(239,68,68,0.2)] flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                WAITING FOR FLIGHT
              </div>
            )
          ) : (
            <button
              disabled={gameState === "flying"}
              onClick={() => placeBet(activeTab)}
              className="w-full py-4 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 disabled:border-gray-600 disabled:shadow-none text-white border border-red-400 rounded-xl font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all active:scale-[0.98]"
            >
              PLACE BET {formatPKR(activeBetAmount)}
            </button>
          )}
          </div>
        </div>

        {/* Live Multiplayer Bets & Community Feed */}
        <AviatorMultiplayerFeed
          currentMultiplier={currentMultiplier}
          gameState={gameState}
        />
      </div>

      <ProvablyFairModal
        isOpen={isProvablyFairOpen}
        onClose={() => setIsProvablyFairOpen(false)}
        gameType="aviator"
      />
    </div>
  );
}
