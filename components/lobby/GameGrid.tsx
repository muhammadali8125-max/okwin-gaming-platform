"use client";

import React from "react";
import Link from "next/link";
import { GameCategory, GameItem } from "@/lib/types";
import { Play, Star, Flame } from "lucide-react";
import { sounds } from "@/lib/soundEngine";

interface GameGridProps {
  category: GameCategory;
  onOpenDemoNotice?: (gameName: string) => void;
}

export const GAMES_LIST: GameItem[] = [
  {
    id: "aviator",
    name: "Aviator",
    category: "mini",
    provider: "Spribe",
    image: "✈️",
    imageCover: "/images/aviator.jpg",
    isHot: true,
    route: "/games/aviator",
    rating: 4.9,
  },
  {
    id: "mines",
    name: "Mines",
    category: "mini",
    provider: "Spribe",
    image: "💣",
    imageCover: "/images/mines.jpg",
    isHot: true,
    route: "/games/mines",
    rating: 4.9,
  },
  {
    id: "piggy-bank",
    name: "Piggy Bank",
    category: "mini",
    provider: "JILI",
    image: "🐷",
    imageCover: "/images/piggybank.jpg",
    isHot: true,
    route: "/games/piggy-bank",
    rating: 4.9,
  },
  {
    id: "crazy777",
    name: "Crazy 777",
    category: "slots",
    provider: "JILI",
    image: "🎰",
    imageCover: "/images/crazy777.jpg",
    isHot: true,
    route: "/games/slots",
    rating: 4.9,
  },
  {
    id: "fortune-gems",
    name: "Fortune Gems 3",
    category: "slots",
    provider: "JILI",
    image: "💎",
    imageCover: "/images/fortunegems.jpg",
    isHot: true,
    route: "/games/slots",
    rating: 4.8,
  },
  {
    id: "7up7down",
    name: "7 Up Down",
    category: "cards",
    provider: "WG",
    image: "🎲",
    imageCover: "/images/7updown.jpg",
    isHot: true,
    route: "/games/7up-down",
    rating: 4.8,
  },
  {
    id: "super-ace",
    name: "Super Ace",
    category: "slots",
    provider: "JILI",
    image: "♠️",
    imageCover: "/images/superace.jpg",
    isHot: true,
    route: "/games/slots",
    rating: 4.9,
  },
  {
    id: "cricket-9wickets",
    name: "Cricket Bet",
    category: "sports",
    provider: "9Wickets",
    image: "🏏",
    imageCover: "/images/cricket.jpg",
    isHot: true,
    rating: 4.9,
  },
  {
    id: "money-coming",
    name: "Money Coming",
    category: "slots",
    provider: "JILI",
    image: "💰",
    imageCover: "/images/crazy777.jpg",
    isHot: false,
    route: "/games/slots",
    rating: 4.7,
  },
  {
    id: "dragon-tiger",
    name: "Dragon Tiger",
    category: "cards",
    provider: "WG",
    image: "🐉",
    imageCover: "/images/7updown.jpg",
    isHot: false,
    route: "/games/7up-down",
    rating: 4.7,
  },
  {
    id: "happy-fishing",
    name: "Happy Fishing",
    category: "fishing",
    provider: "JILI",
    image: "🎣",
    imageCover: "/images/fortunegems.jpg",
    isHot: true,
    route: "/games/slots",
    rating: 4.8,
  },
  {
    id: "live-baccarat",
    name: "Baccarat",
    category: "live",
    provider: "EVO Live",
    image: "👑",
    imageCover: "/images/superace.jpg",
    isHot: false,
    route: "/games/7up-down",
    rating: 4.9,
  },
  {
    id: "plinko",
    name: "Plinko",
    category: "mini",
    provider: "WG",
    image: "🟢",
    imageCover: "/images/mines.jpg",
    isHot: false,
    route: "/games/mines",
    rating: 4.7,
  },
];

export const GameGrid: React.FC<GameGridProps> = ({ category, onOpenDemoNotice }) => {
  const filteredGames = GAMES_LIST.filter((game) => {
    if (category === "hot") return game.isHot;
    return game.category === category;
  });

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
      {filteredGames.map((game) => {
        const isPlayable = !!game.route;

        const CardContent = (
          <div className="group relative bg-gradient-to-b from-[#242424] to-[#1a1a1a] border border-[#333] hover:border-jjwin-primary/60 rounded-xl overflow-hidden flex flex-col transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-lg hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            {/* Shimmer on Hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] z-20 pointer-events-none" />

            {/* 3D Game Poster Image */}
            <div className="relative w-full aspect-[4/5] bg-[#121212] overflow-hidden">
              {game.imageCover ? (
                <img
                  src={game.imageCover}
                  alt={game.name}
                  className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-500 ease-out"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500">
                  {game.image}
                </div>
              )}

              {/* Gradient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none z-10" />

              {/* Provider Watermark */}
              <div className="absolute top-2 left-2 z-20">
                <span className="bg-black/60 backdrop-blur-md text-white/90 text-[9px] font-black font-mono px-2 py-0.5 rounded-full border border-white/10 shadow-sm uppercase tracking-wide">
                  {game.provider}
                </span>
              </div>

              {/* Hot Tag */}
              {game.isHot && (
                <div className="absolute top-2 right-2 z-20">
                  <span className="flex items-center gap-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(220,38,38,0.8)] uppercase">
                    <Flame className="w-2.5 h-2.5 fill-white animate-pulse" />
                    HOT
                  </span>
                </div>
              )}

              {/* Center Play Overlay on Hover/Touch */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                <div className="w-10 h-10 rounded-full bg-jjwin-primary text-black flex items-center justify-center shadow-[0_0_15px_rgba(120,224,44,0.6)] scale-90 group-hover:scale-100 transition-transform duration-300 delay-75">
                  <Play className="w-5 h-5 fill-black ml-0.5" />
                </div>
              </div>
            </div>

            {/* Gradient Separator */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent relative z-20" />

            {/* Bottom Label */}
            <div className="p-2 bg-gradient-to-b from-[#1c1c1c] to-[#151515] flex flex-col justify-between relative z-20">
              <h3 className="font-extrabold text-xs text-white/90 truncate w-full group-hover:text-jjwin-primary transition-colors leading-tight">
                {game.name}
              </h3>

              <div className="flex items-center justify-between mt-1.5 text-[10px]">
                <span className="flex items-center gap-1 text-jjwin-gold font-bold">
                  <Star className="w-3 h-3 fill-jjwin-gold text-jjwin-gold" />
                  {game.rating}
                </span>

                {isPlayable ? (
                  <span className="text-[9px] text-jjwin-primary font-black uppercase tracking-wider bg-jjwin-primary/10 px-1.5 py-0.5 rounded border border-jjwin-primary/30">
                    PLAY
                  </span>
                ) : (
                  <span className="text-[9px] text-gray-500 font-bold uppercase">
                    DEMO
                  </span>
                )}
              </div>
            </div>
          </div>
        );

        if (isPlayable && game.route) {
          return (
            <Link
              key={game.id}
              href={game.route}
              onClick={() => sounds.playClick()}
              className="block"
            >
              {CardContent}
            </Link>
          );
        }

        return (
          <div
            key={game.id}
            onClick={() => {
              sounds.playClick();
              if (onOpenDemoNotice) onOpenDemoNotice(game.name);
            }}
          >
            {CardContent}
          </div>
        );
      })}
    </div>
  );
};
