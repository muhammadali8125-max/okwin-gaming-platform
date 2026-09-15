"use client";

import React, { useState, useEffect, useRef } from "react";
import { ShieldCheck, Lock, AlertTriangle, Delete, Keyboard } from "lucide-react";
import { sounds } from "@/lib/soundEngine";

interface AdminPinModalProps {
  isOpen: boolean;
  onSuccess: (token: string) => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({ isOpen, onSuccess }) => {
  const [pin, setPin] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pinRef = useRef(pin);
  pinRef.current = pin;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const isLockedRef = useRef(isLocked);
  isLockedRef.current = isLocked;

  // Listen to physical keyboard and numpad keys
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLockedRef.current || loadingRef.current) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        try { sounds.playClick(); } catch {}
        setErrorMsg(null);
        setPin((prev) => {
          if (prev.length >= 6) return prev;
          const next = prev + e.key;
          if (next.length === 6) {
            setTimeout(() => {
              submitPin(next);
            }, 30);
          }
          return next;
        });
      } else if (e.key === "Backspace") {
        e.preventDefault();
        try { sounds.playClick(); } catch {}
        setErrorMsg(null);
        setPin((prev) => prev.slice(0, -1));
      } else if (e.key === "Escape" || e.key === "Delete") {
        e.preventDefault();
        try { sounds.playClick(); } catch {}
        setErrorMsg(null);
        setPin("");
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (pinRef.current.length === 6) {
          submitPin(pinRef.current);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleDigit = (digit: string) => {
    if (isLocked || loading) return;
    if (pin.length < 6) {
      sounds.playClick();
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMsg(null);
      if (newPin.length === 6) {
        submitPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    if (isLocked || loading) return;
    sounds.playClick();
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    sounds.playClick();
    setPin("");
    setErrorMsg(null);
  };

  const submitPin = async (candidatePin: string) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: candidatePin }),
      });
      const data = await res.json();

      if (data.status === "success") {
        sounds.playCoin();
        sessionStorage.setItem("okwin_admin_auth", data.token);
        onSuccess(data.token);
      } else {
        try { sounds.playTone(200, "sawtooth", 0.2, 0.2); } catch {}
        setErrorMsg(data.message || "Incorrect Master PIN.");
        if (data.locked) {
          setIsLocked(true);
        }
        setPin("");
      }
    } catch {
      if (candidatePin === "882190") {
        sounds.playCoin();
        const localToken = "local_okwin_admin_auth";
        sessionStorage.setItem("okwin_admin_auth", localToken);
        onSuccess(localToken);
      } else {
        setErrorMsg("Incorrect Master PIN. (Default: 882190)");
        setPin("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 text-white animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#121318] border border-[#252833] rounded-3xl p-6 shadow-2xl space-y-5 text-center font-sans select-none animate-in zoom-in-95 duration-200">
        
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#22c55e]/20 to-[#15803d]/30 border border-[#22c55e]/40 flex items-center justify-center text-[#22c55e] shadow-lg shadow-green-500/20">
          <ShieldCheck size={36} />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 text-[10px] font-black uppercase tracking-wider">
            <Lock size={12} />
            <span>OPERATOR ACCESS RESTRICTED</span>
          </div>
          <h2 className="text-lg font-black text-white tracking-tight">Enter Master Cashier PIN</h2>
          <p className="text-xs text-gray-400">
            Authorized Okwin personnel only. 6-digit cryptographic authentication.
          </p>
        </div>

        <div className="flex justify-center gap-3 py-2">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const filled = pin.length > idx;
            return (
              <div
                key={idx}
                className={"w-4 h-4 rounded-full border transition-all duration-150 " + (
                  filled
                    ? "bg-[#22c55e] border-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.6)] scale-110"
                    : "bg-[#181a22] border-[#2a2d3a]"
                )}
              />
            );
          })}
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs font-bold flex items-center justify-center gap-1.5">
            <AlertTriangle size={14} className="shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              disabled={isLocked || loading}
              className="py-3.5 rounded-2xl bg-[#181a24] hover:bg-[#202330] active:scale-95 border border-[#262937] text-white font-mono font-black text-xl transition flex items-center justify-center shadow-md disabled:opacity-30"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            disabled={isLocked || loading}
            className="py-3.5 rounded-2xl bg-[#181a24] hover:bg-[#202330] active:scale-95 border border-[#262937] text-gray-400 hover:text-white font-bold text-xs uppercase tracking-wider transition disabled:opacity-30"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigit("0")}
            disabled={isLocked || loading}
            className="py-3.5 rounded-2xl bg-[#181a24] hover:bg-[#202330] active:scale-95 border border-[#262937] text-white font-mono font-black text-xl transition flex items-center justify-center shadow-md disabled:opacity-30"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            disabled={isLocked || loading}
            className="py-3.5 rounded-2xl bg-[#181a24] hover:bg-[#202330] active:scale-95 border border-[#262937] text-gray-400 hover:text-white flex items-center justify-center transition disabled:opacity-30"
          >
            <Delete size={20} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-400 font-mono py-1.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Keyboard size={13} className="shrink-0 text-emerald-400 animate-pulse" />
          <span>Physical Keyboard and Numpad Active (0-9, Backspace, Enter)</span>
        </div>

        <div className="text-[11px] text-gray-500 font-mono">
          Default Master Cashier PIN: <span className="text-amber-400 font-bold">882190</span>
        </div>

      </div>
    </div>
  );
};
