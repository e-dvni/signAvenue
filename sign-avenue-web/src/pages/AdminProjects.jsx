import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import AdminLayout from "../components/AdminLayout";

// Safely format "YYYY-MM-DD" + slot into a nice label
const formatInstallLabel = (install_date, install_slot) => {
  if (!install_date) return "Not scheduled";

  const parts = install_date.split("-");
  if (parts.length !== 3) return install_date; // fallback

  const [yearStr, monthStr, dayStr] = parts;
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1; // 0-based
  const day = Number(dayStr);

  const d = new Date(year, monthIndex, day);

  const dateLabel = d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  let slotLabel = "";
  if (install_slot === "am") {
    slotLabel = " (AM 8am–12pm)";
  } else if (install_slot === "pm") {
    slotLabel = " (PM 12pm–4pm)";
  }

  return `${dateLabel}${slotLabel}`;
};

// You can tweak these to match your real statuses
const STATUS_OPTIONS = [
  "draft",
  "in_production",
  "ready_for_install",
  "completed",
  "canceled",
];

const AdminProjects = () => {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/api/v1/admin/projects", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load projects");
        }

        setProjects(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load projects.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "admin") {
      fetchProjects();
    } else {
      setLoading(false);
      setError("You are not authorized to view this page.");
    }
  }, [token, user]);

  const handleStatusChange = (projectId, newStatus) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              status: newStatus,
              // can_schedule is controlled on the backend, but
              // if you want the UI to reflect it immediately:
              can_schedule: newStatus === "ready_for_install",
            }
          : p
      )
    );
  };

  const handleSaveProject = async (project) => {
    if (!token) return;

    setSavingId(project.id);
    try {
      const res = await fetch(
        `http://localhost:3000/api/v1/admin/projects/${project.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            project: {
              status: project.status,
              install_date: project.install_date,
              install_slot: project.install_slot,
              location: project.location,
              description: project.description,
              user_id: project.user?.id,
            },
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.errors?.join(", ") || data.error || "Update failed");
      }

      // Replace with fresh data from server (so date/slot stay in sync)
      setProjects((prev) =>
        prev.map((p) => (p.id === data.id ? data : p))
      );
    } catch (err) {
      console.error(err);
      alert(err.message || "Unable to update project.");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Projects" subtitle="All sign projects in the system.">
        <p>Loading projects...</p>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Projects">
        <p className="admin-error">{error}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Projects"
      subtitle="All customer sign projects managed by Sign Avenue."
    >
      <section className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">All Projects</h2>
          <span className="admin-section-badge">{projects.length}</span>
        </div>

        {projects.length === 0 ? (
          <p className="admin-empty-state">No projects yet.</p>
        ) : (
          <ul className="admin-list">
            {projects.map((p) => (
              <li key={p.id} className="admin-list-item">
                <div className="admin-list-item-main">
                  {/* Title + status */}
                  <p className="admin-list-item-title">
                    {p.name || `Project #${p.id}`}
                    {p.status && (
                      <span className="admin-status-badge">
                        {p.status}
                      </span>
                    )}
                  </p>

                  {/* Customer */}
                  <p className="admin-list-item-subtitle">
                    {p.user
                      ? `${p.user.name} (${p.user.email})`
                      : "Unassigned"}
                  </p>

                  {/* Location */}
                  {p.location && (
                    <p className="admin-list-item-body">
                      Location: {p.location}
                    </p>
                  )}

                  {/* Install date + slot (fixed & combined) */}
                  <p className="admin-list-item-body">
                    Install: {formatInstallLabel(p.install_date, p.install_slot)}
                  </p>

                  {/* Description */}
                  {p.description && (
                    <p className="admin-list-item-body">
                      {p.description}
                    </p>
                  )}

                  {/* Inline status editor */}
                  <div
                    style={{
                      marginTop: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.85rem",
                        display: "inline-flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                      }}
                    >
                      Status
                      <select
                        value={p.status || ""}
                        onChange={(e) =>
                          handleStatusChange(p.id, e.target.value)
                        }
                        style={{
                          fontSize: "0.85rem",
                          padding: "0.25rem 0.4rem",
                          borderRadius: "0.35rem",
                          border: "1px solid #d1d5db",
                        }}
                      >
                        <option value="">(none)</option>
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleSaveProject(p)}
                      disabled={savingId === p.id}
                      style={{
                        fontSize: "0.8rem",
                        padding: "0.35rem 0.7rem",
                        borderRadius: "999px",
                        border: "1px solid #d1d5db",
                        backgroundColor: "#ffffff",
                        cursor: savingId === p.id ? "default" : "pointer",
                      }}
                    >
                      {savingId === p.id ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminLayout>
  );
};

export default AdminProjects;
