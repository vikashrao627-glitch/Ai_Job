# Vikash Rao — AI Job Application Agent (Vercel starter)

This repository is a public-facing Vercel website with a private owner console. The website can be public; the job queue and decision endpoints are protected by a server-side owner token.

## Included
- Next.js website suitable for Vercel deployment.
- Server-side API proxy to n8n (n8n URLs are not exposed to the browser).
- Owner-token check for queue reads and approve/reject actions.
- Approval UI clearly states that approval is **not** an application submission.
- n8n workflow contract and Google Sheets schema in `/n8n`.

## Important: not yet connected to your private services
This package does not contain your Gemini key, Google Sheets credential, n8n URL, or Vercel credentials. Add those directly in the relevant service dashboards. Never commit secrets to GitHub or expose them as `NEXT_PUBLIC_*` variables.

## Owner console

The Next.js App Router application lives in `app/`. The public landing page contains no job data. The owner queue requires the `ADMIN_ACCESS_TOKEN` in an Authorization Bearer header. Keep it private; it is held in page memory only and is not written to local storage or cookies. Server routes proxy to n8n and never return the webhook secret.

The API routes enforce owner-token checks, validate decision inputs, use HTTPS-only configured webhook URLs, disable caching, and apply request timeouts. Add platform-level rate limiting/WAF before broad public promotion. Configure the n8n Header Auth credential exactly as described below.

## Vercel deployment
1. Create a GitHub repository and upload this project.
2. In Vercel, select **Add New → Project**, import that repository, and use the default Next.js settings.
3. Add the four variables in `.env.example` under **Project → Settings → Environment Variables** for Production (and Preview only if needed).
4. Deploy. Use a long random `ADMIN_ACCESS_TOKEN` (at least 32 random characters). Store it in a password manager.
5. Add your production Vercel URL to the n8n webhook allowlist/CORS policy if you add browser-origin checks. Current API calls are server-to-server.

## n8n integration contract
Create two production webhooks:
- `GET /public-jobs` → return JSON `{ "jobs": [ ... ] }` from the Google Sheets approval queue.
- `POST /admin-decision` → accept `{ "job_id": "...", "decision": "approve" | "reject" }`, update the matching row, and return `{ "ok": true }`.

Required job object fields:
`job_id, title, company, location, work_mode, job_url, source, posted_at, score, status, match_reasons, gaps, tailored_resume_text, cover_letter`.

Configure n8n Header Auth on both webhooks with header name `Authorization` and value `Bearer <the exact N8N_WEBHOOK_SECRET value>`. The Next.js server adds this header; do not expose the secret in client code. The decision webhook must only update a status field. It must not connect to any browser automation or application-submit node. Manual submission remains outside this workflow.

## Daily 50-job design
Run two scheduled n8n sourcing batches per day, each with a maximum of 25 candidate listings. Normalize and validate each listing, deduplicate by canonical URL and a normalized company+title+location fingerprint, screen against the verified CV, and append eligible jobs to the review sheet. This is a target cap, not a guarantee that 50 valid jobs exist each day. Do not invent listings to reach the target.

Recommended sources: official employer career pages and reputable job-board APIs/RSS feeds that permit automated access. Each source needs its own credential and terms-of-use review. Configure a source adapter before enabling the schedule; do not scrape sites that prohibit it.

## Gemini document-generation rules
Use the verified profile facts in `n8n/profile_facts.json`. Generate one ATS-friendly resume variant and one cover letter per approved-for-preparation job. The model must:
- use only facts present in the profile JSON and verified job description;
- never invent metrics, employers, dates, degrees, tools, certifications, or responsibilities;
- preserve actual job titles and dates;
- label missing requirements as gaps instead of pretending the candidate has them;
- return structured JSON, then validate before saving.

## Google Sheets tabs
Use the headers in `n8n/google_sheets_schema.csv`. Keep `job_id` unique. Suggested statuses:
`NEW → SCREENED → DOCS_READY → PENDING_APPROVAL → APPROVED_FOR_MANUAL_SUBMISSION` or `REJECTED`.
No transition in this starter triggers an external application submission.

## Before going live
- Keep the GitHub repository **private**: `n8n/profile_facts.json` contains personal CV details. The deployed website does not need to publish this file.
- Restrict access to your Google Sheet to your own Google account and the n8n service account only.
- Use a private GitHub repository if you do not want your source code public; the deployed website can still be public.
- Set a strong owner token and rotate it if exposed.
- Enable Vercel deployment protection for Preview deployments.
- Add rate limiting/WAF to the API routes before broad public promotion.
- Test unauthorized queue access (must return 401), valid owner access, duplicate rejection, and decision updates.
- Keep uploaded CV and generated documents out of public web folders.
