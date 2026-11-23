"use client";

import { useCallback, useEffect, useState } from "react";

type Job = {
  job_id: string; title: string; company: string; location?: string; work_mode?: string;
  job_url: string; source?: string; posted_at?: string; score?: number; status?: string;
  match_reasons?: string[] | string; gaps?: string[] | string;
  tailored_resume_text?: string; cover_letter?: string;
};

export default function Home() {
  const [token, setToken] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Enter your owner access token to open your private review queue.");
  const [busy, setBusy] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    if (!token.trim()) return;
    setLoading(true); setMessage("Loading your review queue…");
    try {
      const res = await fetch("/api/jobs", { headers: { "x-admin-token": token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load jobs");
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      setMessage(data.jobs?.length ? "Review each opportunity before deciding." : "No jobs are waiting for review yet.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { /* Queue loads only after an explicit owner action. */ }, []);

  async function decide(jobId: string, decision: "approve" | "reject") {
    setBusy(jobId);
    try {
      const res = await fetch("/api/decision", { method: "POST", headers: { "content-type": "application/json", "x-admin-token": token }, body: JSON.stringify({ job_id: jobId, decision }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Decision could not be saved");
      setJobs(current => current.filter(job => job.job_id !== jobId));
      setMessage(decision === "approve" ? "Approved for manual submission. No application was submitted." : "Job rejected.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(null); }
  }

  return <main className="shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark">V</span><span>Vikash <b>AI Job Agent</b></span></a><span className="pill">PRIVATE REVIEW CONSOLE</span></header>
    <section className="hero">
      <div className="eyebrow">YOUR CAREER WORKSPACE</div>
      <h1>Find better-fit roles.<br/><span>Apply with confidence.</span></h1>
      <p className="lead">Your assistant screens opportunities, prepares tailored application documents, and keeps every final submission in your hands.</p>
      <div className="stats"><div><b>50</b><small>Daily discovery target</small></div><div><b>2×</b><small>Scheduled search runs</small></div><div><b>100%</b><small>Human approval required</small></div></div>
    </section>
    <section className="panel access">
      <div><div className="section-kicker">OWNER ACCESS</div><h2>Open your review queue</h2><p>Only your owner token can access candidate records.</p></div>
      <div className="access-form"><input aria-label="Owner access token" type="password" placeholder="Enter owner access token" value={token} onChange={e=>setToken(e.target.value)} onKeyDown={e=>e.key==="Enter"&&loadJobs()}/><button onClick={loadJobs} disabled={!token || loading}>{loading?"Loading…":"Load jobs"} <span>→</span></button></div>
    </section>
    <div className="queue-head"><div><div className="section-kicker">APPLICATION PIPELINE</div><h2>Jobs awaiting your decision</h2></div><span className="count">{jobs.length} waiting</span></div>
    <p className="notice" role="status">{message}</p>
    <section className="jobs">
      {jobs.map(job=><article className="job-card" key={job.job_id}>
        <div className="job-top"><div><div className="company">{job.company}</div><h3>{job.title}</h3><div className="meta">{job.location || "Location not listed"} · {job.work_mode || "Work mode not specified"} · {job.source || "Source not listed"}</div></div><div className="score">{job.score ?? "—"}<small>MATCH</small></div></div>
        {job.match_reasons && <div className="detail"><b>Why it matches</b><p>{Array.isArray(job.match_reasons)?job.match_reasons.join(" · "):job.match_reasons}</p></div>}
        {job.gaps && <div className="detail gaps"><b>Potential gaps</b><p>{Array.isArray(job.gaps)?job.gaps.join(" · "):job.gaps}</p></div>}
        <div className="job-actions"><a href={job.job_url} target="_blank" rel="noreferrer">View original job ↗</a><div><button className="reject" disabled={busy===job.job_id} onClick={()=>decide(job.job_id,"reject")}>Reject</button><button disabled={busy===job.job_id} onClick={()=>decide(job.job_id,"approve")}>Approve for manual application</button></div></div>
        <p className="disclaimer">Approval only updates your tracker. It does not submit an application.</p>
      </article>)}
    </section>
    <footer>Built for careful, evidence-based applications · Your data stays behind owner authentication.</footer>
  </main>;
}