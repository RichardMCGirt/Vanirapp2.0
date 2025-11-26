// src/pages/Subcontractors.js
import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../api/api";
import SubcontractorFormModal from "../components/SubcontractorFormModal";
import "./Subcontractors.css";

export default function Subcontractors() {
  const [list, setList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [activeSub, setActiveSub] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await apiGet("/subcontractors");
    setList(res);
    setFiltered(res);
    setLoading(false);
  }

  // Search
  useEffect(() => {
    const s = list.filter((r) => {
      return (
        (r.installername || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.contractorname || "").toLowerCase().includes(search.toLowerCase())
      );
    });
    setFiltered(s);
  }, [search, list]);

  function openEdit(item) {
    setEditItem(item);
    setModalOpen(true);
  }

  async function deleteItem(id) {
    if (!window.confirm("Delete this subcontractor?")) return;
    await apiDelete(`/subcontractors/${id}`);
    load();
  }

  async function restore(id) {
    await apiPost(`/subcontractors/restore/${id}`);
    load();
  }

  return (
    <div className="sub-page">

      <h1 className="page-title">Subcontractors</h1>

      <div className="top-bar">
        <input
          className="search-input"
          placeholder="Search subcontractors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className="add-btn"
          onClick={() => {
            setEditItem(null);
            setModalOpen(true);
          }}
        >
          + Add Subcontractor
        </button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="sub-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Installer</th>
              <th>Contractor</th>
              <th>Title</th>
              <th>UserId</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} onClick={() => setActiveSub(r)}>
                <td>{r.id}</td>
                <td>{r.installername}</td>
                <td>{r.contractorname}</td>
                <td>{r.contractortitle}</td>
                <td>{r.userid}</td>
                <td style={{ color: r.isdeleted ? "red" : "green" }}>
                  {r.isdeleted ? "Deleted" : "Active"}
                </td>

                <td>
                  <button
                    className="small-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(r);
                    }}
                  >
                    Edit
                  </button>

                  {!r.isdeleted ? (
                    <button
                      className="small-btn delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(r.id);
                      }}
                    >
                      Delete
                    </button>
                  ) : (
                    <button
                      className="small-btn restore"
                      onClick={(e) => {
                        e.stopPropagation();
                        restore(r.id);
                      }}
                    >
                      Restore
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Detail Panel */}
      {activeSub && (
        <div className="details-panel">
          <button className="close-btn" onClick={() => setActiveSub(null)}>
            ✖
          </button>

          <h2>Details</h2>

          <p><strong>ID:</strong> {activeSub.id}</p>
          <p><strong>Installer:</strong> {activeSub.installername}</p>
          <p><strong>Contractor:</strong> {activeSub.contractorname}</p>
          <p><strong>Title:</strong> {activeSub.contractortitle}</p>
          <p><strong>User ID:</strong> {activeSub.userid}</p>

          <p><strong>Created:</strong> {activeSub.creationtime}</p>
          <p><strong>Modified:</strong> {activeSub.lastmodificationtime || "—"}</p>
          <p><strong>Deleted:</strong> {activeSub.isdeleted ? "Yes" : "No"}</p>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <SubcontractorFormModal
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
          editItem={editItem}
        />
      )}
    </div>
  );
}
