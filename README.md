# Vikash Rao — AI Job Application Agent

A Next.js owner console for a human-in-the-loop job discovery and application-preparation workflow.

## Safety model
- The web UI can be public, but queue and decision APIs require a server-side owner token.
- The browser never receives n8n webhook URLs or webhook secrets.
- Approving a job records approval for **manual submission only**. No browser automation or application submission is implemented.
- Do not commit CVs, profile facts, generated resumes, credentials, or personal documents to this public repository.

## Stack
- Next.js 14 / React 18
- Vercel hosting
- n8n for scheduled sourcing and document preparation
- Gemini for evidence-based job matching and document drafting
- Google Sheets for deduplication, review queue, and status tracking

## Environment variables
Set these in Vercel Project Settings → Environment Variables:
- `N8N_PUBLIC_JOBS_WEBHOOK`
- `N8N_ADMIN_DECISION_WEBHOOK`
- `ADMIN_ACCESS_TOKEN` (long random secret)
- `N8N_WEBHOOK_SECRET` (shared webhook secret)

Never use a `NEXT_PUBLIC_*` prefix for secrets. Do not commit `.env.local`.

## n8n webhook contract
Create two authenticated webhooks:
- `GET /public-jobs` returns `{ "jobs": [...] }`
- `POST /admin-decision` accepts `{ "job_id": "...", "decision": "approve" | "reject" }`

Each job should include: `job_id, title, company, location, work_mode, job_url, source, posted_at, score, status, match_reasons, gaps`, and optionally `tailored_resume_text, cover_letter`.

Both webhooks must validate the `x-webhook-secret` header. The decision workflow may only update the matching row's status. It must not submit applications.

## Sourcing plan
Run two scheduled sourcing batches per day, up to 25 candidates each. Fifty is a target ceiling, not a promise; never invent jobs to meet it. Prefer official employer career pages and permitted APIs/RSS feeds. Respect each source's terms and rate limits. Deduplicate by canonical URL and normalized company/title/location.

## Candidate profile
Keep verified profile facts in a private store or n8n credential-backed data source. Only use facts the candidate has confirmed. Never invent employers, experience, dates, education, skills, certifications, or metrics. Report missing requirements as gaps.

## Local development
```bash
npm install
npm run dev
```

## Deployment checklist
1. Configure the four environment variables in Vercel.
2. Configure and test authenticated n8n webhooks.
3. Test unauthorized API access returns 401.
4. Test valid owner access and decision updates.
5. Verify approval only changes tracker status and never submits an application.
6. Add rate limiting and monitoring before broad public promotion.
