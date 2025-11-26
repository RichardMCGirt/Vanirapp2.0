import React, { useEffect, useState } from "react";
import { apiGet } from "../api/api";
import "./Subcontractors.css";

export default function Subcontractors() {
  const [subs, setSubs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeSub, setActiveSub] = useState(null);

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
    <div className="subcontractors-container">
      <h2>Subcontractors</h2>

      <table className="subs-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Name</th>
            <th>Store</th>
            <th>General Liability</th>
            <th>Workers Comp</th>
            <th>Auto Liability</th>
            <th>Specialty</th>
            <th>COI Files</th>
          </tr>
        </thead>

        <tbody>
          {sortedStores.map((storeName) => (
            <React.Fragment key={storeName}>
              {/* Sticky Store Header */}
              <tr className="store-header">
                <td colSpan="9" className="sticky-store">
                  {storeName}
                </td>
              </tr>

              {grouped[storeName].map((r) => (
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
                  <td>{r.Specialty?.length ? r.Specialty.join(", ") : "—"}</td>

                  {/* COI ATTACHMENTS */}
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
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* SIDE PANEL */}
      {activeSub && (
        <div className="side-panel">
          <h3>
            {activeSub.Name} {activeSub.Surname}
          </h3>

          <p>
            <strong>Store:</strong> {activeSub.StoreName}
          </p>

     <p>
  <strong>Specialty:</strong> {activeSub.Specialty?.join(", ")}
</p>


          <p><strong>COI Files:</strong></p>
          {activeSub.COI?.length ? (
            activeSub.COI.map((f, i) => (
              <p key={i}>
                <a href={f.url} target="_blank" rel="noreferrer">
                  File {i + 1}
                </a>
              </p>
            ))
          ) : (
            <p>—</p>
          )}
        </div>
      )}
    </div>
  );
}
