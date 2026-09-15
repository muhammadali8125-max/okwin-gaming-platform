import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all";
    const status = searchParams.get("status") || "all";

    const records = adminBackend.getFinanceRecords(type, status);

    return NextResponse.json({
      status: "success",
      records,
      count: records.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load finance records";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recordId, type, action, operatorNotes } = body;

    if (!recordId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { status: "error", message: "recordId and valid action (approve/reject) required" },
        { status: 400 }
      );
    }

    let result;
    if (type === "withdraw") {
      result = adminBackend.processWithdrawal(recordId, action, operatorNotes);
    } else {
      result = adminBackend.processDeposit(recordId, action, operatorNotes);
    }

    if (!result.success) {
      return NextResponse.json({ status: "error", message: result.message }, { status: 400 });
    }

    return NextResponse.json({
      status: "success",
      message: result.message,
      record: result.record,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
