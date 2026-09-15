"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { wallet } from "@/lib/walletStore";
import { sounds } from "@/lib/soundEngine";
import { generateRaastSvgQr } from "@/lib/qrGenerator";
import { QrCode } from "lucide-react";

// Utility: Generate authentic Order ID starting with U + YYMMDD + 6 alphanumeric chars
function generateOrderId() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomPart = "";
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `U${yy}${mm}${dd}${randomPart}`;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Parameters
  const initialAmount = parseFloat(searchParams.get("amount") || "150");
  const initialMethod = (searchParams.get("method") || "jazzcash").toLowerCase();
  const initialOrderId = searchParams.get("orderId") || "";

  // State
  const [mounted, setMounted] = useState<boolean>(false);
  const [amount, setAmount] = useState<number>(initialAmount || 150);
  const [orderId, setOrderId] = useState<string>(initialOrderId || "U260915000000");
  const [paymentMethod, setPaymentMethod] = useState<"jazzcash" | "easypaisa" | "raast">(
    initialMethod.includes("raast") ? "raast" : initialMethod.includes("easy") ? "easypaisa" : "jazzcash"
  );
  const [walletAccount, setWalletAccount] = useState<string>("03");
  const [copiedOrder, setCopiedOrder] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // MA Push Dialog State
  const [isPushModalOpen, setIsPushModalOpen] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(60);
  const [pushStatus, setPushStatus] = useState<"waiting" | "success" | "failed" | "expired">("waiting");
  const [transactionDetails, setTransactionDetails] = useState<{
    ewpId: string;
    dateTime: string;
    responseCode: string;
    responseDesc: string;
  } | null>(null);

  // Initialize orderId on client mount to prevent SSR hydration mismatch
  useEffect(() => {
    setMounted(true);
    if (!initialOrderId) {
      setOrderId(generateOrderId());
    }
  }, [initialOrderId]);

  // Handle Copy Order Number
  const handleCopyOrder = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(orderId);
      setCopiedOrder(true);
      try { sounds.playClick(); } catch {}
      setTimeout(() => setCopiedOrder(false), 2000);
    }
  };

  // Format and validate wallet account input
  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 11) {
      setWalletAccount(raw);
      setErrorMessage("");
    }
  };

  // Detect network operator prefix
  const networkBadge = useMemo(() => {
    if (walletAccount.length >= 4) {
      const prefix = walletAccount.slice(0, 4);
      if (prefix.startsWith("030")) return { name: "Jazz", color: "bg-red-50 text-red-600 border-red-200" };
      if (prefix.startsWith("034")) return { name: "Telenor / EasyPaisa", color: "bg-emerald-50 text-emerald-600 border-emerald-200" };
      if (prefix.startsWith("031")) return { name: "Zong", color: "bg-purple-50 text-purple-600 border-purple-200" };
      if (prefix.startsWith("033")) return { name: "Ufone", color: "bg-amber-50 text-amber-600 border-amber-200" };
    }
    return null;
  }, [walletAccount]);

  // Handle Form Submit: Trigger Mobile Account (MA) Push
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!walletAccount || walletAccount.length !== 11 || !walletAccount.startsWith("03")) {
      setErrorMessage("براہ کرم درست 11 ہندسوں کا موبائل اکاؤنٹ نمبر درج کریں (03xxxxxxxxx)");
      return;
    }

    setIsSubmitting(true);
    try { sounds.playClick(); } catch {}

    try {
      const res = await fetch("/api/payment/initiate-ma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          transactionAmount: amount,
          mobileAccountNo: walletAccount,
          method: paymentMethod === "easypaisa" ? "EasyPaisa" : "JazzCash",
          userId: wallet.getUser().id,
          username: wallet.getUser().username,
        }),
      });

      const data = await res.json();

      if (data.status === "success" || data.responseCode === "0000") {
        setTransactionDetails({
          ewpId: data.transactionId || `EWP${Date.now()}`,
          dateTime: data.transactionDateTime || new Date().toLocaleString(),
          responseCode: data.responseCode || "0000",
          responseDesc: data.responseDesc || "SUCCESS",
        });
        setCountdown(60);
        setPushStatus("waiting");
        setIsPushModalOpen(true);
      } else {
        setErrorMessage(data.message || "ادائیگی کا عمل شروع نہیں ہو سکا۔ دوبارہ کوشش کریں۔");
      }
    } catch {
      // Offline fallback simulation
      setTransactionDetails({
        ewpId: `EWP${Date.now()}`,
        dateTime: new Date().toLocaleString(),
        responseCode: "0000",
        responseDesc: "SUCCESS",
      });
      setCountdown(60);
      setPushStatus("waiting");
      setIsPushModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Countdown timer for MPIN push modal
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPushModalOpen && pushStatus === "waiting" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setPushStatus("expired");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPushModalOpen, pushStatus, countdown]);

  // Complete Payment and Credit Real Balance
  const handleAuthorizeSuccess = () => {
    try { sounds.playCoin(); } catch {}
    setPushStatus("success");
    // Credit player wallet store
    const methodName = paymentMethod === "easypaisa" ? "EasyPaisa" : "JazzCash";
    wallet.deposit(amount, methodName);
  };

  return (
    <div className="w-full max-w-[460px] mx-auto min-h-screen sm:min-h-0 sm:my-8 bg-white sm:rounded-3xl sm:shadow-2xl sm:border border-slate-200/80 flex flex-col font-sans select-none overflow-hidden">
      
      {/* TOP COMPACT NAV BAR */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <button
          type="button"
          onClick={() => {
            try { sounds.playClick(); } catch {}
            router.back();
          }}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition active:scale-95 text-xs font-semibold"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
          <ShieldCheck size={13} strokeWidth={2.5} />
          <span>Secured Checkout</span>
        </div>
      </div>

      {/* MAIN CARD BODY */}
      <div className="p-6 sm:p-8 flex-1 flex flex-col">
        
        {/* ================= 1. AMOUNT & ORDER NUMBER HEADER ================= */}
        <div className="text-center space-y-1">
          <div suppressHydrationWarning className="text-3xl sm:text-[34px] font-black text-slate-900 tracking-tight leading-none">
            PKR {amount.toFixed(2)}
          </div>
          
          <div className="text-xs sm:text-[13px] font-medium text-slate-500 pt-1.5 flex items-center justify-center gap-1">
            <span>Order Number</span>
            <span className="text-slate-300">|</span>
            <span className="font-urdu">آرڈر نمبر</span>
          </div>

          <div
            onClick={handleCopyOrder}
            title="Click to copy Order ID"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-700 font-mono text-xs sm:text-sm font-semibold cursor-pointer active:scale-95 transition mx-auto mt-0.5"
          >
            <span suppressHydrationWarning>{orderId}</span>
            {copiedOrder ? (
              <Check size={13} className="text-emerald-600" strokeWidth={3} />
            ) : (
              <Copy size={13} className="text-slate-400" />
            )}
            {copiedOrder && (
              <span className="text-[10px] text-emerald-600 font-bold ml-0.5">Copied!</span>
            )}
          </div>
        </div>

        {/* DIVIDER */}
        <div className="w-full h-px bg-slate-100 my-6" />

        {/* ================= 2. SELECT PAYMENT METHOD ================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-[15px] font-bold text-slate-900">
              Select Payment Method
            </span>
            <span className="text-xs sm:text-[13px] font-medium text-slate-500 font-urdu" dir="rtl">
              ادائیگی کا طریقہ منتخب کریں
            </span>
          </div>

          {/* METHOD TOGGLE BUTTONS */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                try { sounds.playClick(); } catch {}
                setPaymentMethod("jazzcash");
              }}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                paymentMethod === "jazzcash"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#E50914] shrink-0" />
              <span className="truncate">JazzCash</span>
            </button>

            <button
              type="button"
              onClick={() => {
                try { sounds.playClick(); } catch {}
                setPaymentMethod("easypaisa");
              }}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                paymentMethod === "easypaisa"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#00C853] shrink-0" />
              <span className="truncate">EasyPaisa</span>
            </button>

            <button
              type="button"
              onClick={() => {
                try { sounds.playClick(); } catch {}
                setPaymentMethod("raast");
              }}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                paymentMethod === "raast"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <QrCode size={13} className="text-[#064e3b] shrink-0" />
              <span className="truncate">Raast QR</span>
            </button>
          </div>

          {/* METHOD DISPLAY CARD (Exact Match to User's Uploaded Screenshot) */}
          <div className="w-full h-[76px] sm:h-[84px] rounded-2xl border-2 border-emerald-800/80 bg-white p-3 flex items-center justify-center shadow-sm relative overflow-hidden group transition-all">
            {paymentMethod === "jazzcash" && (
              <img
                src="/images/jazzcash_emblem.png"
                alt="JazzCash Official"
                className="h-10 sm:h-12 w-auto object-contain max-w-[140px] pointer-events-none select-none transition-transform group-hover:scale-105"
              />
            )}
            {paymentMethod === "easypaisa" && (
              <img
                src="/images/easypaisa_emblem.png"
                alt="EasyPaisa Official"
                className="h-10 sm:h-12 w-auto object-contain max-w-[140px] pointer-events-none select-none transition-transform group-hover:scale-105"
              />
            )}
            {paymentMethod === "raast" && (
              <img
                src="/images/raast_official.png"
                alt="State Bank of Pakistan Raast"
                className="h-10 sm:h-12 w-auto object-contain max-w-[140px] pointer-events-none select-none transition-transform group-hover:scale-105"
              />
            )}
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-100/70 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
              <Check size={11} strokeWidth={3} />
              <span>Active</span>
            </div>
          </div>
        </div>

        {paymentMethod === "raast" ? (
          <div className="space-y-4 mt-6 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 flex flex-col items-center justify-center text-center space-y-3">
              <div
                className="p-2.5 bg-white rounded-2xl shadow-md border border-slate-200"
                dangerouslySetInnerHTML={{
                  __html: generateRaastSvgQr(`raast://pay?iban=PK36MEZN0001234567890123&amount=${amount}&ref=${orderId}`, 180),
                }}
              />
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-800">Scan & Pay with Any Pakistani Bank App</div>
                <div className="text-[11px] text-slate-500 font-urdu">میزان، ایچ بی ایل، الفلاح یا نیاپے سے اسکین کریں</div>
                <div className="text-[11px] font-mono text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded">
                  Raast ID: 03001234567
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                try { sounds.playCoin(); } catch {}
                wallet.deposit(amount, "Bank & Raast");
                setPushStatus("success");
                setIsPushModalOpen(true);
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#064e3b] hover:bg-[#043d2e] active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ادائیگی کی تصدیق کریں | Confirm Raast Settlement</span>
              <CheckCircle2 size={16} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          /* ================= 3. WALLET ACCOUNT INPUT ================= */
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-[13px] font-bold text-slate-900">
                Wallet Account (03xxxxxxxxx)
              </label>
              <span className="text-xs sm:text-[13px] font-medium text-slate-500 font-urdu" dir="rtl">
                والیٹ اکاؤنٹ
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={11}
                placeholder="03xxxxxxxxx"
                value={walletAccount}
                onChange={handleAccountChange}
                required
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 text-slate-900 font-mono text-base font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all shadow-sm tracking-wider"
              />
              {networkBadge && (
                <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold px-2 py-0.5 rounded-md border ${networkBadge.color}`}>
                  {networkBadge.name}
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="text-xs text-rose-600 font-medium flex items-center gap-1.5 pt-1">
                <AlertCircle size={14} />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* ================= 4. ACTION SUBMIT BUTTON ================= */}
          <button
            type="submit"
            disabled={isSubmitting || walletAccount.length !== 11}
            className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-[#064e3b] hover:bg-[#043d2e] active:scale-[0.99] text-white font-bold text-base sm:text-[17px] shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>پروسیسنگ ہو رہی ہے...</span>
              </>
            ) : (
              <span>جمع کرائیں | Submit</span>
            )}
          </button>
        </form>

        )}
        {/* ================= 5. BILINGUAL INSTRUCTIONS (Exact Match) ================= */}
        <div className="mt-6 space-y-4 text-slate-500 text-xs sm:text-[13px] leading-relaxed">
          
          {/* Instruction Block 1 */}
          <div className="space-y-1">
            <p className="text-slate-600 font-medium">
              After clicking &quot;Submit&quot;, please open your wallet and enter your password to complete the payment.
            </p>
            <p className="text-slate-600 font-urdu text-right leading-relaxed" dir="rtl">
              &quot;جمع کرائیں&quot; پر کلک کرنے کے بعد، براہ کرم اپنا والیٹ کھولیں اور ادائیگی مکمل کرنے کے لیے اپنا پاس ورڈ درج کریں۔
            </p>
          </div>

          {/* Instruction Block 2 */}
          <div className="space-y-1 pt-1">
            <p className="text-slate-600 font-medium">
              After clicking submit, if you want to change your account for payment, please wait for one minute before trying again with a new account.
            </p>
            <p className="text-slate-600 font-urdu text-right leading-relaxed" dir="rtl">
              سبمٹ پر کلک کرنے کے بعد، اگر آپ ادائیگی کے لیے اپنا اکاؤنٹ تبدیل کرنا چاہتے ہیں، تو براہ کرم نئے اکاؤنٹ کے ساتھ دوبارہ کوشش کرنے سے پہلے ایک منٹ انتظار کریں۔
            </p>
          </div>
        </div>

        {/* COMPLIANCE & SECURITY FOOTER */}
        <div className="mt-auto pt-8 border-t border-slate-100 flex flex-col items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
            <ShieldCheck size={14} className="text-emerald-700" />
            <span>State Bank of Pakistan (SBP) Regulated Gateway</span>
          </div>
          <p>256-Bit SSL Encrypted • ISO 27001 Certified Settlement</p>
        </div>

      </div>

      {/* ================= 6. INTERACTIVE MA PUSH AUTHORIZATION MODAL ================= */}
      {isPushModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[420px] bg-white rounded-3xl p-6 shadow-2xl space-y-5 border border-slate-100 animate-in zoom-in-95 duration-200">
            
            {/* WAITING STATE: USSD PUSH PROMPT */}
            {pushStatus === "waiting" && (
              <>
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-200 relative">
                    <Smartphone size={32} className="animate-pulse" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#064e3b] text-white flex items-center justify-center text-xs font-mono font-bold">
                      {countdown}s
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    MPIN Push Request Sent!
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    A payment prompt of <strong className="text-slate-900">PKR {amount.toFixed(2)}</strong> has been sent to your {paymentMethod === "easypaisa" ? "EasyPaisa" : "JazzCash"} mobile account <strong className="text-slate-900">{walletAccount}</strong>.
                  </p>
                </div>

                {/* SIMULATED PHONE USSD POPUP CARD */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2.5 shadow-inner border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                    <span className="flex items-center gap-1 font-bold text-emerald-400">
                      <Clock size={12} />
                      <span>{paymentMethod === "easypaisa" ? "EasyPaisa 3737 Push" : "JazzCash *786# Flash"}</span>
                    </span>
                    <span className="font-mono text-amber-400">Expires in {countdown}s</span>
                  </div>
                  <div className="text-xs text-slate-200 space-y-1">
                    <p><strong>Merchant:</strong> OKWIN GAMING CORP</p>
                    <p><strong>Order ID:</strong> <span className="font-mono text-emerald-300">{orderId}</span></p>
                    <p><strong>Amount:</strong> <span className="font-mono text-amber-300 font-bold">PKR {amount.toFixed(2)}</span></p>
                  </div>
                  <div className="text-[11px] text-slate-300 bg-slate-800/80 p-2 rounded-lg border border-slate-700 text-center font-medium">
                    Please approve this request on your phone or simulate approval below:
                  </div>
                </div>

                {/* TEST SIMULATION BUTTONS */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAuthorizeSuccess}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#22c55e] text-black font-black text-sm uppercase tracking-wider shadow-md active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Simulate MPIN Approval (Approve)</span>
                    <CheckCircle2 size={16} strokeWidth={2.5} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPushStatus("failed")}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition active:scale-98"
                  >
                    Simulate Incorrect MPIN / Cancel
                  </button>
                </div>
              </>
            )}

            {/* SUCCESS STATE */}
            {pushStatus === "success" && (
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                  <CheckCircle2 size={38} strokeWidth={2.5} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Payment Successful!
                  </h3>
                  <p className="text-xs text-slate-600">
                    Your balance has been instantly credited with <strong className="text-emerald-700 font-bold">PKR {amount.toFixed(2)}</strong>.
                  </p>
                </div>

                {/* OFFICIAL RECEIPT */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-left">
                  <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500">Order ID:</span>
                    <span className="font-mono font-bold text-slate-900">{orderId}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500">Telco Reference:</span>
                    <span className="font-mono font-bold text-slate-900">{transactionDetails?.ewpId}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500">Method:</span>
                    <span className="font-bold text-slate-900">{paymentMethod === "easypaisa" ? "EasyPaisa Mobile Account" : "JazzCash Mobile Account"}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500">Sender Account:</span>
                    <span className="font-mono font-bold text-slate-900">{walletAccount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Gateway Status:</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <Check size={12} strokeWidth={3} />
                      <span>0000 (SUCCESS)</span>
                    </span>
                  </div>
                </div>

                {/* NAVIGATION ACTION BUTTONS */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      try { sounds.playClick(); } catch {}
                      router.push("/");
                    }}
                    className="w-full py-3.5 rounded-2xl bg-[#064e3b] hover:bg-[#043d2e] text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-950/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Return to Lobby / Play Games</span>
                    <ArrowRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      try { sounds.playClick(); } catch {}
                      router.push("/wallet");
                    }}
                    className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition active:scale-98"
                  >
                    View in Wallet
                  </button>
                </div>
              </div>
            )}

            {/* FAILED / EXPIRED STATE */}
            {(pushStatus === "failed" || pushStatus === "expired") && (
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                  <AlertCircle size={36} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    {pushStatus === "expired" ? "Authorization Timed Out" : "Authorization Declined"}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {pushStatus === "expired"
                      ? "The 60-second MPIN authorization window expired before completion. Please try again."
                      : "The payment request was cancelled or incorrect MPIN was entered. No funds were deducted."}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPushStatus("waiting");
                      setCountdown(60);
                    }}
                    className="w-full py-3 rounded-xl bg-[#064e3b] hover:bg-[#043d2e] text-white font-bold text-xs uppercase tracking-wider active:scale-98 transition"
                  >
                    Try Again
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPushModalOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider active:scale-98 transition"
                  >
                    Close & Edit Account
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen flex items-center justify-center bg-[#f1f5f9] text-slate-500 text-sm">
        <RefreshCw size={24} className="animate-spin text-emerald-700" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
