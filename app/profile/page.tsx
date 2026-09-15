"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User, ShieldCheck, Phone, Wallet, Crown, Headphones, Send, Settings, LogOut, ChevronRight } from "lucide-react";
import { wallet } from "@/lib/walletStore";
import { sounds } from "@/lib/soundEngine";
import { formatPKR } from "@/lib/utils";
import { UserProfile } from "@/lib/types";
import { BottomNav } from "@/components/layout/BottomNav";
import { AuthModal } from "@/components/auth/AuthModal";
import { LiveChatModal } from "@/components/common/LiveChatModal";
import { MessageSquare } from "lucide-react";
import { authStore } from "@/lib/authStore";

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile>(wallet.getDefaultUser());
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState<boolean>(false);

  useEffect(() => {
    setUser(wallet.getUser());
    const handleUpdate = () => setUser(wallet.getUser());
    window.addEventListener("jjwin_user_updated", handleUpdate);
    return () => window.removeEventListener("jjwin_user_updated", handleUpdate);
  }, []);

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#181818] to-[#141414] border-b border-jjwin-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={() => sounds.playClick()}
            className="w-8 h-8 rounded-full bg-[#242424] hover:bg-[#333333] flex items-center justify-center text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-extrabold text-base tracking-tight text-white">Member Center</h1>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-lg mx-auto w-full space-y-4">
        {/* User Card */}
        <div className="bg-gradient-to-br from-[#202020] to-[#141414] border border-jjwin-border rounded-3xl p-5 shadow-card flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 z-0" />
          <div suppressHydrationWarning className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-tr from-jjwin-primary to-emerald-400 text-black font-black text-2xl flex items-center justify-center shadow-glow">
            {user.username.charAt(0)}
          </div>

          <div className="flex-1 space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <h2 suppressHydrationWarning className="text-base font-black text-white">{user.username}</h2>
              <span suppressHydrationWarning className="bg-gradient-to-r from-amber-600 to-yellow-500 text-black px-2 py-0.5 rounded-full text-[10px] font-black uppercase shadow-sm">
                VIP {user.vipLevel}
              </span>
            </div>
            <p suppressHydrationWarning className="text-xs font-mono text-jjwin-textMuted flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {user.phone}
            </p>
            <div className="text-xs text-jjwin-textSecondary font-mono">
              Balance: <span suppressHydrationWarning className="text-jjwin-primary font-bold drop-shadow-sm">{formatPKR(user.balance)}</span>
            </div>
          </div>
        </div>

        {/* Switch Account / Auth Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              setIsAuthOpen(true);
            }}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 hover:from-amber-500/30 hover:to-yellow-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs transition flex items-center justify-center gap-1.5"
          >
            <span>Switch / Register (+₨ 888)</span>
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              authStore.logout();
              setUser(wallet.getUser());
            }}
            className="px-3 py-2 rounded-xl bg-transparent hover:bg-red-500/10 border border-transparent hover:border-red-500/30 text-jjwin-textMuted hover:text-red-400 font-bold text-xs transition-all flex items-center gap-1"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Quick Menu */}
        <div className="bg-[#1c1c1c] border border-jjwin-border rounded-3xl p-2 shadow-card grid gap-1">
          <Link
            href="/wallet"
            onClick={() => sounds.playClick()}
            className="flex items-center justify-between p-3 hover:bg-[#252525] rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-lg border border-transparent hover:border-jjwin-primary/20 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/40 text-jjwin-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold text-white group-hover:text-jjwin-primary transition-colors">Deposit & Withdrawal History</span>
            </div>
            <ChevronRight className="w-4 h-4 text-jjwin-textMuted group-hover:text-jjwin-primary transition-colors group-hover:translate-x-1" />
          </Link>

          <Link
            href="/vip"
            onClick={() => sounds.playClick()}
            className="flex items-center justify-between p-3 hover:bg-[#252525] rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-lg border border-transparent hover:border-amber-500/20 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-900/40 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Crown className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold text-white group-hover:text-amber-400 transition-colors">VIP Club & Daily Bonuses</span>
            </div>
            <ChevronRight className="w-4 h-4 text-jjwin-textMuted group-hover:text-amber-400 transition-colors group-hover:translate-x-1" />
          </Link>

          <Link
            href="/promote"
            onClick={() => sounds.playClick()}
            className="flex items-center justify-between p-3 hover:bg-[#252525] rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-lg border border-transparent hover:border-purple-500/20 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-900/40 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold text-white group-hover:text-purple-400 transition-colors">Agent Commission Center</span>
            </div>
            <ChevronRight className="w-4 h-4 text-jjwin-textMuted group-hover:text-purple-400 transition-colors group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 24/7 Customer Service Desk */}
        <div className="bg-[#1c1c1c] border border-jjwin-border rounded-3xl p-4 sm:p-5 space-y-3 shadow-card">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-jjwin-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-jjwin-textMuted">
              7x24 Online Customer Service
            </h3>
          </div>
          <p className="text-xs text-jjwin-textSecondary">
            If you need assistance with deposits, withdrawals, or game rules, contact our official support channels.
          </p>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setIsLiveChatOpen(true);
            }}
            className="w-full mb-2 p-3 rounded-xl bg-gradient-to-r from-[#22c55e]/20 to-[#16a34a]/10 border border-[#22c55e]/40 text-[#22c55e] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#22c55e]/25 transition"
          >
            <Headphones className="w-4 h-4" />
            <span>Open 24/7 Live Support Chat (Cashier & Bonus)</span>
          </button>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href="https://telegram.me"
              target="_blank"
              rel="noreferrer"
              onClick={() => sounds.playClick()}
              className="p-2.5 rounded-xl bg-[#242424] hover:bg-[#2d2d2d] border border-jjwin-border flex items-center gap-2 text-xs font-bold text-white transition-colors"
            >
              <Send className="w-4 h-4 text-[#0088cc]" />
              <span>Official Telegram</span>
            </a>

            <a
              href="https://whatsapp.com"
              target="_blank"
              rel="noreferrer"
              onClick={() => sounds.playClick()}
              className="p-2.5 rounded-xl bg-[#242424] hover:bg-[#2d2d2d] border border-jjwin-border flex items-center gap-2 text-xs font-bold text-white transition-colors"
            >
              <Phone className="w-4 h-4 text-[#25D366]" />
              <span>WhatsApp Hotline</span>
            </a>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setUser(wallet.getUser());
        }}
      />

      <LiveChatModal isOpen={isLiveChatOpen} onClose={() => setIsLiveChatOpen(false)} />
      <BottomNav />
    </div>
  );
}
