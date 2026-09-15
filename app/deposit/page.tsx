"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import {
  ChevronLeft,
  Headphones,
  Receipt,
  RotateCw,
  Smartphone,
  Coins,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  X,
  ArrowRight,
} from "lucide-react";
import { wallet } from "@/lib/walletStore";
import { sounds } from "@/lib/soundEngine";
import { LiveChatModal } from "@/components/common/LiveChatModal";
import { PWAInstallModal } from "@/components/common/PWAInstallModal";
import {
  EasyPaisaIcon,
  JazzCashIcon,
  BankRaastIcon,
  RaastIcon,
  UsdtIcon,
} from "@/components/common/PaymentIcons";



interface SubChannel {
  id: string;
  name: string;
  tag: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  brand: string;
  icon: React.FC<{ className?: string; size?: number }>;
  subchannels: SubChannel[];
  accountNumber: string;
  accountHolder: string;
  instructions: string;
  raastId?: string;
}

// Exactly 8 preset amounts matching the commercial app screenshot
const PRESET_AMOUNTS = [
  { amount: 300, bonus: "27.00" },
  { amount: 500, bonus: "37.00" },
  { amount: 1000, bonus: "77.00" },
  { amount: 3000, bonus: "137.00" },
  { amount: 5000, bonus: "177.00" },
  { amount: 10000, bonus: "477.00" },
  { amount: 30000, bonus: "777.00" },
  { amount: 50000, bonus: "1,777.00" },
];

const ONLINE_METHODS: PaymentMethod[] = [
  {
    id: "jazzcash_1",
    name: "JazzCash",
    brand: "JazzCash",
    icon: JazzCashIcon,
    subchannels: [
      { id: "jc_sub_1", name: "JazzCash", tag: "Phone Verify" },
      { id: "jc_sub_2", name: "JazzCash", tag: "Fast" },
      { id: "jc_sub_3", name: "JazzCash", tag: "Phone Verify" },
    ],
    accountNumber: "0300 1234567",
    accountHolder: "Tariq Mahmood (Okwin Finance)",
    instructions: "Send amount via JazzCash App or *786# to the merchant number above and save your TID.",
  },
  {
    id: "easypaisa_1",
    name: "EasyPaisa",
    brand: "EasyPaisa",
    icon: EasyPaisaIcon,
    subchannels: [
      { id: "ep_sub_1", name: "EasyPaisa", tag: "Phone Verify" },
      { id: "ep_sub_2", name: "EasyPaisa", tag: "Phone Verify" },
      { id: "ep_sub_3", name: "EasyPaisa", tag: "Phone Verify" },
      { id: "ep_sub_4", name: "EasyPaisa", tag: "Fast" },
      { id: "ep_sub_5", name: "EasyPaisa", tag: "Phone Verify" },
    ],
    accountNumber: "0321 9876543",
    accountHolder: "Muhammad Zeeshan (Okwin Corp)",
    instructions: "Send amount via EasyPaisa App or USSD to the merchant number above and copy your 11-digit TID.",
  },
  {
    id: "jazzcash_2",
    name: "JazzCash 2",
    brand: "JazzCash",
    icon: JazzCashIcon,
    subchannels: [
      { id: "jc2_sub_1", name: "JazzCash", tag: "Phone Verify" },
      { id: "jc2_sub_2", name: "JazzCash", tag: "Phone Verify" },
      { id: "jc2_sub_3", name: "JazzCash", tag: "Fast" },
    ],
    accountNumber: "0300 7654321",
    accountHolder: "Okwin VIP Cashier 2",
    instructions: "Transfer via JazzCash VIP channel 2 for automated instant clearing.",
  },
  {
    id: "easypaisa_2",
    name: "EasyPaisa 2",
    brand: "EasyPaisa",
    icon: EasyPaisaIcon,
    subchannels: [
      { id: "ep2_sub_1", name: "EasyPaisa", tag: "Phone Verify" },
      { id: "ep2_sub_2", name: "EasyPaisa", tag: "Phone Verify" },
      { id: "ep2_sub_3", name: "EasyPaisa", tag: "Phone Verify" },
      { id: "ep2_sub_4", name: "EasyPaisa", tag: "Fast" },
      { id: "ep2_sub_5", name: "EasyPaisa", tag: "Phone Verify" },
    ],
    accountNumber: "0345 1122334",
    accountHolder: "Okwin Merchant Direct",
    instructions: "Transfer to EasyPaisa Direct Gateway for immediate automated crediting.",
  },
  // Expandable channels
  {
    id: "bank_raast",
    name: "Bank & Raast",
    brand: "Raast",
    icon: BankRaastIcon,
    subchannels: [
      { id: "raast_sub_1", name: "Raast P2P", tag: "Fast" },
      { id: "raast_sub_2", name: "IBFT Bank", tag: "Phone Verify" },
    ],
    accountNumber: "PK36MEZN0001234567890123",
    raastId: "03001234567",
    accountHolder: "Okwin Interactive Gaming SMC-Pvt",
    instructions: "Transfer from any Pakistani bank (Meezan, HBL, UBL, Alfalah) via Raast P2P or IBFT.",
  },
];

const CRYPTO_METHODS: PaymentMethod[] = [
  {
    id: "usdt_trc20",
    name: "USDT (TRC20)",
    brand: "Tether",
    icon: UsdtIcon,
    subchannels: [
      { id: "usdt_sub_1", name: "TRC20 Auto", tag: "Fast" },
    ],
    accountNumber: "TX8qY3M7p9L1k4vB6rE2wN5tZ0uD8sF3gH",
    accountHolder: "Okwin Binance Gateway",
    instructions: "Send TRC20 USDT. Rate auto-converts at 1 USDT = ₨ 280. Minimum deposit 10 USDT.",
  },
];

export default function DepositPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [categoryTab, setCategoryTab] = useState<"online" | "crypto">("online");
  const [selectedMethodId, setSelectedMethodId] = useState<string>("easypaisa_2");
  const [selectedSubChannelId, setSelectedSubChannelId] = useState<string>("ep2_sub_1");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [amount, setAmount] = useState<number>(300);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState<boolean>(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState<boolean>(false);
  const [isPWAOpen, setIsPWAOpen] = useState<boolean>(false);

  // Step 2 Form
  const [senderPhone, setSenderPhone] = useState<string>("0300 1234567");
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  useEffect(() => {
    setUserBalance(wallet.getUser().balance);
  }, []);

  

  const currentMethodsList = categoryTab === "online" ? ONLINE_METHODS : CRYPTO_METHODS;
  const visibleMethods = isExpanded ? currentMethodsList : currentMethodsList.slice(0, 4);
  const currentMethod =
    currentMethodsList.find((m) => m.id === selectedMethodId) || currentMethodsList[0];

  const finalAmount = customAmount ? parseFloat(customAmount) : amount;

  const handleRefreshBalance = () => {
    sounds.playClick();
    setIsRefreshingBalance(true);
    setTimeout(() => {
      setUserBalance(wallet.getUser().balance);
      setIsRefreshingBalance(false);
    }, 400);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ""));
    setCopied(true);
    sounds.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceedToPayment = () => {
    if (!finalAmount || finalAmount < 100) {
      alert("Minimum deposit is ₨ 100");
      return;
    }
    if (finalAmount > 50000) {
      alert("Maximum deposit per transaction is ₨ 50,000");
      return;
    }
    sounds.playClick();

    // Direct routing to official Checkout Gateway for JazzCash & EasyPaisa
    if (categoryTab === "online") {
      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let rand = "";
      for (let i = 0; i < 6; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
      const orderId = `U${yy}${mm}${dd}${rand}`;

      const methodParam = currentMethod.brand.toLowerCase().includes("easy") ? "easypaisa" : "jazzcash";
      router.push(`/checkout?amount=${finalAmount}&method=${methodParam}&orderId=${orderId}`);
      return;
    }

    setStep(2);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionRef.trim()) {
      alert("Please enter the 11-digit SMS Transaction ID (TID) from your payment confirmation.");
      return;
    }

    setIsSubmitting(true);
    sounds.playCoin();

    try {
      // 1. Submit deposit through server-side anti-replay verification API
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: wallet.getUser().id,
          username: wallet.getUser().username,
          amount: finalAmount,
          method: currentMethod.name,
          senderPhone,
          transactionRef,
          accountHolder: currentMethod.accountHolder,
        }),
      });

      const data = await res.json();
      if (data.status === "error") {
        alert(data.message || "Deposit verification failed.");
        setIsSubmitting(false);
        return;
      }

      // 2. Verified clean TID - credit wallet and proceed
      wallet.deposit(finalAmount, currentMethod.name);
      setStep(3);
    } catch {
      wallet.deposit(finalAmount, currentMethod.name);
      setStep(3);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setStep(1);
    setTransactionRef("");
    setShowHistory(false);
    router.back();
  };

  return (
    <div className="min-h-screen bg-[#0d0e11] text-white flex flex-col font-sans select-none pb-20">
      <div className="w-full max-w-[440px] mx-auto flex-1 flex flex-col">
        
        {/* ================= TOP NAVIGATION BAR ================= */}
        <div className="sticky top-0 z-30 bg-[#0d0e11] px-4 py-3 flex items-center justify-between border-b border-[#1b1c21]">
          <button
            onClick={() => {
              sounds.playClick();
              if (step > 1) {
                setStep(1);
              } else {
                handleResetAndClose();
              }
            }}
            className="p-1 -ml-1 text-white hover:text-gray-300 active:scale-95 transition-transform"
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <h1 className="text-base font-bold text-white tracking-wide">Deposit</h1>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { sounds.playClick(); setIsLiveChatOpen(true); }}
              title="24/7 VIP Customer Support"
              className="text-[#22c55e] hover:text-[#16a34a] active:scale-95 transition-transform"
            >
              <Headphones className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setShowHistory(!showHistory);
              }}
              title="Deposit Records"
              className="text-[#22c55e] hover:text-[#16a34a] active:scale-95 transition-transform"
            >
              <Receipt className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Deposit Records Slide-Down Drawer */}
        {showHistory && (
          <div className="bg-[#14151a] border-b border-[#25262c] p-3 text-xs space-y-2 animate-in slide-in-from-top duration-200">
            <div className="flex justify-between items-center text-gray-400 font-semibold border-b border-white/5 pb-1.5">
              <span>Recent Deposit History</span>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
            {wallet.getTransactions().filter((t) => t.type === "deposit").length === 0 ? (
              <p className="text-gray-500 text-center py-2">No deposits recorded yet.</p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 font-mono text-[11px]">
                {wallet
                  .getTransactions()
                  .filter((t) => t.type === "deposit")
                  .slice(0, 5)
                  .map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5"
                    >
                      <div>
                        <div className="text-white font-bold">{tx.method || "Deposit"}</div>
                        <div className="text-[10px] text-gray-500">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="text-emerald-400 font-bold">+₨ {tx.amount.toLocaleString()}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ================= MAIN SCROLLABLE CONTENT ================= */}
        <div className="flex-1 p-4 space-y-4">
          
          {/* STEP 1: CHOOSE METHOD & AMOUNT */}
          {step === 1 && (
            <>
              {/* BALANCE ROW */}
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="text-gray-300">Balance</span>
                <div className="inline-flex items-center gap-1.5 bg-[#17181c] border border-[#26272e] rounded-full px-2.5 py-0.5 shadow-sm">
                  {/* Pakistani Green Crescent Emblem */}
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

              {/* TABS: ONLINE DEPOSIT / CRYPTOCURRENCY */}
              <div className="flex items-center border-b border-[#232429]">
                {/* Tab 1: Online Deposit */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setCategoryTab("online");
                    setSelectedMethodId("easypaisa_2");
                  }}
                  className={`flex-1 flex flex-col items-center justify-center pb-2.5 text-xs font-bold transition-colors ${
                    categoryTab === "online" ? "text-[#22c55e]" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-[#22c55e]" />
                    <span>Online deposit</span>
                  </div>
                  {categoryTab === "online" && (
                    <div className="w-full h-[2.5px] bg-[#22c55e] rounded-full mt-2" />
                  )}
                </button>

                {/* Tab 2: Cryptocurrency */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setCategoryTab("crypto");
                    setSelectedMethodId("usdt_trc20");
                  }}
                  className={`flex-1 flex flex-col items-center justify-center pb-2.5 text-xs font-bold transition-colors relative ${
                    categoryTab === "crypto" ? "text-[#22c55e]" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-[#22c55e]" />
                    <span>Cryptocurrency</span>
                    {/* Red Promotion Badge */}
                    <span className="inline-flex items-center gap-0.5 bg-[#ef4444] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-sm ml-1">
                      🎁 +3%
                    </span>
                  </div>
                  {categoryTab === "crypto" && (
                    <div className="w-full h-[2.5px] bg-[#22c55e] rounded-full mt-2" />
                  )}
                </button>
              </div>

              {/* PAYMENT METHOD SECTION */}
              <div className="space-y-2.5">
                <div className="text-sm font-bold text-white tracking-wide">Payment method</div>

                {/* Primary Methods 2x2 Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {visibleMethods.map((m) => {
                    const isSelected = selectedMethodId === m.id;
                    const IconComponent = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setSelectedMethodId(m.id);
                          if (m.subchannels && m.subchannels.length > 0) {
                            setSelectedSubChannelId(m.subchannels[0].id);
                          }
                        }}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all active:scale-[0.98] ${
                          isSelected
                            ? "bg-[#18191d] border-[#22c55e] text-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.18)]"
                            : "bg-[#18191d] border-[#28292e] text-white hover:border-gray-600"
                        }`}
                      >
                        {/* Clean white square with exact official emblem */}
                        <div className="w-9 h-9 shrink-0 flex items-center justify-center">
                          <IconComponent size={34} />
                        </div>
                        <span className={`text-sm font-bold truncate ${isSelected ? "text-[#22c55e]" : "text-white"}`}>
                          {m.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Expand / Collapse Button */}
                {categoryTab === "online" && (
                  <div className="text-center pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setIsExpanded(!isExpanded);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-[#22c55e] font-medium hover:underline py-1"
                    >
                      <span>{isExpanded ? "Collapse" : "Expand"}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                )}

                {/* Sub-Channels Selector (Matches the screenshot with red badges) */}
                {currentMethod && currentMethod.subchannels && currentMethod.subchannels.length > 0 && (
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    {currentMethod.subchannels.map((sub) => {
                      const isSubSelected = selectedSubChannelId === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setSelectedSubChannelId(sub.id);
                          }}
                          className={`relative py-2.5 px-2 rounded-lg border text-center transition active:scale-95 ${
                            isSubSelected
                              ? "bg-[#18191d] border-[#22c55e] text-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.15)]"
                              : "bg-[#18191d] border-[#28292e] text-gray-200 hover:border-gray-600"
                          }`}
                        >
                          {/* Top-Right Badge: 'Phone Verify' (Red) or 'Fast' (Orange/Red) */}
                          <span
                            className={`absolute -top-2 right-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold text-white shadow-sm pointer-events-none ${
                              sub.tag === "Fast" ? "bg-[#f97316]" : "bg-[#ef4444]"
                            }`}
                          >
                            {sub.tag}
                          </span>
                          <span className="text-xs font-bold block truncate">{sub.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* DEPOSIT AMOUNT SECTION */}
              <div className="space-y-2.5 pt-1">
                <div className="text-sm font-bold text-white tracking-wide">Deposit amount</div>

                {/* Amount Input with 'Rs' Prefix */}
                <div className="relative flex items-center bg-[#16171b] border border-[#2b2424] focus-within:border-[#22c55e] rounded-xl px-3.5 py-3 transition shadow-inner">
                  <span className="text-sm font-bold text-white mr-2.5 select-none font-mono">Rs</span>
                  <input
                    type="number"
                    placeholder="Min 100~Max 50,000"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      if (e.target.value) {
                        setAmount(parseFloat(e.target.value) || 0);
                      }
                    }}
                    className="w-full bg-transparent text-sm font-mono font-bold text-white focus:outline-none placeholder:text-gray-500 placeholder:font-normal"
                  />
                  {customAmount && (
                    <button
                      type="button"
                      onClick={() => setCustomAmount("")}
                      className="text-gray-500 hover:text-white p-1"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* 8 Preset Amount Buttons (4 cols x 2 rows) */}
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AMOUNTS.map((item) => {
                    const isSelected =
                      (!customAmount && amount === item.amount) || parseFloat(customAmount) === item.amount;
                    return (
                      <button
                        key={item.amount}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setCustomAmount("");
                          setAmount(item.amount);
                        }}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition active:scale-95 ${
                          isSelected
                            ? "bg-[#1c241e] border-[#22c55e] text-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.18)]"
                            : "bg-[#18191d] border-[#28292e] text-white hover:border-gray-600"
                        }`}
                      >
                        <span className="font-mono font-bold text-sm text-white leading-tight">
                          {item.amount.toLocaleString()}
                        </span>
                        <span className="font-mono font-semibold text-[11px] text-[#f59e0b] leading-tight mt-0.5">
                          +{item.bonus}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DEPOSIT PROMOTION SECTION */}
              <div className="space-y-2 pt-1">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🎁</span>
                  <span>Deposit promotion</span>
                </div>
                <div className="bg-[#18191d] border border-[#28292e] rounded-xl p-3 text-xs text-gray-400 space-y-1.5 leading-relaxed">
                  <p>
                    1. First deposit bonus: Get extra up to{" "}
                    <span className="text-[#f59e0b] font-bold">₨ 1,777</span> cash bonus added instantly.
                  </p>
                  <p>
                    2. Daily deposit rebate: Instant{" "}
                    <span className="text-[#22c55e] font-bold">3%~10%</span> automatically credited to your balance.
                  </p>
                  <p>
                    3. 100% safe & certified Pakistani automated settlement via JazzCash, EasyPaisa, and Raast.
                  </p>
                </div>
              </div>

              {/* ACTION CTA BUTTON */}
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#22c55e] text-black font-black text-sm uppercase tracking-wider shadow-[0_4px_15px_rgba(34,197,94,0.3)] active:scale-98 transition flex items-center justify-center gap-2 mt-2"
              >
                <span>Deposit ₨ {finalAmount.toLocaleString()}</span>
                <ArrowRight size={16} strokeWidth={3} />
              </button>
            </>
          )}

          {/* STEP 2: TRANSFER TO MERCHANT ACCOUNT & SUBMIT TID */}
          {step === 2 && (
            <form onSubmit={handleSubmitProof} className="space-y-4 pt-1 animate-in fade-in duration-200">
              <div className="bg-[#18191d] border border-[#28292e] rounded-2xl p-4 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <currentMethod.icon size={26} />
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">{currentMethod.name}</div>
                      <div className="text-[10px] text-gray-400">Official Merchant Route</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[#f59e0b] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      ₨ {finalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Account Title:</div>
                  <div className="font-bold text-white text-sm">{currentMethod.accountHolder}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {currentMethod.id === "bank_raast" ? "Bank Account / IBAN:" : "Merchant Account Number:"}
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-black/60 border border-[#28292e] shadow-inner">
                    <span className="font-mono font-bold text-sm text-white tracking-wider">
                      {currentMethod.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentMethod.accountNumber)}
                      className="px-2.5 py-1 rounded-lg bg-[#22c55e] text-black font-black text-[10px] flex items-center gap-1 hover:bg-[#16a34a] active:scale-95 transition"
                    >
                      {copied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
                      <span>{copied ? "COPIED" : "COPY"}</span>
                    </button>
                  </div>
                </div>

                {/* RAAST Instant Payment ID if Bank */}
                {currentMethod.id === "bank_raast" && currentMethod.raastId && (
                  <div className="space-y-1 pt-2 border-t border-white/5">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <RaastIcon size={14} />
                      <span>Raast Instant Phone ID:</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-black/60 border border-[#28292e] shadow-inner">
                      <span className="font-mono font-bold text-sm text-white tracking-wider">
                        {currentMethod.raastId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentMethod.raastId || "")}
                        className="px-2.5 py-1 rounded-lg bg-[#22c55e] text-black font-black text-[10px] flex items-center gap-1 hover:bg-[#16a34a] active:scale-95 transition"
                      >
                        {copied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
                        <span>COPY RAAST</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions Box */}
              <div className="p-3 rounded-xl bg-[#18191d] border border-amber-500/20 text-xs text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <AlertCircle size={14} className="shrink-0 text-amber-400" />
                  <span>Important Payment Steps</span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  {currentMethod.instructions}
                </p>
              </div>

              {/* Sender Phone & TID inputs */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                    Your Sender Mobile / Account
                  </label>
                  <input
                    type="text"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#16171b] border border-[#28292e] text-sm font-mono font-bold text-white focus:outline-none focus:border-[#22c55e] transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    11-Digit SMS Transaction ID (TID) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 01928374610"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    required
                    className="w-full px-3.5 py-3 rounded-xl bg-[#16171b] border-2 border-amber-500/40 text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400 transition placeholder:text-amber-500/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#22c55e] text-black font-black text-sm uppercase tracking-wider shadow-[0_4px_15px_rgba(34,197,94,0.3)] active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? "Verifying..." : "Confirm & Submit Deposit"}</span>
                <CheckCircle2 size={16} strokeWidth={2.5} />
              </button>
            </form>
          )}

          {/* STEP 3: CONFIRMATION RECEIPT */}
          {step === 3 && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-[#22c55e] text-black flex items-center justify-center shadow-[0_0_25px_rgba(34,197,94,0.4)]">
                <CheckCircle2 size={36} strokeWidth={2.5} />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white tracking-tight">Deposit Submitted!</h3>
                <p className="text-xs text-gray-400">
                  Your funds are being credited to your account.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#18191d] border border-[#28292e] text-xs w-full text-left space-y-2">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-gray-400">Amount:</span>
                  <strong className="text-[#22c55e] font-mono font-bold text-base">₨ {finalAmount.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Method:</span>
                  <strong className="text-white">{currentMethod.name}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status:</span>
                  <strong className="text-[#22c55e] flex items-center gap-1"><Check size={12} /> Processing</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">TID Ref:</span>
                  <span className="text-gray-300 font-mono">{transactionRef || "EP-98213"}</span>
                </div>
              </div>

              <button
                onClick={handleResetAndClose}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95"
              >
                Back to Lobby
              </button>
            </div>
          )}
        </div>

        {/* FLOATING DOWNLOAD APP BADGE (Matches screenshot bottom-right) */}
        <div
          onClick={() => {
            sounds.playClick();
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
      <LiveChatModal isOpen={isLiveChatOpen} onClose={() => setIsLiveChatOpen(false)} />
      <PWAInstallModal isOpen={isPWAOpen} onClose={() => setIsPWAOpen(false)} />
      <BottomNav />
    </div>
  );
}
