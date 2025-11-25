import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./JobDetails.css"; // or EditJob.css
import { apiGet, apiPut } from "../api/api"; // your helper

export default function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
const [storeName, setStoreName] = useState("");
const [communityName, setCommunityName] = useState("");
const [builderName, setBuilderName] = useState("");

  // -----------------------------
  // STATE
  // -----------------------------
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [stores, setStores] = useState([]);
  const [builders, setBuilders] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [fieldTechs, setFieldTechs] = useState([]);

  // -----------------------------
  // FETCH JOB + DROPDOWNS
  // -----------------------------
  useEffect(() => {
  async function loadAll() {
    try {
      // 1️⃣ Load job first
      const jobData = await apiGet(`/job/${id}`);

      if (!jobData) {
        console.error("❌ No job found");
        return;
      }

      setJob(jobData);

      // 2️⃣ Load supporting lists
      const [storesRes, buildersRes, communitiesRes, fieldtechRes] =
        await Promise.all([
          apiGet("/stores"),
          apiGet("/builders"),
          apiGet("/communities"),
          apiGet("/fieldtechs")
        ]);

      // 3️⃣ Save lists (even if they are not dropdowns anymore, needed later)
      setStores(storesRes || []);
      setBuilders(buildersRes || []);
      setCommunities(communitiesRes || []);
      setFieldTechs(fieldtechRes || []);

      // 4️⃣ Set read-only display values safely
      setStoreName(jobData.store_name || "");
      setCommunityName(jobData.community_name || "");
      setBuilderName(jobData.builder_name || "");

    } catch (err) {
      console.error("Error loading job:", err);
    } finally {
      setLoading(false);
    }
  }

  loadAll();
}, [id]);


  // -----------------------------
  // HELPERS
  // -----------------------------
  function formatDateForInput(utc) {
    if (!utc) return "";
    const d = new Date(utc);
    const iso = d.toISOString();
    return iso.substring(0, 16); // datetime-local friendly
  }

  function formatDatePretty(utc) {
    const date = new Date(utc);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function updateField(field, value) {
    setJob((prev) => ({ ...prev, [field]: value }));
  }

  function updateTrade(index, field, value) {
    const updated = [...job.trades];
    updated[index][field] = value;
    setJob((prev) => ({ ...prev, trades: updated }));
  }

  // -----------------------------
  // SAVE JOB
  // -----------------------------
  async function handleSave() {
    if (!job) return;
    setSaving(true);

    try {
      // Build the payload your backend expects
      const payload = {
        id: job.id,
        name: job.name,
        fieldTechId: job.fieldTechId,
        materialId: job.materialId,
        storeId: job.storeId,
        builderId: job.builderId,
        communityId: job.communityId,
        Longitude: job.longitude,
        Latitude: job.latitude,
        status: job.status,
        Colors: job.Colors || [],
        locationAddress: job.address,
        plansAndOptions: job.plansandoptions,
        startDate: job.startdate,
        trades: job.trades, // since you're not using CrewIQ trade IDs
      };

      await apiPut("/job/Update", payload);

      alert("Job saved successfully!");
      navigate(`/job/${id}`);
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving job!");
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------
  // UI LOADING
  // -----------------------------
  if (loading || !job) return <div className="loading">Loading job...</div>;

  return (
    <div className="edit-job-container">
      <h1 className="page-title">Edit Job</h1>

      <div className="edit-grid">
        {/* Job Name */}
        <div className="form-group">
          <label>Job Name</label>
          <input
            type="text"
            value={job.name || ""}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </div>

        {/* Start Date */}
        <div className="form-group">
          <label>Start Date</label>
          <input
            type="datetime-local"
            value={formatDateForInput(job.startdate)}
            onChange={(e) => updateField("startdate", e.target.value)}
          />
          <small>Pretty: {formatDatePretty(job.startdate)}</small>
        </div>

        {/* Field Tech */}
        <div className="form-group">
          <label>Field Tech</label>
          <select
            value={job.fieldTechId || ""}
            onChange={(e) => updateField("fieldTechId", e.target.value)}
          >
            <option value="">Select Field Tech</option>
            {fieldTechs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Store */}
        <div className="form-group">
          <label>Store</label>
        <input
  type="text"
  value={storeName}
  readOnly
  className="read-only-input"
/>

        </div>

        {/* Community */}
        <div className="form-group">
          <label>Community</label>
       <input
  type="text"
  value={communityName}
  readOnly
  className="read-only-input"
/>


        </div>

        {/* Builder */}
        <div className="form-group">
          <label>Builder</label>
          <input
  type="text"
  value={builderName}
  readOnly
  className="read-only-input"
/>

        </div>

        {/* Address */}
        <div className="form-full">
          <label>Address</label>
          <input
            type="text"
            value={job.address || ""}
            onChange={(e) => updateField("address", e.target.value)}
          />
        </div>

        {/* Plans & Options */}
        <div className="form-full">
          <label>Plans & Options</label>
          <textarea
            rows="4"
            value={job.plansandoptions || ""}
            onChange={(e) => updateField("plansandoptions", e.target.value)}
          />
        </div>

        {/* Trades */}
        <div className="form-full trades-section">
          <h2>Trades</h2>
          {job.trades?.map((t, idx) => (
            <div className="trade-row" key={idx}>
              <span className="trade-name">{t.trade_name}</span>
              <input
                type="number"
                step="0.01"
                value={t.labor_cost}
                onChange={(e) => updateTrade(idx, "labor_cost", e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* SAVE BUTTON */}
      <div className="save-container">
        <button
          className="save-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
