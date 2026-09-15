import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";
import { inquireJazzCashTransaction } from "@/lib/server/jazzcashService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txnRefNo } = body;

    if (!txnRefNo) {
      return NextResponse.json({ status: "error", message: "txnRefNo is required" }, { status: 400 });
    }

    const gwConfig = adminBackend.getPaymentGateways();
    const jcCreds = gwConfig.jazzcash;

    const inquiryResult = await inquireJazzCashTransaction(
      {
        merchantId: jcCreds.merchantId || "",
        password: jcCreds.password || "",
        integritySalt: jcCreds.integritySalt || "",
        mode: jcCreds.mode || "sandbox",
      },
      txnRefNo
    );

    return NextResponse.json({
      status: "success",
      data: inquiryResult,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
