import { NextRequest, NextResponse } from "next/server";
import { serverWallet } from "@/lib/server/walletBackend";
import { verifyHmacSignature, validateApiKey } from "@/lib/server/security";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || "";
    const apiKey = req.headers.get("x-api-key");

    // Optional verification: if x-signature or x-api-key provided, validate it
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

    const payload = rawBody ? JSON.parse(rawBody) : {};
    const userId = payload.userId || "OK-982314";

    const wallet = serverWallet.getWallet(userId);

    return NextResponse.json({
      status: "success",
      userId: wallet.userId,
      username: wallet.username,
      balance: wallet.balance,
      currency: wallet.currency,
      timestamp: Date.now(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { status: "error", code: "INTERNAL_ERROR", message },
      { status: 500 }
    );
  }
}
