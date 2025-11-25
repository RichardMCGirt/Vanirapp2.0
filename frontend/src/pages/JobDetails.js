import React, { useEffect, useState } from "react";
import { apiGet } from "../api/api";
import "./JobDetails.css";
import { useParams, Link } from "react-router-dom";

export default function JobDetails() {
  const { id } = useParams();
  const [details, setDetails] = useState(null);

  useEffect(() => {
    apiGet(`/api/jobs/${id}`).then((data) => setDetails(data));
  }, [id]);

  if (!details) return <div className="loading">Loading job details...</div>;

  return (
    <div className="job-details-page">
      <Link to="/jobs">← Back to Jobs</Link>
      <h1>{details.job.Name}</h1>
      <p className="subtitle">Job ID: {details.job.Id}</p>

      <section className="section">
        <h2>Store & Trade Info</h2>
        <p><strong>Store:</strong> {details.job.store_name || "N/A"}</p>
        <p><strong>Trade:</strong> {details.job.trade_name || "N/A"}</p>
        <p><strong>Status:</strong> {details.job.Status}</p>
      </section>

      <section className="section">
        <h2>Contractors</h2>
        {details.contractors.map((c) => (
          <div className="card" key={c.Id}>
            <p><strong>Contractor ID:</strong> {c.UserId}</p>
            <p><strong>Paid:</strong> {c.IsPaid ? "✔ Paid" : "⛔ Not Paid"}</p>
          </div>
        ))}
      </section>

      <section className="section">
        <h2>Materials</h2>
        {details.materials.map((m) => (
          <div className="card" key={m.Id}>
            <p>{m.Name}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
