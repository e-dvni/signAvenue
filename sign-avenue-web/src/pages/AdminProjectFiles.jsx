import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AdminLayout from "../components/AdminLayout";

const AdminProjectFiles = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const apiBase = "http://localhost:3000/api/v1";

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/admin/projects/${id}/files`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load files");
      setFiles(data);
    } catch (e) {
      console.error(e);
      alert(e.message || "Unable to load files.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  const handleUpload = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const form = new FormData();
    selected.forEach((f) => form.append("files[]", f));

    setUploading(true);
    try {
      const res = await fetch(`${apiBase}/admin/projects/${id}/files`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setFiles(data);
      e.target.value = "";
    } catch (err) {
      console.error(err);
      alert(err.message || "Unable to upload files.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!confirm("Delete this file?")) return;
    try {
      const res = await fetch(`${apiBase}/admin/projects/${id}/files/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Delete failed");
      }
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error(err);
      alert(err.message || "Unable to delete file.");
    }
  };

  const downloadUrl = (fileId) => `${apiBase}/admin/projects/${id}/files/${fileId}`;

  return (
    <AdminLayout>
      <section className="admin-page">
        <div className="admin-page-inner">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <h1 className="admin-title">Project Files</h1>
              <p style={{ marginTop: 6, opacity: 0.8 }}>
                Upload and manage files for this project.
              </p>
            </div>
            <Link to="/admin/projects" className="btn btn-secondary">
              Back to Projects
            </Link>
          </div>

          <div style={{ marginTop: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
              Upload files
            </label>
            <input type="file" multiple onChange={handleUpload} disabled={uploading} />
            {uploading && <p style={{ marginTop: 8 }}>Uploading...</p>}
          </div>

          <div style={{ marginTop: 18 }}>
            {loading ? (
              <p>Loading files...</p>
            ) : files.length === 0 ? (
              <p>No files uploaded yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                {files.map((f) => (
                  <li key={f.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{f.filename}</div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                          {f.content_type || "file"} • {(f.byte_size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <a
                          href={downloadUrl(f.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                        >
                          Download
                        </a>
                        <button className="btn btn-danger" onClick={() => handleDelete(f.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </AdminLayout>
  );
};

export default AdminProjectFiles;
