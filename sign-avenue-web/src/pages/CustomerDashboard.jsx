// src/pages/CustomerDashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";

const formatInstallLabel = (install_date, install_slot) => {
  if (!install_date) return "Not scheduled";

  const parts = install_date.split("-");
  if (parts.length !== 3) return install_date;

  const [yearStr, monthStr, dayStr] = parts;
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const day = Number(dayStr);

  const d = new Date(year, monthIndex, day);

  const dateLabel = d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  let slotLabel = "";
  if (install_slot === "am") slotLabel = " (AM 8am–12pm)";
  if (install_slot === "pm") slotLabel = " (PM 12pm–4pm)";

  return `${dateLabel}${slotLabel}`;
};

const CustomerDashboard = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!token) {
        setLoadingProjects(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/api/v1/projects", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load projects.");
        }

        setProjects(data || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load projects.");
      } finally {
        setLoadingProjects(false);
      }
    };

    if (user && token) {
      fetchProjects();
    } else {
      setLoadingProjects(false);
    }
  }, [user, token]);

  const handleCancelInstall = async (project) => {
    if (!token) return;

    const confirmed = window.confirm(
      `Cancel installation for "${project.name || `Project #${project.id}`}"?`
    );
    if (!confirmed) return;

    setSavingId(project.id);
    try {
      const res = await fetch(
        `http://localhost:3000/api/v1/projects/${project.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            project: {
              install_date: null,
              install_slot: null,
            },
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || data.errors?.join(", ") || "Cancel failed."
        );
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === data.id ? data : p))
      );
    } catch (err) {
      console.error(err);
      alert(err.message || "Unable to cancel appointment.");
    } finally {
      setSavingId(null);
    }
  };

  if (authLoading || loadingProjects) {
    return (
      <section className="admin-page">
        <div className="admin-page-inner">
          <p>Loading your dashboard...</p>
        </div>
      </section>
    );
  }

  if (!user || !token) {
    return (
      <section className="admin-page">
        <div className="admin-page-inner">
          <h1>My Projects</h1>
          <p>You need to log in to view your projects.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-page-inner">
        <h1 className="admin-title">My Projects</h1>
        <p className="admin-subtitle">
          View your Sign Avenue projects, statuses, and installation dates.
        </p>

        {error && (
          <div className="admin-error" style={{ marginTop: "0.75rem" }}>
            {error}
          </div>
        )}

        <section className="admin-section" style={{ marginTop: "1rem" }}>
          {projects.length === 0 ? (
            <p className="admin-empty-state">
              You don’t have any projects yet.
            </p>
          ) : (
            <ul className="admin-list">
              {projects.map((p) => {
                const hasInstall = Boolean(p.install_date && p.install_slot);

                return (
                  <li key={p.id} className="admin-list-item">
                    <div className="admin-list-item-main">
                      <p className="admin-list-item-title">
                        {p.name || `Project #${p.id}`}
                        {p.status && (
                          <span className="admin-status-badge">
                            {p.status}
                          </span>
                        )}
                      </p>

                      {p.location && (
                        <p className="admin-list-item-subtitle">
                          Location: {p.location}
                        </p>
                      )}

                      <p className="admin-list-item-body">
                        Install:{" "}
                        {formatInstallLabel(
                          p.install_date,
                          p.install_slot
                        )}
                      </p>

                      {p.description && (
                        <p className="admin-list-item-body">
                          {p.description}
                        </p>
                      )}

                      {hasInstall && (
                        <div style={{ marginTop: "0.5rem" }}>
                          <button
                            type="button"
                            className="schedule-calendar-slot-button"
                            onClick={() => handleCancelInstall(p)}
                            disabled={savingId === p.id}
                          >
                            {savingId === p.id
                              ? "Cancelling..."
                              : "Cancel Installation"}
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
};

export default CustomerDashboard;
