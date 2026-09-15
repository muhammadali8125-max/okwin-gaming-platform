import { NextRequest, NextResponse } from "next/server";
import { serverWallet } from "@/lib/server/walletBackend";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "OK-982314";

  const wallet = serverWallet.getWallet(userId);
  const transactions = serverWallet.getRecentTransactions(30);

  return NextResponse.json({
    status: "success",
    wallet,
    transactions,
  });
}
