import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Okwin Casino Operator Admin & Cashier Panel",
  description: "Executive Management Portal, Player Ledger, Cashier Approvals, and Game RTP Engine for Okwin.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen bg-[#0a0e17] text-slate-100 flex flex-col font-sans">
      {children}
    </div>
  );
}
