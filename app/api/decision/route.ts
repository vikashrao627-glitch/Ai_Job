import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const expected = process.env.ADMIN_ACCESS_TOKEN;
  const supplied = request.headers.get("x-admin-token");
  if (!expected || !supplied || supplied !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { job_id?: string; decision?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body.job_id || !["approve", "reject"].includes(body.decision || "")) return NextResponse.json({ error: "A job_id and valid decision are required." }, { status: 400 });
  const url = process.env.N8N_ADMIN_DECISION_WEBHOOK;
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!url || !secret) return NextResponse.json({ error: "Decision integration is not configured yet." }, { status: 503 });
  try {
    const upstream = await fetch(url, { method: "POST", headers: { "content-type": "application/json", "x-webhook-secret": secret }, body: JSON.stringify({ job_id: body.job_id, decision: body.decision }), cache: "no-store" });
    if (!upstream.ok) return NextResponse.json({ error: "The decision could not be saved." }, { status: 502 });
    return NextResponse.json({ ok: true, note: "This records approval for manual submission only. No application was submitted." });
  } catch {
    return NextResponse.json({ error: "Could not reach the decision service." }, { status: 502 });
  }
}