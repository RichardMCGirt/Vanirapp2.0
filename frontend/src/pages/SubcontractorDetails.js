import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet } from "../api/api";
import "./SubcontractorDetails.css";
import Navbar from "../components/Navbar";

export default function SubcontractorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await apiGet(`/subcontractor/${id}`);
        console.log("Subcontractor Details:", response);
        setData(response);
      } catch (err) {
        console.error("Error loading subcontractor:", err);
      }
      setLoading(false);
    }

    load();
  }, [id]);

  if (loading) {
    return <p className="loading">Loading subcontractor details…</p>;
  }

  if (!data) {
    return <p>No subcontractor details found.</p>;
  }

  const fullName = `${data.FirstName || ""} ${data.LastName || ""}`.trim();

  return (
    <>
      <Navbar />

      <div className="sub-details-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ⟵ Back
        </button>

        <h1 className="title">{fullName}</h1>
        <h3 className="subtitle">Store: {data.StoreName || "N/A"}</h3>

        {/* BASIC INFO */}
        <section className="section">
          <h2>Basic Information</h2>
          <p><strong>Email:</strong> {data.EmailAddress || "N/A"}</p>
          <p><strong>Username:</strong> {data.UserName || "N/A"}</p>
        </section>

        {/* INSURANCE INFO */}
        <section className="section">
          <h2>Insurance Information</h2>
          <p><strong>General Liability Expiration:</strong> {data.GeneralLiabilityExpiration || "N/A"}</p>
          <p><strong>Workers Comp Expiration:</strong> {data.WorkersCompExpiration || "N/A"}</p>
          <p><strong>Insurance Provider Email:</strong> {data.ProviderEmail || "N/A"}</p>
          <p><strong>Insurance Verified:</strong> {data.ProviderVerified ? "Yes" : "No"}</p>
        </section>

        {/* CWCC FORMS */}
        <section className="section">
          <h2>CWCC Form</h2>
          <p><strong>Company:</strong> {data.CompanyName || "N/A"}</p>
          <p><strong>Policy Company:</strong> {data.PolicyCompany || "N/A"}</p>
          <p><strong>Contractor Name:</strong> {data.ContractorName || "N/A"}</p>

          {data.SignUrl ? (
            <p>
              <strong>Signed Form:</strong>{" "}
              <a href={data.SignUrl} target="_blank" rel="noopener noreferrer">View File</a>
            </p>
          ) : (
            <p><strong>Signed Form:</strong> Not Uploaded</p>
          )}

          <p><strong>Approved:</strong> {data.CwccApproved ? "Yes" : "No"}</p>
          <p><strong>Notes:</strong> {data.CwccNote || "None"}</p>
        </section>

        {/* FILES */}
        <section className="section">
          <h2>Uploaded Files</h2>

          {(!data.files || data.files.length === 0) && (
            <p>No files uploaded.</p>
          )}

          {data.files?.map((file) => (
            <div key={file.Id} className="file-row">
              <p>
                <strong>{file.FileName}</strong> ({file.Extension})
              </p>

              <a
                href={file.Url}
                target="_blank"
                rel="noopener noreferrer"
                className="view-file-btn"
              >
                View File
              </a>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
