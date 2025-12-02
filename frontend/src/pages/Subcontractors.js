import React, { useEffect, useState } from "react";
import { apiGet } from "../api/api";
import "./Subcontractors.css";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Subcontractors() {
  const [subs, setSubs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeSub, setActiveSub] = useState(null);
const navigate = useNavigate();
const [awsFiles, setAwsFiles] = useState([]);
const [selectedSub, setSelectedSub] = useState(null);

  // -----------------------------
  // FORMAT DATE + COLOR CODE
  // -----------------------------
  function formatExpDate(dateStr) {
    if (!dateStr) return { text: "—", className: "exp-na" };

    const today = new Date();
    const date = new Date(dateStr);
    const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

    if (diff < 0) return { text: dateStr, className: "exp-expired" };
    if (diff <= 30) return { text: dateStr, className: "exp-warning" };

    return { text: dateStr, className: "exp-ok" };
  }
async function loadAwsFiles(email) {
  if (!email) {
    setAwsFiles([]);
    return;
  }

  console.log("📥 Loading AWS COIs for:", email);

  const encoded = encodeURIComponent(email);
  const res = await apiGet(`/subcontractor-files/${encoded}`);

  console.log("📤 AWS files response:", res);

  setAwsFiles(res || []);
}

  // -----------------------------
  // LOAD SUBCONTRACTORS
  // -----------------------------
  async function load() {
    console.log("🔵 Fetching subcontractors...");
    const res = await apiGet("/subcontractors-users");

    console.log("🔵 API /subcontractors-users response:", res);

    if (!Array.isArray(res)) {
      console.error("❌ API did not return an array!", res);
      return;
    }

    setSubs(res);
    setFiltered(res);
  }

  useEffect(() => {
    load();
  }, []);

  // -----------------------------
  // GROUP BY STORE NAME
  // -----------------------------
  const grouped = {};
  filtered.forEach((r) => {
    const store = r.StoreName || "Unknown Store";
    if (!grouped[store]) grouped[store] = [];
    grouped[store].push(r);
  });

  // 🔥 FIX: SORT STORE GROUPS A → Z
  const sortedStores = Object.keys(grouped).sort((a, b) =>
    a.localeCompare(b)
  );

  return (
  <>
    <Navbar />

    <div className="subcontractors-container">
      <h2>Subcontractors</h2>

      <table className="subs-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Name</th>
            <th>General Liability</th>
            <th>Workers Comp</th>
            <th>Auto Liability</th>
            <th>Specialty</th>
            <th>COI Files</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {sortedStores.map((storeName) => (
            <React.Fragment key={storeName}>
              {/* Sticky Store Header */}
              <tr className="store-header">
                <td colSpan="10" className="sticky-store">
                  {storeName}
                </td>
              </tr>

              {grouped[storeName].map((r) => (
                <tr
                  key={r.Id}
                  onClick={() => {
                    setSelectedSub(r);
                    loadAwsFiles(r.UserName); // load AWS COIs
                  }}
                >
                  <td>{r.Id}</td>
                  <td>{r.UserName}</td>
                  <td>{r.Name} {r.Surname}</td>

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
                  <td>{r.Specialty?.join(", ") || "—"}</td>

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

                  {/* ACTION BUTTON */}
                  <td>
                    <button
                      className="view-btn"
                      onClick={(e) => {
                        e.stopPropagation(); // prevents right panel open
                        navigate(`/subcontractor/${r.Id}`);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* SIDE PANEL */}
      {selectedSub && (
        <div className="side-panel">
          <button
            className="close-btn"
            onClick={() => setSelectedSub(null)}
          >
            ✕
          </button>

          <h3>
            {selectedSub.Name} {selectedSub.Surname}
          </h3>

          <p>
            <strong>Store:</strong> {selectedSub.StoreName}
          </p>

          <p>
            <strong>Specialty:</strong>{" "}
            {selectedSub.Specialty?.join(", ") || "—"}
          </p>

          <hr />

          <h4>CWCC Forms</h4>

          <p>
            <strong>Policy Company:</strong>{" "}
            {selectedSub.PolicyCompany || "—"}
          </p>

          <p>
            <strong>Contractor Name:</strong>{" "}
            {selectedSub.ContractorName || "—"}
          </p>

          <p>
            <strong>Company Name:</strong>{" "}
            {selectedSub.CompanyName || "—"}
          </p>

          {selectedSub.SignUrl && (
            <p>
              <a
                href={selectedSub.SignUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#004aad", fontWeight: "bold" }}
              >
                View Signed CWCC Form
              </a>
            </p>
          )}

          <hr />

          <h4>AWS COI Files</h4>
          {awsFiles.length ? (
            awsFiles.map((f, i) => (
              <p key={i}>
                <a href={f.url} target="_blank">AWS File {i + 1}</a>
              </p>
            ))
          ) : (
            <p>None found</p>
          )}
        </div>
      )}
    </div>
  </>
);
}
