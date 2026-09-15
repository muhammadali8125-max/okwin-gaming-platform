"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gift, Wallet, Crown, User } from "lucide-react";
import { sounds } from "@/lib/soundEngine";

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Promote", href: "/promote", icon: Gift },
    { label: "Wallet", href: "/wallet", icon: Wallet },
    { label: "VIP Club", href: "/vip", icon: Crown },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-[#141414]/98 backdrop-blur-lg border-t border-[#262626] py-1.5 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.7)]">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => sounds.playClick()}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? "text-[#78E02C] font-black scale-105"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-[#78E02C]/15 text-[#78E02C] shadow-[0_0_10px_rgba(120,224,44,0.3)]"
                    : "text-[#888888]"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
