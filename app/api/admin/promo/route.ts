import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";

export async function GET() {
  try {
    const promoCodes = adminBackend.getPromoCodes();
    return NextResponse.json({
      status: "success",
      promoCodes,
      count: promoCodes.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load promo codes";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { code, bonusAmount, description, maxClaims } = body;
      const result = adminBackend.createPromoCode({
        code,
        bonusAmount: parseFloat(bonusAmount),
        description,
        maxClaims: maxClaims ? parseInt(maxClaims) : undefined,
      });

      if (!result.success) {
        return NextResponse.json({ status: "error", message: result.message }, { status: 400 });
      }

      return NextResponse.json({
        status: "success",
        message: result.message,
        promo: result.promo,
      });
    }

    if (action === "toggle") {
      const { code } = body;
      const result = adminBackend.togglePromoCode(code);

      if (!result.success) {
        return NextResponse.json({ status: "error", message: result.message }, { status: 400 });
      }

      return NextResponse.json({
        status: "success",
        message: result.message,
        promo: result.promo,
      });
    }

    return NextResponse.json(
      { status: "error", message: "Invalid action. Supported: create, toggle" },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
