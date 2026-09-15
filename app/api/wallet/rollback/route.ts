import { NextRequest, NextResponse } from "next/server";
import { serverWallet } from "@/lib/server/walletBackend";
import { verifyHmacSignature, validateApiKey } from "@/lib/server/security";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || "";
    const apiKey = req.headers.get("x-api-key");

    // Optional authentication check
    if (signature && !verifyHmacSignature(rawBody, signature)) {
      return NextResponse.json(
        { status: "error", code: "INVALID_SIGNATURE", message: "HMAC signature mismatch" },
        { status: 401 }
      );
    }
    if (apiKey && !validateApiKey(apiKey)) {
      return NextResponse.json(
        { status: "error", code: "UNAUTHORIZED", message: "Invalid API key" },
        { status: 401 }
      );
    }

    if (!rawBody) {
      return NextResponse.json(
        { status: "error", code: "BAD_REQUEST", message: "Missing request body" },
        { status: 400 }
      );
    }

    const payload = JSON.parse(rawBody);
    const { userId = "OK-982314", referenceBetId, transactionId, reason = "Game voided or cancelled" } = payload;

    if (!transactionId) {
      return NextResponse.json(
        { status: "error", code: "MISSING_TX_ID", message: "transactionId is required" },
        { status: 400 }
      );
    }

    if (!referenceBetId) {
      return NextResponse.json(
        { status: "error", code: "MISSING_REFERENCE_ID", message: "referenceBetId is required for rollback" },
        { status: 400 }
      );
    }

    // 1. Idempotency verification
    const cached = serverWallet.getCachedResponse(transactionId);
    if (cached) {
      return NextResponse.json(
        { ...(cached.body as object), idempotentReplay: true },
        { status: cached.status }
      );
    }

    // 2. Process rollback/refund against original transaction
    const result = serverWallet.processRollback(
      userId,
      referenceBetId,
      transactionId,
      reason
    );

    if (!result.success) {
      const errorResp = {
        status: "error",
        code: result.code || "ROLLBACK_FAILED",
        message: result.message,
        balance: result.balance,
      };
      const statusCode = result.code === "BET_NOT_FOUND" ? 404 : 400;
      return NextResponse.json(errorResp, { status: statusCode });
    }

    const successResp = {
      status: "success",
      transactionId,
      referenceBetId,
      userId,
      refundedAmount: result.refundedAmount,
      balance: result.balance,
      currency: "PKR",
      reason,
      alreadyRolledBack: result.code === "ALREADY_ROLLED_BACK",
      timestamp: Date.now(),
    };

    // Cache successful rollback response for idempotency
    serverWallet.setCachedResponse(transactionId, 200, successResp);

    return NextResponse.json(successResp, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { status: "error", code: "INTERNAL_ERROR", message },
      { status: 500 }
    );
  }
}
