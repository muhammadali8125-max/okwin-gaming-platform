import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";

export async function GET() {
  try {
    const settings = adminBackend.getSystemSettings();
    return NextResponse.json({ status: "success", settings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load settings";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = adminBackend.updateSystemSettings(body);
    return NextResponse.json({
      status: "success",
      message: "System settings updated successfully",
      settings: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
