import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";

function App() {
  return (
    <Router>
      <Routes>

        {/* LOGIN PAGE */}
        <Route path="/" element={<Login />} />

        {/* JOB LIST */}
        <Route path="/jobs" element={<Jobs />} />

        {/* JOB DETAILS */}
        <Route path="/job/:id" element={<JobDetails />} />

      </Routes>
    </Router>
  );
}

export default App;
