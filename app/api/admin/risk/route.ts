import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";

export async function GET() {
  try {
    const riskSettings = adminBackend.getRiskSettings();
    return NextResponse.json({
      status: "success",
      riskSettings,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load risk settings";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "update_risk" || action === "update_risk_settings") {
      const { settings } = body;
      const updated = adminBackend.updateRiskSettings(settings);
      return NextResponse.json({
        status: "success",
        message: "Risk control parameters updated successfully",
        riskSettings: updated,
      });
    }

    if (action === "void_account") {
      const { userId, reason } = body;
      if (!userId) {
        return NextResponse.json({ status: "error", message: "userId is required" }, { status: 400 });
      }
      const result = adminBackend.voidFraudAccount(userId, reason || "Suspected multi-account syndicate");
      if (!result.success) {
        return NextResponse.json({ status: "error", message: result.message }, { status: 400 });
      }
      return NextResponse.json({
        status: "success",
        message: result.message,
      });
    }

    return NextResponse.json(
      { status: "error", message: "Invalid action. Supported: update_risk, void_account" },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
