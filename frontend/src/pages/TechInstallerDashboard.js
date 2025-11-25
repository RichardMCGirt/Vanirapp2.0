import React, { useEffect, useState } from "react";
import { apiGet } from "../api/api";
import { Bar } from "react-chartjs-2";
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
  const [techs, setTechs] = useState([]);
  const [installers, setInstallers] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await apiGet("/dashboard/workloads");
    console.log("📊 Dashboard Data:", data);

    setTechs((data.techs || []).sort((a, b) => a.job_count - b.job_count));
    setInstallers((data.installers || []).sort((a, b) => a.job_count - b.job_count));
  };

  const techChart = {
    labels: techs.map(t => t.name),
    datasets: [
      {
        label: "Open Jobs",
        data: techs.map(t => Number(t.job_count)),
        backgroundColor: "rgba(54, 162, 235, 0.6)"
      }
    ]
  };

  const installerChart = {
    labels: installers.map(i => i.name),
    datasets: [
      {
        label: "Jobs Assigned",
        data: installers.map(i => Number(i.job_count)),
        backgroundColor: "rgba(255, 99, 132, 0.6)"
      }
    ]
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Tech & Installer Workload Dashboard</h1>

      <div style={{ marginTop: "40px" }}>
        <h2>Open Jobs per Field Tech</h2>
        <Bar data={techChart} />
      </div>

      <div style={{ marginTop: "60px" }}>
        <h2>Total Jobs per Installer</h2>
        <Bar data={installerChart} />
      </div>
    </div>
  );
}
