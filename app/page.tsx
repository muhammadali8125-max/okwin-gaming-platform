"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { BannerCarousel } from "@/components/lobby/BannerCarousel";
import { WinnerTicker } from "@/components/lobby/WinnerTicker";
import { CategoryTabs } from "@/components/lobby/CategoryTabs";
import { GameGrid } from "@/components/lobby/GameGrid";
import { BottomNav } from "@/components/layout/BottomNav";
import { RechargeModal } from "@/components/modals/RechargeModal";
import { GameCategory } from "@/lib/types";
import { Download, Flame, Trophy, Sparkles, Gift, Hammer } from "lucide-react";
import { sounds } from "@/lib/soundEngine";
import { LuckyWheelModal } from "@/components/gamification/LuckyWheelModal";
import { RedPacketModal } from "@/components/modals/RedPacketModal";
import { PWAInstallModal } from "@/components/common/PWAInstallModal";
import { LiveChatModal } from "@/components/common/LiveChatModal";
import { usePWAInstall } from "@/lib/usePWAInstall";
import Link from "next/link";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>("hot");
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [isRedPacketOpen, setIsRedPacketOpen] = useState(false);
  const [isPWAOpen, setIsPWAOpen] = useState(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [demoNoticeGame, setDemoNoticeGame] = useState<string | null>(null);

  const { promptInstall, showIOSGuide, setShowIOSGuide, isInstalled } = usePWAInstall();

  return (
    <div className="w-full flex-1 flex flex-col pb-20">
      {/* Sticky Mobile Header */}
      <Header onOpenDeposit={() => setIsDepositOpen(true)} />

      {/* Main Mobile Screen Content */}
      <main className="p-2 sm:p-3 w-full space-y-2.5 flex-1">
        {/* Banner Carousel */}
        <BannerCarousel />

        {/* Live Winners Ticker */}
        <WinnerTicker />

        {/* Promotional App Download, Red Packet, Lucky Wheel & Piggy Bank Strip */}
        <div className="grid grid-cols-4 gap-1.5">
          {/* 1. App Install */}
          <div className="bg-gradient-to-b from-[#1a2c16] to-[#121a11] border border-[#78E02C]/30 rounded-xl p-2 flex flex-col justify-between shadow-md relative overflow-hidden group">
            <div className="flex flex-col gap-1 relative z-10">
              <div className="w-6 h-6 rounded-lg bg-[#78E02C]/20 text-[#78E02C] flex items-center justify-center shrink-0">
                <Download className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] font-black text-white block truncate tracking-wide">APP</span>
                <span className="text-[8px] text-[#78E02C] font-bold block font-mono">
                  +₨ 888
                </span>
              </div>
            </div>
            <button
              onClick={() => { sounds.playCoin(); setIsPWAOpen(true); }}
              className="mt-1.5 w-full jjwin-btn py-1 rounded-md text-[8px] text-black font-black uppercase tracking-wider cursor-pointer shadow-sm active:scale-95"
            >
              {isInstalled ? "OPEN" : "GET"}
            </button>
          </div>

          {/* 2. Red Packet Promo Code */}
          <div className="bg-gradient-to-b from-[#3a0e12] to-[#20080a] border border-[#EA4E3D]/40 rounded-xl p-2 flex flex-col justify-between shadow-md relative overflow-hidden group">
            <div className="flex flex-col gap-1 relative z-10">
              <div className="w-7 h-7 rounded-lg bg-[#EA4E3D]/20 text-[#FFAA09] flex items-center justify-center shrink-0 border border-[#FFAA09]/20 overflow-hidden">
                <img src="/images/icons3d/bonus-gift.png" alt="Red Packet" className="w-6 h-6 object-contain drop-shadow-[0_0_6px_rgba(234,78,61,0.6)] group-hover:scale-110 transition-transform" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] font-black text-white block truncate tracking-wide">RED PKT</span>
                <span className="text-[8px] text-[#FFAA09] font-bold block font-mono">
                  CODE
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                setIsRedPacketOpen(true);
              }}
              className="mt-1.5 w-full bg-gradient-to-r from-[#EA4E3D] to-[#c73223] hover:from-[#f05a4a] hover:to-[#EA4E3D] text-white py-1 rounded-md text-[8px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
            >
              CLAIM
            </button>
          </div>

          {/* 3. Lucky Fortune Wheel */}
          <div className="bg-gradient-to-b from-[#332208] to-[#1c1404] border border-[#FFAA09]/40 rounded-xl p-2 flex flex-col justify-between shadow-md relative overflow-hidden group">
            <div className="flex flex-col gap-1 relative z-10">
              <div className="w-7 h-7 rounded-lg bg-[#FFAA09]/20 text-[#FFAA09] flex items-center justify-center shrink-0 overflow-hidden">
                <img src="/images/icons3d/slots-777.png" alt="Wheel" className="w-6 h-6 object-contain drop-shadow-[0_0_6px_rgba(255,170,9,0.6)] group-hover:scale-110 transition-transform" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] font-black text-white block truncate tracking-wide">WHEEL</span>
                <span className="text-[8px] text-[#FFAA09] font-bold block font-mono">
                  +1.8K
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                setIsWheelOpen(true);
              }}
              className="mt-1.5 w-full bg-gradient-to-r from-[#FFAA09] to-[#d98200] hover:from-[#ffba33] hover:to-[#FFAA09] text-black py-1 rounded-md text-[8px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95"
            >
              SPIN
            </button>
          </div>

          {/* 4. Piggy Bank Smash */}
          <Link
            href="/games/piggy-bank"
            onClick={() => sounds.playClick()}
            className="bg-gradient-to-b from-[#332508] to-[#1a1405] border border-[#FFAA09]/40 hover:border-[#FFAA09] rounded-xl p-2 flex flex-col justify-between shadow-md group relative overflow-hidden transition-all"
          >
            <div className="flex flex-col gap-1 relative z-10">
              <div className="w-7 h-7 rounded-lg bg-[#FFAA09]/20 text-[#FFAA09] flex items-center justify-center shrink-0 overflow-hidden">
                <img src="/images/icons3d/cashier-wallet.png" alt="Piggy" className="w-6 h-6 object-contain drop-shadow-[0_0_6px_rgba(255,170,9,0.6)] group-hover:scale-110 transition-transform" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] font-black text-white block truncate tracking-wide">PIGGY</span>
                <span className="text-[8px] text-[#FFAA09] font-bold block font-mono">
                  50X HOT
                </span>
              </div>
            </div>
            <span className="mt-1.5 w-full bg-gradient-to-r from-[#78E02C] to-[#5cb320] text-black py-1 rounded-md text-[8px] font-black uppercase tracking-wider text-center block shadow-sm">
              SMASH
            </span>
          </Link>
        </div>

        {/* Categories Bar */}
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5 drop-shadow-md">
                <Flame className="w-4 h-4 text-orange-500 drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]" />
                <span>Game Categories</span>
              </h2>
              <div className="h-px bg-gradient-to-r from-jjwin-border to-transparent flex-1 ml-2 min-w-[30px]" />
            </div>
            <span className="text-[10px] text-jjwin-textMuted font-mono font-semibold bg-[#1a1a1a] px-2 py-0.5 rounded-full border border-jjwin-border">
              200+ Games
            </span>
          </div>

          <CategoryTabs
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
          />
        </div>

        {/* 3-Column Mobile Game Grid */}
        <GameGrid
          category={selectedCategory}
          onOpenDemoNotice={(name) => setDemoNoticeGame(name)}
        />
      </main>

      {/* Demo Toast Notice */}
      {demoNoticeGame && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-[#1a1a1a] to-[#252525] border border-jjwin-gold/40 text-white text-[11px] px-5 py-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8),_0_0_15px_rgba(234,179,8,0.2)] flex items-center gap-3 w-[90%] max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="w-8 h-8 rounded-full bg-jjwin-gold/10 text-jjwin-gold flex items-center justify-center shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
          <div className="flex-1 leading-tight">
            <span className="font-bold text-white block mb-0.5">{demoNoticeGame}</span>
            <span className="text-slate-400 text-[10px]">Launching soon! Try Aviator, Mines & Crazy 777.</span>
          </div>
          <button
            onClick={() => setDemoNoticeGame(null)}
            className="text-jjwin-gold font-black uppercase px-3 py-1.5 rounded-lg bg-jjwin-gold/10 hover:bg-jjwin-gold/20 transition-colors"
          >
            OK
          </button>
        </div>
      )}

      {/* Recharge Modal */}
      <RechargeModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />

      {/* Daily Lucky Fortune Wheel */}
      <LuckyWheelModal isOpen={isWheelOpen} onClose={() => setIsWheelOpen(false)} />

      {/* Red Packet Voucher Modal */}
      <RedPacketModal isOpen={isRedPacketOpen} onClose={() => setIsRedPacketOpen(false)} />

      {/* iOS PWA Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-b from-[#1c1c1c] to-[#121212] border border-amber-500/30 rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-[0_20px_50px_rgba(0,0,0,0.7),_0_0_20px_rgba(245,158,11,0.1)] animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 flex items-center justify-center mx-auto text-3xl shadow-[0_0_15px_rgba(245,158,11,0.2)] border border-amber-500/20">
              📱
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-white tracking-wide">Install Okwin App</h3>
              <p className="text-[11px] text-amber-200/70 font-medium">For iPhone & iPad</p>
            </div>

            <div className="space-y-3 mt-4 text-left">
              <div className="flex gap-3 items-start p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center font-black text-xs shrink-0 mt-0.5">1</div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  Tap the <strong className="text-amber-400 mx-1 border border-amber-500/30 px-1.5 py-0.5 rounded bg-amber-500/10 inline-flex items-center gap-1">Share <span className="text-lg leading-none">⎙</span></strong> button at the bottom of Safari.
                </div>
              </div>
              <div className="flex gap-3 items-start p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center font-black text-xs shrink-0 mt-0.5">2</div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  Scroll down the menu and tap <strong className="text-white mx-1 font-black">&apos;Add to Home Screen&apos;</strong> <span className="text-lg leading-none inline-block align-middle">➕</span>
                </div>
              </div>
              <div className="flex gap-3 items-start p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center font-black text-xs shrink-0 mt-0.5">3</div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  Launch Okwin from your home screen for full-screen immersive play!
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95"
            >
              GOT IT!
            </button>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation */}
      <PWAInstallModal isOpen={isPWAOpen} onClose={() => setIsPWAOpen(false)} />
      <LiveChatModal isOpen={isLiveChatOpen} onClose={() => setIsLiveChatOpen(false)} />
      <BottomNav />
    </div>
  );
}
