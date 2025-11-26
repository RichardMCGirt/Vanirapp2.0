import React, { useEffect, useState } from "react";
import { apiGet } from "../api/api";
import "./ConstructionManagers.css";

export default function ConstructionManagers() {
  const [groupedData, setGroupedData] = useState({});
  const [search, setSearch] = useState("");

  async function loadData() {
    try {
      const stores = await apiGet("/stores");
      const managers = await apiGet("/constructionmanagers");
      const builders = await apiGet("/builders");

      // Build lookup maps
      const storeMap = {};
      stores.forEach(s => (storeMap[s.Id] = s.Name));

      const builderMap = {};
      builders.forEach(b => (builderMap[b.Id] = b.Name));

      // Group managers → store → builder
      const grouped = {};

    managers.forEach(m => {
  const storeName = storeMap[m.StoreId] || "Unknown Store";
  let rawBuilder = builderMap[m.BuilderId] || "Unknown Builder";

  // 🔥 Clean builder name — remove the store portion after ANY dash pattern
  const builderName = rawBuilder.split(/\s*-\s*/)[0].trim();

  if (!grouped[storeName]) grouped[storeName] = {};
  if (!grouped[storeName][builderName]) grouped[storeName][builderName] = [];

  grouped[storeName][builderName].push(m);
});


      setGroupedData(grouped);
    } catch (err) {
      console.error("Construction Manager load error:", err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);
function formatPhone(num) {
  if (!num) return "";

  // Remove all non-digits
  const digits = num.toString().replace(/\D/g, "");

  // Ensure 10 digits
  if (digits.length !== 10) return num;

  const area = digits.slice(0, 3);
  const prefix = digits.slice(3, 6);
  const line = digits.slice(6);

  return `(${area}) ${prefix}-${line}`;
}
function displayBuilderName(builderName, storeName) {
  if (!builderName) return "";
  
  // If builder name already includes the store name, return builderName only
  if (builderName.toLowerCase().includes(storeName.toLowerCase())) {
    return builderName.replace(new RegExp(storeName, "i"), "").replace(/[-–—]\s*$/, "").trim();
  }

  return builderName;
}

  // Search filter
  function filter(list) {
    if (!search.trim()) return list;

    return list.filter(m =>
      (m.FullName || "").toLowerCase().includes(search.toLowerCase())
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Construction Managers</h1>

      <input
        type="text"
        className="search-box"
        placeholder="Search managers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {Object.keys(groupedData).map(storeName => (
        <div key={storeName} className="store-section">
          <h2 className="store-title">{storeName}</h2>

          {Object.keys(groupedData[storeName]).map(builderName => {
            const list = filter(groupedData[storeName][builderName]);
            if (list.length === 0) return null;

            return (
              <div key={builderName} className="builder-section">
<h3 className="builder-title">
  {displayBuilderName(builderName, storeName)}
</h3>

                <table className="cm-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Full Name</th>
                      <th>Phone Number</th>
                    </tr>
                  </thead>

                  <tbody>
                    {list.map(m => (
                      <tr key={m.Id}>
                        <td>{m.Id}</td>
                        <td>{m.FullName || "—"}</td>
<td>{formatPhone(m.PhoneNumber)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
