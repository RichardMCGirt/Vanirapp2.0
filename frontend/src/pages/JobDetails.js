import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet } from "../api/api";
import "./JobDetails.css";

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await apiGet(`/job/${id}`);

      if (!data || !Array.isArray(data) || data.length === 0) return;

      const base = data[0];

      setJob({
        job_start_date: base.jobstartdate,
        job_name: base.job_name,
        creationtime: base.creationtime,
        store_name: base.store_name,
        community_name: base.community_name,
        builder_name: base.builder_name,
        fieldtech_name: base.fieldtech_name,
        address: base.address,
        plans: base.plansandoptions,

        trades: data.map(t => ({
          trade_name: t.trade_name,
          labor_cost: t.labor_cost,
          ispaid: t.ispaid
        }))
      });
    }

    load();
  }, [id]);

  if (!job) return <div className="jobloading">Loading job details...</div>;

  return (
    <div className="jobdetails-wrapper">

      {/* HEADER */}
      <div className="header-bar">
        <h1>Job Details</h1>
        <span className="status-tag ordered">Ordered</span>

        <div className="header-buttons">
          <button>📅 Timeline</button>
          <button>📋 Job Audit</button>
          <button>✏ Edit</button>
          <button>⬅ Back</button>
        </div>
      </div>

      <div className="jobdetails-container">

        {/* LEFT PANEL */}
        <div className="details-panel">
          <DetailItem label="Job Start Date:" value={job.job_start_date} />
          <DetailItem label="Job Name:" value={job.job_name} />
          <DetailItem label="Field Tech:" value={job.fieldtech_name} />
          <DetailItem label="Vanir Store:" value={job.store_name} />
          <DetailItem label="Community:" value={job.community_name} />
          <DetailItem label="Builder:" value={job.builder_name} />

          {/* TRADES */}
          {job.trades.map((t, i) => (
            <React.Fragment key={i}>
              <DetailItem label={`Trade #${i + 1}:`} value={t.trade_name} />
              <DetailItem
                label="Labor Cost:"
                value={t.labor_cost ? `$${Number(t.labor_cost).toFixed(2)}` : "—"}
              />
            </React.Fragment>
          ))}

          <DetailItem label="Address:" value={job.address} />
          <DetailItem label="Plans & Options:" value={job.plans} />
        </div>

        {/* MAP PANEL */}
        <div className="map-panel">
          <div className="map-header">
            <button>🧭 Map</button>
            <button>🛰 Satellite</button>
            <button>📍 Open</button>
          </div>

          <div className="map-box">
            <p className="map-placeholder">
              Google Map Placeholder <br />
              (Address: {job.address})
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || "—"}</span>
    </div>
  );
}
