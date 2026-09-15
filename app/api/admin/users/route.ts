import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const status = searchParams.get("status") || "all";

    const players = adminBackend.getPlayers(query, status);

    return NextResponse.json({
      status: "success",
      players,
      count: players.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load players";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json({ status: "error", message: "userId is required" }, { status: 400 });
    }

    if (action === "adjust_balance") {
      const { amount, operation, reason = "Admin manual adjustment" } = body;
      if (!amount || typeof amount !== "number" || amount <= 0) {
        return NextResponse.json({ status: "error", message: "Valid positive amount required" }, { status: 400 });
      }
      if (operation !== "credit" && operation !== "debit") {
        return NextResponse.json({ status: "error", message: "Operation must be credit or debit" }, { status: 400 });
      }

      const result = adminBackend.adjustPlayerBalance(userId, amount, operation, reason);
      if (!result.success) {
        return NextResponse.json({ status: "error", message: result.message }, { status: 400 });
      }

      return NextResponse.json({ status: "success", message: result.message, player: result.player });
    }

    if (action === "update_status") {
      const { status, vipLevel } = body;
      if (!status || !["active", "frozen", "banned"].includes(status)) {
        return NextResponse.json({ status: "error", message: "Invalid status value" }, { status: 400 });
      }

      const result = adminBackend.updatePlayerStatus(userId, status, vipLevel);
      if (!result.success) {
        return NextResponse.json({ status: "error", message: result.message }, { status: 400 });
      }

      return NextResponse.json({ status: "success", message: result.message, player: result.player });
    }

    return NextResponse.json({ status: "error", message: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
