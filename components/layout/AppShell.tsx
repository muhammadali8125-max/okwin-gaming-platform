"use client";

import React from "react";
import { usePathname } from "next/navigation";

import { SupportWidget } from "@/components/common/SupportWidget";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isCheckout = pathname?.startsWith("/checkout");

  if (isAdmin) {
    return <div className="w-full min-h-screen bg-[#0a0e17] text-slate-100">{children}</div>;
  }

  if (isCheckout) {
    return <div className="w-full min-h-screen bg-[#f1f5f9] text-slate-900 flex justify-center items-start">{children}</div>;
  }

  return (
    <div className="w-full max-w-[480px] min-h-screen bg-[#141414] border-x border-[#222222]/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col overflow-x-hidden">
      {children}
      <SupportWidget />
    </div>
  );
}
