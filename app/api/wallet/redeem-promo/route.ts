import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, code } = body;

    if (!userId || !code) {
      return NextResponse.json(
        { status: "error", message: "Please provide both user ID and promo code." },
        { status: 400 }
      );
    }

    const result = adminBackend.redeemPromoCode(userId, code);

    if (!result.success) {
      return NextResponse.json(
        { status: "error", message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: result.message,
      bonusAmount: result.bonusAmount,
      newBalance: result.newBalance,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
