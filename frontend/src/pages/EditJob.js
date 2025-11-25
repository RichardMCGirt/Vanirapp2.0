// src/pages/EditJob.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../api/api";
import "./EditJob.css";

export default function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();

  // -------------------------
  // STATE
  // -------------------------
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);

  const [stores, setStores] = useState([]);
  const [builders, setBuilders] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [fieldtechs, setFieldTechs] = useState([]);

  // READ-ONLY DISPLAY FIELDS
  const [storeName, setStoreName] = useState("");
  const [communityName, setCommunityName] = useState("");
  const [builderName, setBuilderName] = useState("");

  // Field Tech dropdown
  const [selectedTech, setSelectedTech] = useState("");

  // Editable job fields
  const [jobName, setJobName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [address, setAddress] = useState("");
  const [plansAndOptions, setPlansAndOptions] = useState("");

  // Trades
  const [trades, setTrades] = useState([]);

  // -------------------------
  // LOAD ALL DATA
  // -------------------------
  useEffect(() => {
    async function loadAll() {
      try {
        // 1️⃣ Load main job record
        const jobData = await apiGet(`/job/${id}`);
        if (!jobData) {
          console.error("❌ Job not found");
          return;
        }

        setJob(jobData);

        // Fill UI with job values
        setJobName(jobData.name || "");
        setAddress(jobData.address || "");
        setPlansAndOptions(jobData.plansandoptions || "");

        // Start date formatting (convert from ISO → input-local)
        if (jobData.startdate) {
          const iso = jobData.startdate;
          const local = new Date(iso).toISOString().slice(0, 16);
          setStartDate(local);
        }

        // Trades
        setTrades(jobData.trades || []);

        // Read-only fields
        setStoreName(jobData.store_name || "");
        setCommunityName(jobData.community_name || "");
        setBuilderName(jobData.builder_name || "");

        // Pre-select field tech
        setSelectedTech(jobData.fieldtech_id || "");

        // 2️⃣ Load dropdown datasets (even if read-only, future use)
        const [storesRes, buildersRes, communitiesRes, fieldtechRes] =
          await Promise.all([
            apiGet("/stores"),
            apiGet("/builders"),
            apiGet("/communities"),
            apiGet("/fieldtechs"),
          ]);

        setStores(storesRes || []);
        setBuilders(buildersRes || []);
        setCommunities(communitiesRes || []);
        setFieldTechs(fieldtechRes || []);
      } catch (err) {
        console.error("Error loading job:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, [id]);

  // -------------------------
  // SAVE UPDATED JOB
  // -------------------------
  async function handleSave() {
    try {
      const payload = {
        id,
        name: jobName,
        startdate: new Date(startDate).toISOString(),
        address,
plansandoptions: plansAndOptions,
        fieldtech_id: selectedTech,
        trades: trades.map((t) => ({
          id: t.id,
          trade_name: t.trade_name,
          labor_cost: t.labor_cost,
        })),
      };

      await apiPost("/job/update", payload);

      alert("Job updated!");
      navigate(`/job/${id}`);
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving job.");
    }
  }

  // -------------------------
  // RENDER
  // -------------------------
  if (loading) return <div>Loading...</div>;
  if (!job) return <div>Job not found</div>;

  return (
    <div style={{ padding: "20px" }}>
   <div className="edit-job-page">

  <h1>Edit Job</h1>

  <div className="form-grid">
    <label>Job Name</label>
    <input value={jobName} onChange={(e) => setJobName(e.target.value)} />

    <label>Start Date</label>
    <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

    <label>Field Tech</label>
    <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)}>
      <option value="">Select Field Tech</option>
      {fieldtechs.map(ft => (
        <option key={ft.id} value={ft.id}>{ft.name}</option>
      ))}
    </select>

    <label>Store</label>
    <input value={storeName} readOnly />

    <label>Community</label>
    <input value={communityName} readOnly />

    <label>Builder</label>
    <input value={builderName} readOnly />

    <label>Address</label>
    <input value={address} onChange={(e) => setAddress(e.target.value)} />

    <label>Plans & Options</label>
    <textarea
      value={plansAndOptions}
      onChange={(e) => setPlansAndOptions(e.target.value)}
    />
  </div>

  <h2 className="section-title">Trades</h2>

  {trades.map((t, idx) => (
    <div className="trade-row" key={t.id}>
      <strong>{t.trade_name}</strong>
      <input
        value={t.labor_cost}
        onChange={(e) => {
          const updated = [...trades];
          updated[idx].labor_cost = e.target.value;
          setTrades(updated);
        }}
      />
    </div>
  ))}

  <button className="save-btn" onClick={handleSave}>Save</button>
</div>
</div>
  );
}
