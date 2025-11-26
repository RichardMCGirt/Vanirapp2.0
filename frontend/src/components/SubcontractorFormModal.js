// src/components/SubcontractorFormModal.js
import React, { useEffect, useState } from "react";
import { apiPost, apiPut } from "../api/api";
import "../pages/Subcontractors.css";

export default function SubcontractorFormModal({ onClose, onSaved, editItem }) {
  const [installername, setInstaller] = useState("");
  const [contractorname, setContractor] = useState("");
  const [contractortitle, setTitle] = useState("");
  const [userid, setUser] = useState("");

  useEffect(() => {
    if (editItem) {
      setInstaller(editItem.installername || "");
      setContractor(editItem.contractorname || "");
      setTitle(editItem.contractortitle || "");
      setUser(editItem.userid || "");
    }
  }, [editItem]);

  async function save() {
    const payload = {
      installername,
      contractorname,
      contractortitle,
      userid
    };

    if (editItem) {
      await apiPut(`/subcontractors/${editItem.id}`, payload);
    } else {
      await apiPost(`/subcontractors`, payload);
    }

    onSaved();
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>{editItem ? "Edit Subcontractor" : "Add Subcontractor"}</h2>

        <label>Installer Name</label>
        <input value={installername} onChange={e => setInstaller(e.target.value)} />

        <label>Contractor Name</label>
        <input value={contractorname} onChange={e => setContractor(e.target.value)} />

        <label>Contractor Title</label>
        <input value={contractortitle} onChange={e => setTitle(e.target.value)} />

        <label>User ID</label>
        <input value={userid} onChange={e => setUser(e.target.value)} />

        <div className="modal-buttons">
          <button onClick={save} className="save-btn">Save</button>
          <button onClick={onClose} className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
}
