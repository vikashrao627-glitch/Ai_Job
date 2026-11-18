import { getWebhookConfig, isAuthorized, jsonError } from "../../../lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAuthorized(request)) return jsonError("Unauthorized. Check your owner access token.", 401);
  const config = getWebhookConfig("N8N_PUBLIC_JOBS_WEBHOOK");
  if (!config) return jsonError("The jobs webhook is not configured in Vercel.", 503);

  try {
    const upstream = await fetch(config.url, {
      method: "GET",
      headers: { Authorization: `Bearer ${config.secret}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!upstream.ok) return jsonError("The job service is temporarily unavailable.", 502);
    const payload: unknown = await upstream.json();
    if (!payload || typeof payload !== "object" || !Array.isArray((payload as { jobs?: unknown }).jobs)) {
      return jsonError("The job service returned an unexpected response.", 502);
    }
    return Response.json({ jobs: (payload as { jobs: unknown[] }).jobs }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch {
    return jsonError("Could not reach the job service. Check the n8n webhook and try again.", 502);
  }
}
