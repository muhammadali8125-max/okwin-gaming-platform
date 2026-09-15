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
    const { userId = "OK-982314", amount, transactionId, roundId, gameId, providerId } = payload;

    if (!transactionId) {
      return NextResponse.json(
        { status: "error", code: "MISSING_TX_ID", message: "transactionId is required" },
        { status: 400 }
      );
    }

    if (amount === undefined || typeof amount !== "number" || amount < 0) {
      return NextResponse.json(
        { status: "error", code: "INVALID_AMOUNT", message: "amount must be a non-negative number" },
        { status: 400 }
      );
    }

    // 1. Idempotency verification: return cached response if transactionId was already processed
    const cached = serverWallet.getCachedResponse(transactionId);
    if (cached) {
      return NextResponse.json(
        { ...(cached.body as object), idempotentReplay: true },
        { status: cached.status }
      );
    }

    // 2. Process credit to server ledger
    const result = serverWallet.processWin(
      userId,
      amount,
      transactionId,
      roundId,
      gameId,
      providerId
    );

    const successResp = {
      status: "success",
      transactionId,
      userId,
      amountCredited: amount,
      balance: result.balance,
      currency: "PKR",
      roundId,
      gameId,
      providerId,
      timestamp: Date.now(),
    };

    // Cache successful transaction response for idempotency
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
