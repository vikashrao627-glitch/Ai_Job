import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const expected = process.env.ADMIN_ACCESS_TOKEN;
  const supplied = request.headers.get("x-admin-token");
  if (!expected || !supplied || supplied !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = process.env.N8N_PUBLIC_JOBS_WEBHOOK;
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!url || !secret) return NextResponse.json({ error: "Job queue integration is not configured yet." }, { status: 503 });
  try {
    const upstream = await fetch(url, { headers: { "x-webhook-secret": secret }, cache: "no-store" });
    const data = await upstream.json();
    if (!upstream.ok) return NextResponse.json({ error: "The job service is temporarily unavailable." }, { status: 502 });
    return NextResponse.json({ jobs: Array.isArray(data.jobs) ? data.jobs : [] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not reach the job service." }, { status: 502 });
  }
}