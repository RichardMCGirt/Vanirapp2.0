import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import EditJob from "./pages/EditJob";
import TechInstallerDashboard from "./pages/TechInstallerDashboard";
import Subcontractors from "./pages/Subcontractors";
import Communities from "./pages/Communities";
import ConstructionManagers from "./pages/ConstructionManagers";
import Materials from "./pages/materials";
import SubcontractorDetails from "./pages/SubcontractorDetails";

function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <Router>
      <Routes>

        {/* PUBLIC LOGIN */}
        <Route path="/" element={<Login />} />

        {/* PROTECTED ROUTES */}
        <Route
          path="/dashboard/workloads"
          element={
            <RequireAuth>
              <TechInstallerDashboard />
            </RequireAuth>
          }
        />
<Route path="/constructionmanagers" element={<ConstructionManagers />} />

        <Route
          path="/jobs"
          element={
            <RequireAuth>
              <Jobs />
            </RequireAuth>
          }
        />
<Route path="/subcontractor/:id" element={<SubcontractorDetails />} />

        {/* ⚠ MUST COME BEFORE /job/:id */}
        <Route
          path="/job/edit/:id"
          element={
            <RequireAuth>
              <EditJob />
            </RequireAuth>
          }
        />
<Route
  path="/subcontractors"
  element={
    <RequireAuth>
      <Subcontractors />
    </RequireAuth>
  }
/>
<Route
  path="/communities"
  element={
    <RequireAuth>
      <Communities />
    </RequireAuth>
  }
/>
<Route
  path="/materials"
  element={
    <RequireAuth>
      <Materials />
    </RequireAuth>
  }
/>

        {/* MUST BE LAST - WILDCARD ROUTE */}
        <Route
          path="/job/:id"
          element={
            <RequireAuth>
              <JobDetails />
            </RequireAuth>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
