import React, { useEffect, useState, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const API_BASE = "http://localhost:3000";

export default function AdminUserDetail() {
  const { id } = useParams();
  const { token, user: authedUser } = useContext(AuthContext);

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createInfo, setCreateInfo] = useState("");

  const [form, setForm] = useState({
    name: "",
    status: "draft",
    location: "",
    description: "",
  });

  const [files, setFiles] = useState([]); // File[]

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
        setUser(data.user);
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

  async function handleCreateProject(e) {
    e.preventDefault();
    setCreateError("");
    setCreateInfo("");

    if (!form.name.trim()) {
      setCreateError("Project name is required.");
      return;
    }

    try {
      setCreating(true);

      // ✅ multipart/form-data so we can send files[]
      const fd = new FormData();
      fd.append("project[name]", form.name.trim());
      fd.append("project[status]", form.status);
      if (form.location.trim()) fd.append("project[location]", form.location.trim());
      if (form.description.trim()) fd.append("project[description]", form.description.trim());

      // Attach multiple files as files[]
      files.forEach((f) => fd.append("files[]", f));

      const res = await fetch(`${API_BASE}/api/v1/admin/users/${id}/projects`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // IMPORTANT: Do NOT set Content-Type manually for FormData
        },
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to create project.");

      setCreateInfo(`Project created: ${data?.project?.name || form.name.trim()}`);

      // Reset form + files
      setForm({
        name: "",
        status: "draft",
        location: "",
        description: "",
      });
      setFiles([]);

      // Optional: If you want to immediately go manage files for that project later,
      // you can add a link based on data.project.id. For now we just show the success message.
    } catch (e) {
      setCreateError(e.message || "Failed to create project.");
    } finally {
      setCreating(false);
    }
  }

  function removeSelectedFile(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  if (authedUser?.role !== "admin") {
    return (
      <div style={{ padding: 24 }}>
        <h1>Admin</h1>
        <p style={{ color: "crimson" }}>Admin only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <p><Link to="/admin/users">← Back to Users</Link></p>
        <h1>User</h1>
        <p>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <p><Link to="/admin/users">← Back to Users</Link></p>
        <h1>User</h1>
        <p style={{ color: "crimson" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <p><Link to="/admin/users">← Back to Users</Link></p>

      <h1 style={{ marginTop: 6 }}>{user?.name || `User #${id}`}</h1>
      <div style={{ opacity: 0.85 }}>{user?.email}</div>
      <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
        Role: {user?.role} • Confirmed: {user?.email_confirmed_at ? "yes" : "no"}
      </div>

      <hr style={{ margin: "18px 0" }} />

      <h2>Create Project for this user</h2>

      {createError && <p style={{ color: "crimson" }}>{createError}</p>}
      {createInfo && <p style={{ color: "green" }}>{createInfo}</p>}

      <form onSubmit={handleCreateProject} style={{ display: "grid", gap: 10, maxWidth: 560 }}>
        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="Project name"
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
        />

        <select
          value={form.status}
          onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
        >
          <option value="draft">Draft</option>
          <option value="in_progress">In progress</option>
          <option value="ready_for_install">Ready for install</option>
          <option value="completed">Completed</option>
        </select>

        <input
          value={form.location}
          onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
          placeholder="Location (optional)"
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
        />

        <textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Description / notes (optional)"
          rows={4}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
        />

        {/* ✅ Files picker for NEW project */}
        <div style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Attach files to this new project</div>
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />

          {files.length > 0 && (
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {files.map((f, idx) => (
                <div
                  key={`${f.name}-${idx}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                    border: "1px solid #eee",
                    borderRadius: 10,
                    padding: 10,
                  }}
                >
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      {(f.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSelectedFile(idx)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 10,
                      border: "1px solid #b91c1c",
                      background: "#b91c1c",
                      color: "white",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
            Tip: You can attach multiple files (proofs, drawings, photos, invoices).
          </div>
        </div>

        <button
          type="submit"
          disabled={creating}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #222",
            background: "#222",
            color: "white",
            cursor: creating ? "not-allowed" : "pointer",
          }}
        >
          {creating ? "Creating..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}
