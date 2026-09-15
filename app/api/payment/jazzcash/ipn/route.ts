import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";
import { verifyJazzCashSecureHash, paisasToPKR } from "@/lib/server/jazzcashService";

export async function POST(req: NextRequest) {
  try {
    // JazzCash IPN sends form data or json
    let payload: Record<string, any> = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      formData.forEach((val, key) => {
        payload[key] = String(val);
      });
    } else {
      payload = await req.json();
    }

    const gwConfig = adminBackend.getPaymentGateways();
    const jcCreds = gwConfig.jazzcash;

    // 1. Verify HMAC-SHA256 signature
    const isValidHash = verifyJazzCashSecureHash(payload, jcCreds.integritySalt || "");

    const isSuccess = payload.pp_ResponseCode === "000";
    const txnRefNo = payload.pp_TxnRefNo || "";
    const orderId = payload.ppmpf_1 || payload.pp_BillReference || txnRefNo;
    const amountPKR = payload.pp_Amount ? paisasToPKR(payload.pp_Amount) : 0;
    const mobileNo = payload.pp_MobileNumber || payload.ppmpf_2 || "";

    if (isSuccess) {
      // Record transaction and auto-credit player
      adminBackend.recordDirectMAPushPayment({
        orderId,
        amount: amountPKR,
        method: "JazzCash",
        mobileAccountNo: mobileNo,
        userId: "OK-982314",
        username: "Player_777",
        storeId: jcCreds.merchantId,
        status: "approved",
      });

      adminBackend.logAuditAction({
        operator: "JazzCash IPN Gateway",
        category: "GATEWAY",
        action: "IPN_PAYMENT_CONFIRMED",
        severity: "INFO",
        details: `JazzCash payment of ₨ ${amountPKR} confirmed via IPN. TxnRefNo: ${txnRefNo}, RRN: ${payload.pp_RetrievalReferenceNo || payload.pp_RetreivalReferenceNo || 'N/A'}`,
      });
    }

    return NextResponse.json({
      status: isSuccess ? "success" : "failed",
      received: true,
      hashVerified: isValidHash,
      responseCode: payload.pp_ResponseCode,
      txnRefNo,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
