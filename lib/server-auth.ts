import { createHash, timingSafeEqual } from "node:crypto";

export function isAuthorized(request: Request): boolean {
  const expected = process.env.ADMIN_ACCESS_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !supplied) return false;
  const expectedDigest = createHash("sha256").update(expected).digest();
  const suppliedDigest = createHash("sha256").update(supplied).digest();
  return timingSafeEqual(expectedDigest, suppliedDigest);
}

export function getWebhookConfig(name: "N8N_PUBLIC_JOBS_WEBHOOK" | "N8N_ADMIN_DECISION_WEBHOOK") {
  const rawUrl = process.env[name];
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!rawUrl || !secret || rawUrl.includes("YOUR-N8N-HOST")) return null;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) return null;
    return { url: url.toString(), secret };
  } catch {
    return null;
  }
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
