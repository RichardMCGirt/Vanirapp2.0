import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import EditJob from "./pages/EditJob";

function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <Router>
      <Routes>

        {/* LOGIN PAGE */}
        <Route path="/" element={<Login />} />

        {/* PROTECTED ROUTES */}
        <Route
          path="/jobs"
          element={
            <RequireAuth>
              <Jobs />
            </RequireAuth>
          }
        />

        <Route
          path="/job/:id"
          element={
            <RequireAuth>
              <JobDetails />
            </RequireAuth>
          }
        />

        {/* EDIT JOB PAGE */}
        <Route
          path="/job/edit/:id"
          element={
            <RequireAuth>
              <EditJob />
            </RequireAuth>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
