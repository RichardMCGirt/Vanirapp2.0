import React, { useEffect, useState } from "react";
import { apiGet } from "../api/api";
import "./Jobs.css";
import { Link } from "react-router-dom";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadJobs();
  }, []);

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
