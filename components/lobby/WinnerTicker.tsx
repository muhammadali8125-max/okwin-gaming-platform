"use client";

import React, { useEffect, useState } from "react";
import { Volume2, Trophy } from "lucide-react";

interface WinnerNotice {
  user: string;
  game: string;
  amount: number;
}

const INITIAL_WINNERS: WinnerNotice[] = [
  { user: "030***912", game: "Aviator", amount: 48500 },
  { user: "034***108", game: "Crazy 777", amount: 125000 },
  { user: "031***654", game: "Mines", amount: 18200 },
  { user: "033***421", game: "Fortune Gems", amount: 64000 },
  { user: "032***887", game: "Aviator", amount: 92300 },
  { user: "030***333", game: "7 Up Down", amount: 24500 },
];

export const WinnerTicker: React.FC = () => {
  const [winners, setWinners] = useState<WinnerNotice[]>(INITIAL_WINNERS);

  useEffect(() => {
    // Periodically add new simulated winners
    const interval = setInterval(() => {
      const randomUser = `03${Math.floor(Math.random() * 5)}${Math.floor(Math.random() * 9)}***${Math.floor(Math.random() * 900 + 100)}`;
      const games = ["Aviator", "Mines", "Crazy 777", "Fortune Gems", "7 Up Down"];
      const amounts = [14200, 28500, 52000, 89000, 150000, 310000];
      const newWin: WinnerNotice = {
        user: randomUser,
        game: games[Math.floor(Math.random() * games.length)],
        amount: amounts[Math.floor(Math.random() * amounts.length)],
      };
      setWinners((prev) => [newWin, ...prev.slice(0, 7)]);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-gradient-to-r from-[#1a1a1a] to-[#121212] border border-jjwin-border/80 rounded-xl px-3 py-2.5 flex items-center gap-3 overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-2 text-jjwin-gold shrink-0 font-black text-xs uppercase tracking-wider pr-3 border-r border-white/10">
        <div className="relative flex items-center justify-center">
          <span className="absolute w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-75"></span>
          <span className="relative w-1.5 h-1.5 bg-green-500 rounded-full"></span>
        </div>
        <Trophy className="w-3.5 h-3.5 text-jjwin-gold" />
        <span className="hidden sm:inline">Recent Wins</span>
      </div>

      <div className="relative flex-1 overflow-hidden h-5">
        <div className="absolute flex items-center gap-6 whitespace-nowrap animate-ticker">
          {winners.map((win, idx) => (
            <div key={idx} className="inline-flex items-center gap-1.5 text-xs text-jjwin-textSecondary">
              <span className="text-white font-mono font-medium">{win.user}</span>
              <span className="text-gray-400">won</span>
              <span className="text-[#00ff66] font-mono font-black tracking-tight drop-shadow-[0_0_2px_rgba(0,255,102,0.3)]">
                🪙 ₨ {win.amount.toLocaleString()}
              </span>
              <span className="text-gray-400">in</span>
              <span className="text-jjwin-gold font-bold">{win.game}</span>
              <span className="text-white/10 mx-2">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
