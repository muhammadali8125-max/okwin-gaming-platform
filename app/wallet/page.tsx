"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Wallet, ArrowDownRight, ArrowUpRight, Clock, PlusCircle, CreditCard, ShieldCheck, Gift } from "lucide-react";
import { wallet } from "@/lib/walletStore";
import { sounds } from "@/lib/soundEngine";
import { formatPKR } from "@/lib/utils";
import { Transaction, UserProfile } from "@/lib/types";
import { RechargeModal } from "@/components/modals/RechargeModal";
import { WithdrawModal } from "@/components/modals/WithdrawModal";
import { RedPacketModal } from "@/components/modals/RedPacketModal";
import { BottomNav } from "@/components/layout/BottomNav";

export default function WalletPage() {
  const [user, setUser] = useState<UserProfile>(wallet.getDefaultUser());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isRedPacketOpen, setIsRedPacketOpen] = useState(false);

  useEffect(() => {
    setUser(wallet.getUser());
    setTransactions(wallet.getTransactions());

    const handleUserUpdate = () => setUser(wallet.getUser());
    const handleTxUpdate = () => setTransactions(wallet.getTransactions());

    window.addEventListener("jjwin_user_updated", handleUserUpdate);
    window.addEventListener("jjwin_tx_updated", handleTxUpdate);

    return () => {
      window.removeEventListener("jjwin_user_updated", handleUserUpdate);
      window.removeEventListener("jjwin_tx_updated", handleTxUpdate);
    };
  }, []);

  const filtered = transactions.filter((tx) => {
    if (activeFilter === "all") return true;
    return tx.type === activeFilter;
  });

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#181818] to-[#121212] border-b border-jjwin-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={() => sounds.playClick()}
            className="w-8 h-8 rounded-full bg-[#242424] hover:bg-[#333333] flex items-center justify-center text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-extrabold text-base tracking-tight text-white">Wallet & Cashier</h1>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-lg mx-auto w-full space-y-4">
        {/* Balance Card */}
        <div className="w-full bg-gradient-to-br from-[#1c2c1c] via-[#1a221a] to-[#121212] border border-jjwin-primary/30 rounded-3xl p-5 shadow-glow relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 z-0" />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4ADE80_1px,transparent_1px)] [background-size:16px_16px] z-0" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between text-xs text-jjwin-textSecondary font-bold">
              <span>Main Account Balance</span>
              <span className="bg-jjwin-primary/20 text-jjwin-primary px-2 py-0.5 rounded-full text-[10px] border border-jjwin-primary/20">
                Active PKR (₨)
              </span>
            </div>

            <div suppressHydrationWarning className="text-3xl font-black font-mono text-white mt-2 mb-4 tracking-tight drop-shadow-md">
              {formatPKR(user.balance)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-black/50 rounded-xl p-3 border border-white/5 mb-4 backdrop-blur-sm">
              <div>
                <span className="text-jjwin-textMuted block text-[10px]">Bonus Balance</span>
                <span suppressHydrationWarning className="text-jjwin-gold font-bold">{formatPKR(user.bonusBalance)}</span>
              </div>
              <div>
                <span className="text-jjwin-textMuted block text-[10px]">VIP Points</span>
                <span suppressHydrationWarning className="text-white font-bold">{user.vipPoints} pts</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsDepositOpen(true);
                }}
                className="bg-gradient-to-r from-jjwin-primary to-emerald-400 hover:from-emerald-400 hover:to-jjwin-primary text-black py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-glow transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Deposit</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setIsWithdrawOpen(true);
                }}
                className="bg-gradient-to-r from-[#2a2a2a] to-[#222222] hover:from-[#333333] hover:to-[#2a2a2a] border border-jjwin-border hover:border-jjwin-gold/50 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <CreditCard className="w-4 h-4 text-jjwin-gold" />
                <span>Withdraw</span>
              </button>
            </div>
          </div>
        </div>

        {/* Red Packet Voucher Banner */}
        <button
          onClick={() => {
            sounds.playClick();
            setIsRedPacketOpen(true);
          }}
          className="w-full bg-gradient-to-r from-[#5a0c12] via-[#40080c] to-[#1c0507] hover:from-[#6d0f16] border border-red-500/40 p-3 rounded-2xl flex items-center justify-between transition-all group text-left shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-yellow-300 flex items-center justify-center shrink-0 border border-yellow-400/20">
              <Gift className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-xs font-black text-white group-hover:text-yellow-300 transition flex items-center gap-1.5">
                Red Packet Gift Voucher
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-yellow-400/20 text-yellow-300 font-mono font-bold">
                  FREE CASH
                </span>
              </div>
              <div className="text-[10px] text-amber-200/70 font-medium">
                Enter code OKWIN888 or FREE500 for instant wallet balance
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
        </button>

        {/* Developer / B2B Webhook Sandbox Banner */}
        <Link
          href="/admin/api-tester"
          className="w-full bg-[#181818] hover:bg-[#202020] border border-amber-500/30 hover:border-amber-500/60 p-3 rounded-2xl flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white group-hover:text-amber-300 transition flex items-center gap-1.5">
                Seamless Wallet API Sandbox
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">B2B API</span>
              </div>
              <div className="text-[10px] text-jjwin-textMuted">
                Test balance, debit, credit, idempotency & rollbacks
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-jjwin-textMuted group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* Transactions History Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-jjwin-primary" />
              <span>Transaction History</span>
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 text-xs">
            {["all", "deposit", "withdraw", "bet", "win", "bonus"].map((type) => (
              <button
                key={type}
                onClick={() => {
                  sounds.playClick();
                  setActiveFilter(type);
                }}
                className={`px-3 py-1 rounded-full uppercase text-[10px] font-bold border transition-all ${
                  activeFilter === type
                    ? "bg-gradient-to-r from-jjwin-primary to-emerald-400 text-black border-transparent shadow-glow-sm"
                    : "bg-[#1f1f1f] hover:bg-[#252525] text-jjwin-textSecondary border-jjwin-border"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Transactions List */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="bg-[#181818] border border-jjwin-border rounded-2xl p-6 text-center text-xs text-jjwin-textMuted">
                No transactions found under this category.
              </div>
            ) : (
              filtered.map((tx) => {
                const isPositive = tx.type === "win" || tx.type === "deposit" || tx.type === "bonus" || tx.type === "commission";
                return (
                  <div
                    key={tx.id}
                    className="relative bg-[#181818] hover:bg-[#1c1c1c] border border-jjwin-border/70 hover:border-jjwin-border rounded-2xl p-3 flex items-center justify-between text-xs transition-all group overflow-hidden"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <div className="flex items-center gap-2.5 pl-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isPositive ? "bg-emerald-950/80 text-jjwin-primary" : "bg-red-950/80 text-jjwin-red"
                        }`}
                      >
                        {isPositive ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>

                      <div>
                        <span className="font-extrabold text-white block capitalize">
                          {tx.gameTitle || tx.method || tx.type}
                        </span>
                        <span className="text-[10px] text-jjwin-textMuted font-mono">
                          {new Date(tx.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-mono font-black text-sm block ${
                          isPositive ? "text-jjwin-primary group-hover:text-emerald-400" : "text-jjwin-red group-hover:text-red-400"
                        } transition-colors`}
                      >
                        {isPositive ? "+" : "-"}
                        {formatPKR(tx.amount)}
                      </span>
                      {tx.type === "withdraw" && tx.status === "pending" ? (
                        <button
                          onClick={() => {
                            sounds.playClick();
                            setIsWithdrawOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[9px] uppercase font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 hover:bg-amber-500/20 transition animate-pulse"
                        >
                          <span>Pending • Track</span>
                        </button>
                      ) : (
                        <span className="text-[9px] uppercase font-bold text-jjwin-textMuted">
                          {tx.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <RechargeModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
      <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} />
      <RedPacketModal isOpen={isRedPacketOpen} onClose={() => setIsRedPacketOpen(false)} />
      <BottomNav />
    </div>
  );
}
