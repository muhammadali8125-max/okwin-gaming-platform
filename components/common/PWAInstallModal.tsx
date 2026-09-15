"use client";

import React, { useState } from "react";
import {
  X,
  Smartphone,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { usePWAInstall } from "@/lib/usePWAInstall";
import { sounds } from "@/lib/soundEngine";

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [activeTab, setActiveTab] = useState<"android" | "ios">(isIOS ? "ios" : "android");

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    sounds.playClick();
    setInstalling(true);
    try {
      const res = await promptInstall();
      if (res === "accepted") {
        sounds.playCoin();
        onClose();
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 text-white animate-in fade-in duration-200">
      <div className="relative w-full max-w-[420px] bg-[#0d0e11] border border-[#26272e] rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans select-none animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#172019] via-[#14151a] to-[#172019] p-4 flex items-center justify-between border-b border-[#25262c]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#22c55e] to-[#15803d] flex items-center justify-center shadow-lg shadow-green-500/20">
              <Download className="w-4 h-4 text-black font-bold" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                Install Okwin App
                <span className="bg-[#22c55e]/20 text-[#22c55e] text-[9px] px-1.5 py-0.5 rounded font-bold border border-[#22c55e]/30">
                  OFFICIAL
                </span>
              </h2>
              <p className="text-[10px] text-gray-400">Fast, secure & no App Store needed</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Platform Switcher Tabs */}
        <div className="flex p-2 bg-[#121318] border-b border-[#25262c] gap-1.5">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("android");
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "android"
                ? "bg-[#22c55e] text-black shadow-md shadow-green-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Smartphone size={14} />
            <span>Android / Chrome</span>
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("ios");
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "ios"
                ? "bg-[#22c55e] text-black shadow-md shadow-green-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Smartphone size={14} />
            <span>iPhone / iOS Safari</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {/* App Card Preview */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#161820] to-[#121318] border border-[#262833] flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0d0e11] to-[#1c1e26] border border-[#22c55e]/40 p-2 flex flex-col items-center justify-center relative shadow-xl">
              <span className="text-base font-black tracking-tighter text-[#22c55e]">OK</span>
              <span className="text-[8px] font-bold text-amber-400 uppercase tracking-widest -mt-1">WIN</span>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#22c55e] rounded-full flex items-center justify-center text-black">
                <CheckCircle2 size={10} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white leading-snug">Okwin Casino Pakistan</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Version 3.4.2 • 2.4 MB • Zero Lag</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="flex items-center gap-1 text-[10px] text-[#22c55e] font-semibold">
                  <ShieldCheck size={12} /> Safe & Verified
                </span>
                <span className="text-gray-600 text-xs">•</span>
                <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                  <Sparkles size={12} /> ₨ 888 Free
                </span>
              </div>
            </div>
          </div>

          {/* Android View */}
          {activeTab === "android" && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#14161d] border border-white/5 space-y-2">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap size={14} className="text-[#22c55e]" />
                  Why Install the App?
                </div>
                <ul className="text-[11px] text-gray-300 space-y-1.5 pl-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-[#22c55e] shrink-0" />
                    <span>Instant 1-tap lobby access from your home screen</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-[#22c55e] shrink-0" />
                    <span>Real-time withdrawal SMS & TID notifications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-[#22c55e] shrink-0" />
                    <span>60 FPS smooth gameplay on Aviator & Mines</span>
                  </li>
                </ul>
              </div>

              {isInstalled ? (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-1">
                  <p className="text-xs font-bold text-emerald-400">✓ Okwin is Already Installed</p>
                  <p className="text-[11px] text-gray-400">You can launch it directly from your device home screen.</p>
                </div>
              ) : (
                <button
                  onClick={handleInstallClick}
                  disabled={installing}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#2ada67] hover:to-[#18b553] active:scale-95 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-green-500/20 transition flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  <span>{installing ? "Preparing Install..." : "Install Now (1-Tap)"}</span>
                </button>
              )}

              <p className="text-[10px] text-gray-500 text-center">
                If the automatic prompt does not show, open browser menu (⋮) and tap <strong>"Add to Home screen"</strong>.
              </p>
            </div>
          )}

          {/* iOS View */}
          {activeTab === "ios" && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Smartphone size={14} />
                Easy 3-Step Safari Setup for iPhone
              </div>

              <div className="space-y-2 text-xs">
                {/* Step 1 */}
                <div className="p-2.5 rounded-xl bg-[#14151b] border border-white/5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/10 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">Tap the Share Button</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                      Tap the <Share size={12} className="text-blue-400 inline" /> icon at the bottom of Safari.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-2.5 rounded-xl bg-[#14151b] border border-white/5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/10 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">Select "Add to Home Screen"</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                      Scroll down in menu and tap <PlusSquare size={12} className="text-green-400 inline" /> <strong>Add to Home Screen</strong>.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-2.5 rounded-xl bg-[#14151b] border border-white/5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#22c55e] text-black font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">Confirm "Add"</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Tap <strong>Add</strong> in the top-right corner to launch with full screen!
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  sounds.playClick();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition"
              >
                Got It, Thanks!
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#0a0b0d] border-t border-[#1c1d24] text-center text-[10px] text-gray-500">
          Official Okwin Gaming Network • Certified 256-bit SSL Security
        </div>

      </div>
    </div>
  );
};
