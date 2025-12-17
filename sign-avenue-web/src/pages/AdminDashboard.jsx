import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import AdminLayout from "../components/AdminLayout";

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [contactRequests, setContactRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const [reqRes, projRes] = await Promise.all([
          fetch("http://localhost:3000/api/v1/admin/contact_requests", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("http://localhost:3000/api/v1/admin/projects", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const reqData = await reqRes.json();
        const projData = await projRes.json();

        if (!reqRes.ok) {
          throw new Error(reqData.error || "Failed to load contact requests");
        }

        if (!projRes.ok) {
          throw new Error(projData.error || "Failed to load projects");
        }

        setContactRequests(reqData);
        setProjects(projData);
      } catch (err) {
        console.error(err);
        setError("Unable to load admin data.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "admin") {
      fetchAdminData();
    } else {
      setLoading(false);
      setError("You are not authorized to view this page.");
    }
  }, [token, user]);

  if (loading) {
    return (
      <AdminLayout title="Admin Dashboard" subtitle="Overview of your admin activity.">
        <p>Loading admin dashboard...</p>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Admin Dashboard">
        <p className="admin-error">{error}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Overview of contact requests and active projects."
    >
      {/* Top summary cards */}
      <div className="admin-summary-grid">
        <div className="admin-card">
          <p className="admin-card-label">Contact Requests</p>
          <p className="admin-card-value">{contactRequests.length}</p>
          <p className="admin-card-hint">
            New leads from the website contact form.
          </p>
        </div>
        <div className="admin-card">
          <p className="admin-card-label">Projects</p>
          <p className="admin-card-value">{projects.length}</p>
          <p className="admin-card-hint">
            Active or past sign jobs in the system.
          </p>
        </div>
      </div>

      {/* Two-column layout: requests + projects */}
      <div className="admin-grid">
        {/* Contact Requests */}
        <section className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Recent Contact Requests</h2>
          </div>

          {contactRequests.length === 0 ? (
            <p className="admin-empty-state">No contact requests yet.</p>
          ) : (
            <ul className="admin-list">
              {contactRequests.slice(0, 3).map((cr) => (
                <li key={cr.id} className="admin-list-item">
                  <div className="admin-list-item-main">
                    <p className="admin-list-item-title">
                      {cr.name}{" "}
                      {cr.city && (
                        <span className="admin-list-item-tag">{cr.city}</span>
                      )}
                    </p>

                    <p className="admin-list-item-subtitle">
                      {cr.email} {cr.phone && `• ${cr.phone}`}
                    </p>

                    {cr.message && (
                      <p className="admin-list-item-body">{cr.message}</p>
                    )}

                    {/* ✅ Step 3b: show attachment link if present */}
                    {cr.file_url && (
                      <p className="admin-list-item-body">
                        <a
                          href={cr.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-file-link"
                        >
                          📎 View Attachment
                        </a>
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Projects */}
        <section className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Projects</h2>
            <span className="admin-section-badge">{projects.length}</span>
          </div>

          {projects.length === 0 ? (
            <p className="admin-empty-state">No projects yet.</p>
          ) : (
            <ul className="admin-list">
              {projects.slice(0, 5).map((p) => (
                <li key={p.id} className="admin-list-item">
                  <div className="admin-list-item-main">
                    <p className="admin-list-item-title">
                      {p.name}
                      {p.status && (
                        <span className="admin-status-badge">{p.status}</span>
                      )}
                    </p>
                    <p className="admin-list-item-subtitle">
                      {p.user
                        ? `${p.user.name} (${p.user.email})`
                        : "Unassigned"}
                    </p>
                    {p.location && (
                      <p className="admin-list-item-body">
                        Location: {p.location}
                      </p>
                    )}
                    {p.install_date && (
                      <p className="admin-list-item-body">
                        Install date: {p.install_date}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
