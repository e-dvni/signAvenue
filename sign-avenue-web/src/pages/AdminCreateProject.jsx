import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { useAuth } from "../hooks/useAuth";
import { PROJECT_STATUSES, statusLabel } from "../utils/projectStatus";

const API_BASE = "http://localhost:3000/api/v1";

export default function AdminCreateProject() {
  const { id } = useParams(); // user id
  const navigate = useNavigate();
  const { user: authedUser, token } = useAuth();

  const [loadingUser, setLoadingUser] = useState(true);
  const [targetUser, setTargetUser] = useState(null);
  const [error, setError] = useState("");

  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState("");
  const [saveError, setSaveError] = useState("");

  const [form, setForm] = useState({
    name: "",
    status: "draft",
    location: "",
    description: "",
  });

  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        setLoadingUser(true);
        setError("");

        const res = await fetch(`${API_BASE}/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load user.");

        if (!mounted) return;
        setTargetUser(data.user || null);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || "Failed to load user.");
      } finally {
        if (mounted) setLoadingUser(false);
      }
    }

    if (token) loadUser();
    return () => (mounted = false);
  }, [id, token]);

  const canSubmit = useMemo(() => {
    return form.name.trim().length > 0 && !saving;
  }, [form.name, saving]);

  const addFiles = (incoming) => {
    const list = Array.from(incoming || []);
    if (!list.length) return;

    setFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}|${f.size}|${f.lastModified}`));
      const next = [...prev];
      list.forEach((f) => {
        const key = `${f.name}|${f.size}|${f.lastModified}`;
        if (!seen.has(key)) next.push(f);
      });
      return next;
    });
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const openPicker = () => {
    fileInputRef.current?.click();
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setSaveError("");
    setInfo("");

    if (!form.name.trim()) {
      setSaveError("Project name is required.");
      return;
    }

    try {
      setSaving(true);

      // 1) Create the project for this user
      const createRes = await fetch(`${API_BASE}/admin/users/${id}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project: {
            name: form.name.trim(),
            status: form.status,
            location: form.location.trim() || null,
            description: form.description.trim() || null,
          },
        }),
      });

      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok) throw new Error(createData?.error || "Failed to create project.");

      const projectId = createData?.project?.id;
      if (!projectId) throw new Error("Project created, but missing project id in response.");

      // 2) Upload files (optional)
      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append("files[]", f));

        const uploadRes = await fetch(`${API_BASE}/admin/projects/${projectId}/files`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });

        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) throw new Error(uploadData?.error || "Project created, but file upload failed.");
      }

      setInfo("Project created successfully.");
      navigate(`/admin/users/${id}`);
    } catch (err) {
      setSaveError(err.message || "Failed to create project.");
    } finally {
      setSaving(false);
    }
  }

  if (authedUser?.role !== "admin") {
    return (
      <AdminLayout title="Create Project">
        <p style={{ color: "crimson" }}>Admin only.</p>
      </AdminLayout>
    );
  }

  if (loadingUser) {
    return (
      <AdminLayout title="Create Project" subtitle="Loading user…">
        <p>Loading…</p>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Create Project">
        <p style={{ color: "crimson" }}>{error}</p>
        <p style={{ marginTop: 12 }}>
          <Link to="/admin/users" className="btn btn-secondary">Back to Users</Link>
        </p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Create Project"
      subtitle={`Creating a new project for ${targetUser?.name || `User #${id}`}`}
    >
      <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div style={{ opacity: 0.85 }}>
            <div style={{ fontWeight: 700 }}>{targetUser?.name}</div>
            <div style={{ fontSize: 13 }}>{targetUser?.email}</div>
          </div>
          <Link to={`/admin/users/${id}`} className="btn btn-secondary">
            ← Back to Profile
          </Link>
        </div>

        <hr style={{ margin: "18px 0" }} />

        {saveError && <p style={{ color: "crimson", marginBottom: 12 }}>{saveError}</p>}
        {info && <p style={{ color: "green", marginBottom: 12 }}>{info}</p>}

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.15fr 0.85fr",
              gap: 16,
              alignItems: "start",
            }}
          >
            {/* LEFT: Drag/drop upload */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              style={{
                border: dragOver ? "2px solid #111" : "1px dashed #cbd5e1",
                borderRadius: 16,
                padding: 18,
                background: dragOver ? "#f8fafc" : "white",
                minHeight: 360,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                  <h2 style={{ margin: 0 }}>Files</h2>
                  <p style={{ marginTop: 6, opacity: 0.75 }}>
                    Drag and drop files here, or browse. You can upload multiple files.
                  </p>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={openPicker}
                    className="btn btn-secondary"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Browse…
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                {files.length === 0 ? (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 14,
                      borderRadius: 12,
                      background: "#f8fafc",
                      opacity: 0.85,
                    }}
                  >
                    No files added yet.
                  </div>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                    {files.map((f, idx) => (
                      <li
                        key={`${f.name}-${f.size}-${f.lastModified}`}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 12,
                          padding: 12,
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "center",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {f.name}
                          </div>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>
                            {(f.size / 1024).toFixed(1)} KB
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="btn btn-danger"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* RIGHT: Project details */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: 18,
                background: "white",
              }}
            >
              <h2 style={{ margin: 0 }}>Project Details</h2>
              <p style={{ marginTop: 6, opacity: 0.75 }}>
                Required: name. Description is optional.
              </p>

              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                <label style={{ fontWeight: 600 }}>
                  Project Name *
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Front Lobby Letters"
                    style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc", marginTop: 6 }}
                  />
                </label>

                <label style={{ fontWeight: 600 }}>
                  Status
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc", marginTop: 6 }}
                  >
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ fontWeight: 600 }}>
                  Location
                  <input
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="optional"
                    style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc", marginTop: 6 }}
                  />
                </label>

                <label style={{ fontWeight: 600 }}>
                  Description / Notes
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="optional"
                    rows={5}
                    style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc", marginTop: 6 }}
                  />
                </label>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  style={{
                    marginTop: 6,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #111",
                    background: "#111",
                    color: "white",
                    cursor: !canSubmit ? "not-allowed" : "pointer",
                    opacity: !canSubmit ? 0.7 : 1,
                  }}
                >
                  {saving ? "Creating..." : "Create Project"}
                </button>

                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  Files will be uploaded after the project is created.
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
