import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";

export async function GET(req: NextRequest) {
  try {
    const games = adminBackend.getGameSettings();
    return NextResponse.json({ status: "success", games });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load game settings";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, rtpPercentage, status } = body;

    if (!gameId || typeof rtpPercentage !== "number") {
      return NextResponse.json(
        { status: "error", message: "gameId and valid rtpPercentage required" },
        { status: 400 }
      );
    }

    const result = adminBackend.updateGameRtp(gameId, rtpPercentage, status);
    if (!result.success) {
      return NextResponse.json({ status: "error", message: result.message }, { status: 400 });
    }

    return NextResponse.json({
      status: "success",
      message: result.message,
      game: result.game,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
