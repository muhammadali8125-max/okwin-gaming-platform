"use client";

import React from "react";
import { GameCategory } from "@/lib/types";
import { Flame, Rocket, Sparkles, Layers, Fish, Video, Trophy } from "lucide-react";
import { sounds } from "@/lib/soundEngine";

interface CategoryTabsProps {
  selectedCategory: GameCategory;
  onSelectCategory: (cat: GameCategory) => void;
}

const CATEGORIES: { id: GameCategory; label: string; icon: React.ElementType }[] = [
  { id: "hot", label: "Hot", icon: Flame },
  { id: "mini", label: "Mini Games", icon: Rocket },
  { id: "slots", label: "Slots", icon: Sparkles },
  { id: "cards", label: "Cards", icon: Layers },
  { id: "fishing", label: "Fishing", icon: Fish },
  { id: "live", label: "Live Casino", icon: Video },
  { id: "sports", label: "Sports", icon: Trophy },
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
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => {
                sounds.playClick();
                onSelectCategory(cat.id);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                isSelected
                  ? "bg-[#78E02C] text-black border-[#78E02C] shadow-[0_0_12px_rgba(120,224,44,0.35)] font-black scale-105"
                  : "bg-[#212121] text-[#888888] border-[#333333] hover:border-gray-600 hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? "text-black" : "text-[#78E02C]"}`} />
              <span>{cat.label}</span>
              {cat.id === "hot" && (
                <span className={`text-[9px] px-1 py-0.2 rounded font-black ${
                  isSelected ? "bg-black/20 text-black" : "bg-[#EA4E3D] text-white"
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
