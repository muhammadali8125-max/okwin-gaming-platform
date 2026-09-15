"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, Volume2, VolumeX, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";
import { wallet } from "@/lib/walletStore";
import { sounds } from "@/lib/soundEngine";
import { formatPKR } from "@/lib/utils";
import { generateMinesGrid, calculateMinesMultiplier, TileState } from "@/lib/games/minesEngine";
import { UserProfile } from "@/lib/types";
import { ProvablyFairModal } from "@/components/common/ProvablyFairModal";

export default function MinesGamePage() {
  const [user, setUser] = useState<UserProfile>(wallet.getDefaultUser());
  const [isMuted, setIsMuted] = useState(false);
  const [isProvablyFairOpen, setIsProvablyFairOpen] = useState(false);

  const [betAmount, setBetAmount] = useState<number>(200);
  const [minesCount, setMinesCount] = useState<number>(3);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [grid, setGrid] = useState<TileState[]>([]);
  const [gemsRevealed, setGemsRevealed] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isWinCashout, setIsWinCashout] = useState<boolean>(false);

  useEffect(() => {
    setUser(wallet.getUser());
    setIsMuted(sounds.getMuted());
    const handleUpdate = () => setUser(wallet.getUser());
    window.addEventListener("jjwin_user_updated", handleUpdate);
    return () => window.removeEventListener("jjwin_user_updated", handleUpdate);
  }, []);

  useEffect(() => {
    setGrid(
      Array.from({ length: 25 }, (_, i) => ({
        index: i,
        isMine: false,
        isRevealed: false,
      }))
    );
  }, []);

  const MAX_WIN_CAP = 50000;
  const currentMultiplier = calculateMinesMultiplier(minesCount, gemsRevealed);
  const nextMultiplier = calculateMinesMultiplier(minesCount, gemsRevealed + 1);
  const currentPayout = Math.min(MAX_WIN_CAP, Math.round(betAmount * currentMultiplier));

  const startGame = () => {
    if (user.balance < betAmount) {
      alert("Insufficient balance! Please deposit.");
      return;
    }

    const ok = wallet.placeBet(betAmount, "Mines");
    if (!ok) return;

    sounds.playCoin();
    const newGrid = generateMinesGrid(minesCount);
    setGrid(newGrid);
    setGemsRevealed(0);
    setIsGameOver(false);
    setIsWinCashout(false);
    setIsPlaying(true);
  };

  const handleTileClick = (index: number) => {
    if (!isPlaying || isGameOver || grid[index].isRevealed) return;

    const targetTile = grid[index];

    if (targetTile.isMine) {
      sounds.playCrash();
      targetTile.isRevealed = true;
      targetTile.isExploded = true;
      const revealedAll = grid.map((tile) => ({ ...tile, isRevealed: true }));
      setGrid(revealedAll);
      setIsGameOver(true);
      setIsPlaying(false);
    } else {
      sounds.playGem();
      targetTile.isRevealed = true;
      const updatedGems = gemsRevealed + 1;
      setGemsRevealed(updatedGems);

      if (updatedGems === 25 - minesCount) {
        handleCashOut(updatedGems);
      }
    }
  };

  const handleCashOut = (forceGems?: number) => {
    const gems = forceGems !== undefined ? forceGems : gemsRevealed;
    if (gems === 0 || !isPlaying) return;

    const finalMultiplier = calculateMinesMultiplier(minesCount, gems);
    const payout = Math.min(MAX_WIN_CAP, Math.round(betAmount * finalMultiplier));

    wallet.creditWin(payout, `Mines (${finalMultiplier}x)`);
    sounds.playWin();

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}

    const revealedAll = grid.map((tile) => ({ ...tile, isRevealed: true }));
    setGrid(revealedAll);
    setIsWinCashout(true);
    setIsPlaying(false);
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#0d0d0d] text-white pb-6 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-emerald-900/10 to-transparent pointer-events-none" />

      {/* Mobile Top Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#121212] border-b border-[#2a2a2a] px-3 py-2.5 flex items-center justify-between shadow-md relative z-10">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            onClick={() => sounds.playClick()}
            className="w-8 h-8 rounded-full bg-[#242424] hover:bg-[#333] flex items-center justify-center text-white transition-all shadow-inner"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 text-base tracking-tight leading-none drop-shadow-sm">MINES</span>
            <span className="text-[9px] font-bold text-gray-400 tracking-wider">Originals • RTP 99%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-amber-900/40 to-yellow-900/20 border border-yellow-600/30 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm">
            <Wallet className="w-3.5 h-3.5 text-yellow-500" />
            <span suppressHydrationWarning className="font-mono font-bold text-xs text-yellow-100">
              {formatPKR(user.balance)}
            </span>
          </div>

          <button
            onClick={() => setIsProvablyFairOpen(true)}
            title="Provably Fair Cryptographic Verification"
            className="w-8 h-8 rounded-full bg-[#242424] hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 flex items-center justify-center transition-all border border-white/5 shadow-inner"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const muted = sounds.toggleMute();
              setIsMuted(muted);
            }}
            className="w-8 h-8 rounded-full bg-[#242424] hover:bg-[#333] flex items-center justify-center text-gray-400 transition-all shadow-inner"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-3 w-full space-y-4 flex-1 flex flex-col items-center z-10 relative">
        {/* Multiplier Info Bar */}
        <div className="w-full bg-gradient-to-r from-[#1a1a1a] to-[#121212] border border-[#333] rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
          <div>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-0.5">
              Current Multiplier
            </span>
            <span className="text-2xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 leading-tight drop-shadow-sm">
              {currentMultiplier.toFixed(2)}x
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-0.5">
              Next Gem
            </span>
            <span className="text-lg font-black font-mono text-emerald-400 leading-tight drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
              {nextMultiplier.toFixed(2)}x
            </span>
          </div>
        </div>

        {/* 5x5 Grid Centered on Mobile */}
        <div className="relative w-full max-w-[360px] aspect-square bg-gradient-to-b from-[#19222a] to-[#10151b] border border-[#2b3a4a] rounded-3xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.6)] grid grid-cols-5 gap-2 ring-1 ring-white/5">
          {grid.map((tile, i) => {
            let tileStyle = "bg-gradient-to-b from-[#2a3746] to-[#1f2937] border-[#3f5166] shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] hover:from-[#334254] hover:to-[#283546]";
            let content = null;

            if (tile.isRevealed) {
              if (tile.isMine) {
                tileStyle = tile.isExploded
                  ? "bg-gradient-to-b from-red-900 to-red-950 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-[1.02]"
                  : "bg-black/80 border-red-900/50 opacity-60";
                content = (
                  <img
                    src="/images/bomb.jpg"
                    alt="Mine"
                    className="w-full h-full object-cover rounded-[10px] p-0.5 filter drop-shadow"
                  />
                );
              } else {
                tileStyle = "bg-gradient-to-b from-emerald-900/80 to-[#0c2430] border-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-[1.02]";
                content = (
                  <img
                    src="/images/gem.jpg"
                    alt="Gem"
                    className="w-full h-full object-cover rounded-[10px] p-0.5 filter drop-shadow brightness-110"
                  />
                );
              }
            }

            return (
              <button
                key={i}
                disabled={!isPlaying || tile.isRevealed}
                onClick={() => handleTileClick(i)}
                className={`relative w-full h-full rounded-xl border-t border-b-2 flex items-center justify-center transition-all duration-200 overflow-hidden ${tileStyle} ${
                  isPlaying && !tile.isRevealed
                    ? "cursor-pointer active:scale-95 active:brightness-110"
                    : "cursor-default"
                }`}
              >
                {content || (
                  <div className="w-3 h-3 rounded-full bg-[#182029] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] opacity-80" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="w-full bg-gradient-to-b from-[#1f1f1f] to-[#151515] border border-[#333] rounded-2xl p-4 space-y-4 shadow-xl">
          {/* Mines Count */}
          <div>
            <div className="flex items-center justify-between mb-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              <span>Mines Count</span>
              <span className="text-red-400 font-mono font-bold bg-red-500/10 px-2 py-0.5 rounded text-[10px] border border-red-500/20">{minesCount} Mines</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 3, 5, 10, 24].map((m) => (
                <button
                  key={m}
                  disabled={isPlaying}
                  onClick={() => {
                    sounds.playClick();
                    setMinesCount(m);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-black border transition-all shadow-sm ${
                    minesCount === m
                      ? "bg-gradient-to-b from-red-500 to-red-700 text-white border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                      : "bg-[#252525] text-gray-400 border-[#333] hover:bg-[#303030] disabled:opacity-50"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Bet Amount */}
          <div>
            <div className="bg-[#111] border border-[#333] focus-within:border-emerald-500/50 focus-within:shadow-[0_0_10px_rgba(16,185,129,0.1)] transition-all rounded-xl px-3 py-2 flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-mono">₨</span>
              <input
                type="number"
                disabled={isPlaying}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(50, Number(e.target.value)))}
                className="w-full bg-transparent text-right font-mono font-bold text-base text-white focus:outline-none disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[100, 200, 500, 1000].map((chip) => (
                <button
                  key={chip}
                  disabled={isPlaying}
                  onClick={() => {
                    sounds.playClick();
                    setBetAmount(chip);
                  }}
                  className="py-1.5 bg-[#2a2a2a] hover:bg-[#383838] border border-[#444] rounded-lg text-[11px] font-mono font-bold text-gray-300 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  +{chip}
                </button>
              ))}
            </div>
          </div>

          {/* Main Button */}
          <div className="pt-2">
            {isPlaying ? (
              <button
                disabled={gemsRevealed === 0}
                onClick={() => handleCashOut()}
                className="w-full py-4 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 disabled:from-amber-900 disabled:to-amber-950 disabled:text-amber-700 disabled:border-amber-900 text-black border border-amber-300 rounded-xl font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all active:scale-[0.98]"
              >
                Cash Out {formatPKR(currentPayout)}
              </button>
            ) : (
              <button
                onClick={startGame}
                className="w-full py-4 bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white border border-emerald-400 rounded-xl font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98]"
              >
                Start Game ({formatPKR(betAmount)})
              </button>
            )}
          </div>

          {isGameOver && (
            <div className="bg-gradient-to-r from-red-900/80 to-red-950/80 border border-red-500/50 rounded-xl p-3 text-center text-xs text-red-200 font-bold shadow-[0_0_10px_rgba(239,68,68,0.2)]">
              💥 BOOM! Mine detonated.
            </div>
          )}

          {isWinCashout && (
            <div className="bg-gradient-to-r from-emerald-900/80 to-emerald-950/80 border border-emerald-500/50 rounded-xl p-3 text-center text-xs text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              🎉 Cashout Win: +{formatPKR(currentPayout)}!
            </div>
          )}
        </div>
      </div>

      <ProvablyFairModal
        isOpen={isProvablyFairOpen}
        onClose={() => setIsProvablyFairOpen(false)}
        gameType="mines"
      />
    </div>
  );
}
