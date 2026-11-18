import { getWebhookConfig, isAuthorized, jsonError } from "../../../lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAuthorized(request)) return jsonError("Unauthorized. Check your owner access token.", 401);
  const config = getWebhookConfig("N8N_ADMIN_DECISION_WEBHOOK");
  if (!config) return jsonError("The decision webhook is not configured in Vercel.", 503);

  let body: unknown;
  try { body = await request.json(); } catch { return jsonError("Invalid JSON request.", 400); }
  if (!body || typeof body !== "object") return jsonError("Invalid decision request.", 400);
  const { job_id, decision } = body as { job_id?: unknown; decision?: unknown };
  if (typeof job_id !== "string" || !job_id.trim() || job_id.length > 200) {
    return jsonError("A valid job_id is required.", 400);
  }
  if (decision !== "approve" && decision !== "reject") {
    return jsonError("Decision must be approve or reject.", 400);
  }

  try {
    const upstream = await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.secret}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ job_id: job_id.trim(), decision }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!upstream.ok) return jsonError("The decision service could not save this change.", 502);
    return Response.json({ ok: true, decision, message: "Decision saved. No external application was submitted." }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return jsonError("Could not reach the decision service. Try again.", 502);
  }
}
