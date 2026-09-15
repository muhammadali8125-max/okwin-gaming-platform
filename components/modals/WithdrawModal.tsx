"use client";

import React, { useState, useEffect } from "react";

import {
  ChevronLeft,
  Headphones,
  Receipt,
  RotateCw,
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Check,
  Building,
  User,
} from "lucide-react";
import { wallet } from "@/lib/walletStore";
import { sounds } from "@/lib/soundEngine";
import { FinancialRecord } from "@/lib/server/adminBackend";
import {
  EasyPaisaIcon,
  JazzCashIcon,
  BankRaastIcon,
  UsdtIcon,
} from "@/components/common/PaymentIcons";
import { LiveChatModal } from "@/components/common/LiveChatModal";
import { PWAInstallModal } from "@/components/common/PWAInstallModal";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WithdrawalChannel {
  id: string;
  name: string;
  icon: React.FC<{ className?: string; size?: number }>;
  min: number;
  max: number;
  fee: string;
  defaultTitle: string;
  defaultNumber: string;
}

const CHANNELS: WithdrawalChannel[] = [
  {
    id: "easypaisa",
    name: "EasyPaisa",
    icon: EasyPaisaIcon,
    min: 500,
    max: 50000,
    fee: "0%",
    defaultTitle: "Muhammad Zeeshan",
    defaultNumber: "0321 9876543",
  },
  {
    id: "jazzcash",
    name: "JazzCash",
    icon: JazzCashIcon,
    min: 500,
    max: 50000,
    fee: "0%",
    defaultTitle: "Tariq Mahmood",
    defaultNumber: "0300 1234567",
  },
  {
    id: "bank",
    name: "Bank & Raast",
    icon: BankRaastIcon,
    min: 1000,
    max: 100000,
    fee: "0%",
    defaultTitle: "Muhammad Ali",
    defaultNumber: "PK36MEZN0001234567890123",
  },
  {
    id: "usdt",
    name: "USDT (TRC20)",
    icon: UsdtIcon,
    min: 2500,
    max: 200000,
    fee: "0%",
    defaultTitle: "Binance TRC20 Wallet",
    defaultNumber: "TX8qY3M7p9L1k4vB6rE2wN5tZ0uD8sF3gH",
  },
];

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000, 50000];

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose }) => {
  
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedChannelId, setSelectedChannelId] = useState<string>("easypaisa");
  const [amount, setAmount] = useState<string>("1000");
  const [accountTitle, setAccountTitle] = useState<string>("Muhammad Zeeshan");
  const [accountNumber, setAccountNumber] = useState<string>("0321 9876543");
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [submittedRecord, setSubmittedRecord] = useState<FinancialRecord | null>(null);
  const [trackingLoading, setTrackingLoading] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState<boolean>(false);
  const [isPWAOpen, setIsPWAOpen] = useState<boolean>(false);

  useEffect(() => {
    setUserBalance(wallet.getUser().balance);
    const handleUpdate = () => setUserBalance(wallet.getUser().balance);
    window.addEventListener("jjwin_user_updated", handleUpdate);
    return () => window.removeEventListener("jjwin_user_updated", handleUpdate);
  }, []);

  if (!isOpen) return null;

  const selectedChannel = CHANNELS.find((c) => c.id === selectedChannelId) || CHANNELS[0];
  const turnoverStatus = wallet.getTurnoverStatus();
  const parsedAmount = parseFloat(amount) || 0;

  const handleRefreshBalance = () => {
    try { sounds.playClick(); } catch {}
    setIsRefreshingBalance(true);
    setTimeout(() => {
      setUserBalance(wallet.getUser().balance);
      setIsRefreshingBalance(false);
    }, 400);
  };

  const handleSelectChannel = (channel: WithdrawalChannel) => {
    try { sounds.playClick(); } catch {}
    setSelectedChannelId(channel.id);
    setAccountTitle(channel.defaultTitle);
    setAccountNumber(channel.defaultNumber);
    setError("");
  };

  const handlePresetAmount = (val: number) => {
    try { sounds.playClick(); } catch {}
    setAmount(val.toString());
    setError("");
  };

  const handleMaxAmount = () => {
    try { sounds.playClick(); } catch {}
    setAmount(Math.floor(userBalance).toString());
    setError("");
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!accountNumber.trim()) {
      setError("Please enter your receiving account number / IBAN.");
      return;
    }
    if (!accountTitle.trim()) {
      setError("Please enter the beneficiary account name.");
      return;
    }
    if (parsedAmount < selectedChannel.min) {
      setError(`Minimum withdrawal for ${selectedChannel.name} is ₨ ${selectedChannel.min.toLocaleString()}.`);
      return;
    }
    if (parsedAmount > selectedChannel.max) {
      setError(`Maximum withdrawal per transaction is ₨ ${selectedChannel.max.toLocaleString()}.`);
      return;
    }
    if (parsedAmount > userBalance) {
      setError("Insufficient available balance in your wallet.");
      return;
    }

    setLoading(true);

    try {
      const user = wallet.getUser();
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          username: user.username,
          amount: parsedAmount,
          method: selectedChannel.name,
          accountNumber: accountNumber.trim(),
          accountTitle: accountTitle.trim(),
        }),
      });

      const data = await res.json();

      if (data.status === "success" && data.record) {
        wallet.withdraw(parsedAmount, `${selectedChannel.name} (${accountNumber})`, data.record.id);
        try { sounds.playCoin(); } catch {}
        setSubmittedRecord(data.record);
        setStep(2);
      } else {
        setError(data.message || "Withdrawal request failed. Please try again.");
      }
    } catch {
      setError("Connection error. Could not submit request to cashier.");
    } finally {
      setLoading(false);
    }
  };

  const refreshClearanceStatus = async () => {
    if (!submittedRecord) return;
    setTrackingLoading(true);
    try {
      const res = await fetch(`/api/wallet/withdraw?recordId=${submittedRecord.id}`);
      const data = await res.json();
      if (data.status === "success" && data.record) {
        setSubmittedRecord(data.record);
        if (data.record.status === "approved") {
          try { sounds.playWin(); } catch {}
        }
      }
    } catch {
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setStep(1);
    setError("");
    setSubmittedRecord(null);
    setShowHistory(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-0 sm:p-4 text-white animate-in fade-in duration-200">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-[440px] bg-[#0d0e11] sm:border sm:border-[#26272e] sm:rounded-3xl shadow-2xl overflow-y-auto flex flex-col font-sans select-none">
        
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-30 bg-[#0d0e11] px-4 py-3 flex items-center justify-between border-b border-[#1b1c21]">
          <button
            onClick={() => {
              try { sounds.playClick(); } catch {}
              if (step > 1) {
                setStep(1);
              } else {
                handleResetAndClose();
              }
            }}
            className="p-1 -ml-1 text-white hover:text-gray-300 active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <h1 className="text-base font-bold text-white tracking-wide">Withdraw</h1>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                try { sounds.playClick(); } catch {}
                setIsLiveChatOpen(true);
              }}
              title="24/7 VIP Customer Support"
              className="text-[#22c55e] hover:text-[#16a34a] active:scale-95 transition-transform"
            >
              <Headphones className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                try { sounds.playClick(); } catch {}
                setShowHistory(!showHistory);
              }}
              title="Withdrawal Records"
              className="text-[#22c55e] hover:text-[#16a34a] active:scale-95 transition-transform"
            >
              <Receipt className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Withdrawal Records Drawer */}
        {showHistory && (
          <div className="bg-[#14151a] border-b border-[#25262c] p-3 text-xs space-y-2 animate-in slide-in-from-top duration-200">
            <div className="flex justify-between items-center text-gray-400 font-semibold border-b border-white/5 pb-1.5">
              <span>Withdrawal History</span>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
            {wallet.getTransactions().filter((t) => t.type === "withdraw").length === 0 ? (
              <p className="text-gray-500 text-center py-2">No withdrawal requests recorded.</p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 font-mono text-[11px]">
                {wallet
                  .getTransactions()
                  .filter((t) => t.type === "withdraw")
                  .slice(0, 5)
                  .map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5"
                    >
                      <div>
                        <div className="text-white font-bold">{tx.method || "Cashout"}</div>
                        <div className="text-[10px] text-gray-500">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="text-red-400 font-bold">-₨ {tx.amount.toLocaleString()}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 space-y-4">
          
          {/* STEP 1: FORM */}
          {step === 1 && (
            <form onSubmit={handleSubmitWithdrawal} className="space-y-4">
              
              {/* Balance Row */}
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="text-gray-300">Withdrawable Balance</span>
                <div className="inline-flex items-center gap-1.5 bg-[#17181c] border border-[#26272e] rounded-full px-2.5 py-0.5 shadow-sm">
                  <div className="w-4 h-4 rounded-full bg-[#00401A] border border-[#00c853]/60 flex items-center justify-center text-[10px] text-white">
                    ☪
                  </div>
                  <span className="text-[#facc15] font-mono font-bold text-xs">
                    {userBalance.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={handleRefreshBalance}
                    className={`text-[#22c55e] hover:text-emerald-400 transition-transform ml-0.5 ${
                      isRefreshingBalance ? "animate-spin" : "active:rotate-180"
                    }`}
                    title="Refresh Balance"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Wagering Turnover Audit Meter */}
              <div className="bg-[#17181c] border border-[#28292e] rounded-2xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-400 font-bold uppercase tracking-wide flex items-center gap-1">
                    <ShieldCheck size={13} className="text-[#22c55e]" />
                    <span>Wagering Turnover Audit</span>
                  </span>
                  {turnoverStatus.isCompliant ? (
                    <span className="text-[#22c55e] font-bold flex items-center gap-1 font-mono">
                      ✓ 100% Unlocked
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold font-mono">
                      ₨ {turnoverStatus.currentTurnover.toLocaleString()} / ₨ {turnoverStatus.requiredTurnover.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      turnoverStatus.isCompliant ? "bg-[#22c55e]" : "bg-gradient-to-r from-amber-500 to-orange-500"
                    }`}
                    style={{
                      width: `${Math.min(100, (turnoverStatus.currentTurnover / (turnoverStatus.requiredTurnover || 1)) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-500">
                  {turnoverStatus.isCompliant
                    ? "Your account has met the 1x play rollover. Instant withdrawals are enabled."
                    : `Play remaining ₨ ${turnoverStatus.remainingTurnover.toLocaleString()} to unlock zero-delay clearance.`}
                </p>
              </div>

              {/* Payment Method 2x2 Grid */}
              <div className="space-y-2.5">
                <div className="text-sm font-bold text-white tracking-wide">Select Receiving Channel</div>
                <div className="grid grid-cols-2 gap-2.5">
                  {CHANNELS.map((ch) => {
                    const isSelected = selectedChannelId === ch.id;
                    const IconComponent = ch.icon;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => handleSelectChannel(ch)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all active:scale-[0.98] ${
                          isSelected
                            ? "bg-[#18191d] border-[#22c55e] text-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.18)]"
                            : "bg-[#18191d] border-[#28292e] text-white hover:border-gray-600"
                        }`}
                      >
                        <div className="w-9 h-9 shrink-0 flex items-center justify-center">
                          <IconComponent size={34} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-bold truncate ${isSelected ? "text-[#22c55e]" : "text-white"}`}>
                            {ch.name}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">Fee: {ch.fee}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Beneficiary Account Details */}
              <div className="space-y-3 bg-[#18191d] border border-[#28292e] rounded-2xl p-3.5 text-xs">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                    Beneficiary Account Title (Name)
                  </label>
                  <div className="relative group">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e]" />
                    <input
                      type="text"
                      placeholder="e.g. Muhammad Zeeshan"
                      value={accountTitle}
                      onChange={(e) => setAccountTitle(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0d0e11] border border-[#28292e] text-white font-medium focus:outline-none focus:border-[#22c55e] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                    {selectedChannel.id === "bank" ? "Bank IBAN Number (24 Digits)" : "Receiving Mobile / Wallet Number"}
                  </label>
                  <div className="relative group">
                    <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e]" />
                    <input
                      type="text"
                      placeholder={selectedChannel.id === "bank" ? "PK36MEZN0001234567890123" : "0321 9876543"}
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0d0e11] border border-[#28292e] text-white font-mono font-bold focus:outline-none focus:border-[#22c55e] transition"
                    />
                  </div>
                </div>
              </div>

              {/* Withdrawal Amount Section */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white tracking-wide">Withdrawal Amount</span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    Min: ₨ {selectedChannel.min.toLocaleString()}
                  </span>
                </div>

                {/* Amount Input */}
                <div className="relative flex items-center bg-[#16171b] border border-[#2b2424] focus-within:border-[#22c55e] rounded-xl px-3.5 py-3 transition shadow-inner">
                  <span className="text-sm font-bold text-white mr-2.5 font-mono select-none">Rs</span>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent text-sm font-mono font-bold text-white focus:outline-none placeholder:text-gray-600"
                  />
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    className="px-2 py-1 rounded bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40 text-[10px] font-bold uppercase font-mono hover:bg-[#22c55e] hover:text-black transition active:scale-95"
                  >
                    MAX
                  </button>
                </div>

                {/* 8 Preset Buttons (4 cols x 2 rows) */}
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AMOUNTS.map((val) => {
                    const isSelected = parsedAmount === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handlePresetAmount(val)}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition active:scale-95 ${
                          isSelected
                            ? "bg-[#1c241e] border-[#22c55e] text-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.18)]"
                            : "bg-[#18191d] border-[#28292e] text-white hover:border-gray-600"
                        }`}
                      >
                        <span className="font-mono font-bold text-sm text-white leading-tight">
                          {val.toLocaleString()}
                        </span>
                        <span className="font-mono font-semibold text-[10px] text-[#22c55e] leading-tight mt-0.5">
                          0% Fee
                        </span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20 transition active:scale-95"
                  >
                    <span className="font-bold text-xs leading-tight">ALL IN</span>
                    <span className="text-[10px] font-mono leading-tight mt-0.5">Max Cash</span>
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#22c55e] text-black font-black text-sm uppercase tracking-wider shadow-[0_4px_15px_rgba(34,197,94,0.3)] active:scale-98 transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? "Processing..." : `Confirm Withdrawal ₨ ${parsedAmount.toLocaleString()}`}</span>
                <ArrowRight size={16} strokeWidth={3} />
              </button>
            </form>
          )}

          {/* STEP 2: CLEARANCE TRACKER */}
          {step === 2 && submittedRecord && (
            <div className="py-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="text-center space-y-1.5">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#22c55e] text-black flex items-center justify-center shadow-[0_0_25px_rgba(34,197,94,0.4)]">
                  <CheckCircle2 size={36} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Withdrawal In Clearance</h3>
                <p className="text-xs text-gray-400">
                  Transferred to 24/7 Cashier Operator queue.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#18191d] border border-[#28292e] text-xs space-y-2.5">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-gray-400">Amount:</span>
                  <strong className="text-white font-mono font-bold text-base">₨ {submittedRecord.amount.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Channel:</span>
                  <span className="text-white font-bold">{submittedRecord.method}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Account:</span>
                  <span className="text-gray-300 font-mono">{submittedRecord.accountNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    submittedRecord.status === "approved"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse"
                  }`}>
                    {submittedRecord.status === "approved" ? "✓ Cleared & Sent" : "Auditing (5-15 mins)"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-gray-500 text-[10px]">Reference ID:</span>
                  <span className="text-gray-400 font-mono text-[10px]">{submittedRecord.id}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={refreshClearanceStatus}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <RotateCw size={14} className={trackingLoading ? "animate-spin" : ""} />
                  <span>Refresh Status</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="flex-1 py-3 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-black text-xs uppercase tracking-wider transition active:scale-95"
                >
                  Back to Lobby
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FLOATING DOWNLOAD APP BADGE (Matches screenshot bottom-right) */}
        <div
          onClick={() => {
            try { sounds.playClick(); } catch {}
            setIsPWAOpen(true);
          }}
          className="fixed bottom-3 right-3 sm:absolute sm:bottom-3 sm:right-3 z-20 flex items-center gap-1.5 bg-[#172019] border border-[#22c55e]/40 text-[#22c55e] px-2.5 py-1.5 rounded-full shadow-lg text-[10px] font-bold cursor-pointer hover:bg-[#1f2e23] active:scale-95 transition"
        >
          <div className="w-4 h-4 rounded-full bg-[#22c55e] text-black flex items-center justify-center text-[10px]">
            ↓
          </div>
          <span>Bottom</span>
          <span className="bg-[#ef4444] text-white text-[8px] px-1 py-0.2 rounded font-mono">
            ⚡ 08:18:15
          </span>
        </div>

      </div>

      {/* In-App Live Support Chat Desk */}
      <LiveChatModal
        isOpen={isLiveChatOpen}
        onClose={() => setIsLiveChatOpen(false)}
      />
      <PWAInstallModal isOpen={isPWAOpen} onClose={() => setIsPWAOpen(false)} />
    </div>
  );
};
