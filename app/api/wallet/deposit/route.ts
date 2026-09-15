import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, username, amount, method, senderPhone, transactionRef, accountHolder } = body;

    if (!amount || !method || !transactionRef) {
      return NextResponse.json(
        { status: "error", code: "INVALID_FIELDS", message: "Amount, payment channel, and Transaction ID (TID) are required." },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 100) {
      return NextResponse.json(
        { status: "error", code: "MIN_AMOUNT", message: "Minimum deposit is ₨ 100." },
        { status: 400 }
      );
    }

    const result = adminBackend.verifyAndRecordDepositTID({
      userId: userId || "GUEST-USER",
      username: username || "Player_" + (userId ? userId.slice(-4) : "001"),
      amount: parsedAmount,
      method,
      senderPhone: senderPhone || "",
      transactionRef,
      accountHolder: accountHolder || "Okwin Merchant",
    });

    if (!result.success) {
      return NextResponse.json(
        { status: "error", code: result.code || "REPLAY_ERROR", message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: result.message,
      record: result.record,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
