// src/pages/CustomerSchedule.jsx
import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const formatDate = (date) => date.toISOString().slice(0, 10);

const startOfMonth = (date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const buildCalendarDays = (monthDate) => {
  const firstOfMonth = startOfMonth(monthDate);
  const month = firstOfMonth.getMonth();

  // Start from the Sunday of the week that contains the 1st
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const startDate = new Date(firstOfMonth);
  startDate.setDate(firstOfMonth.getDate() - startOffset);

  const days = [];

  // 6 weeks * 7 days = 42 cells
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);

    days.push({
      date: d,
      inCurrentMonth: d.getMonth() === month,
    });
  }

  return days;
};

// Allow booking only from 3 days out up to 30 days out
const isDateInNext30Days = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Minimum bookable date: 3 days from today
  const min = new Date(today);
  min.setDate(today.getDate() + 3);

  // Maximum bookable date: 30 days from today
  const max = new Date(today);
  max.setDate(today.getDate() + 30);

  return d >= min && d <= max;
};


// US holiday helper
const isUsHoliday = (date) => {
  const year = date.getFullYear();
  const m = date.getMonth() + 1; // 1-12
  const d = date.getDate();

  // Fixed-date holidays we care about
  if (m === 1 && d === 1) return true;   // New Year's Day
  if (m === 12 && d === 24) return true; // Christmas Eve
  if (m === 12 && d === 25) return true; // Christmas
  if (m === 12 && d === 31) return true; // New Year's Eve

  // Thanksgiving: 4th Thursday in November
  if (m === 11) {
    const temp = new Date(year, 10, 1); // November 1
    let thursdays = 0;
    for (let day = 1; day <= 30; day++) {
      temp.setDate(day);
      if (temp.getDay() === 4) {
        thursdays++;
        if (thursdays === 4 && d === day) return true;
      }
    }
  }

  return false;
};

const CustomerSchedule = () => {
  const { user, token, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const initialProjectIdFromNav = location.state?.projectId
    ? String(location.state.projectId)
    : null;

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState(null);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const calendarDays = useMemo(
    () => buildCalendarDays(currentMonth),
    [currentMonth]
  );

  // Load current user's projects
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

        if (data.length > 0) {
          // If we navigated here with a specific projectId, prefer that
          if (initialProjectIdFromNav) {
            const match = data.find(
              (p) => String(p.id) === initialProjectIdFromNav
            );
            if (match) {
              setSelectedProjectId(initialProjectIdFromNav);
              return;
            }
          }
          // Otherwise fall back to the first project
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
  }, [token, initialProjectIdFromNav]);

  const handleProjectChange = (e) => {
    setSelectedProjectId(e.target.value);
    setError(null);
  };

  const getSelectedProject = () =>
    projects.find((p) => String(p.id) === String(selectedProjectId));

  const hasBookingForSelectedProject = () => {
    const project = getSelectedProject();
    return !!(project && project.install_date && project.install_slot);
  };

  const goPrevMonth = () => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() - 1);
      return new Date(d.getFullYear(), d.getMonth(), 1);
    });
  };

  const goNextMonth = () => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + 1);
      return new Date(d.getFullYear(), d.getMonth(), 1);
    });
  };

  const handleOpenDayDetail = (dateObj) => {
    const project = getSelectedProject();
    const dateStr = formatDate(dateObj);

    navigate(`/schedule/${dateStr}`, {
      state: {
        projectId: project ? project.id : null,
      },
    });
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
          <p>You need to be logged in to view and schedule your projects.</p>
        </div>
      </section>
    );
  }

  const monthLabel = currentMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <section className="admin-page">
      <div className="admin-layout">
        <div className="admin-main" style={{ gridColumn: "1 / -1" }}>
          <div className="admin-header">
            <div>
              <h1 className="admin-title">Schedule Your Installation</h1>
              <p className="admin-subtitle">
                Choose one of your projects, then click a day to view its AM/PM
                slots. Only dates 3–30 days from today (excluding weekends and
                holidays) are bookable.
              </p>
            </div>
          </div>

          <div className="admin-content">
            {error && <div className="admin-error">{error}</div>}

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
                  Once your project is created by our team, you’ll be able to
                  schedule installation here.
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

                  {getSelectedProject() && (
                    <p
                      style={{
                        marginTop: "0.5rem",
                        fontSize: "0.8rem",
                        color: "#6b7280",
                      }}
                    >
                      Status: <strong>{getSelectedProject().status}</strong>
                      {!getSelectedProject().can_schedule && (
                        <>
                          {" "}
                          – scheduling will be enabled once this project is
                          marked <strong>ready_for_install</strong> by our team.
                        </>
                      )}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Calendar */}
            {projects.length > 0 && (
              <div className="admin-section">
                <div className="admin-section-header">
                  <h2 className="admin-section-title">
                    2. Browse Calendar & Pick a Day
                  </h2>
                  <span className="admin-section-badge">
                    3–30 days ahead only
                  </span>
                </div>

                <div className="schedule-calendar-header">
                  <button
                    type="button"
                    className="schedule-calendar-nav-button"
                    onClick={goPrevMonth}
                  >
                    ‹
                  </button>
                  <h3 className="schedule-calendar-month-label">
                    {monthLabel}
                  </h3>
                  <button
                    type="button"
                    className="schedule-calendar-nav-button"
                    onClick={goNextMonth}
                  >
                    ›
                  </button>
                </div>

                <div className="schedule-calendar">
                  <div className="schedule-calendar-weekdays">
                    <div className="schedule-calendar-weekday">Sun</div>
                    <div className="schedule-calendar-weekday">Mon</div>
                    <div className="schedule-calendar-weekday">Tue</div>
                    <div className="schedule-calendar-weekday">Wed</div>
                    <div className="schedule-calendar-weekday">Thu</div>
                    <div className="schedule-calendar-weekday">Fri</div>
                    <div className="schedule-calendar-weekday">Sat</div>
                  </div>

                  <div className="schedule-calendar-grid">
                    {calendarDays.map((cell, idx) => {
                      const date = cell.date;
                      const dateStr = formatDate(date);

                      const dNoTime = new Date(date);
                      dNoTime.setHours(0, 0, 0, 0);

                      const isToday =
                        dNoTime.getTime() === today.getTime();

                      const weekday = date.getDay(); // 0=Sun..6=Sat
                      const isWeekend = weekday === 0 || weekday === 6;
                      const isHoliday = isUsHoliday(date);

                      const dayInWindow = isDateInNext30Days(date);

                      const selectedProject = getSelectedProject();
                      const hasBooking = hasBookingForSelectedProject();

                      const isThisProjectsBookingDay =
                        hasBooking &&
                        selectedProject &&
                        selectedProject.install_date === dateStr;

                      const dayClasses = [
                        "schedule-calendar-day",
                        !cell.inCurrentMonth &&
                          "schedule-calendar-day--other-month",
                        isToday && "schedule-calendar-day--today",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      let footerText = "";
                      let footerClass = "";

                      if (!selectedProject || !selectedProject.can_schedule) {
                        footerText = "Waiting for ready_for_install";
                        footerClass = "schedule-calendar-day-unbookable";
                      } else if (isWeekend || isHoliday || !dayInWindow) {
                        footerText = "View only";
                        footerClass = "schedule-calendar-day-unbookable";
                      } else if (hasBooking && isThisProjectsBookingDay) {
                        footerText = `Your booking: ${selectedProject.install_slot.toUpperCase()}`;
                        footerClass = "schedule-calendar-day-bookable";
                      } else if (hasBooking) {
                        footerText =
                          "Already scheduled – cancel before rescheduling";
                        footerClass = "schedule-calendar-day-unbookable";
                      } else {
                        footerText = "Tap to pick time";
                        footerClass = "schedule-calendar-day-bookable";
                      }

                      const canClickDay =
                        selectedProject &&
                        selectedProject.can_schedule &&
                        !isWeekend &&
                        !isHoliday &&
                        dayInWindow;

                      return (
                        <button
                          key={idx}
                          type="button"
                          className={dayClasses}
                          onClick={() => canClickDay && handleOpenDayDetail(date)}
                          disabled={!canClickDay}
                          style={{
                            textAlign: "left",
                            cursor: canClickDay ? "pointer" : "default",
                          }}
                        >
                          <div className="schedule-calendar-day-header">
                            <span className="schedule-calendar-day-number">
                              {date.getDate()}
                            </span>
                            {isToday && (
                              <span className="schedule-calendar-day-badge">
                                Today
                              </span>
                            )}
                          </div>

                          <div className="schedule-calendar-day-footer">
                            <span className={footerClass}>{footerText}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    marginTop: "0.75rem",
                  }}
                >
                  Note: You can only have one active installation appointment
                  per project. To change dates, cancel your current appointment
                  from the dashboard, then book again.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomerSchedule;
