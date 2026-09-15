"use client";

import React, { useState } from "react";
import { X, Sparkles, Gift, CheckCircle2, AlertCircle, ArrowRight, Copy } from "lucide-react";
import { wallet } from "@/lib/walletStore";
import { sounds } from "@/lib/soundEngine";
import { formatPKR } from "@/lib/utils";

interface RedPacketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_CODES = [
  { code: "OKWIN888", amount: "₨ 888", tag: "Welcome" },
  { code: "FREE500", amount: "₨ 500", tag: "Weekend" },
  { code: "VIPPAKISTAN", amount: "₨ 1,000", tag: "VIP" },
];

export const RedPacketModal: React.FC<RedPacketModalProps> = ({ isOpen, onClose }) => {
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [claimedReward, setClaimedReward] = useState<{ amount: number; message: string } | null>(null);

  if (!isOpen) return null;

  const handleClaim = async (codeToUse?: string) => {
    const code = (codeToUse || promoCode).trim().toUpperCase();
    if (!code) {
      setError("Please enter a valid promo code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const user = wallet.getUser();
      const res = await fetch("/api/wallet/redeem-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          code,
        }),
      });

      const data = await res.json();

      if (data.status === "success") {
        sounds.playJackpot();
        wallet.applyBonus(data.bonusAmount, `Red Packet: ${code}`);
        setClaimedReward({
          amount: data.bonusAmount,
          message: data.message,
        });
      } else {
        sounds.playTone(220, "sawtooth", 0.2, 0.15);
        setError(data.message || "Unable to redeem code.");
      }
    } catch {
      setError("Network error while connecting to cashier server.");
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    sounds.playClick();
    setPromoCode("");
    setError("");
    setClaimedReward(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#8f1118] via-[#750d13] to-[#420609] border-2 border-amber-400/30 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8),_0_0_30px_rgba(234,179,8,0.15)] overflow-hidden text-center animate-in zoom-in-95 duration-300">
        {/* Golden Dragon / Floral Glow Header Accent */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-yellow-300/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={resetAndClose}
          className="absolute top-4 right-4 text-amber-200/70 hover:text-white p-1.5 rounded-full bg-black/20 hover:bg-black/40 transition-all active:scale-95 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {claimedReward ? (
          /* SUCCESS STATE: CELEBRATION ENVELOPE OPENED */
          <div className="py-4 space-y-4 animate-in zoom-in-95 duration-300">
            <div className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 p-1 shadow-[0_0_30px_rgba(250,204,21,0.6)] animate-bounce">
              <div className="w-full h-full rounded-full bg-[#750d13] flex items-center justify-center text-amber-300">
                <Gift className="w-10 h-10 animate-pulse" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Red Packet Claimed!
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                Congratulations!
              </h3>
              <p className="text-xs text-amber-200/80 mt-1 font-medium">
                Instant cash credit deposited to your active wallet balance.
              </p>
            </div>

            {/* Credited Amount Card */}
            <div className="bg-black/40 border border-amber-400/30 rounded-2xl p-4 shadow-inner">
              <span className="text-xs uppercase font-bold text-amber-300/80 block tracking-wider">
                Bonus Reward Added
              </span>
              <span className="text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 block mt-1 drop-shadow-sm">
                +{formatPKR(claimedReward.amount)}
              </span>
              <span className="text-[11px] text-emerald-400 font-bold block mt-2 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ready for Aviator & Slot Gameplay
              </span>
            </div>

            <button
              onClick={resetAndClose}
              className="w-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-200 text-black py-3.5 rounded-xl font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all transform active:scale-95"
            >
              Play & Win Now
            </button>
          </div>
        ) : (
          /* RED PACKET FORM */
          <div className="space-y-4">
            {/* Hongbao Golden Seal Emblem */}
            <div className="relative mx-auto w-16 h-16 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 p-0.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <div className="w-full h-full rounded-full bg-[#8f1118] border border-amber-300/40 flex items-center justify-center">
                <span className="text-amber-300 font-serif font-black text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  福
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black text-white tracking-wide uppercase drop-shadow-sm">
                Red Packet Gift
              </h2>
              <p className="text-xs text-amber-200/80 mt-1 font-medium">
                Enter your secret gift code to claim instant PKR cash!
              </p>
            </div>

            {error && (
              <div className="bg-black/50 border border-red-400/50 rounded-xl p-2.5 flex items-center justify-center gap-2 text-xs text-red-300 animate-in fade-in duration-200 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Code Input */}
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                Promo / Voucher Code
              </label>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="e.g. OKWIN888"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleClaim();
                  }}
                  className="w-full bg-black/40 border border-amber-400/50 rounded-xl px-4 py-3 text-sm font-mono font-black text-yellow-300 uppercase placeholder:text-amber-200/30 focus:outline-none focus:border-yellow-300 focus:ring-1 focus:ring-yellow-300 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Quick Tap Promo Codes */}
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-bold text-amber-200/70 uppercase tracking-wider block">
                🔥 Hot Official Vouchers (Tap to Apply):
              </span>
              <div className="grid grid-cols-3 gap-2">
                {POPULAR_CODES.map((p) => (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setPromoCode(p.code);
                      handleClaim(p.code);
                    }}
                    className="p-2 rounded-xl bg-black/30 border border-amber-400/30 hover:border-amber-300 hover:bg-amber-400/10 text-center transition-all active:scale-95 group shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
                  >
                    <div className="text-[10px] font-black text-yellow-300 font-mono group-hover:scale-105 transition-transform">
                      {p.code}
                    </div>
                    <div className="text-[9px] text-amber-200/80 font-bold mt-0.5">
                      {p.amount}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Claim Button */}
            <button
              onClick={() => handleClaim()}
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-200 text-black py-3.5 rounded-xl font-black text-sm uppercase tracking-widest shadow-[0_0_25px_rgba(234,179,8,0.4)] flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Voucher...</span>
                </div>
              ) : (
                <>
                  <Gift className="w-4 h-4" />
                  <span>Open Red Packet</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </>
              )}
            </button>

            <div className="text-[10px] text-amber-200/60 leading-tight font-medium">
              Instant credited bonus funds can be used across all mini-games, crash, and live sportsbook.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
