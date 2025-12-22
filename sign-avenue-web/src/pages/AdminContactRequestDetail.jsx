import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AdminLayout from "../components/AdminLayout";

const API_BASE = "http://localhost:3000/api/v1";

const AdminContactRequestDetail = () => {
  const { id } = useParams();
  const { user, token } = useAuth();

  const [cr, setCr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/admin/contact_requests/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load contact request.");

        setCr(data);
      } catch (e) {
        setError(e.message || "Failed to load contact request.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "admin") load();
    else {
      setLoading(false);
      setError("You are not authorized to view this page.");
    }
  }, [id, token, user]);

  return (
    <AdminLayout title="Contact Request" subtitle="Full message details">
      <p style={{ marginBottom: 12 }}>
        <Link to="/admin/contact-requests">← Back to Contact Requests</Link>
      </p>

      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className="admin-error">{error}</p>
      ) : !cr ? (
        <p>Not found.</p>
      ) : (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, maxWidth: 900 }}>
          <h2 style={{ marginTop: 0 }}>{cr.name || "Unknown"}</h2>

          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            <div><strong>Email:</strong> {cr.email || "—"}</div>
            <div><strong>Phone:</strong> {cr.phone || "—"}</div>
            <div><strong>City:</strong> {cr.city || "—"}</div>
            <div><strong>Business:</strong> {cr.business_name || "—"}</div>
            <div><strong>Received:</strong> {cr.created_at ? new Date(cr.created_at).toLocaleString() : "—"}</div>
            <div><strong>Status:</strong> {cr.status || "—"}</div>
          </div>

          <hr style={{ margin: "16px 0" }} />

          <h3 style={{ marginTop: 0 }}>Message</h3>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
            {cr.message || "—"}
          </div>

          {cr.file_url && (
            <>
              <hr style={{ margin: "16px 0" }} />
              <h3 style={{ marginTop: 0 }}>Attachment</h3>
              <a href={cr.file_url} target="_blank" rel="noreferrer">
                📎 Download attachment
              </a>
            </>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminContactRequestDetail;
