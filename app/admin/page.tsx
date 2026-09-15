"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  CreditCard,
  Gamepad2,
  Sliders,
  Settings,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  ExternalLink,
  PlusCircle,
  MinusCircle,
  Ban,
  Activity,
  Award,
  Layers,
  Sparkles,
  Gift,
  ShieldAlert,
  Lock,
  Percent,
  Bot,
  FileText,
  Download,
  Clock,
  Send,
  Server,
} from "lucide-react";
import { AdminPlayer, FinancialRecord, GameRtpSetting, SystemSettings, PromoCode, RiskSettings } from "@/lib/server/adminBackend";
import { EasyPaisaIcon, JazzCashIcon, BankRaastIcon, UsdtIcon } from "@/components/common/PaymentIcons";
import { AdminPinModal } from "@/components/admin/AdminPinModal";
import { LockKeyhole } from "lucide-react";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "players" | "cashier" | "promos" | "games" | "agents" | "risk" | "settings" | "gateway" | "audit">("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Stats & Data
  const [metrics, setMetrics] = useState<any>(null);
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [financeRecords, setFinanceRecords] = useState<FinancialRecord[]>([]);
  const [games, setGames] = useState<GameRtpSetting[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [riskSettings, setRiskSettings] = useState<RiskSettings | null>(null);
  const [savingRisk, setSavingRisk] = useState<boolean>(false);

  // WordPress-Style Payment Gateway Manager State
  const [gatewaySubTab, setGatewaySubTab] = useState<"overview" | "easypaisa" | "jazzcash" | "raast" | "usdt" | "telegram">("overview");
  const [gatewaysConfig, setGatewaysConfig] = useState<any>(null);
  const [testingGateway, setTestingGateway] = useState<string | null>(null);
  const [gatewayTestResult, setGatewayTestResult] = useState<any>(null);


  // Gateway & Bot State
  const [telcoConfig, setTelcoConfig] = useState<any>(null);
  const [telegramConfig, setTelegramConfig] = useState<any>(null);
  const [savingGateway, setSavingGateway] = useState<boolean>(false);
  const [testingTelegram, setTestingTelegram] = useState<boolean>(false);

  // Audit Trail State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string>("all");
  const [auditSeverityFilter, setAuditSeverityFilter] = useState<string>("all");

  // Inactivity Auto-Lock (10 minutes)
  const [idleSeconds, setIdleSeconds] = useState<number>(600);

  // High-Value 2-Man Authorization Guard (> ₨ 25,000)
  const [highValueModalOpen, setHighValueModalOpen] = useState<boolean>(false);
  const [highValuePin, setHighValuePin] = useState<string>("");
  const [highValuePendingAction, setHighValuePendingAction] = useState<(() => void) | null>(null);
  const [highValuePromptDesc, setHighValuePromptDesc] = useState<string>("");


  // Promo Code Creation State
  const [newCodeName, setNewCodeName] = useState<string>("");
  const [newCodeAmount, setNewCodeAmount] = useState<string>("500");
  const [newCodeDesc, setNewCodeDesc] = useState<string>("Special VIP Red Packet");
  const [newCodeCap, setNewCodeCap] = useState<string>("500");
  const [creatingPromo, setCreatingPromo] = useState<boolean>(false);

  // Search & Filter
  const [playerSearch, setPlayerSearch] = useState<string>("");
  const [playerStatusFilter, setPlayerStatusFilter] = useState<string>("all");
  const [financeTypeFilter, setFinanceTypeFilter] = useState<string>("all");
  const [financeStatusFilter, setFinanceStatusFilter] = useState<string>("all");

  // Balance Adjustment Modal State
  const [selectedPlayer, setSelectedPlayer] = useState<AdminPlayer | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>("1000");
  const [adjustOperation, setAdjustOperation] = useState<"credit" | "debit">("credit");
  const [adjustReason, setAdjustReason] = useState<string>("VIP Loyalty Gift");
  const [adjusting, setAdjusting] = useState<boolean>(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load all platform data
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats & Games
      const statsRes = await fetch("/api/admin/stats");
      const statsData = await statsRes.json();
      if (statsData.status === "success") {
        setMetrics(statsData.metrics);
        setGames(statsData.games);
      }

      // 2. Fetch Players
      const playersRes = await fetch(`/api/admin/users?query=${playerSearch}&status=${playerStatusFilter}`);
      const playersData = await playersRes.json();
      if (playersData.status === "success") {
        setPlayers(playersData.players);
      }

      // 3. Fetch Finance
      const finRes = await fetch(`/api/admin/finance?type=${financeTypeFilter}&status=${financeStatusFilter}`);
      const finData = await finRes.json();
      if (finData.status === "success") {
        setFinanceRecords(finData.records);
      }

      // 4. Fetch Settings
      const setRes = await fetch("/api/admin/settings");
      const setData = await setRes.json();
      if (setData.status === "success") {
        setSettings(setData.settings);
      }

      // 5. Fetch Promo Codes
      const promoRes = await fetch("/api/admin/promo");
      const promoData = await promoRes.json();
      if (promoData.status === "success") {
        setPromoCodes(promoData.promoCodes);
      }

      // 6. Fetch Risk & Anti-Drain Settings
      const riskRes = await fetch("/api/admin/risk");
      const riskData = await riskRes.json();
      if (riskData.status === "success") {
        setRiskSettings(riskData.riskSettings);
      }

      // Fetch WordPress-style Payment Gateways
      const gwMasterRes = await fetch("/api/admin/payment-gateways");
      const gwMasterData = await gwMasterRes.json();
      if (gwMasterData.status === "success") {
        setGatewaysConfig(gwMasterData.gateways);
      }


      // 7. Fetch Gateway & Bot Settings
      const gwRes = await fetch("/api/admin/gateway");
      const gwData = await gwRes.json();
      if (gwData.status === "success") {
        setTelcoConfig(gwData.telco);
        setTelegramConfig(gwData.telegram);
      }

      // 8. Fetch Audit Logs
      const auditRes = await fetch(`/api/admin/audit?category=${auditCategoryFilter}&severity=${auditSeverityFilter}`);
      const auditData = await auditRes.json();
      if (auditData.status === "success") {
        setAuditLogs(auditData.logs);
      }

    } catch (err) {
      console.error("Failed loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Detect ?tab= in URL and auth token on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const auth = sessionStorage.getItem("okwin_admin_auth");
      if (auth) {
        setIsAuthorized(true);
      }
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && ["overview", "players", "cashier", "gateway", "promos", "games", "risk", "audit", "agents", "settings"].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [playerStatusFilter, financeTypeFilter, financeStatusFilter, auditCategoryFilter, auditSeverityFilter]);

  
  // Inactivity Auto-Lock countdown
  useEffect(() => {
    if (!isAuthorized) return;
    const resetTimer = () => setIdleSeconds(600);

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);

    const interval = setInterval(() => {
      setIdleSeconds((prev) => {
        if (prev <= 1) {
          setIsAuthorized(false);
          showToast("Console locked due to 10 minutes of inactivity.");
          return 600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
      clearInterval(interval);
    };
  }, [isAuthorized]);

  
  // Save Gateway & Telegram Config
  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGateway(true);
    try {
      const res = await fetch("/api/admin/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telco: telcoConfig, telegram: telegramConfig }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("✅ Gateway & Telegram configurations saved successfully!");
      } else {
        showToast("❌ Failed to save configuration: " + data.message);
      }
    } catch {
      showToast("❌ Network error saving gateway config.");
    } finally {
      setSavingGateway(false);
    }
  };

  // Test Telegram Bot Alert
  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    try {
      const res = await fetch("/api/admin/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("🚀 Test alert dispatched! Check your Telegram chat.");
      } else {
        showToast("⚠️ " + data.message);
      }
    } catch {
      showToast("❌ Error connecting to Telegram API.");
    } finally {
      setTestingTelegram(false);
    }
  };

  // Confirm High-Value 2-Man Authorization
  const confirmHighValueAction = () => {
    if (highValuePin === "882190") {
      if (highValuePendingAction) highValuePendingAction();
      setHighValueModalOpen(false);
      setHighValuePin("");
      setHighValuePendingAction(null);
      showToast("✅ High-value authorization confirmed.");
    } else {
      showToast("❌ Invalid Master PIN for high-value authorization.");
    }
  };

  
  // Save specific gateway settings (WordPress style)
  const handleSaveSpecificGateway = async (gatewayName: string, configObj: any) => {
    try {
      const res = await fetch("/api/admin/payment-gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateway: gatewayName, config: configObj }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast(`✅ ${gatewayName.toUpperCase()} settings saved successfully!`);
        loadData();
      } else {
        showToast("❌ " + (data.message || "Failed to save settings"));
      }
    } catch {
      showToast("❌ Network error saving gateway settings");
    }
  };

  // Test Gateway Connection Handshake
  const handleTestSpecificGateway = async (gatewayName: "easypaisa" | "jazzcash") => {
    setTestingGateway(gatewayName);
    setGatewayTestResult(null);
    try {
      const res = await fetch("/api/admin/payment-gateways/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateway: gatewayName }),
      });
      const data = await res.json();
      setGatewayTestResult(data);
      if (data.success) {
        showToast(`🚀 ${data.message}`);
      } else {
        showToast(`⚠️ ${data.message}`);
      }
    } catch {
      showToast("❌ Error testing gateway connection");
    } finally {
      setTestingGateway(null);
    }
  };

  // Handle Player Search submit
  const handlePlayerSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(`/api/admin/users?query=${encodeURIComponent(playerSearch)}&status=${playerStatusFilter}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") setPlayers(data.players);
      });
  };

  // Handle Promo Code Creation
  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeName.trim()) {
      alert("Please enter a promo code name.");
      return;
    }
    const amt = parseFloat(newCodeAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid bonus amount.");
      return;
    }

    setCreatingPromo(true);
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          code: newCodeName.trim().toUpperCase(),
          bonusAmount: amt,
          description: newCodeDesc.trim(),
          maxClaims: parseInt(newCodeCap) || 500,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast(data.message);
        setNewCodeName("");
        loadData();
      } else {
        alert(data.message || "Failed to create promo code");
      }
    } catch {
      alert("Network error creating promo code");
    } finally {
      setCreatingPromo(false);
    }
  };

  // Handle Toggle Promo Code
  const handleTogglePromo = async (code: string) => {
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          code,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast(data.message);
        loadData();
      } else {
        alert(data.message || "Failed to toggle status");
      }
    } catch {
      alert("Network error toggling promo code");
    }
  };

  // Handle Balance Adjustment
  const handleBalanceAdjust = async () => {
    if (!selectedPlayer) return;
    const num = parseFloat(adjustAmount);
    if (isNaN(num) || num <= 0) {
      alert("Please enter a valid positive amount");
      return;
    }

    setAdjusting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust_balance",
          userId: selectedPlayer.id,
          amount: num,
          operation: adjustOperation,
          reason: adjustReason,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast(data.message);
        setSelectedPlayer(null);
        loadData();
      } else {
        alert(data.message || "Failed to adjust balance");
      }
    } catch {
      alert("Network error adjusting balance");
    } finally {
      setAdjusting(false);
    }
  };

  // Handle Player Status Toggle (Freeze/Unfreeze)
  const handleTogglePlayerStatus = async (player: AdminPlayer) => {
    const nextStatus = player.status === "active" ? "frozen" : "active";
    if (!confirm(`Are you sure you want to change ${player.username} to ${nextStatus.toUpperCase()}?`)) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          userId: player.id,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast(data.message);
        loadData();
      }
    } catch {
      alert("Failed to update status");
    }
  };

  // Handle Cashier Process (Approve / Reject)
  const handleCashierAction = async (recordId: string, type: "deposit" | "withdraw", action: "approve" | "reject") => {
    const actionLabel = action === "approve" ? "APPROVE" : "REJECT & REFUND";
    if (!confirm(`Confirm ${actionLabel} for transaction #${recordId}?`)) return;

    try {
      const res = await fetch("/api/admin/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId,
          type,
          action,
          operatorNotes: action === "approve" ? "Verified and approved by admin cashier" : "Rejected by cashier security audit",
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast(data.message);
        loadData();
      } else {
        alert(data.message || "Action failed");
      }
    } catch {
      alert("Error processing cashier transaction");
    }
  };

  // Handle Game RTP Update
  const handleGameRtpChange = async (gameId: string, newRtp: number, status?: "active" | "maintenance") => {
    try {
      const res = await fetch("/api/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          rtpPercentage: newRtp,
          status,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast(data.message);
        // Update local state
        setGames((prev) =>
          prev.map((g) => (g.id === gameId ? { ...g, rtpPercentage: newRtp, houseEdge: Math.round((100 - newRtp) * 10) / 10, ...(status ? { status } : {}) } : g))
        );
      }
    } catch {
      alert("Failed updating RTP");
    }
  };

  // Handle Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("System settings saved successfully!");
      }
    } catch {
      alert("Error saving settings");
    }
  };

  // Handle Risk & House Protection Save
  const handleSaveRiskSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskSettings) return;
    setSavingRisk(true);
    try {
      const res = await fetch("/api/admin/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_risk_settings",
          settings: riskSettings,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("Risk & House Protection parameters updated!");
        loadData();
      } else {
        alert(data.message || "Failed to update risk settings");
      }
    } catch {
      alert("Network error updating risk settings");
    } finally {
      setSavingRisk(false);
    }
  };

  // Handle Void & Freeze Fraud Account
  const handleVoidFraudAccount = async (record: FinancialRecord) => {
    if (
      !confirm(
        `⚠️ CAUTION: Are you sure you want to VOID withdrawal ${record.id}, FREEZE user ${record.username} (${record.userId}), and flag as FRAUD?`
      )
    ) {
      return;
    }
    try {
      const res = await fetch("/api/admin/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "void_account",
          userId: record.userId,
          reason: record.riskReason || "Wagering rollover violation & fraudulent drain pattern",
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast(data.message || "Account frozen and withdrawal voided");
        loadData();
      } else {
        alert(data.message || "Failed to void account");
      }
    } catch {
      alert("Network error voiding account");
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center font-sans select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Admin Console...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0a0e17] text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-500 text-black font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-bounce">
          <CheckCircle2 size={18} />
          <span className="text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center font-black text-black text-sm shadow-glow-sm">
              OK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
                  OKWIN
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                  CORE OPERATOR CONSOLE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                B2B Production Gateway • Pakistan Gaming Engine
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refresh Ledger State"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setActiveTab("gateway")}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Sliders size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">Payment Gateways</span>
          </button>

          <Link
            href="/admin/api-tester"
            className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Sliders size={14} />
            <span className="hidden sm:inline">Seamless Wallet Sandbox</span>
          </Link>

          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
          >
            <span>Launch Casino</span>
            <ExternalLink size={14} />
          </Link>
        </div>
      </header>

      {/* Main Command Center Body */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-[#0d131f] border-b md:border-b-0 md:border-r border-slate-800 p-3 space-y-1 shrink-0">
          {[
            { id: "overview", label: "Executive Dashboard", icon: Activity, badge: null },
            { id: "players", label: "Player Management", icon: Users, badge: players.length },
            {
              id: "cashier",
              label: "Cashier & Approvals",
              icon: CreditCard,
              badge: metrics?.pendingWithdrawalsCount ? `${metrics.pendingWithdrawalsCount} pending` : null,
              badgeColor: "bg-amber-500 text-black",
            },
            {
              id: "gateway",
              label: "Payment Gateways",
              icon: Sliders,
              badge: "WP Telcos",
              badgeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
            },
            {
              id: "promos",
              label: "Red Packets & Vouchers",
              icon: Gift,
              badge: promoCodes.length ? `${promoCodes.length} Codes` : null,
              badgeColor: "bg-red-500/20 text-yellow-300 border border-red-500/30",
            },
            { id: "games", label: "Game RTP & House Edge", icon: Gamepad2, badge: "Live" },
            {
              id: "risk",
              label: "Risk & House Defenses",
              icon: ShieldAlert,
              badge: "Anti-Drain",
              badgeColor: "bg-red-500/20 text-red-400 border border-red-500/30",
            },
            {
              id: "audit",
              label: "Security Audit Trail",
              icon: ShieldCheck,
              badge: "Audit Logs",
              badgeColor: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
            },
            { id: "agents", label: "Affiliate & Promoters", icon: Award, badge: null },
            { id: "settings", label: "System & Announcements", icon: Settings, badge: null },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className={isActive ? "text-amber-400" : "text-slate-500"} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold uppercase ${
                      item.badgeColor || "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-800/80 px-2 space-y-2">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              Aggregator Endpoints
            </div>
            <div className="text-[11px] font-mono text-slate-400 space-y-1">
              <div className="truncate">POST /api/wallet/bet</div>
              <div className="truncate">POST /api/wallet/win</div>
              <div className="truncate">POST /api/wallet/rollback</div>
            </div>
          </div>
        </aside>

        {/* Dynamic View Canvas */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-x-hidden">
          {/* TAB 1: EXECUTIVE KPI DASHBOARD */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-lg font-black text-white flex items-center gap-2">
                  <Activity size={20} className="text-amber-400" />
                  Executive Operations Dashboard
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time Gross Gaming Revenue (GGR), turnover analytics, and Pakistani cashier volumes.
                </p>
              </div>

              {/* Quick Launch Banner: WordPress-Style Payment Gateway Manager */}
              <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
                    <Sliders size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-white">WordPress-Style Payment Gateways</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Config Suite</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure individual credentials for EasyPaisa (MA + RSA), JazzCash (HMAC), Bank/Raast QR, and USDT.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab("gateway")}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <span>Open Payment Gateways</span>
                    <ArrowUpRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("audit")}
                    className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <ShieldCheck size={14} />
                    <span>Audit Trail</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* GGR */}
                <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-lg shadow-black/30 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                    <span>Gross Gaming Revenue (GGR)</span>
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                      <TrendingUp size={16} />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-2">
                    ₨ {metrics?.ggr?.toLocaleString("en-PK", { minimumFractionDigits: 2 }) || "0.00"}
                  </div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
                    <ArrowUpRight size={14} />
                    <span>House Hold: {metrics?.houseWinRatePercentage || 3.8}% of turnover</span>
                  </div>
                </div>

                {/* Total Turnover Volume */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/30">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                    <span>Total Bet Turnover</span>
                    <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                      <Gamepad2 size={16} />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white font-mono mt-2">
                    ₨ {metrics?.totalTurnover?.toLocaleString("en-PK", { minimumFractionDigits: 2 }) || "0.00"}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Total Wagers processed across all studios
                  </div>
                </div>

                {/* Net Cashflow */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/30">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                    <span>Net Cash Flow</span>
                    <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <CreditCard size={16} />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-2">
                    ₨ {metrics?.netCashflow?.toLocaleString("en-PK", { minimumFractionDigits: 2 }) || "0.00"}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Deposits: ₨ {(metrics?.totalDeposits / 1000).toFixed(0)}k • Withdrawals: ₨ {(metrics?.totalWithdrawals / 1000).toFixed(0)}k
                  </div>
                </div>

                {/* Active Players */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/30">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                    <span>Active Players</span>
                    <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                      <Users size={16} />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white font-mono mt-2">
                    {metrics?.activePlayersCount || 0}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Total Registered: {metrics?.totalRegisteredPlayers || 0} players
                  </div>
                </div>
              </div>

              {/* Game Volume Matrix Breakdown */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Layers size={16} className="text-amber-400" />
                    Studio & In-House Game Volume Breakdown
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">Real-time telemetry</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {games.map((g) => (
                    <div key={g.id} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{g.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-bold">
                          RTP {g.rtpPercentage}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Provider: <strong className="text-slate-200">{g.provider}</strong></span>
                        <span className="text-emerald-400 font-mono font-semibold">Edge: {g.houseEdge}%</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800/50 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">24h Volume:</span>
                        <span className="font-mono font-black text-amber-300">
                          ₨ {g.totalVolume.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setActiveTab("cashier")}
                  className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 hover:border-amber-400 text-left transition"
                >
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <CreditCard size={16} />
                    Pending Cashier Approvals
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {metrics?.pendingWithdrawalsCount || 0} withdrawals awaiting approval
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("players")}
                  className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 hover:border-blue-400 text-left transition"
                >
                  <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <Users size={16} />
                    Adjust Player Balance
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Manual credit/debit for VIP loyalty rewards
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("games")}
                  className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 hover:border-purple-400 text-left transition"
                >
                  <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Sliders size={16} />
                    Tweak RTP & House Edge
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Configure Aviator, Mines & Slots return rates
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PLAYER MANAGEMENT */}
          {activeTab === "players" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <Users size={18} className="text-amber-400" />
                    Player Accounts & Ledger
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage players, modify balances, override VIP tiers, and view lifetime PnL.
                  </p>
                </div>

                {/* Search & Status Filters */}
                <form onSubmit={handlePlayerSearchSubmit} className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search ID, phone, username..."
                      value={playerSearch}
                      onChange={(e) => setPlayerSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <select
                    value={playerStatusFilter}
                    onChange={(e) => setPlayerStatusFilter(e.target.value)}
                    className="py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="frozen">Frozen Only</option>
                    <option value="banned">Banned Only</option>
                  </select>
                </form>
              </div>

              {/* Player Table */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Player ID / User</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3 text-right">Balance (PKR)</th>
                        <th className="p-3 text-center">VIP</th>
                        <th className="p-3 text-right">Total Bets</th>
                        <th className="p-3 text-right">Total Wins</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {players.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3">
                            <div className="font-bold text-white font-sans">{p.username}</div>
                            <div className="text-[10px] text-amber-400/90">{p.id}</div>
                          </td>
                          <td className="p-3 text-slate-300">{p.phone}</td>
                          <td className="p-3 text-right font-bold text-amber-400">
                            ₨ {p.balance.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black">
                              VIP {p.vipLevel}
                            </span>
                          </td>
                          <td className="p-3 text-right text-slate-300">
                            ₨ {p.totalBets.toLocaleString()}
                          </td>
                          <td className="p-3 text-right text-emerald-400">
                            ₨ {p.totalWins.toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                p.status === "active"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : p.status === "frozen"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedPlayer(p)}
                                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-sans font-bold text-[11px] transition"
                              >
                                Adjust Funds
                              </button>
                              <button
                                onClick={() => handleTogglePlayerStatus(p)}
                                title={p.status === "active" ? "Freeze Account" : "Unfreeze Account"}
                                className={`p-1 rounded ${
                                  p.status === "active"
                                    ? "bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white"
                                    : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                                } transition`}
                              >
                                <Ban size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CASHIER & APPROVALS */}
          {activeTab === "cashier" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <CreditCard size={18} className="text-emerald-400" />
                    Pakistani Financial Cashier & Approvals
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    1-Click approval queue for JazzCash, EasyPaisa, Bank Transfer, and USDT deposits/withdrawals.
                  </p>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-2">
                  <select
                    value={financeTypeFilter}
                    onChange={(e) => setFinanceTypeFilter(e.target.value)}
                    className="py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
                  >
                    <option value="all">All Types</option>
                    <option value="withdraw">Withdrawals Only</option>
                    <option value="deposit">Deposits Only</option>
                  </select>

                  <select
                    value={financeStatusFilter}
                    onChange={(e) => setFinanceStatusFilter(e.target.value)}
                    className="py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending Approvals</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Tx Ref & Time</th>
                        <th className="p-3">Player & Risk Score</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Payment Channel</th>
                        <th className="p-3">Account Details</th>
                        <th className="p-3 text-right">Amount (PKR)</th>
                        <th className="p-3 text-center">Wagering Turnover</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {financeRecords.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3">
                            <div className="font-bold text-slate-200">{f.id}</div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(f.timestamp).toLocaleString()}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-sans font-bold text-white flex items-center gap-1.5">
                              <span>{f.username}</span>
                              {f.riskScore === "HIGH_RISK" && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-red-500/20 border border-red-500/40 text-[9px] text-red-300 font-bold animate-pulse">
                                  <ShieldAlert size={10} className="text-red-400" />
                                  HIGH RISK
                                </span>
                              )}
                              {f.riskScore === "MEDIUM" && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-[9px] text-amber-300 font-bold">
                                  MED RISK
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2">
                              <span>{f.userId}</span>
                              {f.riskReason && (
                                <span className="text-red-400 text-[9px] italic truncate max-w-[140px]" title={f.riskReason}>
                                  • {f.riskReason}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                f.type === "deposit"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {f.type}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {f.method?.toLowerCase().includes("easypaisa") && <EasyPaisaIcon size={24} />}
                              {f.method?.toLowerCase().includes("jazzcash") && <JazzCashIcon size={24} />}
                              {(f.method?.toLowerCase().includes("bank") || f.method?.toLowerCase().includes("raast")) && <BankRaastIcon size={24} />}
                              {f.method?.toLowerCase().includes("usdt") && <UsdtIcon size={24} />}
                              <div>
                                <span className="font-sans font-semibold text-slate-200">{f.method}</span>
                                <div className="text-[10px] text-slate-500">{f.txReference}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-slate-200">{f.accountTitle}</div>
                            <div className="text-[10px] text-amber-400">{f.accountNumber}</div>
                          </td>
                          <td className="p-3 text-right font-black text-white text-sm">
                            ₨ {f.amount.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center">
                            {f.turnoverStatus ? (
                              f.turnoverStatus.isCompliant ? (
                                <div className="text-[10px] text-emerald-400 font-bold flex flex-col items-center">
                                  <span className="bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                    ✓ 100% Compliant
                                  </span>
                                  <span className="text-[9px] text-slate-400 mt-0.5">
                                    ₨ {f.turnoverStatus.currentTurnover.toLocaleString()} / ₨ {f.turnoverStatus.requiredTurnover.toLocaleString()}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-[10px] text-red-400 font-bold flex flex-col items-center">
                                  <span className="bg-red-500/20 px-1.5 py-0.5 rounded border border-red-500/40 animate-pulse">
                                    ⚠️ LOCKED (Deficit ₨ {(f.turnoverStatus.requiredTurnover - f.turnoverStatus.currentTurnover).toLocaleString()})
                                  </span>
                                  <span className="text-[9px] text-slate-400 mt-0.5">
                                    Wagered: ₨ {f.turnoverStatus.currentTurnover.toLocaleString()} / ₨ {f.turnoverStatus.requiredTurnover.toLocaleString()}
                                  </span>
                                </div>
                              )
                            ) : f.type === "withdraw" ? (
                              <span className="text-[10px] text-slate-400">1x Dep / 15x Bonus</span>
                            ) : (
                              <span className="text-[10px] text-slate-500">-</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                f.status === "approved"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : f.status === "pending"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {f.status}
                            </span>
                          </td>
                          <td className="p-3 text-center font-sans">
                            {f.status === "pending" ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleCashierAction(f.id, f.type, "approve")}
                                  className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] transition shadow"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleCashierAction(f.id, f.type, "reject")}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleVoidFraudAccount(f)}
                                  title="Void fraudulent cashout and freeze user account"
                                  className="px-2 py-1 rounded bg-red-600/30 hover:bg-red-600 border border-red-500/40 text-red-300 hover:text-white font-bold text-[10px] transition"
                                >
                                  Void & Ban
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: RED PACKETS & PROMO CODES */}
          {activeTab === "promos" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <Gift size={18} className="text-red-400" />
                    Red Packet Marketing & Voucher Engine
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Issue viral promo codes (OKWIN888, FREE500) for instant player wallet credits.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                    Active Codes: <strong className="text-amber-400">{promoCodes.filter((p) => p.status === "active").length}</strong>
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                    Total Claims: <strong className="text-emerald-400">{promoCodes.reduce((a, b) => a + b.claimsCount, 0)}</strong>
                  </span>
                </div>
              </div>

              {/* Create New Promo Code Form */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <PlusCircle size={15} className="text-amber-400" />
                  Issue New Red Packet Voucher
                </h3>

                <form onSubmit={handleCreatePromo} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Promo Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VIPBONUS"
                      value={newCodeName}
                      onChange={(e) => setNewCodeName(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-yellow-300 uppercase focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Credit Reward (PKR)
                    </label>
                    <input
                      type="number"
                      placeholder="500"
                      value={newCodeAmount}
                      onChange={(e) => setNewCodeAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Max Claim Cap (Players)
                    </label>
                    <input
                      type="number"
                      placeholder="500"
                      value={newCodeCap}
                      onChange={(e) => setNewCodeCap(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Description / Campaign
                    </label>
                    <input
                      type="text"
                      placeholder="Special Weekend Gift"
                      value={newCodeDesc}
                      onChange={(e) => setNewCodeDesc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-4 flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={creatingPromo}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-500/20 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      <Gift size={14} />
                      <span>{creatingPromo ? "Generating Code..." : "Create & Activate Voucher"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Promo Codes Table */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Voucher Code</th>
                        <th className="p-3">Campaign Description</th>
                        <th className="p-3 text-right">Cash Reward (PKR)</th>
                        <th className="p-3 text-center">Redemption Progress</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {promoCodes.map((p) => {
                        const progressPct = Math.min(100, Math.round((p.claimsCount / p.maxClaims) * 100));
                        return (
                          <tr key={p.code} className="hover:bg-slate-800/40 transition">
                            <td className="p-3">
                              <div className="font-bold text-yellow-300 font-mono text-sm">{p.code}</div>
                              <div className="text-[10px] text-slate-500">
                                Created: {new Date(p.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="p-3 font-sans text-slate-200">
                              {p.description}
                            </td>
                            <td className="p-3 text-right font-black text-amber-400 text-sm">
                              ₨ {p.bonusAmount.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-white font-bold">{p.claimsCount}</span>
                                <span className="text-slate-500">/ {p.maxClaims}</span>
                                <span className="text-[10px] text-slate-400">({progressPct}%)</span>
                              </div>
                              <div className="w-24 h-1.5 bg-slate-800 rounded-full mx-auto mt-1 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  p.status === "active"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleTogglePromo(p.code)}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                                  p.status === "active"
                                    ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                                    : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                }`}
                              >
                                {p.status === "active" ? "Disable" : "Activate"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GAME RTP & HOUSE EDGE ENGINE */}
          {activeTab === "games" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Gamepad2 size={18} className="text-purple-400" />
                  In-House & Studio Game RTP & House Edge Engine
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tune mathematical Return-to-Player (RTP) percentages, house hold margins, and emergency kill switches.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {games.map((game) => (
                  <div key={game.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-white">{game.name}</div>
                        <div className="text-[11px] text-slate-400">
                          Provider: <span className="text-amber-400">{game.provider}</span> • {game.category}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleGameRtpChange(
                            game.id,
                            game.rtpPercentage,
                            game.status === "active" ? "maintenance" : "active"
                          )
                        }
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition ${
                          game.status === "active"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {game.status === "active" ? "Active" : "Maintenance"}
                      </button>
                    </div>

                    {/* RTP Slider & Edge Display */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">RTP Setting:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-amber-400 text-sm">
                            {game.rtpPercentage.toFixed(1)}%
                          </span>
                          <span className="text-slate-500 text-[11px]">(Edge: {game.houseEdge.toFixed(1)}%)</span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="88.0"
                        max="98.5"
                        step="0.1"
                        value={game.rtpPercentage}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setGames((prev) =>
                            prev.map((g) => (g.id === game.id ? { ...g, rtpPercentage: val, houseEdge: Math.round((100 - val) * 10) / 10 } : g))
                          );
                        }}
                        onMouseUp={(e) => {
                          const val = parseFloat((e.target as HTMLInputElement).value);
                          handleGameRtpChange(game.id, val);
                        }}
                        onTouchEnd={(e) => {
                          const val = parseFloat((e.target as HTMLInputElement).value);
                          handleGameRtpChange(game.id, val);
                        }}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                      />

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>High Casino Margin (88%)</span>
                        <span>Player Friendly (98.5%)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: AFFILIATE & PROMOTERS */}
          {activeTab === "agents" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Award size={18} className="text-amber-400" />
                  Multi-Tier Agent & Referral Network
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Commission hierarchy matching JJWin’s Infinite Differential Agent structure.
                </p>
              </div>

              {/* Commission Tiers Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                  <div className="text-[11px] text-slate-400 font-bold uppercase">Tier 1 Direct Commission</div>
                  <div className="text-3xl font-black text-amber-400 font-mono">
                    {settings?.tier1Commission || 30}%
                  </div>
                  <div className="text-xs text-slate-400">On all direct invite player bets</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                  <div className="text-[11px] text-slate-400 font-bold uppercase">Tier 2 Sub-Agent Spread</div>
                  <div className="text-3xl font-black text-orange-400 font-mono">
                    {settings?.tier2Commission || 10}%
                  </div>
                  <div className="text-xs text-slate-400">From second generation referrals</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                  <div className="text-[11px] text-slate-400 font-bold uppercase">Tier 3 Master Agency</div>
                  <div className="text-3xl font-black text-emerald-400 font-mono">
                    {settings?.tier3Commission || 5}%
                  </div>
                  <div className="text-xs text-slate-400">Platform override commission</div>
                </div>
              </div>

              {/* Top Agents List */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Top Active Promoters (Pakistan Region)
                </h3>
                <div className="divide-y divide-slate-800 text-xs">
                  {[
                    { name: "Winner_007", code: "OKWIN777", invited: 3, commission: "₨ 1,800.00" },
                    { name: "Lahore_King", code: "VIPLAHORE", invited: 24, commission: "₨ 38,400.00" },
                    { name: "Sultan_Vip", code: "SULTAN888", invited: 89, commission: "₨ 194,500.00" },
                  ].map((ag, i) => (
                    <div key={ag.code} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-amber-400 text-[11px]">
                          #{i + 1}
                        </span>
                        <div>
                          <div className="font-bold text-white">{ag.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">Code: {ag.code}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-400">{ag.commission}</div>
                        <div className="text-[10px] text-slate-400">{ag.invited} players invited</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: RISK CONTROL, ANTI-DRAIN & HOUSE DEFENSES */}
          {activeTab === "risk" && riskSettings && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <ShieldAlert size={18} className="text-red-400" />
                  House Profit & Anti-Drain Defense Center
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Protects operator liquidity by enforcing weighted wheel curves, rollover locks, payout ceilings, and bot-farm suppression.
                </p>
              </div>

              {/* 4 Key Protection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5 shadow">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Max Win Per Bet</span>
                    <ShieldAlert size={16} className="text-red-400" />
                  </div>
                  <div className="text-xl font-black font-mono text-white">
                    ₨ {riskSettings.maxWinPerBet.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <span>✓ Hard Capped in Aviator & Mines</span>
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Prevents runaway x1000 multipliers from bankrupting the house.
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5 shadow">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Wheel Deposit Barrier</span>
                    <Lock size={16} className="text-amber-400" />
                  </div>
                  <div className="text-xl font-black font-mono text-amber-400">
                    ₨ {riskSettings.minDepositForSpin.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                    <span>✓ Lifetime Deposit Gate Active</span>
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Stops multi-account burner bots from farming free spins.
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5 shadow">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Bonus Wagering Rollover</span>
                    <RefreshCw size={16} className="text-purple-400" />
                  </div>
                  <div className="text-xl font-black font-mono text-purple-400">
                    {riskSettings.bonusRolloverMultiplier}x
                  </div>
                  <div className="text-[10px] text-purple-300 font-bold flex items-center gap-1">
                    <span>✓ Anti-Drain Turnover Lock</span>
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Free bonus/wheel funds must be wagered 15x before cashout.
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5 shadow">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Tight House Edge Mode</span>
                    <Percent size={16} className="text-emerald-400" />
                  </div>
                  <div className="text-xl font-black font-mono text-white">
                    {riskSettings.tightHouseEdgeMode ? "STRICT" : "NORMAL"}
                  </div>
                  <div className={`text-[10px] font-bold flex items-center gap-1 ${
                    riskSettings.tightHouseEdgeMode ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    <span>{riskSettings.tightHouseEdgeMode ? "⚠️ +3% Defensive House Margin" : "✓ Standard Commercial RTP"}</span>
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Suppresses variance during organized syndicate runs.
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveRiskSettings} className="space-y-6">
                {/* 1. Lucky Wheel Weight Tuning */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Percent size={16} className="text-amber-400" />
                        Lucky Wheel Probability Engine & Weight Sliders
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Client wheel outcome is 100% rigged to these server odds. Tune each slice weight to control house payout.
                      </p>
                    </div>

                    {/* Calculated Expected Value (EV) per spin */}
                    {(() => {
                      const totalWeight = riskSettings.wheelSectorWeights.reduce((a, b) => a + b, 0) || 1;
                      const sectorPayouts = [100, 50, 500, 5, 200, 888, 1888, 300];
                      const ev = riskSettings.wheelSectorWeights.reduce(
                        (acc, w, i) => acc + (w / totalWeight) * sectorPayouts[i],
                        0
                      );
                      return (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-3 font-mono text-xs">
                          <div>
                            <span className="text-[9px] uppercase text-slate-500 block">Expected Cost / Spin</span>
                            <strong className="text-amber-400 text-sm">₨ {ev.toFixed(2)} PKR</strong>
                          </div>
                          <div className="border-l border-slate-800 pl-3">
                            <span className="text-[9px] uppercase text-slate-500 block">Total Slices Weight</span>
                            <span className="text-white font-bold">{totalWeight.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Weight Tuning Presets */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setRiskSettings({
                          ...riskSettings,
                          wheelSectorWeights: [25, 65, 0.1, 5, 4.88, 0.01, 0.005, 0.005],
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
                    >
                      🛡️ Ultra Conservative (Low Payouts)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRiskSettings({
                          ...riskSettings,
                          wheelSectorWeights: [25, 58, 0.2, 10, 5.95, 0.03, 0.01, 0.81],
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold transition"
                    >
                      ⚖️ Standard House Edge (Default)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRiskSettings({
                          ...riskSettings,
                          wheelSectorWeights: [30, 40, 1.0, 15, 10, 0.5, 0.1, 3.4],
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] font-semibold transition"
                    >
                      🎁 Generous Promo Event
                    </button>
                  </div>

                  {/* Sectors Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {[
                      { index: 0, label: "₨ 100 Cash", color: "#e11d48", defaultTier: "Standard Prize" },
                      { index: 1, label: "₨ 50 Cash", color: "#10b981", defaultTier: "Frequent Mini Prize (58%)" },
                      { index: 2, label: "₨ 500 Cash", color: "#f59e0b", defaultTier: "Rare High Prize" },
                      { index: 3, label: "200 VIP Points", color: "#8b5cf6", defaultTier: "Zero Cash Value" },
                      { index: 4, label: "₨ 200 Cash", color: "#06b6d4", defaultTier: "Medium Prize" },
                      { index: 5, label: "₨ 888 Cash", color: "#ec4899", defaultTier: "Ultra Rare Lucky 8" },
                      { index: 6, label: "₨ 1,888 Mega Jackpot", color: "#eab308", defaultTier: "0.01% Tease Jackpot" },
                      { index: 7, label: "₨ 300 Cash", color: "#3b82f6", defaultTier: "Medium Rare Prize" },
                    ].map((sec) => {
                      const totalWeight = riskSettings.wheelSectorWeights.reduce((a, b) => a + b, 0) || 1;
                      const weight = riskSettings.wheelSectorWeights[sec.index] || 0;
                      const percentage = ((weight / totalWeight) * 100).toFixed(2);

                      return (
                        <div
                          key={sec.index}
                          className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-white/20"
                                style={{ backgroundColor: sec.color }}
                              />
                              <span className="font-bold text-xs text-white">{sec.label}</span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                (Slice #{sec.index + 1})
                              </span>
                            </div>
                            <span className="text-[11px] font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {percentage}% Chance
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0.01"
                              max="100"
                              step="0.01"
                              value={weight}
                              onChange={(e) => {
                                const newW = parseFloat(e.target.value) || 0.01;
                                const updated = [...riskSettings.wheelSectorWeights];
                                updated[sec.index] = newW;
                                setRiskSettings({ ...riskSettings, wheelSectorWeights: updated });
                              }}
                              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                            />
                            <input
                              type="number"
                              min="0"
                              max="200"
                              step="0.01"
                              value={weight}
                              onChange={(e) => {
                                const newW = parseFloat(e.target.value) || 0;
                                const updated = [...riskSettings.wheelSectorWeights];
                                updated[sec.index] = newW;
                                setRiskSettings({ ...riskSettings, wheelSectorWeights: updated });
                              }}
                              className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          <div className="text-[9px] text-slate-500 flex items-center justify-between">
                            <span>Tier: {sec.defaultTier}</span>
                            <span>Weight: {weight}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Wagering Rollover & Payout Ceilings */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Lock size={16} className="text-emerald-400" />
                    Wagering Rollover Multipliers & Cashout Gates
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Deposit Turnover Multiplier (x)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="5.0"
                        value={riskSettings.depositRolloverMultiplier}
                        onChange={(e) =>
                          setRiskSettings({
                            ...riskSettings,
                            depositRolloverMultiplier: parseFloat(e.target.value) || 1.0,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Standard AML protocol: 1.0x turnover prevents instant cash washing.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Bonus & Wheel Rollover (x)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        max="50"
                        value={riskSettings.bonusRolloverMultiplier}
                        onChange={(e) =>
                          setRiskSettings({
                            ...riskSettings,
                            bonusRolloverMultiplier: parseFloat(e.target.value) || 15.0,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Prevents extraction of free promo credits & spin wins (default 15x).
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Min Lifetime Deposit for Spin (PKR)
                      </label>
                      <input
                        type="number"
                        step="50"
                        min="0"
                        max="5000"
                        value={riskSettings.minDepositForSpin}
                        onChange={(e) =>
                          setRiskSettings({
                            ...riskSettings,
                            minDepositForSpin: parseFloat(e.target.value) || 500,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Zero-deposit burner accounts cannot spin until depositing ₨ 500.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Single Bet Maximum Payout (PKR)
                      </label>
                      <input
                        type="number"
                        step="5000"
                        min="5000"
                        max="500000"
                        value={riskSettings.maxWinPerBet}
                        onChange={(e) =>
                          setRiskSettings({
                            ...riskSettings,
                            maxWinPerBet: parseFloat(e.target.value) || 50000,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Global hard win cap for Aviator, Mines, and Slots per round.
                      </span>
                    </div>

                    <div className="md:col-span-2 flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>Tight House Edge Margin Override</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                            HIGH ROLLER DEFENSE
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          When active, increases casino house edge across all games by +3% to quickly recoup from heavy player winning streaks.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={riskSettings.tightHouseEdgeMode}
                        onChange={(e) =>
                          setRiskSettings({
                            ...riskSettings,
                            tightHouseEdgeMode: e.target.checked,
                          })
                        }
                        className="w-5 h-5 rounded bg-slate-800 text-amber-500 accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button Bar */}
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span>Risk parameters apply in real-time to all live player sessions and cashout requests.</span>
                  </div>
                  <button
                    type="submit"
                    disabled={savingRisk}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs transition shadow-lg shadow-red-500/20 flex items-center gap-2"
                  >
                    <ShieldAlert size={15} />
                    <span>{savingRisk ? "Applying Defenses..." : "Save Risk & House Defenses"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          
        {/* ================= TAB: WORDPRESS-STYLE PAYMENT GATEWAYS MANAGER ================= */}
        {activeTab === "gateway" && (
          !gatewaysConfig ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#121620] border border-[#232838] rounded-2xl text-center space-y-3">
              <RefreshCw size={36} className="animate-spin text-emerald-400" />
              <div className="text-base font-black text-white">Loading Payment Gateways...</div>
              <p className="text-xs text-slate-400">Fetching EasyPaisa, JazzCash, Bank/Raast & USDT configs</p>
              <button
                type="button"
                onClick={loadData}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Retry Loading
              </button>
            </div>
          ) : (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* TOP WORDPRESS-STYLE HEADER BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121620] border border-[#232838] rounded-2xl p-5 shadow-xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-white">Payment Gateway Manager</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                    WooCommerce Standard
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Configure merchant credentials, API keys, RSA 2048 certificates, and webhooks for Pakistani telcos & banks.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadData}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                  <span>Reload Gateways</span>
                </button>
              </div>
            </div>

            {/* WORDPRESS-STYLE SUB-NAVIGATION TABS */}
            <div className="flex items-center gap-1 bg-[#0d121c] border border-slate-800/80 p-1.5 rounded-2xl overflow-x-auto">
              {[
                { id: "overview", label: "All Gateways", icon: "⚙️" },
                { id: "easypaisa", label: "EasyPaisa (MA & RSA)", icon: "🟢" },
                { id: "jazzcash", label: "JazzCash (HTTP & Salt)", icon: "🔴" },
                { id: "raast", label: "Bank & Raast (IBAN)", icon: "🏦" },
                { id: "usdt", label: "USDT Crypto (TRC20)", icon: "🪙" },
                { id: "telegram", label: "Telegram Bot Alert", icon: "🤖" },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    setGatewaySubTab(sub.id as any);
                    setGatewayTestResult(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                    gatewaySubTab === sub.id
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <span>{sub.icon}</span>
                  <span>{sub.label}</span>
                </button>
              ))}
            </div>

            {/* TEST RESULT TOAST / BANNER */}
            {gatewayTestResult && (
              <div className={`p-4 rounded-2xl border ${
                gatewayTestResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-300"
              } text-xs flex items-center justify-between animate-in fade-in`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{gatewayTestResult.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGatewayTestResult(null)}
                  className="text-slate-400 hover:text-white font-bold text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            {/* ================= SUB-TAB 1: ALL GATEWAYS OVERVIEW ================= */}
            {gatewaySubTab === "overview" && (
              <div className="bg-[#121620] border border-[#232838] rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Configured Payment Methods</h4>
                  <span className="text-xs text-slate-400">Manage live settlement status</span>
                </div>

                <div className="divide-y divide-white/5">
                  {/* EasyPaisa Row */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center border border-white/20 shadow-sm">
                        <img src="/images/easypaisa_emblem.png" alt="EasyPaisa" className="h-7 w-auto object-contain" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">EasyPaisa Mobile Account (MA)</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                            gatewaysConfig.easypaisa.mode === "production" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                          }`}>
                            {gatewaysConfig.easypaisa.mode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Account: <span className="text-white font-mono">{gatewaysConfig.easypaisa.merchantMobile}</span> ({gatewaysConfig.easypaisa.accountTitle}) • Store ID: {gatewaysConfig.easypaisa.storeId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...gatewaysConfig.easypaisa, enabled: !gatewaysConfig.easypaisa.enabled };
                          setGatewaysConfig({ ...gatewaysConfig, easypaisa: updated });
                          handleSaveSpecificGateway("easypaisa", updated);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                          gatewaysConfig.easypaisa.enabled ? "bg-emerald-500 text-black font-extrabold" : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {gatewaysConfig.easypaisa.enabled ? "ENABLED" : "DISABLED"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setGatewaySubTab("easypaisa")}
                        className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                      >
                        Manage
                      </button>
                    </div>
                  </div>

                  {/* JazzCash Row */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center border border-white/20 shadow-sm">
                        <img src="/images/jazzcash_emblem.png" alt="JazzCash" className="h-7 w-auto object-contain" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">JazzCash Direct Merchant Gateway</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                            gatewaysConfig.jazzcash.mode === "production" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                          }`}>
                            {gatewaysConfig.jazzcash.mode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Account: <span className="text-white font-mono">{gatewaysConfig.jazzcash.merchantMobile}</span> ({gatewaysConfig.jazzcash.accountTitle}) • Merchant ID: {gatewaysConfig.jazzcash.merchantId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...gatewaysConfig.jazzcash, enabled: !gatewaysConfig.jazzcash.enabled };
                          setGatewaysConfig({ ...gatewaysConfig, jazzcash: updated });
                          handleSaveSpecificGateway("jazzcash", updated);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                          gatewaysConfig.jazzcash.enabled ? "bg-emerald-500 text-black font-extrabold" : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {gatewaysConfig.jazzcash.enabled ? "ENABLED" : "DISABLED"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setGatewaySubTab("jazzcash")}
                        className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                      >
                        Manage
                      </button>
                    </div>
                  </div>

                  {/* Bank & Raast Row */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center border border-white/20 shadow-sm">
                        <img src="/images/raast_emblem.png" alt="Raast" className="h-7 w-auto object-contain" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">Bank Transfer & Raast Instant Settlement</span>
                          <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-500/20 text-emerald-400">
                            State Bank Regulated
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Bank: <span className="text-white font-bold">{gatewaysConfig.raast.bankName}</span> • IBAN: <span className="font-mono text-emerald-400">{gatewaysConfig.raast.iban}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...gatewaysConfig.raast, enabled: !gatewaysConfig.raast.enabled };
                          setGatewaysConfig({ ...gatewaysConfig, raast: updated });
                          handleSaveSpecificGateway("raast", updated);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                          gatewaysConfig.raast.enabled ? "bg-emerald-500 text-black font-extrabold" : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {gatewaysConfig.raast.enabled ? "ENABLED" : "DISABLED"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setGatewaySubTab("raast")}
                        className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                      >
                        Manage
                      </button>
                    </div>
                  </div>

                  {/* USDT Crypto Row */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#26A17B] text-white flex items-center justify-center font-black text-xs shadow-sm">
                        ₮
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">USDT Cryptocurrency (TRC20 Auto)</span>
                          <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-500/20 text-emerald-400">
                            1 USDT = ₨ {gatewaysConfig.usdt.exchangeRatePkr}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono truncate max-w-sm">
                          {gatewaysConfig.usdt.walletAddress}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...gatewaysConfig.usdt, enabled: !gatewaysConfig.usdt.enabled };
                          setGatewaysConfig({ ...gatewaysConfig, usdt: updated });
                          handleSaveSpecificGateway("usdt", updated);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                          gatewaysConfig.usdt.enabled ? "bg-emerald-500 text-black font-extrabold" : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {gatewaysConfig.usdt.enabled ? "ENABLED" : "DISABLED"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setGatewaySubTab("usdt")}
                        className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= SUB-TAB 2: EASYPAISA DEDICATED SETTINGS ================= */}
            {gatewaySubTab === "easypaisa" && (
              <div className="bg-[#121620] border border-[#232838] rounded-2xl p-6 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center border border-white/20 shadow">
                      <img src="/images/easypaisa_emblem.png" alt="EasyPaisa" className="h-8 w-auto object-contain" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">EasyPaisa Gateway Settings</h3>
                      <p className="text-xs text-slate-400">Telenor Mobile Account (MA) Push & RSA 2048 Digital Signature Configuration</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Status:</span>
                    <button
                      type="button"
                      onClick={() => setGatewaysConfig({
                        ...gatewaysConfig,
                        easypaisa: { ...gatewaysConfig.easypaisa, enabled: !gatewaysConfig.easypaisa.enabled }
                      })}
                      className={`px-3.5 py-1 rounded-full text-xs font-bold transition ${
                        gatewaysConfig.easypaisa.enabled ? "bg-emerald-500 text-black font-black" : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {gatewaysConfig.easypaisa.enabled ? "ENABLED" : "DISABLED"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Environment Mode</label>
                    <select
                      value={gatewaysConfig.easypaisa.mode}
                      onChange={(e) => setGatewaysConfig({
                        ...gatewaysConfig,
                        easypaisa: { ...gatewaysConfig.easypaisa, mode: e.target.value }
                      })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-bold"
                    >
                      <option value="sandbox">🧪 Sandbox / Simulation Mode (Test)</option>
                      <option value="production">⚡ Production Mode (Live Bank Settlement)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Store ID (From Telenor Merchant Portal)</label>
                    <input
                      type="text"
                      value={gatewaysConfig.easypaisa.storeId}
                      onChange={(e) => setGatewaysConfig({
                        ...gatewaysConfig,
                        easypaisa: { ...gatewaysConfig.easypaisa, storeId: e.target.value }
                      })}
                      placeholder="e.g. 641"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Merchant Mobile Account (03xxxxxxxxx)</label>
                    <input
                      type="text"
                      value={gatewaysConfig.easypaisa.merchantMobile}
                      onChange={(e) => setGatewaysConfig({
                        ...gatewaysConfig,
                        easypaisa: { ...gatewaysConfig.easypaisa, merchantMobile: e.target.value }
                      })}
                      placeholder="0345 1122334"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Account Title (Displayed on Cashier & App)</label>
                    <input
                      type="text"
                      value={gatewaysConfig.easypaisa.accountTitle}
                      onChange={(e) => setGatewaysConfig({
                        ...gatewaysConfig,
                        easypaisa: { ...gatewaysConfig.easypaisa, accountTitle: e.target.value }
                      })}
                      placeholder="Okwin Merchant Direct"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Partner Portal Username</label>
                    <input
                      type="text"
                      value={gatewaysConfig.easypaisa.username}
                      onChange={(e) => setGatewaysConfig({
                        ...gatewaysConfig,
                        easypaisa: { ...gatewaysConfig.easypaisa, username: e.target.value }
                      })}
                      placeholder="Username for HTTP Authorization header"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Partner Portal Password</label>
                    <input
                      type="password"
                      value={gatewaysConfig.easypaisa.password}
                      onChange={(e) => setGatewaysConfig({
                        ...gatewaysConfig,
                        easypaisa: { ...gatewaysConfig.easypaisa, password: e.target.value }
                      })}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono"
                    />
                  </div>
                </div>

                {/* RSA 2048 Keys Section */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    <span>RSA 2048 Digital Signature Keys (Per Official Encryption Guide)</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Your RSA Private Key (.pem)</label>
                      <textarea
                        rows={4}
                        placeholder="-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA..."
                        value={gatewaysConfig.easypaisa.privateKeyPem}
                        onChange={(e) => setGatewaysConfig({
                          ...gatewaysConfig,
                          easypaisa: { ...gatewaysConfig.easypaisa, privateKeyPem: e.target.value }
                        })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Easypaisa RSA Public Key (.pem)</label>
                      <textarea
                        rows={4}
                        placeholder="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAA..."
                        value={gatewaysConfig.easypaisa.publicKeyPem}
                        onChange={(e) => setGatewaysConfig({
                          ...gatewaysConfig,
                          easypaisa: { ...gatewaysConfig.easypaisa, publicKeyPem: e.target.value }
                        })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* IPN Callback Webhook URL */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Instant Payment Notification (IPN) Webhook URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={gatewaysConfig.easypaisa.ipnUrl}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-slate-800 text-xs text-emerald-400 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(gatewaysConfig.easypaisa.ipnUrl);
                        showToast("📋 IPN Webhook URL copied!");
                      }}
                      className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold whitespace-nowrap"
                    >
                      Copy URL
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Paste this exact URL into your Telenor Easypaisa Merchant Portal under "IPN Attribute Configurations".
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => handleSaveSpecificGateway("easypaisa", gatewaysConfig.easypaisa)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20"
                  >
                    Save EasyPaisa Settings
                  </button>

                  <button
                    type="button"
                    disabled={testingGateway === "easypaisa"}
                    onClick={() => handleTestSpecificGateway("easypaisa")}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition"
                  >
                    {testingGateway === "easypaisa" ? "Testing..." : "Test EasyPaisa Connection"}
                  </button>
                </div>
              </div>
            )}

            {/* ================= SUB-TAB 3: JAZZCASH DEDICATED SETTINGS ================= */}
            {gatewaySubTab === "jazzcash" && (
              <div className="bg-[#121620] border border-[#232838] rounded-2xl p-6 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center border border-white/20 shadow">
                      <img src="/images/jazzcash_emblem.png" alt="JazzCash" className="h-8 w-auto object-contain" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">JazzCash Gateway Settings</h3>
                      <p className="text-xs text-slate-400">Mobilink Microfinance Bank Direct Merchant Integration & Salt Security</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Status:</span>
                    <button
                      type="button"
                      onClick={() => setGatewaysConfig({
                        ...gatewaysConfig,
                        jazzcash: { ...gatewaysConfig.jazzcash, enabled: !gatewaysConfig.jazzcash.enabled }
                      })}
                      className={`px-3.5 py-1 rounded-full text-xs font-bold transition ${
                        gatewaysConfig.jazzcash.enabled ? "bg-emerald-500 text-black font-black" : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {gatewaysConfig.jazzcash.enabled ? "ENABLED" : "DISABLED"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Environment Mode</label>
                    <select
                      value={gatewaysConfig.jazzcash.mode}
                      onChange={(e) => setGatewaysConfig({
                        ...gatewaysConfig,
                        jazzcash: { ...gatewaysConfig.jazzcash, mode: e.target.value }
                      })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-bold"
                    >
                      <option value="sandbox">🧪 Sandbox / Simulation Mode (Test)</option>
                      <option value="production">⚡ Production Mode (Live Bank Settlement)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Merchant ID (From JazzCash Portal)</label>
                    <input
                      type="text"
                      value={gatewaysConfig.jazzcash.merchantId}
                      onChange={(e) => setGatewaysConfig({
                        ...gatewaysConfig,
                        jazzcash: { ...gatewaysConfig.jazzcash, merchantId: e.target.value }
                      })}
                      placeholder="e.g. MC-882190"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Merchant Mobile / Till (03xxxxxxxxx)</label>
                    <input
                      type="text"
                      value={gatewaysConfig.jazzcash.merchantMobile}
                      onChange={(e) => setGatewaysConfig({
                        ...gatewaysConfig,
                        jazzcash: { ...gatewaysConfig.jazzcash, merchantMobile: e.target.value }
                      })}
                      placeholder="0300 7654321"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Account Title (Cashier Screen)</label>
                    <input
                      type="text"
                      value={gatewaysConfig.jazzcash.accountTitle}
                      onChange={(e) => setGatewaysConfig({
                        ...gatewaysConfig,
                        jazzcash: { ...gatewaysConfig.jazzcash, accountTitle: e.target.value }
                      })}
                      placeholder="Okwin VIP Cashier 2"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">JazzCash Merchant Password</label>
                    <input
                      type="password"
                      value={gatewaysConfig.jazzcash.password}
                      onChange={(e) => setGatewaysConfig({
                        ...gatewaysConfig,
                        jazzcash: { ...gatewaysConfig.jazzcash, password: e.target.value }
                      })}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Integrity Salt (HMAC-SHA256 Secret)</label>
                    <input
                      type="text"
                      value={gatewaysConfig.jazzcash.integritySalt}
                      onChange={(e) => setGatewaysConfig({
                        ...gatewaysConfig,
                        jazzcash: { ...gatewaysConfig.jazzcash, integritySalt: e.target.value }
                      })}
                      placeholder="Hash secret from JazzCash Merchant Portal"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono"
                    />
                  </div>
                </div>

                {/* Webhooks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Return URL</label>
                    <input
                      type="text"
                      value={gatewaysConfig.jazzcash.returnUrl}
                      onChange={(e) => setGatewaysConfig({
                        ...gatewaysConfig,
                        jazzcash: { ...gatewaysConfig.jazzcash, returnUrl: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-slate-800 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">IPN Callback Webhook URL</label>
                    <input
                      type="text"
                      readOnly
                      value={gatewaysConfig.jazzcash.ipnUrl}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-slate-800 text-xs text-emerald-400 font-mono"
                    />
                  </div>
                </div>

                {/* Official JazzCash v4.2 Compliance Reference */}
                <div className="p-4 rounded-xl bg-[#090d16] border border-[#232838] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-400">JazzCash v4.2 Specification Compliance</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">STRICT HMAC-SHA256</span>
                    </div>
                    <a
                      href="https://sandbox.jazzcash.com.pk/SandboxDocumentation/v4.2/index.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-bold"
                    >
                      <span>Official Sandbox Doc</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
                    <div className="truncate">
                      <span className="text-slate-500">MWALLET Push API: </span>
                      <span className="text-slate-300">{gatewaysConfig.jazzcash.mode === "production" ? "payments.jazzcash.com.pk" : "sandbox.jazzcash.com.pk"}/.../DoMWalletTransaction</span>
                    </div>
                    <div className="truncate">
                      <span className="text-slate-500">Hosted Portal URL: </span>
                      <span className="text-slate-300">{gatewaysConfig.jazzcash.mode === "production" ? "payments.jazzcash.com.pk" : "sandbox.jazzcash.com.pk"}/.../merchantform/</span>
                    </div>
                    <div className="truncate">
                      <span className="text-slate-500">Hashing Formula: </span>
                      <span className="text-slate-300">HMAC-SHA256(Salt + & + [ASCII-sorted])</span>
                    </div>
                    <div className="truncate">
                      <span className="text-slate-500">Inquiry API: </span>
                      <span className="text-slate-300">/.../DoTransactionInquiry</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => handleSaveSpecificGateway("jazzcash", gatewaysConfig.jazzcash)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20"
                  >
                    Save JazzCash Settings
                  </button>

                  <button
                    type="button"
                    disabled={testingGateway === "jazzcash"}
                    onClick={() => handleTestSpecificGateway("jazzcash")}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition"
                  >
                    {testingGateway === "jazzcash" ? "Testing..." : "Test JazzCash Connection"}
                  </button>
                </div>
              </div>
            )}

            {/* ================= SUB-TAB 4: RAAST & BANK SETTINGS ================= */}
            {gatewaySubTab === "raast" && (
              <div className="bg-[#121620] border border-[#232838] rounded-2xl p-6 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center border border-white/20 shadow">
                      <img src="/images/raast_emblem.png" alt="Raast" className="h-8 w-auto object-contain" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Bank Transfer & Raast Gateway</h3>
                      <p className="text-xs text-slate-400">State Bank of Pakistan Instant IBFT Settlement & Dynamic QR Generator</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setGatewaysConfig({
                      ...gatewaysConfig,
                      raast: { ...gatewaysConfig.raast, enabled: !gatewaysConfig.raast.enabled }
                    })}
                    className={`px-3.5 py-1 rounded-full text-xs font-bold transition ${
                      gatewaysConfig.raast.enabled ? "bg-emerald-500 text-black font-black" : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {gatewaysConfig.raast.enabled ? "ENABLED" : "DISABLED"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Primary Settlement Bank</label>
                    <select
                      value={gatewaysConfig.raast.bankName}
                      onChange={(e) => setGatewaysConfig({
                        ...gatewaysConfig,
                        raast: { ...gatewaysConfig.raast, bankName: e.target.value }
                      })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-bold"
                    >
                      <option value="Meezan Bank Islamic">Meezan Bank (Islamic)</option>
                      <option value="Habib Bank Limited (HBL)">Habib Bank Limited (HBL)</option>
                      <option value="Bank Alfalah">Bank Alfalah</option>
                      <option value="United Bank Limited (UBL)">United Bank Limited (UBL)</option>
                      <option value="MCB Bank">MCB Bank</option>
                      <option value="Standard Chartered Pakistan">Standard Chartered</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Merchant Account Title</label>
                    <input
                      type="text"
                      value={gatewaysConfig.raast.accountTitle}
                      onChange={(e) => setGatewaysConfig({
                        ...gatewaysConfig,
                        raast: { ...gatewaysConfig.raast, accountTitle: e.target.value }
                      })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">24-Digit Pakistani IBAN</label>
                    <input
                      type="text"
                      value={gatewaysConfig.raast.iban}
                      onChange={(e) => setGatewaysConfig({
                        ...gatewaysConfig,
                        raast: { ...gatewaysConfig.raast, iban: e.target.value }
                      })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Raast Registered Mobile Phone ID</label>
                    <input
                      type="text"
                      value={gatewaysConfig.raast.raastId}
                      onChange={(e) => setGatewaysConfig({
                        ...gatewaysConfig,
                        raast: { ...gatewaysConfig.raast, raastId: e.target.value }
                      })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => handleSaveSpecificGateway("raast", gatewaysConfig.raast)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20"
                  >
                    Save Raast & Bank Settings
                  </button>
                </div>
              </div>
            )}

            {/* ================= SUB-TAB 5: USDT CRYPTO SETTINGS ================= */}
            {gatewaySubTab === "usdt" && (
              <div className="bg-[#121620] border border-[#232838] rounded-2xl p-6 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#26A17B] text-white flex items-center justify-center font-black text-xl shadow">
                      ₮
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">USDT (TRC20) Cryptocurrency Gateway</h3>
                      <p className="text-xs text-slate-400">Automated blockchain deposits with dynamic PKR exchange rate</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setGatewaysConfig({
                      ...gatewaysConfig,
                      usdt: { ...gatewaysConfig.usdt, enabled: !gatewaysConfig.usdt.enabled }
                    })}
                    className={`px-3.5 py-1 rounded-full text-xs font-bold transition ${
                      gatewaysConfig.usdt.enabled ? "bg-emerald-500 text-black font-black" : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {gatewaysConfig.usdt.enabled ? "ENABLED" : "DISABLED"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">TRC20 Wallet Address</label>
                    <input
                      type="text"
                      value={gatewaysConfig.usdt.walletAddress}
                      onChange={(e) => setGatewaysConfig({
                        ...gatewaysConfig,
                        usdt: { ...gatewaysConfig.usdt, walletAddress: e.target.value }
                      })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Exchange Rate (PKR per 1 USDT)</label>
                    <input
                      type="number"
                      value={gatewaysConfig.usdt.exchangeRatePkr}
                      onChange={(e) => setGatewaysConfig({
                        ...gatewaysConfig,
                        usdt: { ...gatewaysConfig.usdt, exchangeRatePkr: parseFloat(e.target.value) || 280 }
                      })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => handleSaveSpecificGateway("usdt", gatewaysConfig.usdt)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20"
                  >
                    Save USDT Crypto Settings
                  </button>
                </div>
              </div>
            )}

            {/* ================= SUB-TAB 6: TELEGRAM ALERT BOT ================= */}
            {gatewaySubTab === "telegram" && telegramConfig && (
              <div className="bg-[#121620] border border-[#232838] rounded-2xl p-6 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 shadow">
                      <Bot size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Operator Telegram Cashier Alert Bot</h3>
                      <p className="text-xs text-slate-400">Receive instant push notifications on your mobile phone for deposits, payouts, and fraud</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTelegramConfig({ ...telegramConfig, enabled: !telegramConfig.enabled })}
                    className={`px-3.5 py-1 rounded-full text-xs font-bold transition ${
                      telegramConfig.enabled ? "bg-emerald-500 text-black font-black" : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {telegramConfig.enabled ? "ENABLED" : "DISABLED"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Telegram Bot Token</label>
                    <input
                      type="text"
                      placeholder="e.g. 7182938102:AAH9f2910..."
                      value={telegramConfig.botToken}
                      onChange={(e) => setTelegramConfig({ ...telegramConfig, botToken: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Telegram Chat ID / Channel</label>
                    <input
                      type="text"
                      placeholder="e.g. -10029384910 or @my_cashier_channel"
                      value={telegramConfig.chatId}
                      onChange={(e) => setTelegramConfig({ ...telegramConfig, chatId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={handleSaveGateway}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20"
                  >
                    Save Telegram Settings
                  </button>

                  <button
                    type="button"
                    disabled={testingTelegram}
                    onClick={handleTestTelegram}
                    className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider transition"
                  >
                    {testingTelegram ? "Dispatching..." : "Send Test Telegram Alert"}
                  </button>
                </div>
              </div>
            )}

          </div>
          )
        )}

        {/* ================= TAB: SECURITY AUDIT TRAIL ================= */}
        {activeTab === "audit" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121620] border border-[#232838] rounded-2xl p-5 shadow-xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-white">Security & Cashier Audit Trail</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold uppercase">
                    Tamper-Evident Ledger
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Cryptographic operational ledger tracking all cashier payouts, RTP overrides, master PIN entries, and settings changes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/api/admin/audit?export=csv"
                  download
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center gap-1.5 transition shadow-lg shadow-purple-600/20"
                >
                  <Download size={14} />
                  <span>Export CSV Log</span>
                </a>
                <button
                  type="button"
                  onClick={loadData}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400 font-bold">Severity:</span>
                {["all", "CRITICAL", "WARN", "INFO"].map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setAuditSeverityFilter(sev)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      auditSeverityFilter === sev
                        ? "bg-purple-600 text-white shadow"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {sev.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400 font-bold">Category:</span>
                {["all", "cashier", "risk", "auth", "system"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAuditCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition ${
                      auditCategoryFilter === cat
                        ? "bg-amber-500 text-black shadow"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b0e14] border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4">Timestamp (PKT)</th>
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Operator</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Event Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          No audit entries match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                log.severity === "CRITICAL"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                                  : log.severity === "WARN"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              }`}
                            >
                              {log.severity}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] uppercase">
                              {log.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                            {log.operator}
                          </td>
                          <td className="py-3 px-4 font-bold text-amber-300 whitespace-nowrap">
                            {log.action}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-300 max-w-md break-words font-mono text-[11px]">
                            {log.details}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

{/* TAB 6: SYSTEM SETTINGS & LIVE MARQUEE */}
          {activeTab === "settings" && settings && (
            <div className="space-y-4 max-w-3xl">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Settings size={18} className="text-amber-400" />
                  Platform System & Announcement Controls
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update live casino marquee banner texts, emergency locks, and cash thresholds.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Live Lobby Marquee Headline
                  </label>
                  <textarea
                    rows={3}
                    value={settings.marqueeText}
                    onChange={(e) => setSettings({ ...settings, marqueeText: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-500">
                    Streamed live across the top ticker of all active mobile players.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Minimum Deposit (PKR)
                    </label>
                    <input
                      type="number"
                      value={settings.minDeposit}
                      onChange={(e) => setSettings({ ...settings, minDeposit: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Minimum Withdrawal (PKR)
                    </label>
                    <input
                      type="number"
                      value={settings.minWithdrawal}
                      onChange={(e) => setSettings({ ...settings, minWithdrawal: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="maint"
                      checked={settings.maintenanceMode}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                      className="rounded bg-slate-800 text-amber-500 accent-amber-500"
                    />
                    <label htmlFor="maint" className="text-xs font-bold text-slate-300 cursor-pointer">
                      Emergency Platform Maintenance Lock
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition shadow-lg shadow-amber-500/20"
                  >
                    Save Platform Settings
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Balance Adjustment Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Manual Balance Adjustment</h3>
                <p className="text-[11px] text-slate-400">
                  Player: <span className="text-amber-400 font-bold">{selectedPlayer.username}</span> ({selectedPlayer.id})
                </p>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-slate-300">
                Current Ledger Balance: <strong className="text-amber-400 font-mono">₨ {selectedPlayer.balance.toFixed(2)}</strong>
              </div>

              {/* Operation Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustOperation("credit")}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                    adjustOperation === "credit"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                >
                  <PlusCircle size={15} />
                  <span>Credit (+ Funds)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustOperation("debit")}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                    adjustOperation === "debit"
                      ? "bg-red-500/20 border-red-500 text-red-400"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                >
                  <MinusCircle size={15} />
                  <span>Debit (- Funds)</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Adjustment Amount (PKR)
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Administrative Reason / Note
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedPlayer(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBalanceAdjust}
                disabled={adjusting}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow"
              >
                {adjusting ? "Processing..." : "Confirm Adjustment"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Master Security PIN Modal Gate */}
      <AdminPinModal
        isOpen={!isAuthorized}
        onSuccess={() => {
          setIsAuthorized(true);
          loadData();
        }}
      />
    </div>
  );
}
