import React, { useEffect, useState } from "react";
import { apiGet } from "../api/api";
import "./Jobs.css";
import { Link } from "react-router-dom";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("");
const [lienJobs, setLienJobs] = useState([]);

useEffect(() => {
  loadJobs();
  loadLienJobs();   // 👈 NEW
}, []);
async function loadLienJobs() {
  const data = await apiGet("/jobs/lien");

  if (!data || !Array.isArray(data)) {
    setLienJobs([]);
    return;
  }

  setLienJobs(data);
  console.log("Lien Jobs →", data); // debug
}


  async function loadJobs() {
  const data = await apiGet("/jobs");

  if (!data || !Array.isArray(data)) {
    setJobs([]);
    return;
  }

  // 1️⃣ Normalize all backend field names
const normalized = data.map((j) => ({
  job_id: j.job_id || j.Id,
  job_name: j.job_name || j.Name,
  creationtime: j.creationtime || j.CreationTime,
  store_name: j.store_name || j.StoreName || j.storename,

  lien_number: j.lien_number ?? j.LienNumber ?? j.liennumber ?? null, // ✅ REQUIRED

  trade_name: j.trade_name || j.TradeName,
  labor_cost: j.labor_cost || j.LaborCost || null,
  ispaid: j.ispaid || j.IsPaid || false,

  installer: {
    user_id: j.installer_user_id,
    first: j.installer_first,
    last: j.installer_last,
    email: j.installer_email
  }
}));



  // 2️⃣ GROUP BY job_id and combine trades
  const grouped = {};

  normalized.forEach((j) => {
    if (!grouped[j.job_id]) {
  grouped[j.job_id] = {
    job_id: j.job_id,
    job_name: j.job_name,
    store_name: j.store_name,
    creationtime: j.creationtime,
    installer: j.installer,
    trades: []
  };
}


    grouped[j.job_id].trades.push({
      trade_name: j.trade_name,
      labor_cost: j.labor_cost,
      ispaid: j.ispaid
    });
  });

  setJobs(Object.values(grouped));
console.log("DEBUG JOBS:", Object.values(grouped));

  }

 const filtered = jobs.filter((job) => {
  const f = filter.toLowerCase();

  const tradeMatch = job.trades.some((t) =>
    (t.trade_name || "").toLowerCase().includes(f)
  );

  return (
    (job.job_name || "").toLowerCase().includes(f) ||
    (job.store_name || "").toLowerCase().includes(f) ||
    tradeMatch
  );
});


  return (
    <div className="jobs-page">
      <h1>Jobs Dashboard</h1>
{/* 🔥 Unpaid Subs Summary */}
<div className="unpaid-subs card">
  <h2>Subcontractors to pay</h2>

  {jobs
    .flatMap(job =>
      job.trades
        .filter(t => t.ispaid === false || t.ispaid === "false")
        .map(t => ({
          job_id: job.job_id,
          job_name: job.job_name,
          installer: job.installer,
          trade: t.trade_name
        }))
    )
    .map((u, i) => (
      <div key={i} className="unpaid-item">
        <p><strong>{u.installer.first} {u.installer.last}</strong></p>
        <p>🛠 {u.trade}</p>
        <p>📌 Job: {u.job_name}</p>
        <Link to={`/job/${u.job_id}`} className="btn small">
          View Job →
        </Link>
      </div>
    ))}

  {/* If empty */}
  {jobs.every(job => job.trades.every(t => t.ispaid)) && (
    <p>✔ All subcontractors are paid</p>
  )}
</div>
{/* 🔥 Jobs with Lien Numbers */}
<div className="lien-jobs card">
  <h2>📄 Jobs With Lien Numbers</h2>

  {lienJobs.length === 0 && (
    <p>No lien numbers found.</p>
  )}

  {lienJobs.map((job) => (
    <div key={job.job_id} className="lien-row">
      <p><strong>{job.job_name}</strong></p>
      <p>🔢 Lien Number: {job.lien_number}</p>

      <Link to={`/job/${job.job_id}`} className="btn small">
        View Job →
      </Link>
    </div>
  ))}
</div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search job, store, or trade..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="jobs-grid">
        {filtered.map((job) => {

          // Show the primary trade (first trade)
          const mainTrade = job.trades[0];

          return (
            <Link to={`/job/${job.job_id}`} key={job.job_id} className="card clickable">
<Link to="/subcontractors" className="btn small">
  Manage Subcontractors →
</Link>

              <p className="job-title">{job.job_name || "Unnamed Job"}</p>

<p>🏢 Store: {job.store_name || "Unassigned"}</p>

<p>👷 Installer: {job.installer?.first || "—"} {job.installer?.last || ""}</p>

           <div className="trade-list">
  {job.trades.map((t, i) => (
    <div key={i}>
      <p>🛠 Trade: {t.trade_name || "N/A"}</p>
      <p>💵 Labor: {t.labor_cost ? `$${Number(t.labor_cost).toFixed(2)}` : "—"}</p>
    </div>
  ))}
</div>

              <p className="status">
                💰 {mainTrade?.ispaid ? "✔ Paid" : "⛔ Not Paid"}
              </p>

              <p className="date">
                📆 {job.creationtime ? new Date(job.creationtime).toLocaleDateString() : ""}
              </p>

            </Link>
          );
        })}
      </div>
    </div>
  );
}
