import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";

export async function GET(req: NextRequest) {
  try {
    const metrics = adminBackend.getPlatformMetrics();
    const games = adminBackend.getGameSettings();
    const pendingFinance = adminBackend.getFinanceRecords("all", "pending");

    return NextResponse.json({
      status: "success",
      metrics,
      games,
      pendingCount: pendingFinance.length,
      timestamp: Date.now(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load stats";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
