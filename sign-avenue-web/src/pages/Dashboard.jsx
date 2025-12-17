// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Helper: parse a DATE-only string "YYYY-MM-DD" as a local Date
const parseLocalDateFromISO = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const Dashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [contactRequests, setContactRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelingProjectId, setCancelingProjectId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Load customer projects
        const projRes = await fetch("http://localhost:3000/api/v1/projects", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const projData = await projRes.json();
        if (!projRes.ok) {
          throw new Error(projData.error || "Failed to load projects");
        }

        setProjects(projData || []);

        // Load customer's contact/inquiry records
        const contactRes = await fetch(
          "http://localhost:3000/api/v1/contact_requests",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (contactRes.ok) {
          const contactData = await contactRes.json();
          setContactRequests(contactData || []);
        } else {
          setContactRequests([]);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load your dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const upcomingInstallations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return projects
      .map((p) => {
        const d = parseLocalDateFromISO(p.install_date);
        return d
          ? {
              ...p,
              installDateObj: d,
            }
          : null;
      })
      .filter((p) => p && p.installDateObj >= today)
      .sort((a, b) => a.installDateObj - b.installDateObj);
  }, [projects]);

  const nextInstallation = upcomingInstallations[0] || null;

  const handleOpenScheduleForProject = (projectId) => {
    navigate("/schedule", {
      state: { projectId },
    });
  };

  const handleCancelInstall = async (project) => {
    if (!token) return;
    const confirmed = window.confirm(
      "Are you sure you want to cancel this installation appointment?"
    );
    if (!confirmed) return;

    setError(null);
    setCancelingProjectId(project.id);

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
        throw new Error(data.error || "Failed to cancel appointment.");
      }

      // Update local projects
      setProjects((prev) =>
        prev.map((p) => (p.id === data.id ? data : p))
      );
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          "Unable to cancel this appointment. Please try again."
      );
    } finally {
      setCancelingProjectId(null);
    }
  };

  if (!user) {
    return (
      <section className="admin-page">
        <div className="admin-page-inner">
          <h1>Customer Dashboard</h1>
          <p>You need to be logged in to view your dashboard.</p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="admin-page">
        <div className="admin-page-inner">
          <p>Loading your dashboard...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-layout">
        {/* No sidebar for customer yet, re-use admin main card styling */}
        <div className="admin-main" style={{ gridColumn: "1 / -1" }}>
          <div className="admin-header">
            <div>
              <h1 className="admin-title">Welcome, {user.name}</h1>
              <p className="admin-subtitle">
                View your projects, installation schedule, and contact history.
              </p>
            </div>
          </div>

          <div className="admin-content">
            {error && <div className="admin-error">{error}</div>}

            {/* Summary cards */}
            <div className="admin-summary-grid">
              <div className="admin-card">
                <div className="admin-card-label">Active Projects</div>
                <div className="admin-card-value">{projects.length}</div>
                <div className="admin-card-hint">
                  These are sign projects associated with your account.
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card-label">Next Installation</div>
                {nextInstallation ? (
                  <>
                    <div className="admin-card-value">
                      {nextInstallation.installDateObj.toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </div>
                    <div className="admin-card-hint">
                      Time:{" "}
                      {nextInstallation.install_slot
                        ? nextInstallation.install_slot.toUpperCase()
                        : "TBD"}
                      <br />
                      {nextInstallation.name ||
                        `Project #${nextInstallation.id}`}{" "}
                      – {nextInstallation.location}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="admin-card-value">None</div>
                    <div className="admin-card-hint">
                      Once an installation is scheduled, it will appear here.
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Projects list */}
            <section className="admin-section">
              <div className="admin-section-header">
                <h2 className="admin-section-title">Your Projects</h2>
                <span className="admin-section-badge">
                  {projects.length}
                </span>
              </div>

              {projects.length === 0 ? (
                <p className="admin-empty-state">
                  You don&apos;t have any projects yet. Once we create a
                  project for your sign, you&apos;ll see it here.
                </p>
              ) : (
                <ul className="admin-list">
                  {projects.map((p) => {
                    const hasBooking = !!(p.install_date && p.install_slot);
                    const canSchedule = p.can_schedule;

                    const installDateObj = parseLocalDateFromISO(
                      p.install_date
                    );
                    const bookingDateLabel =
                      hasBooking && installDateObj
                        ? installDateObj.toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : null;

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

                          {hasBooking && bookingDateLabel ? (
                            <p className="admin-list-item-body">
                              Install scheduled:{" "}
                              <strong>
                                {bookingDateLabel} (
                                {p.install_slot.toUpperCase()})
                              </strong>
                            </p>
                          ) : canSchedule ? (
                            <p className="admin-list-item-body">
                              Ready to schedule installation. Choose a date and
                              time within the next 30 days.
                            </p>
                          ) : (
                            <p className="admin-list-item-body">
                              We&apos;re still working on this project. Once
                              it&apos;s marked{" "}
                              <strong>ready_for_install</strong>, you&apos;ll
                              be able to schedule your installation.
                            </p>
                          )}
                        </div>

                        <div
                          style={{
                            marginTop: "0.5rem",
                            display: "flex",
                            flexDirection: "row",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                          }}
                        >
                          {/* View project details */}
                          <Link
                            to={`/projects/${p.id}`}
                            className="admin-sidebar-link"
                          >
                            View details
                          </Link>

                          {/* Scheduling controls */}
                          {canSchedule && !hasBooking && (
                            <button
                              type="button"
                              style={{
                                borderRadius: "0.5rem",
                                border: "1px solid #111827",
                                padding: "0.3rem 0.8rem",
                                backgroundColor: "#ffffff",
                                fontSize: "0.8rem",
                                cursor: "pointer",
                              }}
                              onClick={() =>
                                handleOpenScheduleForProject(p.id)
                              }
                            >
                              Schedule installation
                            </button>
                          )}

                          {canSchedule && hasBooking && (
                            <>
                              <button
                                type="button"
                                style={{
                                  borderRadius: "0.5rem",
                                  border: "1px solid #b91c1c",
                                  padding: "0.3rem 0.8rem",
                                  backgroundColor: "#ffffff",
                                  fontSize: "0.8rem",
                                  color: "#b91c1c",
                                  cursor:
                                    cancelingProjectId === p.id
                                      ? "wait"
                                      : "pointer",
                                }}
                                disabled={cancelingProjectId === p.id}
                                onClick={() => handleCancelInstall(p)}
                              >
                                {cancelingProjectId === p.id
                                  ? "Canceling..."
                                  : "Cancel appointment"}
                              </button>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#6b7280",
                                  alignSelf: "center",
                                }}
                              >
                                To reschedule, cancel first, then book a new
                                date from the Schedule page.
                              </span>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Contact history */}
            <section className="admin-section">
              <div className="admin-section-header">
                <h2 className="admin-section-title">Contact Requests</h2>
                <span className="admin-section-badge">
                  {contactRequests.length}
                </span>
              </div>

              {contactRequests.length === 0 ? (
                <p className="admin-empty-state">
                  You haven&apos;t submitted any contact or quote forms yet.
                </p>
              ) : (
                <ul className="admin-list">
                  {contactRequests.map((req) => (
                    <li key={req.id} className="admin-list-item">
                      <div className="admin-list-item-main">
                        <p className="admin-list-item-title">
                          {req.subject || "Quote / Contact Request"}
                        </p>
                        <p className="admin-list-item-subtitle">
                          Submitted on{" "}
                          {new Date(req.created_at).toLocaleString()}
                        </p>
                        {req.message && (
                          <p className="admin-list-item-body">
                            {req.message}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
