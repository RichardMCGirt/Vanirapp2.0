// src/pages/Materials.js
import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api/api";
import "./MaterialSelector.css"; // CSS import
import Navbar from "../components/Navbar";

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [saving, setSaving] = useState(false);

  // Load all materials with reasons
  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet("/materials-with-reasons");
        console.log("Loaded materials:", data);
        setMaterials(data);
      } catch (err) {
        console.error("Error loading materials:", err);
      }
    }
    load();
  }, []);

  function handleMaterialChange(e) {
    const id = Number(e.target.value);
    const material = materials.find((m) => m.id === id);

    setSelectedMaterial(material);
    setSelectedReason("");
    setSelectedColor("");
  }

  async function saveMaterial() {
    if (!selectedMaterial) {
      alert("Please select a material.");
      return;
    }
    if (!selectedReason) {
      alert("Please select a reason.");
      return;
    }

    const payload = {
      materialId: selectedMaterial.id,
      reasonId: Number(selectedReason),
      color: selectedMaterial.hasColor ? selectedColor : null,
    };

    setSaving(true);

    try {
      const res = await apiPost("/materials/save-selection", payload);
      console.log("Saved:", res);

      alert("Material saved!");
    } catch (err) {
      alert("Error saving material");
      console.error(err);
    }

    setSaving(false);
  }

  return (
    <>
      <Navbar />

      <div className="material-container">
        <h1>Materials</h1>
        <p>Select a material, reason, and optional color.</p>

        {/* MATERIAL SELECT */}
        <label>Material</label>
        <select
          value={selectedMaterial?.id || ""}
          onChange={handleMaterialChange}
        >
          <option value="">Select material...</option>
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        {/* REASONS SELECT */}
        {selectedMaterial && (
          <>
            <label>Reason</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
            >
              <option value="">Select a reason...</option>

              {selectedMaterial.reasons.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </>
        )}

        {/* COLOR INPUT IF MATERIAL HAS COLOR */}
        {selectedMaterial?.hasColor && (
          <>
            <label>Color</label>
            <input
              type="text"
              placeholder="Enter color (White, Clay, Brown...)"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
            />
          </>
        )}

        {/* SAVE BUTTON */}
        <button onClick={saveMaterial} disabled={saving}>
          {saving ? "Saving..." : "Save Material"}
        </button>
      </div>
    </>
  );
}
