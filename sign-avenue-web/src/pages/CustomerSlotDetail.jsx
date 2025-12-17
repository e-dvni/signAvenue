// src/pages/CustomerSlotDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  normalizeDate,
  isInInstallWindow,
  isWeekendOrHoliday,
} from "../utils/scheduling";

const CustomerSlotDetail = () => {
  const { user, token, loading: authLoading } = useAuth();
  const { date: dateParam, slot } = useParams(); // slot: "am" or "pm"
  const location = useLocation();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(
    location.state?.projectId ? String(location.state.projectId) : ""
  );
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Normalized slot date
  const slotDate = useMemo(
    () => normalizeDate(new Date(dateParam + "T00:00:00")),
    [dateParam]
  );

  const slotLabel = slot === "am" ? "8am – 12pm (AM)" : "12pm – 4pm (PM)";

  useEffect(() => {
    if (!token) {
      setLoadingProjects(false);
      return;
    }

    const fetchProjects = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/v1/projects", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to load projects.");
        }

        const data = await res.json();
        setProjects(data || []);

        // If we don't yet have a selected project, pick the one from state or first
        if (!selectedProjectId) {
          if (location.state?.projectId) {
            const match = data.find(
              (p) => String(p.id) === String(location.state.projectId)
            );
            if (match) {
              setSelectedProjectId(String(match.id));
              return;
            }
          }
          if (data.length > 0) {
            setSelectedProjectId(String(data[0].id));
          }
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load your projects.");
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [token, selectedProjectId, location.state]);

  const getSelectedProject = () =>
    projects.find((p) => String(p.id) === String(selectedProjectId));

  const hasBooking = () => {
    const p = getSelectedProject();
    return !!(p && p.install_date && p.install_slot);
  };

  const isCurrentBookingSlot = () => {
    const p = getSelectedProject();
    if (!p || !p.install_date || !p.install_slot) return false;
    return p.install_date === dateParam && p.install_slot === slot;
  };

  const handleProjectChange = (e) => {
    setSelectedProjectId(e.target.value);
    setError(null);
    setSuccess(null);
  };

  const handleBook = async () => {
    setError(null);
    setSuccess(null);

    const project = getSelectedProject();
    if (!project) {
      setError("Please select a project first.");
      return;
    }

    if (!project.can_schedule) {
      setError(
        "This project is not ready to schedule yet. " +
          "Please wait until our team marks it as Ready for Install."
      );
      return;
    }

    if (hasBooking() && !isCurrentBookingSlot()) {
      setError(
        "This project already has a scheduled installation. " +
          "Please cancel your current appointment first, then choose a new date."
      );
      return;
    }

    const inWindow = isInInstallWindow(slotDate);
    const blocked = isWeekendOrHoliday(slotDate);

    if (!inWindow || blocked) {
      setError(
        "This date/time cannot be booked. It may be a weekend/holiday " +
          "or outside the allowed 3–30 day window."
      );
      return;
    }

    if (!token) {
      setError("You must be logged in to schedule.");
      return;
    }

    setSaving(true);
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
              install_date: dateParam,
              install_slot: slot,
            },
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setSuccess("Install slot booked successfully!");
        // Update local project list
        setProjects((prev) =>
          prev.map((p) => (p.id === data.id ? data : p))
        );
      } else {
        setError(data.error || "Unable to schedule this slot.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setError(null);
    setSuccess(null);

    const project = getSelectedProject();
    if (!project || !hasBooking() || !isCurrentBookingSlot()) {
      setError("No matching booking to cancel for this project and time.");
      return;
    }

    if (!token) {
      setError("You must be logged in to cancel.");
      return;
    }

    setSaving(true);
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

      if (res.ok) {
        setSuccess("Your appointment has been canceled.");
        setProjects((prev) =>
          prev.map((p) => (p.id === data.id ? data : p))
        );
      } else {
        setError(data.error || "Unable to cancel this slot.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <section className="admin-page">
        <div className="admin-page-inner">
          <p>Checking your session...</p>
        </div>
      </section>
    );
  }

  if (!user || !token) {
    return (
      <section className="admin-page">
        <div className="admin-page-inner">
          <h1>Installation Slot</h1>
          <p>You need to be logged in to view this page.</p>
        </div>
      </section>
    );
  }

  const inWindow = isInInstallWindow(slotDate);
  const blocked = isWeekendOrHoliday(slotDate);
  const isBookableDay = inWindow && !blocked;

  const selectedProject = getSelectedProject();
  const projectHasBooking = hasBooking();
  const currentIsBooking = isCurrentBookingSlot();

  const readableDate = slotDate.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="admin-page">
      <div className="admin-layout">
        <div className="admin-main" style={{ gridColumn: "1 / -1" }}>
          <div className="admin-header">
            <div>
              <h1 className="admin-title">Installation Slot Details</h1>
              <p className="admin-subtitle">
                {readableDate} – {slotLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/schedule")}
              className="schedule-calendar-slot-button"
            >
              Back to Calendar
            </button>
          </div>

          <div className="admin-content">
            {error && <div className="admin-error">{error}</div>}
            {success && (
              <div
                style={{
                  color: "#065f46",
                  backgroundColor: "#d1fae5",
                  borderRadius: "0.5rem",
                  padding: "0.75rem",
                  border: "1px solid #a7f3d0",
                }}
              >
                {success}
              </div>
            )}

            {/* Project Selector */}
            <div className="admin-section">
              <div className="admin-section-header">
                <h2 className="admin-section-title">Select Project</h2>
              </div>

              {loadingProjects ? (
                <p>Loading your projects...</p>
              ) : projects.length === 0 ? (
                <p className="admin-empty-state">
                  You currently have no projects associated with your account.
                </p>
              ) : (
                <>
                  <label className="schedule-slot-select-label">
                    Project
                    <select
                      value={selectedProjectId}
                      onChange={handleProjectChange}
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name || `Project #${p.id}`} – {p.location}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedProject && (
                    <p
                      style={{
                        marginTop: "0.5rem",
                        fontSize: "0.8rem",
                        color: "#6b7280",
                      }}
                    >
                      Status: <strong>{selectedProject.status}</strong>
                      {!selectedProject.can_schedule && (
                        <>
                          {" "}
                          – scheduling will be enabled once this project is
                          marked <strong>ready_for_install</strong>.
                        </>
                      )}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Slot Info + Actions */}
            <div className="admin-section">
              <div className="admin-section-header">
                <h2 className="admin-section-title">Slot Actions</h2>
              </div>

              <p style={{ fontSize: "0.9rem", marginBottom: "0.75rem" }}>
                Date: <strong>{readableDate}</strong>
                <br />
                Time: <strong>{slotLabel}</strong>
              </p>

              {!isBookableDay && !currentIsBooking && (
                <p className="admin-empty-state">
                  This date is view-only (weekend/holiday or outside the allowed
                  3–30 day window). New bookings are not allowed here.
                </p>
              )}

              {selectedProject && selectedProject.can_schedule ? (
                <>
                  {projectHasBooking && !currentIsBooking && (
                    <p className="admin-empty-state">
                      This project already has an appointment on{" "}
                      <strong>
                        {selectedProject.install_date} (
                        {selectedProject.install_slot.toUpperCase()})
                      </strong>
                      . To move it, first cancel that appointment from its slot
                      detail page, then choose a new date.
                    </p>
                  )}

                  {/* Book button – only if no booking yet and day is bookable */}
                  {!projectHasBooking && isBookableDay && (
                    <button
                      type="button"
                      onClick={handleBook}
                      disabled={saving}
                      className="schedule-calendar-slot-button"
                    >
                      {saving ? "Booking..." : "Book this slot"}
                    </button>
                  )}

                  {/* Cancel button – only if this exact slot is already booked */}
                  {currentIsBooking && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="schedule-calendar-slot-button"
                      style={{ marginLeft: "0.5rem" }}
                    >
                      {saving ? "Canceling..." : "Cancel this booking"}
                    </button>
                  )}

                  {!projectHasBooking && !isBookableDay && (
                    <p
                      className="admin-empty-state"
                      style={{ marginTop: "0.75rem" }}
                    >
                      New bookings for this project are only allowed on weekdays
                      that are 3–30 days from today and not on major holidays.
                    </p>
                  )}
                </>
              ) : (
                <p className="admin-empty-state">
                  This project is not yet ready for scheduling. Once we update
                  its status to <strong>ready_for_install</strong>, you’ll be
                  able to book an appointment.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomerSlotDetail;
