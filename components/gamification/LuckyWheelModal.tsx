"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { X, Sparkles, Trophy, Clock, Flame, ShieldAlert, AlertTriangle, ShieldCheck } from "lucide-react";
import { wallet } from "@/lib/walletStore";
import { sounds } from "@/lib/soundEngine";
import { formatPKR } from "@/lib/utils";

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WheelSector {
  label: string;
  type: "cash" | "vip" | "bonus";
  value: number;
  color: string;
  textColor: string;
}

const SECTORS: WheelSector[] = [
  { label: "₨ 100", type: "cash", value: 100, color: "#e11d48", textColor: "#ffffff" },
  { label: "₨ 50", type: "cash", value: 50, color: "#10b981", textColor: "#000000" },
  { label: "₨ 500", type: "cash", value: 500, color: "#f59e0b", textColor: "#000000" },
  { label: "200 VIP", type: "vip", value: 200, color: "#8b5cf6", textColor: "#ffffff" },
  { label: "₨ 200", type: "cash", value: 200, color: "#06b6d4", textColor: "#000000" },
  { label: "₨ 888", type: "cash", value: 888, color: "#ec4899", textColor: "#ffffff" },
  { label: "₨ 1,888", type: "cash", value: 1888, color: "#eab308", textColor: "#000000" },
  { label: "₨ 300", type: "cash", value: 300, color: "#3b82f6", textColor: "#ffffff" },
];

const STORAGE_KEY_LAST_SPIN = "okwin_last_lucky_spin_v1";

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({ isOpen, onClose }) => {
  const [spinning, setSpinning] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [wonPrize, setWonPrize] = useState<WheelSector | null>(null);
  const [canSpin, setCanSpin] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [rolloverNotice, setRolloverNotice] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check cooldown
  useEffect(() => {
    const checkCooldown = () => {
      const lastSpin = localStorage.getItem(STORAGE_KEY_LAST_SPIN);
      if (!lastSpin) {
        setCanSpin(true);
        return;
      }

      const diff = Date.now() - parseInt(lastSpin, 10);
      const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours
      if (diff < cooldownMs) {
        setCanSpin(false);
        const remMs = cooldownMs - diff;
        const hrs = Math.floor(remMs / 3600000);
        const mins = Math.floor((remMs % 3600000) / 60000);
        setTimeLeft(`${hrs}h ${mins}m`);
      } else {
        setCanSpin(true);
      }
    };

    if (isOpen) {
      checkCooldown();
      setErrorMsg("");
      drawWheel();
    }
  }, [isOpen]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;
    const numSectors = SECTORS.length;
    const arc = (2 * Math.PI) / numSectors;

    ctx.clearRect(0, 0, size, size);

    // Outer golden rim
    ctx.beginPath();
    ctx.arc(center, center, radius + 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#1e293b";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#eab308";
    ctx.stroke();

    // Draw sectors
    SECTORS.forEach((sector, i) => {
      const angle = i * arc;
      ctx.beginPath();
      ctx.fillStyle = sector.color;
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arc);
      ctx.lineTo(center, center);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#0f172a";
      ctx.stroke();

      // Text label
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = sector.textColor;
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(sector.label, radius - 20, 5);
      ctx.restore();
    });

    // Center Hub
    ctx.beginPath();
    ctx.arc(center, center, 24, 0, 2 * Math.PI);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#eab308";
    ctx.stroke();
  };

  const handleSpin = async () => {
    if (spinning || !canSpin) return;
    setErrorMsg("");

    const user = wallet.getUser();
    // 1. Operator Protection: Deposit Gate (₨ 500 lifetime recharge)
    if (user.totalDeposits < 500) {
      sounds.playTone(220, "sawtooth", 0.2, 0.15);
      setErrorMsg("Deposit Gate: Minimum lifetime recharge of ₨ 500 required to unlock daily free spin privileges.");
      return;
    }

    setSpinning(true);
    setWonPrize(null);
    sounds.playClick();

    try {
      // 2. Query Server for Operator-Weighted Outcome
      const res = await fetch("/api/wallet/lucky-wheel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();

      if (data.status !== "success") {
        setSpinning(false);
        setErrorMsg(data.message || "Unable to spin wheel at this time.");
        sounds.playTone(220, "sawtooth", 0.2, 0.15);
        return;
      }

      const winningIndex = typeof data.sectorIndex === "number" ? data.sectorIndex : 1;
      const sectorAngle = 360 / SECTORS.length;

      // Calculate total degrees to spin (5 full turns + target)
      // Pointer is at the top (270 degrees in canvas / standard 0 deg pointer)
      const extraSpins = 360 * 5;
      const targetDegree = extraSpins + (360 - (winningIndex * sectorAngle + sectorAngle / 2)) + 270;

      setRotation(targetDegree);

      // Play tick sounds periodically
      let tickCount = 0;
      const tickInterval = setInterval(() => {
        sounds.playReelClick();
        tickCount++;
        if (tickCount > 18) clearInterval(tickInterval);
      }, 200);

      setTimeout(() => {
        clearInterval(tickInterval);
        const prize = SECTORS[winningIndex];
        setWonPrize(prize);
        setSpinning(false);
        setCanSpin(false);
        setRolloverNotice(
          data.requiredTurnoverAdded > 0
            ? `Credited to Bonus Wallet with 15x (₨ ${data.requiredTurnoverAdded}) playthrough turnover required`
            : "VIP Points credited to account"
        );
        localStorage.setItem(STORAGE_KEY_LAST_SPIN, Date.now().toString());

        // Play victory sound & confetti
        sounds.playWin();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Credit to bonus wallet with 15x turnover lock
        if (prize.type === "cash") {
          wallet.applyBonus(prize.value, "Daily Lucky Wheel Prize", 15);
        } else if (prize.type === "vip") {
          const u = wallet.getUser();
          u.vipPoints += prize.value;
          wallet.saveUser(u);
        }
      }, 4500);
    } catch {
      setSpinning(false);
      setErrorMsg("Network error connecting to lucky wheel server.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-[#1c1c1c] via-[#121212] to-[#0a0a0a] border border-amber-500/30 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.8),_0_0_30px_rgba(234,179,8,0.15)] text-white text-center relative overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95 z-10"
        >
          <X size={18} />
        </button>

        {/* Header Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
            <Sparkles size={12} />
            <span>DAILY VIP REWARD</span>
          </div>
          <h2 className="text-xl font-black bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200 bg-clip-text text-transparent">
            LUCKY FORTUNE WHEEL
          </h2>
          <p className="text-[11px] text-jjwin-textMuted">
            Spin once every 24 hours to win free PKR cash & VIP multipliers!
          </p>
        </div>

        {/* Error / Deposit Gate Warning */}
        {errorMsg && (
          <div className="bg-red-950/60 border border-red-500/50 rounded-2xl p-2.5 flex items-center gap-2 text-left text-xs text-red-300 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-[11px] leading-tight">{errorMsg}</span>
          </div>
        )}

        {/* Wheel Canvas Container */}
        <div className="relative w-[270px] h-[270px] mx-auto flex items-center justify-center">
          {/* Pointer Marker at the Top */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-amber-400 filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" />

          {/* Canvas Wheel */}
          <div
            className="w-full h-full transition-transform duration-[4500ms] cubic-bezier(0.15, 0.9, 0.2, 1)"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <canvas
              ref={canvasRef}
              width={270}
              height={270}
              className="w-full h-full rounded-full shadow-2xl"
            />
          </div>

          {/* Center Spin Button */}
          <button
            onClick={handleSpin}
            disabled={spinning || !canSpin}
            className={`absolute z-20 w-14 h-14 rounded-full font-black text-[11px] uppercase tracking-wider flex items-center justify-center transition shadow-2xl ${
              canSpin && !spinning
                ? "bg-gradient-to-tr from-amber-400 to-orange-500 text-black hover:scale-105 active:scale-95 shadow-amber-500/40"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            {spinning ? "..." : canSpin ? "SPIN" : "WAIT"}
          </button>
        </div>

        {/* Won Prize Notice with 15x Rollover Lock */}
        {wonPrize && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 animate-bounce space-y-1">
            <div className="text-[11px] text-amber-300 font-bold flex items-center justify-center gap-1">
              <Trophy size={14} className="text-amber-400" />
              CONGRATULATIONS!
            </div>
            <div className="text-lg font-black text-white">
              Won {wonPrize.label} {wonPrize.type === "cash" ? "Bonus PKR!" : "Points!"}
            </div>
            <div className="text-[10px] text-amber-200/90 font-mono">
              {rolloverNotice}
            </div>
          </div>
        )}

        {/* Status / Timer footer */}
        <div className="pt-2 border-t border-[#262626] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1 text-slate-400 text-[10px]">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span>Anti-Abuse Guard</span>
          </div>

          {canSpin ? (
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Flame size={14} className="animate-pulse" />
              <span>Spin Ready!</span>
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Clock size={14} />
              <span>Next spin: <strong className="text-amber-400 font-mono">{timeLeft}</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
