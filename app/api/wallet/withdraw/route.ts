import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, username, amount, method, accountNumber, accountTitle } = body;

    if (!userId || !amount || !method || !accountNumber || !accountTitle) {
      return NextResponse.json(
        { status: "error", message: "Missing required withdrawal details." },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { status: "error", message: "Invalid withdrawal amount." },
        { status: 400 }
      );
    }

    const result = adminBackend.submitWithdrawal({
      userId,
      username: username || "Player_" + userId.slice(-4),
      amount: parsedAmount,
      method,
      accountNumber,
      accountTitle,
    });

    if (!result.success) {
      return NextResponse.json(
        { status: "error", message: result.message },
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get("recordId");

    if (!recordId) {
      return NextResponse.json(
        { status: "error", message: "recordId parameter is required." },
        { status: 400 }
      );
    }

    const record = adminBackend.getFinanceRecord(recordId);
    if (!record) {
      return NextResponse.json(
        { status: "error", message: "Withdrawal record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      record,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
