"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  ShieldCheck,
  Zap,
  Repeat,
  RotateCcw,
  Wallet,
  Server,
  Layers,
  Code2
} from "lucide-react";

interface TransactionItem {
  transactionId: string;
  referenceId?: string;
  userId: string;
  type: "bet" | "win" | "rollback";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  roundId?: string;
  gameId?: string;
  providerId?: string;
  timestamp: number;
  status: string;
}

export default function ApiTesterPage() {
  const [balance, setBalance] = useState<number>(5000);
  const [loading, setLoading] = useState(false);
  const [lastTxId, setLastTxId] = useState<string>("");
  const [provider, setProvider] = useState<string>("jili");
  const [authMode, setAuthMode] = useState<"valid" | "invalid_sig" | "none">("valid");
  
  // Inspector state
  const [lastRequest, setLastRequest] = useState<{
    method: string;
    url: string;
    headers: Record<string, string>;
    body: unknown;
  } | null>(null);

  const [lastResponse, setLastResponse] = useState<{
    status: number;
    latencyMs: number;
    body: unknown;
  } | null>(null);

  const [recentTransactions, setRecentTransactions] = useState<TransactionItem[]>([]);

  // Fetch initial ledger state
  const fetchLedger = async () => {
    try {
      const res = await fetch("/api/wallet/transactions?userId=OK-982314");
      const data = await res.json();
      if (data.status === "success") {
        setBalance(data.wallet.balance);
        setRecentTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to load ledger:", err);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  // Compute dummy SHA256 hex or standard test signature
  const getAuthHeaders = async (bodyString: string) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authMode === "valid") {
      headers["x-api-key"] = "okwin_api_key_777";
      // Compute simple hex or signature
      // Using Web Crypto API for real HMAC if needed, or pass the known valid secret
      try {
        const encoder = new TextEncoder();
        const keyData = encoder.encode("okwin_secret_key_prod_888");
        const cryptoKey = await window.crypto.subtle.importKey(
          "raw",
          keyData,
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const signatureBuffer = await window.crypto.subtle.sign(
          "HMAC",
          cryptoKey,
          encoder.encode(bodyString)
        );
        const hashArray = Array.from(new Uint8Array(signatureBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        headers["x-signature"] = hashHex;
      } catch {
        headers["x-signature"] = "fallback_valid_signature";
      }
    } else if (authMode === "invalid_sig") {
      headers["x-api-key"] = "okwin_api_key_777";
      headers["x-signature"] = "deadbeef_tampered_signature_999";
    }

    return headers;
  };

  const executeApiCall = async (
    endpoint: string,
    payload: Record<string, unknown>
  ) => {
    setLoading(true);
    const bodyStr = JSON.stringify(payload, null, 2);
    const startTime = performance.now();

    try {
      const headers = await getAuthHeaders(bodyStr);

      setLastRequest({
        method: "POST",
        url: endpoint,
        headers,
        body: payload,
      });

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: bodyStr,
      });

      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);
      const data = await res.json();

      setLastResponse({
        status: res.status,
        latencyMs,
        body: data,
      });

      if (data.balance !== undefined) {
        setBalance(data.balance);
      }

      await fetchLedger();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error";
      setLastResponse({
        status: 500,
        latencyMs: Math.round(performance.now() - startTime),
        body: { error: message },
      });
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleCheckBalance = () => {
    executeApiCall("/api/wallet/balance", {
      userId: "OK-982314",
      timestamp: Date.now(),
    });
  };

  const handlePlaceBet = (amount: number = 200) => {
    const txId = `TX_BET_${Date.now().toString().slice(-6)}`;
    const roundId = `RND_${Math.floor(100000 + Math.random() * 900000)}`;
    setLastTxId(txId);

    executeApiCall("/api/wallet/bet", {
      userId: "OK-982314",
      amount,
      transactionId: txId,
      roundId,
      gameId: `${provider}_classic_game`,
      providerId: provider,
    });
  };

  const handleDuplicateBet = () => {
    if (!lastTxId) {
      alert("Place a bet first to obtain a transactionId to replay!");
      return;
    }

    executeApiCall("/api/wallet/bet", {
      userId: "OK-982314",
      amount: 200,
      transactionId: lastTxId,
      roundId: "RND_DUPLICATE_TEST",
      gameId: `${provider}_classic_game`,
      providerId: provider,
    });
  };

  const handleWin = (amount: number = 600) => {
    const txId = `TX_WIN_${Date.now().toString().slice(-6)}`;
    const roundId = `RND_${Math.floor(100000 + Math.random() * 900000)}`;

    executeApiCall("/api/wallet/win", {
      userId: "OK-982314",
      amount,
      transactionId: txId,
      roundId,
      gameId: `${provider}_classic_game`,
      providerId: provider,
    });
  };

  const handleRollback = () => {
    if (!lastTxId) {
      alert("Place a bet first to test rollback on that bet ID!");
      return;
    }

    const rollbackTxId = `TX_RB_${Date.now().toString().slice(-6)}`;

    executeApiCall("/api/wallet/rollback", {
      userId: "OK-982314",
      referenceBetId: lastTxId,
      transactionId: rollbackTxId,
      reason: "Aggregator voided spin / round disconnected",
    });
  };

  const handleInsufficientFundsTest = () => {
    const txId = `TX_OVERBET_${Date.now().toString().slice(-6)}`;
    executeApiCall("/api/wallet/bet", {
      userId: "OK-982314",
      amount: 999999,
      transactionId: txId,
      roundId: "RND_OVERDRAFT_TEST",
      gameId: `${provider}_high_roller`,
      providerId: provider,
    });
  };

  return (
    <div className="min-h-screen bg-[#0d131f] text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-sm transition"
            >
              <ArrowLeft size={16} />
              <span>Back to Casino</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
                  OKWIN
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-semibold">
                  SEAMLESS WALLET SANDBOX
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                B2B Game Provider Webhook Gateway (JILI, Spribe, PG Soft, Pragmatic Play)
              </p>
            </div>
          </div>

          {/* Player Live Balance Card */}
          <div className="flex items-center gap-4 bg-slate-900/90 border border-amber-500/30 rounded-xl px-4 py-2.5 shadow-lg shadow-black/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Wallet size={18} />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Player Balance (OK-982314)</div>
                <div className="text-lg font-black text-amber-400 tracking-tight">
                  ₨ {balance.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <button
              onClick={fetchLedger}
              title="Refresh ledger state"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers size={14} className="text-amber-400" />
              Simulated Provider Suite
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "jili", label: "JILI (315)" },
                { id: "spribe", label: "Spribe Aviator" },
                { id: "pgsoft", label: "PG Soft (200)" },
                { id: "pragmatic", label: "Pragmatic Play" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition text-center ${
                    provider === p.id
                      ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              Security / Auth Signature Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setAuthMode("valid")}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
                  authMode === "valid"
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                    : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                Valid HMAC-SHA256
              </button>
              <button
                onClick={() => setAuthMode("invalid_sig")}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
                  authMode === "invalid_sig"
                    ? "bg-red-500/20 border-red-500 text-red-300 font-bold"
                    : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                Tampered (Test 401)
              </button>
              <button
                onClick={() => setAuthMode("none")}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
                  authMode === "none"
                    ? "bg-blue-500/20 border-blue-500 text-blue-300 font-bold"
                    : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                Unsigned (Direct)
              </button>
            </div>
          </div>
        </div>

        {/* Action Trigger Grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Zap size={16} className="text-amber-400" />
            Interactive Webhook Scenarios
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Action 1: Balance */}
            <button
              onClick={handleCheckBalance}
              disabled={loading}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-left transition group"
            >
              <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400 group-hover:scale-105 transition">
                <Wallet size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  1. Check Balance
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">POST</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Calls <code className="text-slate-300">/api/wallet/balance</code> to query player balance.
                </div>
              </div>
            </button>

            {/* Action 2: Bet */}
            <button
              onClick={() => handlePlaceBet(200)}
              disabled={loading}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/50 text-left transition group"
            >
              <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-105 transition">
                <Send size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  2. Debit Bet (₨ 200)
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">POST</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Calls <code className="text-slate-300">/api/wallet/bet</code> with unique tx ID and deducts balance.
                </div>
              </div>
            </button>

            {/* Action 3: Idempotency Replay */}
            <button
              onClick={handleDuplicateBet}
              disabled={loading}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 hover:bg-slate-800/50 text-left transition group"
            >
              <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400 group-hover:scale-105 transition">
                <Repeat size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  3. Replay Bet (Idempotency)
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono">POST</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Re-submits the exact same transaction ID to verify 0 double-deduction!
                </div>
              </div>
            </button>

            {/* Action 4: Win */}
            <button
              onClick={() => handleWin(600)}
              disabled={loading}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/50 text-left transition group"
            >
              <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-105 transition">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  4. Credit Win (₨ 600)
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">POST</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Calls <code className="text-slate-300">/api/wallet/win</code> with round settlement and credits funds.
                </div>
              </div>
            </button>

            {/* Action 5: Rollback */}
            <button
              onClick={handleRollback}
              disabled={loading}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-orange-500/40 hover:bg-slate-800/50 text-left transition group"
            >
              <div className="p-2.5 rounded-lg bg-orange-500/20 text-orange-400 group-hover:scale-105 transition">
                <RotateCcw size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                  5. Rollback Bet
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-mono">POST</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Calls <code className="text-slate-300">/api/wallet/rollback</code> with referenceBetId to refund bet.
                </div>
              </div>
            </button>

            {/* Action 6: Insufficient Funds */}
            <button
              onClick={handleInsufficientFundsTest}
              disabled={loading}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500/40 hover:bg-slate-800/50 text-left transition group"
            >
              <div className="p-2.5 rounded-lg bg-red-500/20 text-red-400 group-hover:scale-105 transition">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                  6. Insufficient Funds Test
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-mono">POST</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Simulates ₨ 999,999 bet to verify graceful error return and code.
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Live Payload & Response Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Request Box */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Code2 size={14} className="text-blue-400" />
                Aggregator Webhook Request
              </span>
              {lastRequest && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {lastRequest.method} {lastRequest.url}
                </span>
              )}
            </div>

            {lastRequest ? (
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Headers:</div>
                  <pre className="bg-slate-950 p-2 rounded text-slate-300 overflow-x-auto text-[11px]">
                    {JSON.stringify(lastRequest.headers, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Payload Body:</div>
                  <pre className="bg-slate-950 p-2 rounded text-amber-300/90 overflow-x-auto text-[11px]">
                    {JSON.stringify(lastRequest.body, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-500 italic">
                Click any webhook scenario above to inspect outgoing aggregator payload
              </div>
            )}
          </div>

          {/* Response Box */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Server size={14} className="text-emerald-400" />
                Okwin Wallet Response
              </span>
              {lastResponse && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    {lastResponse.latencyMs}ms
                  </span>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
                      lastResponse.status === 200
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    HTTP {lastResponse.status}
                  </span>
                </div>
              )}
            </div>

            {lastResponse ? (
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">JSON Response:</div>
                  <pre
                    className={`bg-slate-950 p-3 rounded overflow-x-auto text-[11px] ${
                      lastResponse.status === 200 ? "text-emerald-300/90" : "text-red-400"
                    }`}
                  >
                    {JSON.stringify(lastResponse.body, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-500 italic">
                Response will appear here with execution status and balance updates
              </div>
            )}
          </div>
        </div>

        {/* Server Ledger Audit History */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Server size={14} className="text-amber-400" />
              Live Server-Side Audit Ledger ({recentTransactions.length} events)
            </h3>
            <span className="text-[11px] text-slate-500">
              Auto-refreshed on each webhook transaction
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Time</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Tx ID</th>
                  <th className="p-2.5">Provider / Game</th>
                  <th className="p-2.5 text-right">Amount</th>
                  <th className="p-2.5 text-right">Balance After</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-500 italic">
                      No webhook transactions recorded yet. Click one of the test triggers above.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => (
                    <tr key={tx.transactionId} className="hover:bg-slate-800/40 transition">
                      <td className="p-2.5 text-slate-400">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            tx.type === "bet"
                              ? "bg-amber-500/20 text-amber-400"
                              : tx.type === "win"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-orange-500/20 text-orange-400"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-200">{tx.transactionId}</td>
                      <td className="p-2.5 text-slate-400">
                        {tx.providerId || "system"} {tx.gameId ? `(${tx.gameId})` : ""}
                      </td>
                      <td
                        className={`p-2.5 text-right font-bold ${
                          tx.type === "bet"
                            ? "text-amber-400"
                            : tx.type === "win"
                            ? "text-emerald-400"
                            : "text-orange-400"
                        }`}
                      >
                        {tx.type === "bet" ? "-" : "+"}₨ {tx.amount.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right text-slate-200">
                        ₨ {tx.balanceAfter.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            tx.status === "success"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : tx.status === "rolled_back"
                              ? "bg-orange-500/10 text-orange-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
