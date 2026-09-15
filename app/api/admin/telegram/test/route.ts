import { NextRequest, NextResponse } from "next/server";
import { telegramBot } from "@/lib/server/telegramBot";
import { adminBackend } from "@/lib/server/adminBackend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const testMessage = body.message || [
      "🔔 <b>OKWIN TEST ALERT</b>",
      "----------------------------------",
      "✅ <b>Telegram Bot connection verified!</b>",
      "⚡ Real-time alerts for Deposits, Withdrawals, and Security Risks are active.",
      `⏱️ ${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })} (PKT)`,
    ].join("\n");

    const result = await telegramBot.sendAlert(testMessage, { parseMode: "HTML" });

    adminBackend.logAuditAction({
      operator: "AdminConsole",
      category: "CONFIG",
      action: "TELEGRAM_TEST_DISPATCHED",
      details: `Test alert dispatched. Result: ${result.message}`,
      severity: result.success ? "INFO" : "WARNING",
    });

    return NextResponse.json({
      status: result.success ? "success" : "warning",
      message: result.message,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
