import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";
import { buildHostedCheckoutPayload } from "@/lib/server/jazzcashService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amountPKR, orderId, description } = body;

    if (!amountPKR || !orderId) {
      return NextResponse.json({ status: "error", message: "amountPKR and orderId required" }, { status: 400 });
    }

    const gwConfig = adminBackend.getPaymentGateways();
    const jcCreds = gwConfig.jazzcash;

    const { postUrl, fields } = buildHostedCheckoutPayload(
      {
        merchantId: jcCreds.merchantId || "",
        password: jcCreds.password || "",
        integritySalt: jcCreds.integritySalt || "",
        returnUrl: jcCreds.returnUrl || "",
        mode: jcCreds.mode || "sandbox",
      },
      {
        amountPKR: parseFloat(amountPKR),
        orderId,
        description,
      }
    );

    return NextResponse.json({
      status: "success",
      postUrl,
      fields,
      method: "POST",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
