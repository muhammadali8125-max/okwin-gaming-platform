import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";
import { telcoGateway } from "@/lib/server/telcoGateway";
import { telegramBot } from "@/lib/server/telegramBot";

/**
 * Instant Payment Notification (IPN) Webhook
 * Receives automated server-to-server callbacks from Easypaisa & JazzCash
 * per Section 2.3 of the Easypaisa Integration Guide.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      transactionId,
      transactionAmount,
      responseCode,
      responseDesc,
      signature,
      mobileAccountNo,
    } = body;

    if (!orderId || !transactionAmount || !responseCode) {
      return NextResponse.json(
        { responseCode: "0002", responseDesc: "REQUIRED FIELD MISSING" },
        { status: 400 }
      );
    }

    const config = adminBackend.getTelcoConfig();

    // 1. Signature Verification in Production Mode
    if (config.mode === "production" && config.easypaisaPublicKeyPem && signature) {
      const isValid = telcoGateway.verifyRsaSignature(
        { orderId, transactionId, transactionAmount, responseCode },
        signature,
        config.easypaisaPublicKeyPem
      );
      if (!isValid) {
        adminBackend.logAuditAction({
          operator: "TelcoIPN",
          category: "SECURITY",
          action: "IPN_SIGNATURE_FAILED",
          details: `IPN signature verification failed for Order ${orderId}`,
          severity: "CRITICAL",
        });
        return NextResponse.json(
          { responseCode: "0010", responseDesc: "INVALID SIGNATURE" },
          { status: 400 }
        );
      }
    }

    // 2. Process Approved Callback
    if (responseCode === "0000") {
      const amountNum = parseFloat(transactionAmount);
      const ewpRef = transactionId || `EWP${Date.now()}`;

      // Record in Admin Backend
      adminBackend.recordDirectMAPushPayment({
        orderId,
        amount: amountNum,
        method: "EasyPaisa",
        mobileAccountNo: mobileAccountNo || "03xxxxxxxxx",
        transactionId: ewpRef,
        status: "approved",
      });

      // Audit Log Entry
      adminBackend.logAuditAction({
        operator: "TelcoIPN",
        category: "GATEWAY",
        action: "IPN_DEPOSIT_CLEARED",
        details: `Order ${orderId} settled for ₨ ${amountNum}. Telco Ref: ${ewpRef}`,
        severity: "INFO",
      });

      // Dispatch Telegram Alert
      await telegramBot.notifyDeposit({
        username: "Player_IPN",
        amount: amountNum,
        method: "EasyPaisa MA (Auto IPN)",
        transactionRef: ewpRef,
        senderPhone: mobileAccountNo,
        riskScore: "OFFICIAL_TELCO_VERIFIED",
      });

      return NextResponse.json({
        responseCode: "0000",
        responseDesc: "SUCCESS",
        message: "IPN processed and balance cleared",
      });
    }

    return NextResponse.json({
      responseCode: responseCode,
      responseDesc: responseDesc || "DECLINED",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "IPN Error";
    return NextResponse.json(
      { responseCode: "0001", responseDesc: "SYSTEM ERROR", message },
      { status: 500 }
    );
  }
}
