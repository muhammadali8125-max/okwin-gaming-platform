"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Lock,
  Phone,
  User,
  Gift,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { authStore } from "@/lib/authStore";
import { sounds } from "@/lib/soundEngine";
import { BottomNav } from "@/components/layout/BottomNav";
import confetti from "canvas-confetti";

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState<string>("3001234567");
  const [username, setUsername] = useState<string>("LuckyWinner");
  const [password, setPassword] = useState<string>("123456");
  const [referralCode, setReferralCode] = useState<string>("OKWIN777");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>("");

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      sounds.playClick();
    } catch {}

    const cleanPhone = phone.trim().replace(/^0/, "").replace(/\s/g, "");
    if (cleanPhone.length < 9) {
      setErrorMsg("Please enter a valid 10-digit mobile number (e.g. 300 1234567).");
      setIsSubmitting(false);
      return;
    }

    if (password.trim().length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      setIsSubmitting(false);
      return;
    }

    const formattedPhone = `+92 ${cleanPhone}`;

    try {
      if (tab === "login") {
        const res = authStore.login(formattedPhone, password);
        if (res.success) {
          try { sounds.playCoin(); } catch {}
          setIsSuccess(true);
          setSuccessMsg(res.message);
          setTimeout(() => {
            router.push("/");
          }, 800);
        } else {
          setErrorMsg(res.message);
          setIsSubmitting(false);
        }
      } else {
        if (!username.trim()) {
          setErrorMsg("Please enter a player username.");
          setIsSubmitting(false);
          return;
        }

        const res = authStore.register(formattedPhone, username.trim(), password, referralCode.trim());
        if (res.success) {
          try { sounds.playWin(); } catch {}
          try {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
            });
          } catch {}

          setIsSuccess(true);
          setSuccessMsg("Account created! ₨ 888 Welcome Bonus credited to your wallet.");
          setTimeout(() => {
            router.push("/");
          }, 1100);
        } else {
          setErrorMsg(res.message);
          setIsSubmitting(false);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e11] text-white flex flex-col font-sans select-none pb-20">
      <div className="w-full max-w-[440px] mx-auto flex-1 flex flex-col p-4">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between py-2 border-b border-[#1b1c21] mb-4">
          <button
            onClick={() => router.back()}
            className="p-1 -ml-1 text-white hover:text-gray-300 active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-base font-bold text-white tracking-wide">
            {tab === "register" ? "Create Account" : "Sign In"}
          </h1>
          <Link href="/" className="text-xs text-[#22c55e] font-bold">Lobby</Link>
        </div>

        {/* Promo Header Banner */}
        <div className="text-center space-y-1.5 pt-2 pb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30 text-[10px] font-black uppercase tracking-wider">
            <Sparkles size={12} />
            <span>+₨ 888 FREE WELCOME GIFT</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {tab === "register" ? "JOIN OKWIN PAKISTAN" : "WELCOME BACK"}
          </h2>
          <p className="text-xs text-gray-400">
            Instant deposit & withdrawal via JazzCash, EasyPaisa & Raast
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-1 bg-[#14151a] p-1 rounded-xl border border-[#28292e] mb-4">
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setErrorMsg(null);
            }}
            className={`py-2.5 rounded-lg text-xs font-bold transition-all ${
              tab === "register"
                ? "bg-[#22c55e] text-black font-black shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Sign Up (+₨ 888)
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setErrorMsg(null);
            }}
            className={`py-2.5 rounded-lg text-xs font-bold transition-all ${
              tab === "login"
                ? "bg-[#22c55e] text-black font-black shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Success Confirmation Toast */}
        {isSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs text-center font-bold flex items-center justify-center gap-2 mb-3 animate-in zoom-in-95">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Feedback */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs text-center font-bold flex items-center justify-center gap-1.5 mb-3">
            <AlertCircle size={14} className="shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
          {tab === "register" && (
            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                Player Username
              </label>
              <div className="relative group">
                <User
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e] transition-colors"
                />
                <input
                  type="text"
                  placeholder="e.g. Winner_007"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#14151a] border border-[#28292e] text-white focus:outline-none focus:border-[#22c55e] transition placeholder:text-gray-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
              Pakistani Mobile Number
            </label>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-3 rounded-xl bg-[#14151a] border border-[#28292e] text-[#22c55e] font-mono font-bold">
                +92
              </span>
              <div className="relative flex-1 group">
                <Phone
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e] transition-colors"
                />
                <input
                  type="tel"
                  placeholder="300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#14151a] border border-[#28292e] text-white font-mono focus:outline-none focus:border-[#22c55e] transition placeholder:text-gray-600"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
              Password
            </label>
            <div className="relative group">
              <Lock
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e] transition-colors"
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#14151a] border border-[#28292e] text-white focus:outline-none focus:border-[#22c55e] transition placeholder:text-gray-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {tab === "register" && (
            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                Invitation / Referral Code
              </label>
              <div className="relative group">
                <Gift
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500/70 group-focus-within:text-amber-400 transition-colors"
                />
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#14151a] border border-[#28292e] text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isSuccess}
            className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#22c55e] text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(34,197,94,0.3)] transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{tab === "register" ? "Creating Account..." : "Signing In..."}</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 size={16} />
                <span>Success!</span>
              </>
            ) : (
              <>
                <span>{tab === "register" ? "Create Account (+₨ 888 Free)" : "Sign In to Account"}</span>
                <CheckCircle2 size={16} strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[10px] text-gray-500 pt-3 font-medium">
          By continuing you agree to Okwin 18+ Responsible Gaming Rules.
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
