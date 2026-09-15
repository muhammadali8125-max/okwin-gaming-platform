"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gift, Wallet, Crown, User } from "lucide-react";
import { sounds } from "@/lib/soundEngine";

interface NavItem {
  label: string;
  href: string;
  icon3d: string;
  fallbackIcon: React.ElementType;
  isCenter?: boolean;
}

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { label: "Home", href: "/", icon3d: "/images/icons3d/nav-home.png", fallbackIcon: Home },
    { label: "Promote", href: "/promote", icon3d: "/images/icons3d/nav-promote.png", fallbackIcon: Gift },
    { label: "Wallet", href: "/wallet", icon3d: "/images/icons3d/nav-wallet.png", fallbackIcon: Wallet, isCenter: true },
    { label: "VIP Club", href: "/vip", icon3d: "/images/icons3d/nav-vip.png", fallbackIcon: Crown },
    { label: "Profile", href: "/profile", icon3d: "/images/icons3d/nav-profile.png", fallbackIcon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-[#121418]/95 backdrop-blur-xl border-t border-[#232730] py-1 px-1.5 shadow-[0_-6px_25px_rgba(0,0,0,0.85)]">
      <div className="flex items-center justify-around relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => sounds.playClick()}
                className="relative -top-3 flex flex-col items-center group"
              >
                <div className="w-13 h-13 rounded-full bg-gradient-to-b from-[#FFAA09] via-[#D48806] to-[#8C5500] p-0.5 shadow-[0_4px_18px_rgba(255,170,9,0.45)] group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full bg-[#161a22] flex items-center justify-center p-1 relative overflow-hidden">
                    <div className="absolute inset-0 bg-radial from-[#FFAA09]/20 to-transparent pointer-events-none" />
                    <img
                      src={item.icon3d}
                      alt={item.label}
                      className="w-9 h-9 object-contain drop-shadow-[0_0_8px_rgba(255,170,9,0.6)] group-hover:scale-110 transition-transform"
                    />
                  </div>
                </div>
                <span className="text-[10px] tracking-tight font-black text-[#FFAA09] mt-0.5 drop-shadow-[0_0_4px_rgba(255,170,9,0.3)]">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => sounds.playClick()}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "text-[#78E02C] font-black scale-105"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              <div
                className={`relative w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-[#78E02C]/15 shadow-[0_0_12px_rgba(120,224,44,0.35)] ring-1 ring-[#78E02C]/40"
                    : "opacity-75 group-hover:opacity-100"
                }`}
              >
                <img
                  src={item.icon3d}
                  alt={item.label}
                  className={`w-6 h-6 object-contain transition-transform duration-200 ${
                    isActive ? "scale-115 drop-shadow-[0_0_6px_rgba(120,224,44,0.7)]" : "group-hover:scale-110"
                  }`}
                />
              </div>
              <span className={`text-[10px] tracking-tight ${isActive ? "font-black text-[#78E02C]" : "font-semibold"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

