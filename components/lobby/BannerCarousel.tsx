"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { sounds } from "@/lib/soundEngine";

const SLIDES = [
  {
    id: 1,
    title: "OKWIN VIP CLUB",
    subtitle: "Weekly PKR 10M Prize Pool & Lifetime Rebates",
    highlight: "ROLEX GREEN VIP",
    buttonText: "Join VIP",
    link: "/vip",
    badge: "👑 EXCLUSIVE PRIVILEGE",
    bgImage: "/images/hero_vip_banner.jpg",
  },
  {
    id: 2,
    title: "SPRIBE AVIATOR",
    subtitle: "High-Stakes Stunt Racing • Cash Out Before Crash",
    highlight: "UP TO 1,000X",
    buttonText: "Play Now",
    link: "/games/aviator",
    badge: "🔥 #1 IN PAKISTAN",
    bgImage: "/images/aviator.jpg",
  },
  {
    id: 3,
    title: "CRAZY 777 SLOTS",
    subtitle: "Spin 4th Multiplier Reel with 10X Mega Multipliers",
    highlight: "JACKPOT ₨ 5,000,000",
    buttonText: "Spin Slots",
    link: "/games/slots",
    badge: "⭐ JILI ORIGINAL",
    bgImage: "/images/crazy777.jpg",
  },
];

export const BannerCarousel: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[currentIdx];

  return (
    <div className="relative w-full h-44 sm:h-48 overflow-hidden rounded-2xl border border-jjwin-border/70 shadow-xl group select-none bg-[#121212]">
      {/* Slides */}
      {SLIDES.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
            idx === currentIdx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src={slide.bgImage}
              alt={slide.title}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-black/60 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/20" />
          </div>

          {/* Content */}
          <div className="relative z-20 w-full h-full p-4 sm:p-5 flex flex-col justify-between">
            <div className="space-y-1.5 max-w-[280px]">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-b from-white/10 to-black/60 backdrop-blur-md border border-white/20 text-white shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                <span>{slide.badge}</span>
              </div>

              <h2 className="text-2xl font-black tracking-tighter text-white leading-none drop-shadow-lg">
                {slide.title}
              </h2>

              <div className="text-sm font-black font-mono tracking-tight text-jjwin-primary drop-shadow-md">
                {slide.highlight}
              </div>

              <p className="text-xs text-gray-300 font-medium line-clamp-2 leading-relaxed drop-shadow">
                {slide.subtitle}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Link
                href={slide.link}
                onClick={() => sounds.playClick()}
                className="relative inline-flex items-center gap-1.5 jjwin-btn px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-glow-sm overflow-hidden group/btn"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[150%] group-hover/btn:translate-x-[150%] transition-transform duration-700 ease-in-out" />
                <span className="relative z-10">{slide.buttonText}</span>
                <ChevronRight className="w-3.5 h-3.5 relative z-10" />
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Dots Indicator (Moved outside slides so it doesn't duplicate) */}
      <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-full border border-white/10 shadow-lg">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              sounds.playClick();
              setCurrentIdx(idx);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIdx ? "w-6 bg-jjwin-primary shadow-glow-sm" : "w-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
