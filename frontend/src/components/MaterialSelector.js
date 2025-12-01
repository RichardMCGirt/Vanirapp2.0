import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api/api";

export default function MaterialSelector({ jobId }) {
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [saving, setSaving] = useState(false);

  // Load materials on mount
  useEffect(() => {
    async function loadMaterials() {
      const data = await apiGet("/materials-with-reasons");
      setMaterials(data);
    }
    loadMaterials();
  }, []);

  function handleMaterialChange(e) {
    const matId = Number(e.target.value);
    const material = materials.find(m => m.id === matId);

    setSelectedMaterial(material);
    setSelectedReason("");
    setSelectedColor("");
  }

  async function handleSubmit() {
    if (!selectedMaterial || !selectedReason) {
      alert("Please select both material and reason.");
      return;
    }

    setSaving(true);

    try {
      await apiPost("/save-job-material", {
        jobId,
        materialId: selectedMaterial.id,
        reasonId: Number(selectedReason),
        color: selectedMaterial.hasColor ? selectedColor : null
      });

      alert("Material saved!");
    } catch (err) {
      console.error(err);
      alert("Error saving material");
    }

    setSaving(false);
  }

  return (
    <div className="material-container">
      <h2>Material Selection</h2>

      {/* Material Dropdown */}
      <label>Material</label>
      <select value={selectedMaterial?.id || ""} onChange={handleMaterialChange}>
        <option value="">Select material...</option>
        {materials.map(mat => (
          <option key={mat.id} value={mat.id}>
            {mat.name}
          </option>
        ))}
      </select>

      {/* Reason Dropdown */}
      {selectedMaterial && (
        <>
          <label>Reason</label>
          <select
            value={selectedReason}
            onChange={e => setSelectedReason(e.target.value)}
          >
            <option value="">Select a reason...</option>
            {selectedMaterial.reasons.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </>
      )}

      {/* Color Picker if HasColor = true */}
      {selectedMaterial?.hasColor && (
        <>
          <label>Color</label>
          <input
            type="text"
            placeholder="Enter color (e.g., White, Clay, Brown)"
            value={selectedColor}
            onChange={e => setSelectedColor(e.target.value)}
          />
        </>
      )}

      {/* Submit */}
      <button disabled={saving} onClick={handleSubmit}>
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
