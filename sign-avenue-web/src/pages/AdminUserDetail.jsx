import React, { useEffect, useMemo, useState, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AdminLayout from "../components/AdminLayout";
import { statusLabel } from "../utils/projectStatus";

const API_BASE = "http://localhost:3000";

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
};

export default function AdminUserDetail() {
  const { id } = useParams();
  const { token, user: authedUser } = useContext(AuthContext);

  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/api/v1/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load user.");

        if (!mounted) return;
        setUser(data.user || null);
        setProjects(Array.isArray(data.projects) ? data.projects : []);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || "Failed to load user.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (token) load();
    return () => {
      mounted = false;
    };
  }, [id, token]);

  const sortedProjects = useMemo(() => {
    const list = Array.isArray(projects) ? [...projects] : [];
    list.sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));
    return list;
  }, [projects]);

  if (authedUser?.role !== "admin") {
    return (
      <AdminLayout title="User Profile">
        <p style={{ color: "crimson" }}>Admin only.</p>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="User Profile">
        <p>
          <Link to="/admin/users">← Back to Users</Link>
        </p>
        <p>Loading…</p>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="User Profile">
        <p>
          <Link to="/admin/users">← Back to Users</Link>
        </p>
        <p style={{ color: "crimson" }}>{error}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="User Profile" subtitle="User details and project history.">
      <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ marginTop: 0, width: 850 }}>
          <Link to="/admin/users">← Back to Users</Link>
        </p>

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            background: "white",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20 }}>{user?.name || `User #${id}`}</h2>
              <div style={{ marginTop: 6, opacity: 0.85 }}>{user?.email || "—"}</div>
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.75 }}>
                Role: <strong>{user?.role || "customer"}</strong> • Confirmed:{" "}
                <strong>{user?.email_confirmed_at ? "yes" : "no"}</strong>
              </div>
              <div style={{ marginTop: 4, fontSize: 13, opacity: 0.75 }}>
                Created: <strong>{fmtDate(user?.created_at)}</strong>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <Link
                to={`/admin/users/${id}/create-project`}
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "#111827",
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                + Create Project
              </Link>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ margin: 0 }}>Projects</h3>
            <div style={{ fontSize: 13, opacity: 0.75 }}>
              Total: <strong>{sortedProjects.length}</strong>
            </div>
          </div>

          <div style={{ marginTop: 10, border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
            {sortedProjects.length === 0 ? (
              <div style={{ padding: 14, background: "white" }}>No projects for this user yet.</div>
            ) : (
              <div style={{ overflowX: "auto", background: "white" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                      <th style={thStyle}>Project Name</th>
                      <th style={thStyle}>Start Date</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Install Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProjects.map((p) => (
                      <tr key={p.id} style={{ borderTop: "1px solid #eef2f7" }}>
                        <td style={{ padding: 12, fontWeight: 700 }}>{p.name || `Project #${p.id}`}</td>
                        <td style={{ padding: 12 }}>{fmtDate(p.created_at)}</td>
                        <td style={{ padding: 12 }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              borderRadius: 999,
                              border: "1px solid #e5e7eb",
                              fontSize: 12,
                              fontWeight: 700,
                              opacity: 0.85,
                            }}
                          >
                            {p.status ? statusLabel(p.status) : "—"}
                          </span>
                        </td>
                        <td style={{ padding: 12 }}>{p.install_date ? fmtDate(p.install_date) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const thStyle = {
  padding: 12,
  fontSize: 12,
  letterSpacing: 0.3,
  textTransform: "uppercase",
  opacity: 0.7,
};
