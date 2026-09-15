import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gateway } = body;

    if (gateway !== "easypaisa" && gateway !== "jazzcash") {
      return NextResponse.json(
        { status: "error", message: "Testing only supported for EasyPaisa and JazzCash." },
        { status: 400 }
      );
    }

    const result = adminBackend.testGatewayCredentials(gateway);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
