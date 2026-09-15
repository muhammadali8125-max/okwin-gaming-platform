import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";

export async function GET() {
  try {
    const telco = adminBackend.getTelcoConfig();
    const telegram = adminBackend.getTelegramConfig();

    return NextResponse.json({
      status: "success",
      telco: {
        ...telco,
        // Mask secret keys for safe display
        easypaisaPassword: telco.easypaisaPassword ? "••••••••" : "",
        easypaisaPrivateKeyPem: telco.easypaisaPrivateKeyPem ? "[CONFIGURED RSA 2048 PRIVATE KEY]" : "[NOT SET - USING SIMULATION]",
        easypaisaPublicKeyPem: telco.easypaisaPublicKeyPem ? "[CONFIGURED RSA 2048 PUBLIC KEY]" : "[NOT SET]",
      },
      telegram: {
        ...telegram,
        botToken: telegram.botToken ? `${telegram.botToken.slice(0, 6)}••••••••${telegram.botToken.slice(-4)}` : "",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { telco, telegram } = body;

    let updatedTelco = null;
    let updatedTelegram = null;

    if (telco) {
      updatedTelco = adminBackend.updateTelcoConfig(telco);
    }
    if (telegram) {
      updatedTelegram = adminBackend.updateTelegramConfig(telegram);
    }

    return NextResponse.json({
      status: "success",
      message: "Gateway & Telegram configurations saved successfully.",
      telco: updatedTelco,
      telegram: updatedTelegram,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
