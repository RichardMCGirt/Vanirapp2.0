// src/pages/Subcontractors.js
import React, { useEffect, useState } from "react";
import { apiGet } from "../api/api";
import "./Subcontractors.css";

export default function Subcontractors() {
  const [list, setList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState(null);

console.log("Base:", process.env.REACT_APP_AIRTABLE_BASE);
console.log("Table:", process.env.REACT_APP_AIRTABLE_TABLE);
console.log("View:", process.env.REACT_APP_AIRTABLE_VIEW);
console.log("Key:", process.env.REACT_APP_AIRTABLE_KEY?.substring(0, 5) + "...");

  useEffect(() => {
    load();
  }, []);
function formatExpDate(dateValue) {
  if (!dateValue) return { text: "—", className: "" };

  const d = new Date(dateValue);
  if (isNaN(d)) return { text: dateValue, className: "" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((d - today) / (1000 * 60 * 60 * 24));

  let className = "";
  if (diffDays < 0) className = "expired";         // RED
  else if (diffDays <= 30) className = "expiring"; // ORANGE (optional)

  return {
    text: d.toLocaleDateString(),
    className
  };
}
function renderSpecialty(list) {
  if (!Array.isArray(list) || list.length === 0) return "—";

  return list.map((item, i) => (
    <span key={i} className="tag">
      {item}
    </span>
  ));
}
function renderCOI(files) {
  if (!Array.isArray(files) || files.length === 0) return "—";

  return files.map((file, i) => (
    <div key={i}>
      <a href={file.url} target="_blank" rel="noopener noreferrer">
        📄 {file.filename}
      </a>
    </div>
  ));
}

async function load() {
  setLoading(true);

  const res = await apiGet("/subcontractors-users");

  console.log("🔵 API /subcontractors-users response:", res);

  if (!Array.isArray(res)) {
    console.error("❌ ERROR: API did not return an array!", res);
    setList([]);
    setFiltered([]);
    setLoading(false);
    return;
  }

  const cleaned = res.filter(u =>
    !u.UserName?.toLowerCase().includes("vanir") &&
    !u.UserName?.toLowerCase().includes("techverx")
  );

  console.log("🟢 Cleaned Users:", cleaned);

  setList(cleaned);
  setFiltered(cleaned);
  setLoading(false);
}
  // Search filter
  useEffect(() => {
    const s = list.filter((r) => {
      return (
        (r.UserName || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.Name || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.Surname || "").toLowerCase().includes(search.toLowerCase())
      );
    });
    setFiltered(s);
  }, [search, list]);

  return (
    <div className="sub-page">

      <h1 className="page-title">Subcontractors</h1>

      <div className="top-bar">
        <input
          className="search-input"
          placeholder="Search subcontractors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="sub-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Name</th>
              <th>Store</th>
              <th>General Liability Exp.</th>
              <th>Workers Comp Exp.</th>
              <th>Auto Liability Exp.</th>
              <th>Specialty</th>
<th>COI</th>

            </tr>
          </thead>

     <tbody>
  {filtered.map((r) => (
    <tr
      key={r.Id}
      onClick={() => {
        console.log("👉 Selected subcontractor:", r);
        setActiveSub(r);
      }}
    >
      <td>{r.Id}</td>
      <td>{r.UserName}</td>
      <td>
        {r.Name} {r.Surname}
      </td>
      <td>{r.StoreName || "—"}</td>

      {/* GENERAL LIABILITY */}
      {(() => {
        const { text, className } = formatExpDate(r.GeneralLiability);
        return <td className={className}>{text}</td>;
      })()}

      {/* WORKERS COMP */}
      {(() => {
        const { text, className } = formatExpDate(r.WorkersComp);
        return <td className={className}>{text}</td>;
      })()}

      {/* AUTO LIABILITY */}
      {(() => {
        const { text, className } = formatExpDate(r.AutoLiability);
        return <td className={className}>{text}</td>;
      })()}

      {/* SPECIALTY */}
      <td>
        {r.Specialty?.length ? r.Specialty.join(", ") : "—"}
      </td>

      {/* COI FILES */}
      <td>
        {r.COI?.length ? (
          r.COI.map((file, i) => (
            <div key={i}>
              <a href={file.url} target="_blank" rel="noreferrer">
                COI {i + 1}
              </a>
            </div>
          ))
        ) : (
          "—"
        )}
      </td>
    </tr>
  ))}
</tbody>

        </table>
      )}

      {/* RIGHT SIDE DETAILS PANEL */}
      {activeSub && (
        <div className="details-panel">
          <button className="close-btn" onClick={() => setActiveSub(null)}>
            ✖
          </button>

          <h2>Details</h2>

          <p><strong>ID:</strong> {activeSub.Id}</p>
          <p><strong>Email:</strong> {activeSub.UserName}</p>
          <p><strong>Name:</strong> {activeSub.Name} {activeSub.Surname}</p>
          <p><strong>Store:</strong> {activeSub.StoreName}</p>

<p><strong>General Liability Exp:</strong> {activeSub.GeneralLiability || "—"}</p>
<p><strong>Workers Comp Exp:</strong> {activeSub.WorkersComp || "—"}</p>
<p><strong>Auto Liability Exp:</strong> {activeSub.AutoLiability || "—"}</p>
<p><strong>Specialty:</strong> {renderSpecialty(activeSub.airtable?.["Specialty"])}</p>

<p><strong>COI:</strong> {renderCOI(activeSub.airtable?.["COI"])}</p>


        </div>
      )}

    </div>
  );
}
