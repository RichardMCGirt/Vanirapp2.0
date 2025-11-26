import React, { useEffect, useState } from "react";
import { apiGet } from "../api/api";
import "./Communities.css";

export default function Communities() {
  const [stores, setStores] = useState({});
  const [search, setSearch] = useState("");

  async function loadData() {
    try {
      const storesRes = await apiGet("/stores");
      const communitiesRes = await apiGet("/communities");

      // Build store lookup
      const storeMap = {};
      storesRes.forEach(s => {
        storeMap[s.Id] = s.Name;
      });

      // Group by store
      const grouped = {};
      communitiesRes.forEach(c => {
const storeName = storeMap[c.StoreId] || "Unknown Store";

        if (!grouped[storeName]) grouped[storeName] = [];
        grouped[storeName].push(c);
      });

      setStores(grouped);
    } catch (err) {
      console.error("Communities load error:", err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Search filter
  function filterList(list) {
    if (!search.trim()) return list;
    return list.filter(c =>
      c.Name.toLowerCase().includes(search.toLowerCase())
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Communities</h1>

      <input
        type="text"
        className="search-box"
        placeholder="Search communities..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {Object.keys(stores).map((storeName) => {
        const list = filterList(stores[storeName]);

        if (list.length === 0) return null;

        return (
          <div key={storeName} className="store-section">
            <h2 className="store-title">{storeName}</h2>

            <table className="community-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Community</th>
                  <th>Labor Reduction</th>
                </tr>
              </thead>

              <tbody>
                {list.map((c) => (
                  <tr key={c.Id}>
                    <td>{c.Id}</td>
                    <td>{c.Name}</td>
                    <td style={{ color: "#004aad", fontWeight: "bold" }}>
                      {c.LaborReduction ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
