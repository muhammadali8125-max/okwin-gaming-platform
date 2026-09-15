"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, Sparkles, Check, Gift, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";
import { wallet } from "@/lib/walletStore";
import { sounds } from "@/lib/soundEngine";
import { formatPKR } from "@/lib/utils";
import { UserProfile } from "@/lib/types";
import { BottomNav } from "@/components/layout/BottomNav";

const VIP_TIERS = [
  { level: 1, name: "Bronze Member", pointsNeeded: 0, levelBonus: 200, rebate: "0.4%" },
  { level: 2, name: "Silver Member", pointsNeeded: 500, levelBonus: 500, rebate: "0.6%" },
  { level: 3, name: "Gold Member", pointsNeeded: 1500, levelBonus: 1000, rebate: "0.8%" },
  { level: 4, name: "Platinum VIP", pointsNeeded: 5000, levelBonus: 3000, rebate: "1.0%" },
  { level: 5, name: "Diamond VIP", pointsNeeded: 15000, levelBonus: 8000, rebate: "1.2%" },
  { level: 6, name: "Crown Royal", pointsNeeded: 50000, levelBonus: 25000, rebate: "1.5%" },
];

export default function VipPage() {
  const [user, setUser] = useState<UserProfile>(wallet.getUser());
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  useEffect(() => {
    setUser(wallet.getUser());
    const handleUpdate = () => setUser(wallet.getUser());
    window.addEventListener("jjwin_user_updated", handleUpdate);
    return () => window.removeEventListener("jjwin_user_updated", handleUpdate);
  }, []);

  const handleClaimDaily = () => {
    sounds.playCoin();
    const res = wallet.claimDailyReward();
    setClaimMessage(res.message);
    if (res.success) {
      sounds.playWin();
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 } });
      } catch {}
    }
  };

  const progressPercent = Math.min(100, Math.round((user.vipPoints / user.nextVipPoints) * 100));

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#181818] to-[#121212] border-b border-jjwin-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={() => sounds.playClick()}
            className="w-8 h-8 rounded-full bg-[#242424] hover:bg-[#333333] flex items-center justify-center text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-jjwin-gold" />
            <span>VIP Club & Privileges</span>
          </h1>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-lg mx-auto w-full space-y-4">
        {/* VIP Member Card */}
        <div className="w-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 text-black rounded-3xl p-5 shadow-gold relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px] opacity-20 z-0" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 z-0" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-lg">
                <img
                  src="/images/icons3d/vip-crown.png"
                  alt="VIP Crown"
                  className="w-8 h-8 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                />
                <span>VIP TIER {user.vipLevel}</span>
              </div>
              <span className="bg-black text-yellow-400 font-mono text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-sm border border-black/50">
                Member ID: {user.id}
              </span>
            </div>

            <div className="mt-4 mb-2">
              <div className="flex justify-between text-xs font-bold text-black/80 mb-1 font-mono">
                <span>Points: {user.vipPoints} pts</span>
                <span>Next Tier: {user.nextVipPoints} pts</span>
              </div>
              <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-black to-gray-800 transition-all duration-500 rounded-full relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
                </div>
              </div>
            </div>
            <p className="text-[11px] font-medium text-black/90">
              Bet on any game to earn VIP points. ₨ 10 bet = 1 VIP Point.
            </p>
          </div>
        </div>

        {/* Daily Streak Check-in */}
        <div className="bg-[#1c1c1c] border border-jjwin-border rounded-3xl p-4 sm:p-5 space-y-3 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-jjwin-primary" />
              <h3 className="font-black text-sm text-white uppercase tracking-wider">
                7-Day Sign-in Streak
              </h3>
            </div>
            <span className="text-xs text-jjwin-primary font-bold font-mono bg-jjwin-primary/10 px-2 py-0.5 rounded-lg border border-jjwin-primary/20">
              Day {user.dailyStreak} / 7
            </span>
          </div>

          {/* 7 Day Streak Circles */}
          <div className="relative py-2">
            <div className="absolute top-1/2 left-[5%] right-[5%] h-0.5 bg-[#252525] -translate-y-1/2 z-0" />
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 relative z-10">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const isClaimed = day < user.dailyStreak;
                const isCurrent = day === user.dailyStreak;
                const reward = 100 + day * 50;
                return (
                  <div
                    key={day}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center border text-center transition-all ${
                      isClaimed
                        ? "bg-jjwin-primary/20 border-jjwin-primary text-jjwin-primary"
                        : isCurrent
                        ? "bg-gradient-to-br from-amber-500/30 to-amber-900/40 border-amber-400 text-amber-300 shadow-gold scale-105"
                        : "bg-[#252525] border-jjwin-border text-jjwin-textMuted"
                    }`}
                  >
                    <span className="text-[9px] font-bold block">D{day}</span>
                    <span className="text-[10px] font-mono font-black mt-0.5">₨{reward}</span>
                    {isClaimed ? (
                      <Check className="w-3 h-3 text-jjwin-primary mt-1" />
                    ) : (
                      <Gift className="w-3 h-3 opacity-40 mt-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {claimMessage && (
            <div className="text-xs text-center font-bold text-jjwin-primary py-1 animate-pulse">
              {claimMessage}
            </div>
          )}

          <button
            onClick={handleClaimDaily}
            className="w-full py-3 bg-gradient-to-r from-jjwin-primary to-emerald-400 hover:from-emerald-400 hover:to-jjwin-primary text-black rounded-xl font-black text-xs uppercase tracking-wider shadow-glow transition-all hover:scale-[1.02]"
          >
            Claim Daily Check-in Bonus
          </button>
        </div>

        {/* VIP Tiers Table */}
        <div className="bg-[#1c1c1c] border border-jjwin-border rounded-3xl p-4 sm:p-5 space-y-3 shadow-card">
          <h3 className="font-black text-sm text-white uppercase tracking-wider">
            VIP Tier Benefits & Rebates
          </h3>
          <div className="space-y-2">
            {VIP_TIERS.map((tier) => {
              const getTierColors = (level: number) => {
                switch (level) {
                  case 1: return "from-orange-700/20 to-orange-900/20 border-orange-700/50 text-orange-400";
                  case 2: return "from-slate-400/20 to-slate-600/20 border-slate-400/50 text-slate-300";
                  case 3: return "from-yellow-500/20 to-amber-600/20 border-yellow-500/50 text-yellow-400";
                  case 4: return "from-cyan-400/20 to-blue-600/20 border-cyan-400/50 text-cyan-300";
                  case 5: return "from-purple-500/20 to-pink-600/20 border-purple-500/50 text-purple-300";
                  case 6: return "from-red-500/20 to-orange-600/20 border-red-500/50 text-red-400";
                  default: return "from-[#222222] to-[#1c1c1c] border-jjwin-border/60 text-jjwin-textSecondary";
                }
              };
              const colors = getTierColors(tier.level);
              
              return (
                <div
                  key={tier.level}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs bg-gradient-to-r transition-all hover:scale-[1.01] ${
                    user.vipLevel === tier.level
                      ? "from-amber-500/20 to-amber-900/20 border-amber-500 shadow-gold-sm"
                      : colors
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm bg-black/40 border border-current`}>
                      {tier.level}
                    </div>
                    <div>
                      <span className="font-bold text-white block">{tier.name}</span>
                      <span className="text-[10px] opacity-70 font-mono">
                        Req: {tier.pointsNeeded} pts
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-jjwin-gold block">
                      +₨{tier.levelBonus} Bonus
                    </span>
                    <span className="text-[10px] text-jjwin-primary font-bold block mt-0.5">
                      Rebate {tier.rebate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
