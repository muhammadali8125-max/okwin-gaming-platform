"use client";

import React from "react";
import { GameCategory } from "@/lib/types";
import { Flame, Rocket, Sparkles, Layers, Fish, Video, Trophy } from "lucide-react";
import { sounds } from "@/lib/soundEngine";

interface CategoryTabsProps {
  selectedCategory: GameCategory;
  onSelectCategory: (cat: GameCategory) => void;
}

const CATEGORIES: { id: GameCategory; label: string; icon3d: string; fallbackIcon: React.ElementType }[] = [
  { id: "hot", label: "Hot", icon3d: "/images/icons3d/hot-fire.png", fallbackIcon: Flame },
  { id: "mini", label: "Mini Games", icon3d: "/images/icons3d/crash-rocket.png", fallbackIcon: Rocket },
  { id: "slots", label: "Slots", icon3d: "/images/icons3d/slots-777.png", fallbackIcon: Sparkles },
  { id: "cards", label: "Cards", icon3d: "/images/icons3d/table-cards.png", fallbackIcon: Layers },
  { id: "fishing", label: "Fishing", icon3d: "/images/icons3d/bonus-gift.png", fallbackIcon: Fish },
  { id: "live", label: "Live Casino", icon3d: "/images/icons3d/vip-crown.png", fallbackIcon: Video },
  { id: "sports", label: "Sports", icon3d: "/images/icons3d/sports-trophy.png", fallbackIcon: Trophy },
];

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="w-full overflow-x-auto py-1.5 scrollbar-none">
      <div className="flex items-center gap-2 min-w-max px-0.5">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const Fallback = cat.fallbackIcon;
          return (
            <button
              key={cat.id}
              onClick={() => {
                sounds.playClick();
                onSelectCategory(cat.id);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border ${
                isSelected
                  ? "bg-gradient-to-r from-[#78E02C]/25 to-[#1c2e12] text-white border-[#78E02C] shadow-[0_0_14px_rgba(120,224,44,0.4)] scale-105"
                  : "bg-[#1c1c1c]/90 text-[#a0a0a0] border-[#2c2c2c] hover:border-gray-600 hover:text-white"
              }`}
            >
              <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                <img
                  src={cat.icon3d}
                  alt={cat.label}
                  className={`w-5 h-5 object-contain transition-transform duration-200 ${
                    isSelected ? "scale-115 drop-shadow-[0_0_6px_rgba(120,224,44,0.8)]" : "opacity-80 group-hover:opacity-100"
                  }`}
                  onError={(e) => {
                    // Fallback to hidden if image fails
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <span className={isSelected ? "text-[#78E02C] font-black" : ""}>{cat.label}</span>
              {cat.id === "hot" && (
                <span className={`text-[8px] px-1 py-0.5 rounded font-black tracking-wider uppercase ${
                  isSelected ? "bg-[#EA4E3D] text-white shadow-sm" : "bg-[#EA4E3D]/80 text-white"
                }`}>
                  HOT
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

