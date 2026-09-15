import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { status: "error", message: "User ID is required." },
        { status: 400 }
      );
    }

    const result = adminBackend.spinLuckyWheel(userId);

    if (!result.success) {
      return NextResponse.json(
        { status: "error", code: "DEPOSIT_REQUIRED", message: result.message },
        { status: 403 }
      );
    }

    return NextResponse.json({
      status: "success",
      sectorIndex: result.sectorIndex,
      prize: result.prize,
      message: result.message,
      newBonusBalance: result.newBonusBalance,
      requiredTurnoverAdded: result.requiredTurnoverAdded,
      remainingTurnover: result.remainingTurnover,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
