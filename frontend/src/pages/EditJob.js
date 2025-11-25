// src/pages/EditJob.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../api/api";

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
      <h1>Edit Job</h1>

      {/* --------------------- */}
      {/* Job Name */}
      {/* --------------------- */}
      <label><strong>Job Name</strong></label><br />
      <input
        value={jobName}
        onChange={(e) => setJobName(e.target.value)}
        style={{ width: "300px" }}
      /><br /><br />

      {/* --------------------- */}
      {/* Start Date */}
      {/* --------------------- */}
      <label><strong>Start Date</strong></label><br />
      <input
        type="datetime-local"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        style={{ width: "250px" }}
      /><br /><br />

      {/* --------------------- */}
      {/* Field Tech Dropdown */}
      {/* --------------------- */}
      <label><strong>Field Tech</strong></label><br />
      <select
        value={selectedTech}
        onChange={(e) => setSelectedTech(e.target.value)}
        style={{ width: "250px" }}
      >
        <option value="">Select Field Tech</option>
        {fieldtechs.map((tech) => (
          <option key={tech.id} value={tech.id}>
            {tech.name}
          </option>
        ))}
      </select>

      <br /><br />

      {/* --------------------- */}
      {/* READ-ONLY FIELDS */}
      {/* --------------------- */}
      <label><strong>Store</strong></label><br />
      <input value={storeName} readOnly style={{ width: "250px" }} /><br /><br />

      <label><strong>Community</strong></label><br />
      <input value={communityName} readOnly style={{ width: "250px" }} /><br /><br />

      <label><strong>Builder</strong></label><br />
      <input value={builderName} readOnly style={{ width: "250px" }} /><br /><br />

      {/* --------------------- */}
      {/* Address */}
      {/* --------------------- */}
      <label><strong>Address</strong></label><br />
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        style={{ width: "350px" }}
      /><br /><br />

      {/* --------------------- */}
      {/* Plans and Options */}
      {/* --------------------- */}
      <label><strong>Plans & Options</strong></label><br />
      <textarea
        value={plansAndOptions}
        onChange={(e) => setPlansAndOptions(e.target.value)}
        rows="4"
        cols="50"
      /><br /><br />

      {/* --------------------- */}
      {/* Trades */}
      {/* --------------------- */}
      <h2>Trades</h2>
      {trades.map((t, idx) => (
        <div key={t.id} style={{ marginBottom: "10px" }}>
          <label><strong>{t.trade_name}</strong></label><br />
          <input
            type="text"
            value={t.labor_cost}
            onChange={(e) => {
              const updated = [...trades];
              updated[idx].labor_cost = e.target.value;
              setTrades(updated);
            }}
            style={{ width: "150px" }}
          />
        </div>
      ))}

      <br /><br />

      {/* --------------------- */}
      {/* SAVE BUTTON */}
      {/* --------------------- */}
      <button onClick={handleSave} style={{ padding: "10px 20px" }}>
        Save
      </button>
    </div>
  );
}
