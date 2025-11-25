import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet } from "../api/api";
import "./JobDetails.css";
import { Link } from "react-router-dom";

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);

 // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  loadDetails();
}, []);


  async function loadDetails() {
    const data = await apiGet(`/job/${id}`);
    setJob(data);
  }

  if (!job) return <div className="loading">Loading...</div>;
function formatPrettyDate(dateStr) {
  if (!dateStr) return "—";

  const date = new Date(dateStr);
  const day = date.getDate();

  // ordinal suffix: st, nd, rd, th
  const suffix =
    day % 10 === 1 && day !== 11 ? "st" :
    day % 10 === 2 && day !== 12 ? "nd" :
    day % 10 === 3 && day !== 13 ? "rd" :
    "th";

  const options = { month: "long", year: "numeric" };
  const formatted = date.toLocaleDateString("en-US", options);

  return `${formatted.replace(",", "")} ${day}${suffix}, ${date.getFullYear()}`;
}

  function getStatusText(code) {
    switch (code) {
      case 0: return "Ordered";
      case 1: return "In Progress";
      case 2: return "Completed";
      default: return "Unknown";
    }
  }

  const statusText = getStatusText(job.status || 0);
  const badgeClass = statusText.toLowerCase().replace(" ", "-");

  return (
    <div className="job-details">

      <div className="header">
        <div>
          <h1>{job.name}</h1>
          <h2 className={`status-badge ${badgeClass}`}>{statusText}</h2>
        </div>

      <div className="header-buttons">
  <button
    className="maps-btn"
    onClick={() =>
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          job.address
        )}`
      )
    }
  >
    📍 Open in Google Maps
  </button>

  <Link to={`/job/edit/${job.id}`} className="btn small">
    ✏️ Edit
  </Link>
</div>

  
      </div>

      <div className="info-grid">
        <div className="card">
          <h3>Job Information</h3>
          <p><strong>Community:</strong> {job.community_name || "—"}</p>
          <p><strong>Builder:</strong> {job.builder_name || "—"}</p>
          <p><strong>Store:</strong> {job.store_name || "—"}</p>
<p><strong>Start Date:</strong> {formatPrettyDate(job.startdate)}</p>
          <p><strong>Created:</strong> {new Date(job.creationtime).toLocaleDateString()}</p>
        </div>

        <div className="card">
          <h3>Field Tech</h3>
        <p><strong></strong> {job.fieldtech_name || "—"}</p>

        </div>

     <div className="card">
  <h3>Trades</h3>

  {(!job.trades || job.trades.length === 0) && <p>— No trades found —</p>}

  {(job.trades || []).map((t, i) => (
    <div key={i} className="trade-row">
      <p><strong>{t.trade_name}</strong></p>
      <p>Labor: {t.labor_cost ? `$${Number(t.labor_cost).toFixed(2)}` : "—"}</p>
    </div>
  ))}
</div>

      </div>

      <div className="card full-width">
        <h3>Plans & Options</h3>
        <pre>{job.plansandoptions || "—"}</pre>
      </div>

      <div className="card full-width">
        <h3>Address</h3>
        <p>{job.address || "—"}</p>
      </div>
    </div>
  );
}
