import https from "https";
import { adminBackend } from "./adminBackend";

export interface TelegramMessagePayload {
  chat_id: string;
  text: string;
  parse_mode?: "HTML" | "Markdown";
  disable_web_page_preview?: boolean;
}

/**
 * Telegram Cashier & Risk Control Alert Bot Engine
 * Transmits real-time cashier notifications to the platform owner's phone via Telegram Bot API.
 */
class TelegramBotService {
  private static instance: TelegramBotService;

  private constructor() {}

  public static getInstance(): TelegramBotService {
    if (!TelegramBotService.instance) {
      TelegramBotService.instance = new TelegramBotService();
    }
    return TelegramBotService.instance;
  }

  public async sendAlert(
    message: string,
    options?: { parseMode?: "HTML" | "Markdown" }
  ): Promise<{ success: boolean; message: string }> {
    const config = adminBackend.getTelegramConfig();

    if (!config.enabled || !config.botToken || !config.chatId) {
      // Graceful offline mock: Record in audit log
      adminBackend.logAuditAction({
        operator: "TelegramBot",
        category: "CONFIG",
        action: "BOT_ALERT_SKIPPED",
        details: `Telegram alert skipped (bot not enabled or credentials unset). Preview: ${message.slice(0, 100)}...`,
        severity: "INFO",
      });
      return { success: false, message: "Telegram bot is not configured or disabled." };
    }

    const payload: TelegramMessagePayload = {
      chat_id: config.chatId,
      text: message,
      parse_mode: options?.parseMode || "HTML",
      disable_web_page_preview: true,
    };

    return new Promise((resolve) => {
      const dataString = JSON.stringify(payload);
      const req = https.request(
        {
          hostname: "api.telegram.org",
          path: `/bot${config.botToken}/sendMessage`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(dataString),
          },
          timeout: 8000,
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            try {
              const parsed = JSON.parse(body);
              if (parsed.ok) {
                resolve({ success: true, message: "Alert dispatched to Telegram." });
              } else {
                resolve({
                  success: false,
                  message: `Telegram API error: ${parsed.description || "Unknown error"}`,
                });
              }
            } catch {
              resolve({ success: false, message: "Invalid response from Telegram API." });
            }
          });
        }
      );

      req.on("error", (err) => {
        resolve({ success: false, message: `Network error: ${err.message}` });
      });

      req.on("timeout", () => {
        req.destroy();
        resolve({ success: false, message: "Telegram request timed out." });
      });

      req.write(dataString);
      req.end();
    });
  }

  // --- Specialized Cashier Notifications ---

  public async notifyDeposit(deposit: {
    username: string;
    amount: number;
    method: string;
    transactionRef: string;
    accountHolder?: string;
    senderPhone?: string;
    riskScore?: string;
  }) {
    const config = adminBackend.getTelegramConfig();
    if (!config.enabled || !config.notifyOnDeposit) return;
    if (deposit.amount < config.minAmountForAlert) return;

    const time = new Date().toLocaleTimeString("en-PK", { timeZone: "Asia/Karachi" });
    const msg = [
      `💰 <b>NEW DEPOSIT RECEIVED</b>`,
      `----------------------------------`,
      `👤 <b>Player:</b> <code>${deposit.username}</code>`,
      `💵 <b>Amount:</b> <b>₨ ${deposit.amount.toLocaleString()}</b>`,
      `💳 <b>Method:</b> ${deposit.method}`,
      `📱 <b>Phone:</b> <code>${deposit.senderPhone || "N/A"}</code>`,
      `🔖 <b>TID Ref:</b> <code>${deposit.transactionRef}</code>`,
      `🛡️ <b>Anti-Replay Risk:</b> ${deposit.riskScore || "CLEAN"}`,
      `⏱️ <b>Time:</b> ${time} (PKT)`,
      `----------------------------------`,
      `<i>Verified via Okwin Anti-Replay Engine</i>`,
    ].join("\n");

    return this.sendAlert(msg, { parseMode: "HTML" });
  }

  public async notifyWithdrawal(withdrawal: {
    username: string;
    amount: number;
    method: string;
    accountNumber: string;
    accountTitle: string;
    isCompliant: boolean;
    deficit: number;
  }) {
    const config = adminBackend.getTelegramConfig();
    if (!config.enabled || !config.notifyOnWithdrawal) return;

    const time = new Date().toLocaleTimeString("en-PK", { timeZone: "Asia/Karachi" });
    const complianceBadge = withdrawal.isCompliant
      ? "✅ <b>Turnover 100% Compliant</b>"
      : `⚠️ <b>TURNOVER DEFICIT: ₨ ${withdrawal.deficit.toLocaleString()}</b>`;

    const msg = [
      `🏦 <b>WITHDRAWAL REQUEST ALERT</b>`,
      `----------------------------------`,
      `👤 <b>Player:</b> <code>${withdrawal.username}</code>`,
      `💸 <b>Payout:</b> <b>₨ ${withdrawal.amount.toLocaleString()}</b>`,
      `💳 <b>Method:</b> ${withdrawal.method}`,
      `🏷️ <b>Title:</b> ${withdrawal.accountTitle}`,
      `📱 <b>Account:</b> <code>${withdrawal.accountNumber}</code>`,
      `📊 <b>Status:</b> ${complianceBadge}`,
      `⏱️ <b>Time:</b> ${time} (PKT)`,
      `----------------------------------`,
      `<i>Review & authorize in Operator Console</i>`,
    ].join("\n");

    return this.sendAlert(msg, { parseMode: "HTML" });
  }

  public async notifySecurity(alert: {
    title: string;
    details: string;
    severity: "WARNING" | "CRITICAL";
    ip?: string;
  }) {
    const config = adminBackend.getTelegramConfig();
    if (!config.enabled || !config.notifyOnSecurityAlert) return;

    const icon = alert.severity === "CRITICAL" ? "🚨🚨" : "⚠️";
    const time = new Date().toLocaleTimeString("en-PK", { timeZone: "Asia/Karachi" });

    const msg = [
      `${icon} <b>SECURITY RISK CONTROL ALERT</b>`,
      `----------------------------------`,
      `🛡️ <b>Type:</b> <b>${alert.title}</b>`,
      `⚠️ <b>Severity:</b> ${alert.severity}`,
      `📝 <b>Details:</b> ${alert.details}`,
      `🌐 <b>Source IP:</b> <code>${alert.ip || "Local/Anonymous"}</code>`,
      `⏱️ <b>Time:</b> ${time} (PKT)`,
      `----------------------------------`,
      `<i>Immediate attention recommended</i>`,
    ].join("\n");

    return this.sendAlert(msg, { parseMode: "HTML" });
  }
}

export const telegramBot = TelegramBotService.getInstance();
