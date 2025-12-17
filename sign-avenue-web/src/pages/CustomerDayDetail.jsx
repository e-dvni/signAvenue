// src/pages/CustomerDayDetail.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const formatDate = (date) => date.toISOString().slice(0, 10);

const parseDateParam = (param) => {
  // param is expected as YYYY-MM-DD
  const [y, m, d] = param.split("-").map((v) => parseInt(v, 10));
  return new Date(y, m - 1, d);
};

const isDateInNext30DaysWithNotice = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const min = new Date(today);
  min.setDate(today.getDate() + 3); // at least 3 days out

  const max = new Date(today);
  max.setDate(today.getDate() + 30);

  if (d < min) return { inWindow: false, reason: "too_soon" };
  if (d > max) return { inWindow: false, reason: "too_far" };

  return { inWindow: true, reason: null };
};

const isUsHoliday = (date) => {
  const year = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  if (m === 1 && d === 1) return true; // New Year's Day
  if (m === 12 && d === 24) return true; // Christmas Eve
  if (m === 12 && d === 25) return true; // Christmas
  if (m === 12 && d === 31) return true; // New Year's Eve

  // Thanksgiving: 4th Thursday in November
  if (m === 11) {
    const tmp = new Date(year, 10, 1);
    let thursdays = 0;
    for (let day = 1; day <= 30; day++) {
      tmp.setDate(day);
      if (tmp.getDay() === 4) {
        thursdays++;
        if (thursdays === 4 && d === day) return true;
      }
    }
  }

  return false;
};

const SLOT_OPTIONS = [
  {
    key: "am",
    label: "AM slot (8am – 12pm)",
    window: "8:00am – 12:00pm",
  },
  {
    key: "pm",
    label: "PM slot (12pm – 4pm)",
    window: "12:00pm – 4:00pm",
  },
];

const CustomerDayDetail = () => {
  const { date } = useParams(); // YYYY-MM-DD
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, loading: authLoading } = useAuth();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const dateObj = useMemo(() => parseDateParam(date), [date]);
  const weekday = dateObj.getDay();
  const isWeekend = weekday === 0 || weekday === 6;
  const isHoliday = isUsHoliday(dateObj);
  const { inWindow: dayInWindow, reason: dayWindowReason } =
    isDateInNext30DaysWithNotice(dateObj);

  const _today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // Load projects for this user
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

        const projectIdFromState = location.state?.projectId
          ? String(location.state.projectId)
          : null;

        if (data.length > 0) {
          if (projectIdFromState) {
            const match = data.find(
              (p) => String(p.id) === projectIdFromState
            );
            if (match) {
              setSelectedProjectId(projectIdFromState);
              return;
            }
          }
          setSelectedProjectId(String(data[0].id));
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load your projects.");
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [token, location.state]);

  const getSelectedProject = () =>
    projects.find((p) => String(p.id) === String(selectedProjectId));

  const hasBookingForSelectedProject = () => {
    const project = getSelectedProject();
    return !!(project && project.install_date && project.install_slot);
  };

  const handleProjectChange = (e) => {
    setSelectedProjectId(e.target.value);
    setError(null);
    setSuccess(null);
  };

  const handleBook = async (slotKey) => {
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
          "Please wait until it is marked ready_for_install."
      );
      return;
    }

    const { inWindow } = isDateInNext30DaysWithNotice(dateObj);
    if (!inWindow || isWeekend || isHoliday) {
      setError(
        "This date is not eligible for booking (weekend, holiday, or outside the 3–30 day window)."
      );
      return;
    }

    const hasBooking = hasBookingForSelectedProject();

    // If the project already has a booking (on any date/slot),
    // we require the user to cancel from the dashboard first.
    if (hasBooking) {
      setError(
        "This project already has an installation scheduled. " +
          "Please cancel the existing appointment from your dashboard before booking a new one."
      );
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
              install_date: formatDate(dateObj),
              install_slot: slotKey,
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
          <h1 className="admin-title">Schedule Installation</h1>
          <p>You need to be logged in to view this page.</p>
        </div>
      </section>
    );
  }

  const friendlyDate = dateObj.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const selectedProject = getSelectedProject();
  const hasBooking = hasBookingForSelectedProject();
  const projectBookingDate =
    selectedProject && selectedProject.install_date
      ? new Date(selectedProject.install_date)
      : null;

  const projectBookingDateLabel =
    projectBookingDate &&
    projectBookingDate.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const projectBookingSlotLabel =
    selectedProject && selectedProject.install_slot
      ? selectedProject.install_slot.toUpperCase()
      : null;

  const dayIsViewOnly = isWeekend || isHoliday || !dayInWindow;

  let globalNotice = "";
  if (isWeekend) {
    globalNotice = "Weekends are view-only. Installation is Monday–Friday.";
  } else if (isHoliday) {
    globalNotice = "This date is a holiday, so installation is view-only.";
  } else if (!dayInWindow) {
    if (dayWindowReason === "too_soon") {
      globalNotice =
        "We require at least 3 days' notice to book an installation.";
    } else if (dayWindowReason === "too_far") {
      globalNotice =
        "Installations can only be scheduled within 30 days from today.";
    } else {
      globalNotice = "This date is view-only.";
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-layout">
        <div className="admin-main" style={{ gridColumn: "1 / -1" }}>
          <div className="admin-header">
            <div>
              <h1 className="admin-title">Installation Day Details</h1>
              <p className="admin-subtitle">
                {friendlyDate}. Choose AM or PM for your installation window.
              </p>
            </div>
            <button
              type="button"
              className="schedule-calendar-nav-button"
              onClick={() => navigate(-1)}
            >
              Back
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
                <h2 className="admin-section-title">1. Select a Project</h2>
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
                          – scheduling opens when marked{" "}
                          <strong>ready_for_install</strong>.
                        </>
                      )}
                    </p>
                  )}

                  {hasBooking && projectBookingDateLabel && projectBookingSlotLabel && (
                    <p
                      style={{
                        marginTop: "0.5rem",
                        fontSize: "0.8rem",
                        color: "#6b7280",
                      }}
                    >
                      Current appointment:{" "}
                      <strong>
                        {projectBookingDateLabel} ({projectBookingSlotLabel})
                      </strong>
                      . To change this appointment, cancel it from your
                      dashboard first, then book a new date.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Day-level notice */}
            <div className="admin-section">
              <div className="admin-section-header">
                <h2 className="admin-section-title">2. Available Time Slots</h2>
              </div>

              {globalNotice && (
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#b45309",
                    marginBottom: "0.75rem",
                  }}
                >
                  {globalNotice}
                </p>
              )}

              {!selectedProject ? (
                <p className="admin-empty-state">
                  Select a project above to view and book time slots.
                </p>
              ) : !selectedProject.can_schedule ? (
                <p className="admin-empty-state">
                  This project is not ready for scheduling yet. We&apos;ll let
                  you know once it&apos;s marked{" "}
                  <strong>ready_for_install</strong>.
                </p>
              ) : (
                <div className="schedule-day-detail-slots">
                  {SLOT_OPTIONS.map((slot) => {
                    const slotKey = slot.key;

                    const isThisSlotCurrentBooking =
                      hasBooking &&
                      selectedProject.install_date === formatDate(dateObj) &&
                      selectedProject.install_slot === slotKey;

                    const canAttemptBooking =
                      !dayIsViewOnly && !hasBooking && selectedProject.can_schedule;

                    let buttonLabel = "";
                    let buttonDisabled = false;
                    let helperText = "";

                    if (isThisSlotCurrentBooking) {
                      buttonLabel = "Booked";
                      buttonDisabled = true;
                      helperText =
                        "This is your current appointment. To cancel, go to your dashboard.";
                    } else if (hasBooking) {
                      buttonLabel = "View only";
                      buttonDisabled = true;
                      helperText =
                        "You already have an appointment on another date. Cancel it from your dashboard before booking a new slot.";
                    } else if (!canAttemptBooking) {
                      buttonLabel = "View only";
                      buttonDisabled = true;
                      helperText =
                        "This slot cannot be booked (weekend, holiday, or outside the 3–30 day window).";
                    } else {
                      buttonLabel = "Book this slot";
                      buttonDisabled = saving;
                      helperText =
                        "Click to reserve this installation window for your project.";
                    }

                    return (
                      <div
                        key={slotKey}
                        className="schedule-day-detail-slot-card"
                      >
                        <div className="schedule-day-detail-slot-header">
                          <h3 className="schedule-day-detail-slot-title">
                            {slot.label}
                          </h3>
                          <p className="schedule-day-detail-slot-window">
                            {slot.window}
                          </p>
                        </div>
                        <div className="schedule-day-detail-slot-body">
                          <button
                            type="button"
                            className="schedule-day-detail-slot-button"
                            onClick={() => handleBook(slotKey)}
                            disabled={buttonDisabled}
                          >
                            {buttonLabel}
                          </button>
                          <p className="schedule-day-detail-slot-helper">
                            {helperText}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <p
              style={{
                fontSize: "0.8rem",
                color: "#6b7280",
                marginTop: "0.75rem",
              }}
            >
              Note: You can only have one active installation appointment per
              project at a time. To change dates, cancel your existing
              appointment from the dashboard first, then book a new slot.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomerDayDetail;
