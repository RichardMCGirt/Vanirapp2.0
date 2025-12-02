// src/pages/JobDetails.js
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet, apiPost } from "../api/api";
import "./JobDetails.css";
import MaterialSelector from "../components/MaterialSelector";
import Navbar from "../components/Navbar";

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
const [measurements, setMeasurements] = useState([]);
const [prewalkPdfs, setPrewalkPdfs] = useState([]);
const [prewalkItems, setPrewalkItems] = useState([]);
const [constructionManager, setConstructionManager] = useState(null);
const [creatorName, setCreatorName] = useState("");

useEffect(() => {
  async function fetchJob() {
    const data = await apiGet(`/job/${id}`);
    setJob(data);
    setCreatorName(
  ((data.creator_first || "") + " " + (data.creator_last || "")).trim()
);

  }

  async function fetchMeasurements() {
    const m = await apiGet(`/job/${id}/measurements`);
    setMeasurements(m || []);
  }

  async function fetchPrewalkPdfs() {
    const pdfs = await apiGet(`/job/${id}/prewalk-pdfs`);
    setPrewalkPdfs(pdfs || []);
  }

  async function fetchPrewalkItems() {
    const items = await apiGet(`/job/${id}/prewalk-items`);
    setPrewalkItems(items || []);
  }
  async function fetchConstructionManager() {
  const data = await apiGet(`/job/${id}/construction-manager`);
  setConstructionManager(data);
}

fetchConstructionManager();
  fetchJob();
  fetchMeasurements();
  fetchPrewalkPdfs();
  fetchPrewalkItems();
}, [id]);



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
function getCategoryLabel(cat) {
  switch (cat) {
    case 0: return "Crawl door";
    case 1: return "Knee wall";
    default: return "Unknown";
  }
}

async function submitMeasurements() {
  const body = {
    jobId: id,
    measurements: measurements.map(m => ({
      id: m.id,
      width: m.width,
      height: m.height,
      category: m.category
    }))
  };

  const res = await apiPost("/measurements/update", body);

  if (res.success) {
    alert("Measurements updated!");
  } else {
    alert("Failed to update measurements.");
  }
}


  function getStatusText(code) {
    switch (code) {
      case 0: return "Draft";
      case 1: return "Ordered";
      case 2: return "Active";
      case 3: return "Completed";
      case 4: return "Finished";

      default: return "Unknown";
    }
  }

  const statusText = getStatusText(job.status);
  const badgeClass = statusText.toLowerCase().replace(" ", "-");

  return (
      <>
      <Navbar />
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
    <p><strong>Created By:</strong> {job.creator?.first} {job.creator?.last}</p>
<p><strong>Email:</strong> {job.creator?.email}</p>

    <p><strong>Start Date:</strong> {formatPrettyDate(job.startdate)}</p>
    <p><strong>Created:</strong> {new Date(job.creationtime).toLocaleDateString()}</p>
<p style={{ marginTop: "6px" }}>
  <strong>Created By:</strong> 
  <span style={{ color: "#004aad", marginLeft: "4px" }}>{creatorName || "—"}</span>
</p>

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
<div className="card">
  <h3>Construction Manager</h3>

  {!constructionManager ? (
    <p>— No construction manager assigned —</p>
  ) : (
    <>
      <p><strong>Name:</strong> {constructionManager.FullName}</p>
      <p><strong>Phone:</strong> <a href={`tel:${constructionManager.PhoneNumber}`}>
         {constructionManager.PhoneNumber}
      </a></p>
    </>
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
 <div className="card full-width">
  <h3>Measurements</h3>

  {measurements.length === 0 ? (
    <p>— No measurements —</p>
  ) : (
    measurements.map((m, idx) => (
      <div key={m.id} className="measurement-block">

        <h4>{getCategoryLabel(m.category)}</h4>

        {/* Crawl Door (width + height) */}
        {m.category === 0 && (
          <>
            <div className="measurement-row">
              <div className="measurement-field">
                <label>Width</label>
                <div className="input-unit">
                  <input
                    type="number"
                    value={m.width}
                    onChange={(e) => {
                      const copy = [...measurements];
                      copy[idx].width = Number(e.target.value);
                      setMeasurements(copy);
                    }}
                  />
                  <span>Inch</span>
                </div>
              </div>

              <div className="measurement-field">
                <label>Height</label>
                <div className="input-unit">
                  <input
                    type="number"
                    value={m.height}
                    onChange={(e) => {
                      const copy = [...measurements];
                      copy[idx].height = Number(e.target.value);
                      setMeasurements(copy);
                    }}
                  />
                  <span>Inch</span>
                </div>
              </div>
              <div className="card full-width">
  <h3>Pre-Walk PDFs</h3>

  {prewalkPdfs.length === 0 ? (
    <p>— No documents —</p>
  ) : (
    prewalkPdfs.map((pdf) => (
      <div key={pdf.Id} className="pdf-row">
        <a 
          href={pdf.PreWalkItemsPdfUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn small"
        >
          📄 View PDF {pdf.Id}
        </a>
      </div>
    ))
  )}
  <div className="card full-width">
  <h3>Pre-Walk Items</h3>

  {prewalkItems.length === 0 ? (
    <p>— No Pre-Walk items —</p>
  ) : (
    <table className="measurements-table">
      <thead>
        <tr>
          <th>Reason</th>
          <th>Note</th>
          <th>Ask CM To Fix?</th>
        </tr>
      </thead>
      <tbody>
        {prewalkItems.map((item) => (
          <tr key={item.Id}>
            <td>{item.reason_name || "—"}</td>
            <td>{item.Note || "—"}</td>
            <td>{item.AskCMToFix ? "Yes" : "No"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>

</div>

            </div>
          </>
        )}

        {/* Knee wall (one dimension) */}
        {m.category === 1 && (
          <div className="measurement-field">
            <label>Dimension</label>
            <div className="input-unit">
              <input
                type="number"
                value={m.height}
                onChange={(e) => {
                  const copy = [...measurements];
                  copy[idx].height = Number(e.target.value);
                  setMeasurements(copy);
                }}
              />
              <span>SQ</span>
            </div>
          </div>
        )}

        <hr />
      </div>
    ))
  )}

  <button className="btn" onClick={submitMeasurements}>
    Save Measurements
  </button>
</div> {/* closes Measurements card */}

</div> {/* closes info-grid */}


</div> {/* ⛔ THIS closes the main <div className="job-details"> */}


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

</>
);
}

