"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gift, Share2, Copy, Check, Users, DollarSign, Sparkles, MessageCircle, Send } from "lucide-react";
import { sounds } from "@/lib/soundEngine";
import { wallet } from "@/lib/walletStore";
import { formatPKR } from "@/lib/utils";
import { BottomNav } from "@/components/layout/BottomNav";

export default function PromotePage() {
  const user = wallet.getUser();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const inviteLink = `https://www.okwin9.com/register?code=${user.referralCode}`;

  const handleCopyLink = () => {
    sounds.playCoin();
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    sounds.playCoin();
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

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
          <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-jjwin-primary" />
            <span>Agent Promotion & Invite</span>
          </h1>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-lg mx-auto w-full space-y-4">
        {/* Banner Hero */}
        <div className="w-full bg-gradient-to-br from-emerald-950 via-[#152415] to-[#121212] border border-jjwin-primary/40 rounded-3xl p-5 shadow-glow relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#4ADE8033,transparent_70%)] opacity-50 z-0" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 z-0" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-black/50 border border-jjwin-primary/40 text-jjwin-primary shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>OKWIN OFFICIAL AGENT</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white mt-2 leading-tight">
              Invite Friends To Receive
            </h2>
            <div className="text-3xl sm:text-4xl font-black font-mono text-jjwin-primary drop-shadow-md my-1">
              Rs 600 Bonus
            </div>
            <p className="text-xs text-jjwin-textSecondary font-medium">
              Get unlimited passive commission for every bet placed by your downline players!
            </p>
          </div>
        </div>

        {/* Commission Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-b from-[#222222] to-[#1c1c1c] border-t-2 border-t-jjwin-primary border-x border-b border-jjwin-border rounded-2xl p-3.5 space-y-1 relative overflow-hidden shadow-sm">
            <div className="absolute -right-4 -top-4 w-12 h-12 bg-jjwin-primary/10 rounded-full blur-xl" />
            <div className="flex items-center gap-1 text-xs text-jjwin-textMuted font-bold uppercase relative z-10">
              <Users className="w-3.5 h-3.5 text-jjwin-primary" />
              <span>Referred Friends</span>
            </div>
            <div className="text-2xl font-black font-mono text-white relative z-10">
              {user.referredCount}
            </div>
            <span className="text-[10px] text-jjwin-primary font-bold relative z-10">+1 Active Today</span>
          </div>

          <div className="bg-gradient-to-b from-[#222222] to-[#1c1c1c] border-t-2 border-t-jjwin-gold border-x border-b border-jjwin-border rounded-2xl p-3.5 space-y-1 relative overflow-hidden shadow-sm">
            <div className="absolute -right-4 -top-4 w-12 h-12 bg-jjwin-gold/10 rounded-full blur-xl" />
            <div className="flex items-center gap-1 text-xs text-jjwin-textMuted font-bold uppercase relative z-10">
              <DollarSign className="w-3.5 h-3.5 text-jjwin-gold" />
              <span>Total Commission</span>
            </div>
            <div className="text-2xl font-black font-mono text-jjwin-gold relative z-10">
              {formatPKR(user.commissionEarned)}
            </div>
            <span className="text-[10px] text-jjwin-textMuted relative z-10">Withdrawable anytime</span>
          </div>
        </div>

        {/* Referral Tools */}
        <div className="bg-[#1c1c1c] border border-jjwin-border rounded-3xl p-4 sm:p-5 space-y-4 shadow-card">
          <h3 className="text-xs font-bold uppercase tracking-wider text-jjwin-textMuted">
            Your Invitation Code & Link
          </h3>

          {/* Code */}
          <div className="flex items-center justify-between bg-black/40 border-2 border-dashed border-jjwin-primary/40 rounded-xl px-4 py-3 hover:border-jjwin-primary/60 transition-colors">
            <div>
              <span className="text-[10px] text-jjwin-textMuted block font-bold uppercase">
                Invite Code
              </span>
              <span className="text-lg font-black font-mono text-jjwin-primary tracking-wider drop-shadow-sm">
                {user.referralCode}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 bg-[#252525] hover:bg-[#333333] px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors border border-jjwin-border hover:border-white/20"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-jjwin-primary" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? "Copied" : "Copy"}</span>
            </button>
          </div>

          {/* Link */}
          <div className="flex items-center justify-between bg-[#121212] border border-jjwin-border rounded-xl px-3.5 py-2.5">
            <div className="truncate mr-2">
              <span className="text-[10px] text-jjwin-textMuted block font-bold uppercase">
                Referral Link
              </span>
              <span className="text-xs font-mono text-jjwin-textSecondary truncate block">
                {inviteLink}
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 bg-gradient-to-r from-jjwin-primary to-emerald-400 hover:from-emerald-400 hover:to-jjwin-primary text-black px-3 py-1.5 rounded-lg text-xs font-black shrink-0 transition-all shadow-glow-sm"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Copied" : "Copy Link"}</span>
            </button>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={`https://wa.me/?text=Join%20Okwin%20Pakistan%20and%20claim%20Rs%20888%20bonus!%20${encodeURIComponent(inviteLink)}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => sounds.playClick()}
              className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-white flex items-center justify-center gap-2 text-xs font-black transition-transform hover:scale-[1.02] shadow-lg shadow-[#25D366]/20"
            >
              <MessageCircle className="w-4 h-4 text-white" />
              <span>Share WhatsApp</span>
            </a>

            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=Join%20Okwin%20Pakistan%20and%20claim%20Rs%20888%20bonus!`}
              target="_blank"
              rel="noreferrer"
              onClick={() => sounds.playClick()}
              className="py-2.5 px-3 rounded-xl bg-[#0088cc] hover:bg-[#0077b3] text-white flex items-center justify-center gap-2 text-xs font-black transition-transform hover:scale-[1.02] shadow-lg shadow-[#0088cc]/20"
            >
              <Send className="w-4 h-4 text-white" />
              <span>Share Telegram</span>
            </a>
          </div>
        </div>

        {/* 3 Steps Guide */}
        <div className="bg-[#1c1c1c] border border-jjwin-border rounded-3xl p-4 sm:p-5 space-y-3 shadow-card">
          <h3 className="text-xs font-bold uppercase tracking-wider text-jjwin-textMuted">
            How The Agent Program Works
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-jjwin-primary text-black flex items-center justify-center font-black text-[11px] shrink-0 mt-0.5">
                1
              </div>
              <p className="text-jjwin-textSecondary leading-snug">
                <strong className="text-white">Share Your Link:</strong> Send your invitation link or code to friends and groups.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-jjwin-primary text-black flex items-center justify-center font-black text-[11px] shrink-0 mt-0.5">
                2
              </div>
              <p className="text-jjwin-textSecondary leading-snug">
                <strong className="text-white">Friends Register & Play:</strong> When your friends recharge and place bets in Aviator, Mines, or Slots.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-jjwin-primary text-black flex items-center justify-center font-black text-[11px] shrink-0 mt-0.5">
                3
              </div>
              <p className="text-jjwin-textSecondary leading-snug">
                <strong className="text-white">Collect Lifetime Commissions:</strong> Earn up to 30% automatic rebate transferred directly to your balance!
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
