import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const CustomerProjectFiles = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const apiBase = "http://localhost:3000/api/v1";

  useEffect(() => {
    const run = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/projects/${id}/files`, {
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
    run();
  }, [token, id]);

  const downloadUrl = (fileId) => `${apiBase}/projects/${id}/files/${fileId}`;

  return (
    <section className="admin-page">
      <div className="admin-page-inner">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <h1 className="admin-title">Project Files</h1>
            <p style={{ marginTop: 6, opacity: 0.8 }}>
              Files shared for this project.
            </p>
          </div>
          <Link to="/dashboard" className="btn btn-secondary">
            Back to My Projects
          </Link>
        </div>

        <div style={{ marginTop: 18 }}>
          {loading ? (
            <p>Loading files...</p>
          ) : files.length === 0 ? (
            <p>No files available yet.</p>
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
                    <a
                      href={downloadUrl(f.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                    >
                      Download
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default CustomerProjectFiles;
