import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";

/**
 * Inquire Mobile Account (MA) Status API
 * Implements the Inquire Mobile Account Integration Guide with RSA standard.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { responseCode: "0002", responseDesc: "REQUIRED FIELD MISSING", message: "orderId is required" },
        { status: 400 }
      );
    }

    const result = adminBackend.inquireMAPushPayment(orderId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "System error";
    return NextResponse.json(
      { responseCode: "0001", responseDesc: "SYSTEM ERROR", message },
      { status: 500 }
    );
  }
}
