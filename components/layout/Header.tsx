"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { wallet } from "@/lib/walletStore";
import { formatPKR } from "@/lib/utils";
import { UserProfile } from "@/lib/types";
import { Wallet, Volume2, VolumeX, PlusCircle, RefreshCw, UserCheck } from "lucide-react";
import { sounds } from "@/lib/soundEngine";
import { AuthModal } from "@/components/auth/AuthModal";

interface HeaderProps {
  onOpenDeposit: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDeposit }) => {
  const [user, setUser] = useState<UserProfile>(wallet.getDefaultUser());
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  useEffect(() => {
    setUser(wallet.getUser());
    setIsMuted(sounds.getMuted());

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<UserProfile>;
      if (customEvent.detail) {
        setUser(customEvent.detail);
      } else {
        setUser(wallet.getUser());
      }
    };

    window.addEventListener("jjwin_user_updated", handleUpdate);
    return () => window.removeEventListener("jjwin_user_updated", handleUpdate);
  }, []);

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    if (!muted) sounds.playClick();
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    sounds.playClick();
    setUser(wallet.getUser());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#141414]/95 backdrop-blur-md border-b border-[#262626] px-3 py-2 flex items-center justify-between shadow-md">
      {/* Okwin Brand Logo */}
      <Link href="/" className="flex items-center gap-1.5 group cursor-pointer">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#78E02C] to-[#5cb320] flex items-center justify-center font-black text-black text-xs shadow-[0_0_12px_rgba(120,224,44,0.35)] tracking-tighter">
          OK
        </div>
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className="font-extrabold text-base tracking-tight text-white group-hover:text-[#78E02C] transition-colors">
              OK<span className="text-[#78E02C]">WIN</span>
            </span>
            <span suppressHydrationWarning className="text-[8px] bg-[#FFAA09]/20 text-[#FFAA09] border border-[#FFAA09]/40 px-1 py-0.2 rounded font-black uppercase">
              VIP {user.vipLevel}
            </span>
          </div>
          <span className="text-[8px] text-[#888888] font-bold tracking-wider uppercase mt-0.5">
            OFFICIAL CASINO
          </span>
        </div>
      </Link>

      {/* Balance & Actions */}
      <div className="flex items-center gap-1.5">
        {/* Balance Card */}
        <div className="bg-[#1c1c1c] border border-[#333333] rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-inner">
          <div className="w-4 h-4 rounded-full bg-[#FFAA09]/20 flex items-center justify-center text-[#FFAA09]">
            <Wallet className="w-2.5 h-2.5" />
          </div>
          <span suppressHydrationWarning className="text-xs font-black text-white font-mono leading-none">
            {formatPKR(user.balance)}
          </span>
          <button
            onClick={handleRefresh}
            title="Refresh Balance"
            className={`text-[#888888] hover:text-white transition-transform ${
              isRefreshing ? "animate-spin" : ""
            }`}
          >
            <RefreshCw className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* Deposit Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onOpenDeposit();
          }}
          className="jjwin-btn px-3 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1 uppercase tracking-wider cursor-pointer shadow-[0_0_12px_rgba(120,224,44,0.35)] active:scale-95"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Deposit</span>
        </button>

        {/* Auth / Account button */}
        <button
          onClick={() => {
            sounds.playClick();
            setIsAuthOpen(true);
          }}
          title="Sign In / Register (+Rs 888 Free)"
          className="w-7 h-7 rounded-full bg-[#202020] border border-[#FFAA09]/40 hover:border-[#FFAA09] flex items-center justify-center text-[#FFAA09] transition"
        >
          <UserCheck className="w-3.5 h-3.5" />
        </button>

        {/* Sound toggle */}
        <button
          onClick={handleToggleSound}
          title={isMuted ? "Unmute" : "Mute"}
          className="w-7 h-7 rounded-full bg-[#202020] border border-[#333333] flex items-center justify-center text-[#888888] hover:text-white"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#EA4E3D]" /> : <Volume2 className="w-3.5 h-3.5 text-[#78E02C]" />}
        </button>
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setUser(wallet.getUser());
        }}
      />
    </header>
  );
};
