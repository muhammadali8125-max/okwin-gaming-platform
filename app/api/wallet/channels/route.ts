import { NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";

export async function GET() {
  try {
    const gateways = adminBackend.getPaymentGateways();
    return NextResponse.json({
      status: "success",
      channels: {
        easypaisa: {
          enabled: gateways.easypaisa.enabled,
          mode: gateways.easypaisa.mode,
          accountNumber: gateways.easypaisa.merchantMobile,
          accountHolder: gateways.easypaisa.accountTitle,
        },
        jazzcash: {
          enabled: gateways.jazzcash.enabled,
          mode: gateways.jazzcash.mode,
          accountNumber: gateways.jazzcash.merchantMobile,
          accountHolder: gateways.jazzcash.accountTitle,
        },
        raast: {
          enabled: gateways.raast.enabled,
          bankName: gateways.raast.bankName,
          accountNumber: gateways.raast.iban,
          raastId: gateways.raast.raastId,
          accountHolder: gateways.raast.accountTitle,
        },
        usdt: {
          enabled: gateways.usdt.enabled,
          walletAddress: gateways.usdt.walletAddress,
          network: gateways.usdt.network,
          exchangeRatePkr: gateways.usdt.exchangeRatePkr,
        },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
