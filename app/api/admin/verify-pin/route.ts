import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json(
        { status: "error", message: "Security PIN is required." },
        { status: 400 }
      );
    }

    const result = adminBackend.verifyAdminPin(pin);
    if (!result.success) {
      return NextResponse.json(
        {
          status: "error",
          message: result.message,
          locked: result.locked || false,
          remainingAttempts: result.remainingAttempts ?? 0,
        },
        { status: 401 }
      );
    }

    const token = Buffer.from("okwin_admin_" + Date.now() + "_" + pin).toString("base64");

    return NextResponse.json({
      status: "success",
      message: "Console unlocked successfully.",
      token,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
