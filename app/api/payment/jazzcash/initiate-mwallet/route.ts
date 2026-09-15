import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";
import { executeMWalletTransaction } from "@/lib/server/jazzcashService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mobileNumber,
      amountPKR,
      orderId,
      cnicLast6 = "",
      description = "",
      userId = "OK-982314",
      username = "Player_777",
    } = body;

    if (!mobileNumber || !amountPKR || !orderId) {
      return NextResponse.json(
        {
          status: "error",
          responseCode: "0002",
          message: "mobileNumber, amountPKR, and orderId are required.",
        },
        { status: 400 }
      );
    }

    const cleanPhone = String(mobileNumber).replace(/[\s-]/g, "");
    if (!/^03\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        {
          status: "error",
          responseCode: "0002",
          message: "JazzCash mobile number must be 11 digits (e.g. 03001234567).",
        },
        { status: 400 }
      );
    }

    const amountNum = parseFloat(amountPKR);
    if (isNaN(amountNum) || amountNum < 100) {
      return NextResponse.json(
        {
          status: "error",
          responseCode: "0013",
          message: "Minimum JazzCash deposit amount is ₨ 100.",
        },
        { status: 400 }
      );
    }

    // Retrieve active JazzCash credentials from Admin Backend
    const gwConfig = adminBackend.getPaymentGateways();
    const jcCreds = gwConfig.jazzcash;

    if (!jcCreds.enabled) {
      return NextResponse.json(
        {
          status: "error",
          message: "JazzCash gateway is currently disabled by administrator.",
        },
        { status: 403 }
      );
    }

    // Execute official JazzCash MWALLET API call
    const result = await executeMWalletTransaction(
      {
        merchantId: jcCreds.merchantId || "",
        password: jcCreds.password || "",
        integritySalt: jcCreds.integritySalt || "",
        returnUrl: jcCreds.returnUrl || "",
        mode: jcCreds.mode || "sandbox",
      },
      {
        mobileNumber: cleanPhone,
        amountPKR: amountNum,
        orderId,
        cnicLast6,
        description: description || `Okwin Deposit ${orderId}`,
      }
    );

    // If successful, record payment in platform ledger and auto-credit player
    if (result.success) {
      adminBackend.recordDirectMAPushPayment({
        orderId,
        amount: amountNum,
        method: "JazzCash",
        mobileAccountNo: cleanPhone,
        userId,
        username,
        storeId: jcCreds.merchantId,
        status: "approved",
      });
    }

    return NextResponse.json({
      status: result.success ? "success" : "failed",
      success: result.success,
      responseCode: result.responseCode,
      responseMessage: result.responseMessage,
      txnRefNo: result.txnRefNo,
      retrievalRefNo: result.retrievalRefNo,
      authCode: result.authCode,
      orderId,
      amountPKR: amountNum,
      method: "JazzCash",
      mobileNumber: cleanPhone,
      mode: jcCreds.mode,
      rawResponse: result.rawResponse,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      {
        status: "error",
        responseCode: "999",
        message,
      },
      { status: 500 }
    );
  }
}
