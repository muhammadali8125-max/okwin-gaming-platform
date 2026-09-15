import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";

export async function GET() {
  try {
    const raw = adminBackend.getPaymentGateways();
    // Return sanitized credentials for UI display
    return NextResponse.json({
      status: "success",
      gateways: {
        easypaisa: {
          ...raw.easypaisa,
          password: raw.easypaisa.password ? "••••••••" : "",
          privateKeyPem: raw.easypaisa.privateKeyPem || "",
          publicKeyPem: raw.easypaisa.publicKeyPem || "",
        },
        jazzcash: {
          ...raw.jazzcash,
          password: raw.jazzcash.password ? "••••••••" : "",
          integritySalt: raw.jazzcash.integritySalt ? "••••••••" : "",
        },
        raast: raw.raast,
        usdt: raw.usdt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gateway, config } = body;

    if (!gateway || !config) {
      return NextResponse.json(
        { status: "error", message: "Gateway name and config object are required." },
        { status: 400 }
      );
    }

    if (!["easypaisa", "jazzcash", "raast", "usdt"].includes(gateway)) {
      return NextResponse.json(
        { status: "error", message: "Invalid gateway name." },
        { status: 400 }
      );
    }

    const updated = adminBackend.updatePaymentGateway(gateway, config);

    return NextResponse.json({
      status: "success",
      message: `${gateway.toUpperCase()} settings saved successfully.`,
      gateways: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
