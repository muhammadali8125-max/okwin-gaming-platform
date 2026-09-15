import { NextRequest, NextResponse } from "next/server";
import { adminBackend } from "@/lib/server/adminBackend";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") || "all";
    const severity = url.searchParams.get("severity") || "all";
    const exportCsv = url.searchParams.get("export") === "csv";

    const logs = adminBackend.getAuditLogs(category, severity);

    if (exportCsv) {
      const csvRows = [
        ["ID", "Timestamp", "DateTime (PKT)", "Operator", "Category", "Action", "Severity", "Details"],
        ...logs.map((l) => [
          l.id,
          l.timestamp,
          new Date(l.timestamp).toLocaleString("en-PK", { timeZone: "Asia/Karachi" }),
          l.operator,
          l.category,
          l.action,
          l.severity,
          `"${l.details.replace(/"/g, '""')}"`,
        ]),
      ];
      const csvString = csvRows.map((r) => r.join(",")).join("\n");
      return new NextResponse(csvString, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=okwin-audit-trail-${Date.now()}.csv`,
        },
      });
    }

    return NextResponse.json({
      status: "success",
      count: logs.length,
      logs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
