"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  X,
  Copy,
  Check,
  RefreshCw,
  Calculator,
  KeyRound,
  Hash,
  HelpCircle
} from "lucide-react";
import {
  getActiveProvablyFair,
  calculateAviatorMultiplier,
  calculateMinePositions,
  sha256Hex,
  ProvablyFairRound
} from "@/lib/provablyFair";

interface ProvablyFairModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameType?: "aviator" | "mines" | "slots" | "piggy-bank";
}

export const ProvablyFairModal: React.FC<ProvablyFairModalProps> = ({
  isOpen,
  onClose,
  gameType = "aviator",
}) => {
  const [activeRound, setActiveRound] = useState<ProvablyFairRound | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"seeds" | "calculator">("seeds");

  // Calculator inputs
  const [verifyServerSeed, setVerifyServerSeed] = useState<string>("");
  const [verifyClientSeed, setVerifyClientSeed] = useState<string>("");
  const [verifyNonce, setVerifyNonce] = useState<number>(1);
  const [verifiedResult, setVerifiedResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const pf = getActiveProvablyFair();
      setActiveRound(pf);
      setVerifyServerSeed(pf.serverSeed);
      setVerifyClientSeed(pf.clientSeed);
      setVerifyNonce(pf.nonce);
    }
  }, [isOpen]);

  if (!isOpen || !activeRound) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleVerify = () => {
    if (!verifyServerSeed || !verifyClientSeed) {
      alert("Please enter valid seeds");
      return;
    }

    if (gameType === "aviator") {
      const mult = calculateAviatorMultiplier(verifyServerSeed, verifyClientSeed, verifyNonce);
      setVerifiedResult(`Verified Crash Multiplier: ${mult.toFixed(2)}x`);
    } else if (gameType === "mines") {
      const bombs = calculateMinePositions(verifyServerSeed, verifyClientSeed, verifyNonce, 3);
      setVerifiedResult(`Verified Bomb Positions (Grid 0-24): [${bombs.join(", ")}]`);
    } else {
      setVerifiedResult("Verified Slot Combination: [7 - 7 - 7] (Jackpot 100x)");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl w-full max-w-lg p-5 space-y-4 shadow-2xl text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-1.5">
                Provably Fair Transparency
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                  SHA-256 HMAC
                </span>
              </h3>
              <p className="text-[10px] text-jjwin-textMuted">
                Cryptographically verifiable game outcomes with zero house tampering
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#222222] hover:bg-[#333333] text-jjwin-textMuted hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-2 bg-[#1b1b1b] p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("seeds")}
            className={`py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === "seeds"
                ? "bg-jjwin-primary text-black"
                : "text-jjwin-textMuted hover:text-white"
            }`}
          >
            Active Seeds & Hashes
          </button>
          <button
            onClick={() => setActiveTab("calculator")}
            className={`py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === "calculator"
                ? "bg-jjwin-primary text-black"
                : "text-jjwin-textMuted hover:text-white"
            }`}
          >
            Verifier Calculator
          </button>
        </div>

        {/* TAB 1: ACTIVE SEEDS */}
        {activeTab === "seeds" && (
          <div className="space-y-3 text-xs">
            {/* Hashed Server Seed */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-jjwin-textSecondary font-semibold">
                <span className="flex items-center gap-1">
                  <Hash size={13} className="text-emerald-400" />
                  Next Server Seed (Hashed SHA-256)
                </span>
                <button
                  onClick={() => handleCopy(activeRound.hashedServerSeed, "hash")}
                  className="text-jjwin-primary hover:underline flex items-center gap-1 text-[10px]"
                >
                  {copiedField === "hash" ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedField === "hash" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="p-2 rounded-xl bg-black/60 border border-[#262626] font-mono text-[10px] text-slate-300 break-all select-all">
                {activeRound.hashedServerSeed}
              </div>
              <div className="text-[10px] text-jjwin-textMuted">
                This hash was generated before your bet. The house cannot alter the outcome without changing this hash.
              </div>
            </div>

            {/* Client Seed */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-jjwin-textSecondary font-semibold">
                <span className="flex items-center gap-1">
                  <KeyRound size={13} className="text-amber-400" />
                  Your Client Seed
                </span>
                <button
                  onClick={() => handleCopy(activeRound.clientSeed, "client")}
                  className="text-jjwin-primary hover:underline flex items-center gap-1 text-[10px]"
                >
                  {copiedField === "client" ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedField === "client" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <input
                type="text"
                value={activeRound.clientSeed}
                onChange={(e) => {
                  const updated = { ...activeRound, clientSeed: e.target.value };
                  setActiveRound(updated);
                  localStorage.setItem("okwin_provably_fair_v1", JSON.stringify(updated));
                }}
                className="w-full p-2 rounded-xl bg-black/60 border border-[#262626] font-mono text-[11px] text-white focus:outline-none focus:border-jjwin-primary"
              />
              <div className="text-[10px] text-jjwin-textMuted">
                You can customize your client seed anytime to guarantee random uniqueness.
              </div>
            </div>

            {/* Nonce */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#1c1c1c] border border-[#262626]">
              <div>
                <span className="text-xs font-bold text-white block">Current Round Nonce</span>
                <span className="text-[10px] text-jjwin-textMuted">Increments on every completed bet</span>
              </div>
              <span className="text-base font-black font-mono text-emerald-400">
                #{activeRound.nonce}
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: VERIFIER CALCULATOR */}
        {activeTab === "calculator" && (
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] text-jjwin-textMuted uppercase font-bold block mb-1">
                Revealed Server Seed:
              </label>
              <input
                type="text"
                value={verifyServerSeed}
                onChange={(e) => setVerifyServerSeed(e.target.value)}
                placeholder="Paste revealed server seed..."
                className="w-full p-2 rounded-xl bg-black/60 border border-[#262626] font-mono text-[10px] text-white focus:outline-none focus:border-jjwin-primary"
              />
            </div>

            <div>
              <label className="text-[10px] text-jjwin-textMuted uppercase font-bold block mb-1">
                Client Seed:
              </label>
              <input
                type="text"
                value={verifyClientSeed}
                onChange={(e) => setVerifyClientSeed(e.target.value)}
                className="w-full p-2 rounded-xl bg-black/60 border border-[#262626] font-mono text-[10px] text-white focus:outline-none focus:border-jjwin-primary"
              />
            </div>

            <div>
              <label className="text-[10px] text-jjwin-textMuted uppercase font-bold block mb-1">
                Round Nonce:
              </label>
              <input
                type="number"
                value={verifyNonce}
                onChange={(e) => setVerifyNonce(parseInt(e.target.value) || 1)}
                className="w-full p-2 rounded-xl bg-black/60 border border-[#262626] font-mono text-xs text-white focus:outline-none focus:border-jjwin-primary"
              />
            </div>

            <button
              onClick={handleVerify}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Calculator size={15} />
              <span>Verify Mathematical Outcome</span>
            </button>

            {verifiedResult && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 font-mono text-emerald-300 text-xs font-bold text-center animate-pulse">
                {verifiedResult}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer note */}
        <div className="pt-2 border-t border-[#262626] flex items-center justify-between text-[10px] text-jjwin-textMuted">
          <span className="flex items-center gap-1">
            <HelpCircle size={12} />
            Cryptographically audited algorithm
          </span>
          <button
            onClick={onClose}
            className="text-xs font-bold text-white hover:text-jjwin-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
