import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet } from "../api/api";
import "./JobDetails.css";

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJob();
  }, [id]);

  async function loadJob() {
    try {
      const raw = await apiGet(`/job/${id}`);
      const trades = await apiGet(`/job/${id}/trades`);

      const mapped = {
        ...raw,
        StartDate: raw.startdate || raw.StartDate,
        Name: raw.name || raw.Name,
        SidingProduct: raw.SidingProduct || "",
        FieldTech: raw.FieldTech || "",
        Builder: raw.builder_name || "",
        store_name: raw.store_name || "",
        community_name: raw.community_name || "",
        Address: raw.locationaddress || raw.LocationAddress || "",
        PlanOptions: raw.plansandoptions || raw.PlansAndOptions || "",
        trades: trades || []   // ⭐ ADD TRADES HERE
      };

      setJob(mapped);
      setLoading(false);
    } catch (err) {
      console.error("Job load error", err);
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading job details...</div>;
  if (!job) return <div className="error">Job not found</div>;

  return (
    <div className="jobdetails-wrapper">

      {/* HEADER */}
      <div className="header-bar">
        <h1>Job Details</h1>

        <span className="status-tag">
          {job.Status === 1 ? "Ordered" : "In Progress"}
        </span>

        <div className="header-buttons">
          <button>📅 Timeline</button>
          <button>📋 Job Audit</button>
          <button>✏ Edit</button>
          <Link to="/jobs"><button>⬅ Back</button></Link>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="jobdetails-container">

        {/* LEFT PANEL */}
        <div className="details-panel">

          <div className="detail-item">
            <span className="detail-label">Job Start Date:</span>
            <span className="detail-value">
              {job.StartDate ? new Date(job.StartDate).toLocaleDateString() : "—"}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Job Name:</span>
            <span className="detail-value">{job.Name || "—"}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Siding Product Line:</span>
            <span className="detail-value">{job.SidingProduct || "—"}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Field Tech:</span>
            <span className="detail-value">{job.FieldTech || "—"}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Vanir Store:</span>
            <span className="detail-value">{job.store_name || "—"}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Community:</span>
            <span className="detail-value">{job.community_name || "—"}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Builder:</span>
            <span className="detail-value">{job.Builder || "—"}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Construction Manager:</span>
            <span className="detail-value">
              {job.ConstructionManager || "Not Selected"}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Trades:</span>
            <span className="detail-value">
              {job.trades.length === 0
                ? "—"
                : job.trades.map((t, i) => (
                    <div key={i}>
                      {t.trade_name} — ${Number(t.labor_cost).toFixed(2)}
                    </div>
                  ))}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Address:</span>
            <span className="detail-value">{job.Address || "—"}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Plans & Options:</span>
            <span className="detail-value">{job.PlanOptions || "—"}</span>
          </div>

        </div>

        {/* MAP PANEL */}
        <div className="map-panel">
          <div className="map-header">
            <button>🗺 Map</button>
            <button>🛰 Satellite</button>
            <button>📍 Open</button>
          </div>

          <div className="map-box">
            <div className="map-placeholder">
              Google Map Placeholder <br />
              <small>(Address: {job.Address || "—"})</small>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
