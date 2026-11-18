"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Job = {
  job_id: string; title: string; company: string; location: string; work_mode: string;
  job_url: string; source: string; posted_at: string; score: number | string;
  status: string; match_reasons: string[] | string; gaps: string[] | string;
  tailored_resume_text: string; cover_letter: string;
};

function asLines(value: string[] | string | undefined): string[] {
  if (Array.isArray(value)) return value;
  return typeof value === "string" && value.trim() ? value.split(/\n|•/).map((x) => x.trim()).filter(Boolean) : [];
}

export default function Home() {
  const [token, setToken] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");

  const loadJobs = useCallback(async (authToken: string) => {
    setLoading(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/jobs", { headers: { Authorization: `Bearer ${authToken}` }, cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load the review queue.");
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setJobs([]);
    } finally { setLoading(false); }
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token.trim()) return;
    await loadJobs(token.trim());
  }

  async function decide(job: Job, decision: "approve" | "reject") {
    if (!token) return;
    const confirmed = window.confirm(decision === "approve"
      ? "Approve this job for MANUAL application preparation? This will not submit an application."
      : "Reject this job from the review queue?");
    if (!confirmed) return;
    setNotice(""); setError("");
    try {
      const response = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ job_id: job.job_id, decision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Decision could not be saved.");
      setNotice(decision === "approve" ? "Approved for manual submission only. No application was submitted." : "Job rejected.");
      await loadJobs(token);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
  }

  const visibleJobs = useMemo(() => filter === "ALL" ? jobs : jobs.filter((job) => job.status === filter), [jobs, filter]);
  useEffect(() => { /* The owner token intentionally stays in component memory only. */ }, []);

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="AI Job Agent home"><span className="brand-mark">V</span><span>Vikash<span className="muted">.AI</span></span></a>
        <span className="private-label"><span className="live-dot" /> PRIVATE OWNER CONSOLE</span>
      </header>

      <section className="hero">
        <p className="eyebrow">DATA ANALYST · INDIA / REMOTE INDIA</p>
        <h1>Make every application<br /><span>count.</span></h1>
        <p className="hero-copy">Review screened opportunities, compare role fit, and inspect tailored documents before deciding what moves forward.</p>
        <div className="guardrail"><span className="guard-icon">✓</span><span><strong>You stay in control.</strong> Approving a job only marks it ready for manual submission. This system never submits applications automatically.</span></div>
      </section>

      {!jobs.length && !loading && !error ? (
        <section className="login-card">
          <div className="section-kicker">OWNER ACCESS</div><h2>Open your review queue</h2>
          <p>Enter the admin access token configured in your Vercel project. It is used for this session only and is not saved in browser storage.</p>
          <form onSubmit={signIn} className="login-form">
            <label htmlFor="token">Admin access token</label>
            <input id="token" type="password" autoComplete="current-password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Enter your private token" required />
            <button className="primary" disabled={loading}>{loading ? "Connecting…" : "Open review queue"} <span>→</span></button>
          </form>
          {error && <p className="error" role="alert">{error}</p>}
        </section>
      ) : (
        <section className="dashboard">
          <div className="dashboard-heading"><div><div className="section-kicker">YOUR PIPELINE</div><h2>Application review</h2><p>Review each match before making a decision.</p></div><button className="refresh" onClick={() => loadJobs(token)} disabled={loading}>↻ Refresh</button></div>
          <div className="stats">
            <div className="stat"><span>IN QUEUE</span><strong>{jobs.length}</strong></div>
            <div className="stat"><span>PENDING</span><strong>{jobs.filter((j) => j.status === "PENDING_APPROVAL").length}</strong></div>
            <div className="stat"><span>APPROVED</span><strong>{jobs.filter((j) => j.status === "APPROVED_FOR_MANUAL_SUBMISSION").length}</strong></div>
          </div>
          <div className="filters" aria-label="Filter jobs">
            {["ALL", "PENDING_APPROVAL", "APPROVED_FOR_MANUAL_SUBMISSION", "REJECTED"].map((value) => <button key={value} className={filter === value ? "filter active" : "filter"} onClick={() => setFilter(value)}>{value === "ALL" ? "All jobs" : value === "PENDING_APPROVAL" ? "Pending" : value === "REJECTED" ? "Rejected" : "Approved"}</button>)}
          </div>
          {loading && <p className="empty">Loading your jobs…</p>}
          {!loading && visibleJobs.length === 0 && <div className="empty"><strong>No jobs in this view.</strong><span>New screened opportunities will appear here after your n8n workflow adds them to the review queue.</span></div>}
          <div className="job-list">
            {visibleJobs.map((job) => {
              const isOpen = expanded === job.job_id;
              return <article className="job-card" key={job.job_id}>
                <div className="job-head"><div><div className="company">{job.company || "Company not provided"}</div><h3>{job.title || "Untitled role"}</h3><div className="job-meta">{[job.location, job.work_mode, job.source].filter(Boolean).join(" · ")}</div></div><div className="score"><strong>{job.score || "—"}</strong><span>MATCH</span></div></div>
                <div className="job-bottom"><span className={job.status === "REJECTED" ? "status rejected" : job.status === "APPROVED_FOR_MANUAL_SUBMISSION" ? "status approved" : "status"}>{(job.status || "NEW").replaceAll("_", " ")}</span><div className="job-actions"><button className="text-button" onClick={() => setExpanded(isOpen ? null : job.job_id)}>{isOpen ? "Hide details" : "View details"}</button>{job.job_url && <a className="text-button" href={job.job_url} target="_blank" rel="noreferrer">Job description ↗</a>}</div></div>
                {isOpen && <div className="details">
                  <div className="detail-grid"><div><h4>Why this role matches</h4><ul>{asLines(job.match_reasons).map((x, i) => <li key={i}>{x}</li>)}</ul></div><div><h4>Potential gaps</h4><ul>{asLines(job.gaps).map((x, i) => <li key={i}>{x}</li>)}</ul></div></div>
                  <details><summary>Tailored resume</summary><pre>{job.tailored_resume_text || "No resume draft available."}</pre></details>
                  <details><summary>Cover letter</summary><pre>{job.cover_letter || "No cover letter available."}</pre></details>
                  {job.status !== "REJECTED" && job.status !== "APPROVED_FOR_MANUAL_SUBMISSION" && <div className="decision-row"><button className="reject" onClick={() => decide(job, "reject")}>Reject</button><button className="approve" onClick={() => decide(job, "approve")}>Approve for manual submission →</button></div>}
                  {job.status === "APPROVED_FOR_MANUAL_SUBMISSION" && <p className="approved-note">Approved for manual submission. You must complete the application yourself on the employer's website.</p>}
                </div>}
              </article>;
            })}
          </div>
          {notice && <p className="success" role="status">{notice}</p>}{error && <p className="error" role="alert">{error}</p>}
          <button className="signout" onClick={() => { setToken(""); setJobs([]); setFilter("ALL"); setExpanded(null); setNotice(""); setError(""); }}>Lock owner console</button>
        </section>
      )}
      <footer><span>Vikash AI Job Agent</span><span>Private review · Human decision required</span></footer>
    </main>
  );
}
