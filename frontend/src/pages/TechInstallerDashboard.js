import React, { useEffect, useState } from "react";
import { apiGet } from "../api/api";
import { Bar } from "react-chartjs-2";
import Navbar from "../components/Navbar";

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function TechInstallerDashboard() {
  const [stores, setStores] = useState({});
  const [activeStore, setActiveStore] = useState("");
  const [activeTab, setActiveTab] = useState("techs");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await apiGet("/dashboard/workloads");
    setStores(data);

    const firstStore = Object.keys(data)[0];
    if (firstStore) setActiveStore(firstStore);
  };

  if (!activeStore) {
    return <div style={{ padding: 20 }}>Loading dashboard...</div>;
  }

  const current = stores[activeStore];
  console.log("ACTIVE STORE:", activeStore, current);

  const buildChart = (list, label, color) => {
    const safeList = Array.isArray(list) ? list : [];
    const sorted = [...safeList].sort((a, b) => b.count - a.count);

    return {
      labels: sorted.map((x) => x.name || "Unknown"),
      datasets: [
        {
          label,
          data: sorted.map((x) => x.count || 0),
          backgroundColor: color
        }
      ]
    };
  };

  return (
    <>
      <Navbar />

      <div style={{ padding: "20px" }}>
        <h1>Tech & Installer Workload Dashboard</h1>

        {/* STORE TABS */}
        <div
          className="store-tabs"
          style={{ display: "flex", gap: 10, marginTop: 20 }}
        >
          {Object.keys(stores)
            .sort((a, b) => a.localeCompare(b))
            .map((store) => (
              <button
                key={store}
                onClick={() => setActiveStore(store)}
                className="tab-btn"
                style={{
                  padding: "10px 20px",
                  background: activeStore === store ? "#004aad" : "#ddd",
                  border: "none",
                  borderRadius: 6,
                  color: activeStore === store ? "white" : "black",
                  cursor: "pointer"
                }}
              >
                {store}
              </button>
            ))}
        </div>

        {/* INNER TABS */}
        <div style={{ marginTop: 30 }}>
          <button
            onClick={() => setActiveTab("techs")}
            style={{
              padding: "8px 18px",
              background: activeTab === "techs" ? "#0088ff" : "#ccc",
              border: "none",
              borderRadius: 6,
              marginRight: 10,
              cursor: "pointer",
              color: "white"
            }}
          >
            Field Techs
          </button>

          <button
            onClick={() => setActiveTab("installers")}
            style={{
              padding: "8px 18px",
              background: activeTab === "installers" ? "#e63946" : "#ccc",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              color: "white"
            }}
          >
            Installers
          </button>
        </div>

        {/* CHART */}
        <div style={{ marginTop: 40 }}>
          {activeTab === "techs" && (
            <>
              <h2>Open Jobs per Field Tech</h2>
              <Bar
                data={buildChart(
                  current.techs,
                  "Open Jobs",
                  "rgba(54, 162, 235, 0.6)"
                )}
              />
            </>
          )}

          {activeTab === "installers" && (
            <>
              <h2>Jobs Assigned per Installer</h2>
              <Bar
                data={buildChart(
                  current.installers,
                  "Installer Jobs",
                  "rgba(255, 99, 132, 0.6)"
                )}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
