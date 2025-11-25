// src/pages/JobDetails.js
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet } from "../api/api";
import "./JobDetails.css";

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);

  useEffect(() => {
    loadJob();
  }, [id]);

  async function loadJob() {
    const data = await apiGet(`/job/${id}`);
    console.log("JOB DETAILS:", data);
    setJob(data);
  }

  if (!job) return <div className="loading">Loading...</div>;

  // Pretty date formatter
  function formatPrettyDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const day = d.getDate();
    const suffix =
      day % 10 === 1 && day !== 11 ? "st" :
      day % 10 === 2 && day !== 12 ? "nd" :
      day % 10 === 3 && day !== 13 ? "rd" :
      "th";

    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    }).replace(/(\d+)/, `$1${suffix}`);
  }

  function getStatusText(code) {
    switch (code) {
      case 0: return "Ordered";
      case 1: return "In Progress";
      case 2: return "Completed";
      case 3: return "Approved";
      default: return "Unknown";
    }
  }

  const statusText = getStatusText(job.status);
  const badgeClass = statusText.toLowerCase().replace(" ", "-");

  return (
    <div className="job-details">

      {/* HEADER */}
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
                  job.address || ""
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

      {/* INFO GRID */}
      <div className="info-grid">

        {/* JOB INFO */}
        <div className="card">
          <h3>Job Information</h3>
          <p><strong>Community:</strong> {job.community_name || "—"}</p>
          <p><strong>Builder:</strong> {job.builder_name || "—"}</p>
          <p><strong>Store:</strong> {job.store_name || "—"}</p>
          <p><strong>Start Date:</strong> {formatPrettyDate(job.startdate)}</p>
          <p><strong>Created:</strong> {new Date(job.creationtime).toLocaleDateString()}</p>
        </div>

        {/* FIELD TECH */}
        <div className="card">
          <h3>Field Tech</h3>
          <p>{job.fieldtech_name || "—"}</p>
        </div>

        {/* INSTALLER */}
        <div className="card">
          <h3>Installer</h3>

          {job.installer && job.installer.first ? (
            <>
              <p><strong>Name:</strong> {job.installer.first} {job.installer.last}</p>
              <p><strong>Email:</strong> {job.installer.email}</p>
            </>
          ) : (
            <p>— No Installer Assigned —</p>
          )}
        </div>

        {/* TRADES */}
        <div className="card">
          <h3>Trades</h3>

          {!job.trades || job.trades.length === 0 ? (
            <p>— No trades found —</p>
          ) : (
            job.trades.map((t, i) => (
              <div key={i} className="trade-row">
                <p><strong>{t.trade_name}</strong></p>
                <p>Labor: {t.labor_cost ? `$${Number(t.labor_cost).toFixed(2)}` : "—"}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PLANS */}
      <div className="card full-width">
        <h3>Plans & Options</h3>
        <pre>{job.plansandoptions || "—"}</pre>
      </div>

      {/* ADDRESS */}
      <div className="card full-width">
        <h3>Address</h3>
        <p>{job.address || "—"}</p>
      </div>
    </div>
  );
}
