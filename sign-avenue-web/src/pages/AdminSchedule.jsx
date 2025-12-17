import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { useAuth } from "../hooks/useAuth";

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const AdminSchedule = () => {
  const { user, token } = useAuth();
  const [days, setDays] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProjectId, setSavingProjectId] = useState(null);
  const [error, setError] = useState(null);

  // Which month is the calendar showing?
  const [viewMonth, setViewMonth] = useState(() => new Date());

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Allow booking only from 3 days out up to 30 days out
    const dateInNext30Days = (date) => {
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

  // Build calendar days for the viewed month
  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const firstWeekday = firstOfMonth.getDay(); // 0 = Sunday

    // Start grid at the Sunday of the week that contains the 1st
    const gridStart = new Date(year, month, 1 - firstWeekday);

    const daysArray = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);

      daysArray.push({
        date: d,
        inCurrentMonth: d.getMonth() === month,
      });
    }

    return daysArray;
  }, [viewMonth]);

  // Map of dateStr -> schedule day data
  const scheduleByDate = useMemo(() => {
    const map = {};
    days.forEach((day) => {
      // Rails gives date as "YYYY-MM-DD"
      const key = typeof day.date === "string" ? day.date : formatDate(new Date(day.date));
      map[key] = day;
    });
    return map;
  }, [days]);

  // Load schedule + projects whenever month or token changes
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
        const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);

        const fromParam = formatDate(monthStart);
        const toParam = formatDate(monthEnd);

        const [scheduleRes, projectsRes] = await Promise.all([
          fetch(
            `http://localhost:3000/api/v1/admin/schedule?from=${fromParam}&to=${toParam}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),
          fetch("http://localhost:3000/api/v1/admin/projects", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const scheduleData = await scheduleRes.json();
        const projectsData = await projectsRes.json();

        if (!scheduleRes.ok) {
          throw new Error(scheduleData.error || "Failed to load schedule");
        }
        if (!projectsRes.ok) {
          throw new Error(projectsData.error || "Failed to load projects");
        }

        setDays(scheduleData);
        setProjects(projectsData);
      } catch (err) {
        console.error(err);
        setError("Unable to load schedule data.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "admin") {
      setLoading(true);
      fetchData();
    } else {
      setLoading(false);
      setError("You are not authorized to view this page.");
    }
  }, [token, user, viewMonth]);

  const unscheduledProjects = projects.filter(
    (p) => !p.install_date || !p.install_slot
  );

  const handleSetInstallSlot = async (projectId, dateString, slotKey) => {
    if (!dateString || !slotKey) return;

    // Guard: only next 30 days
    if (!dateInNext30Days(dateString)) {
      alert("Install can only be scheduled within the next 30 days.");
      return;
    }

    setSavingProjectId(projectId);
    setError(null);

    try {
      const res = await fetch(
        `http://localhost:3000/api/v1/admin/projects/${projectId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            project: {
              install_date: dateString,
              install_slot: slotKey,
            },
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (data.errors && data.errors.join(", ")));
      }

      // Update projects locally
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, install_date: dateString, install_slot: slotKey }
            : p
        )
      );

      // Refresh schedule from backend for current viewMonth
      try {
        const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
        const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);

        const fromParam = formatDate(monthStart);
        const toParam = formatDate(monthEnd);

        const scheduleRes = await fetch(
          `http://localhost:3000/api/v1/admin/schedule?from=${fromParam}&to=${toParam}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const scheduleData = await scheduleRes.json();
        if (scheduleRes.ok) {
          setDays(scheduleData);
        }
      } catch {
        // ignore secondary fetch error
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update install date.");
    } finally {
      setSavingProjectId(null);
    }
  };

  const goPrevMonth = () => {
    setViewMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() - 1);
      return d;
    });
  };

  const goNextMonth = () => {
    setViewMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + 1);
      return d;
    });
  };

  if (loading) {
    return (
      <AdminLayout
        title="Installation Schedule"
        subtitle="Plan and assign installation dates for projects."
      >
        <p>Loading schedule...</p>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Installation Schedule">
        <p className="admin-error">{error}</p>
      </AdminLayout>
    );
  }

  const monthLabel = viewMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <AdminLayout
      title="Installation Schedule"
      subtitle="Each day has two slots: 8–12 and 12–4. Only the next 30 days are bookable, but you can browse any month."
    >
      {/* Calendar UI */}
      <section className="admin-section">
        <div className="admin-section-header schedule-calendar-header">
          <button
            type="button"
            className="schedule-calendar-nav-button"
            onClick={goPrevMonth}
          >
            ‹
          </button>
          <h2 className="admin-section-title schedule-calendar-month-label">
            {monthLabel}
          </h2>
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
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((wd) => (
              <div key={wd} className="schedule-calendar-weekday">
                {wd}
              </div>
            ))}
          </div>

          <div className="schedule-calendar-grid">
            {calendarDays.map((cell, idx) => {
                const dateStr = formatDate(cell.date);
                const schedule = scheduleByDate[dateStr];
                const isToday = cell.date.getTime() === today.getTime();
                const isBookable = dateInNext30Days(dateStr);

                let amStatus = "";
                let pmStatus = "";
                let allFull = false;

                if (schedule) {
                    const am = schedule.slots.find((s) => s.key === "am");
                    const pm = schedule.slots.find((s) => s.key === "pm");

                    // Only show "Full"/"Avail" and consider allFull
                    // when this day is actually bookable (within next 30 days)
                    // AND marked bookable by the backend.
                    if (isBookable && schedule.bookable) {
                    if (am) {
                        amStatus = am.is_full ? "Full" : "Avail";
                    }
                    if (pm) {
                        pmStatus = pm.is_full ? "Full" : "Avail";
                    }

                    allFull = am && pm && am.is_full && pm.is_full;
                    } else {
                    allFull = false;
                    }
                }

                const dayClasses = [
                    "schedule-calendar-day",
                    !cell.inCurrentMonth && "schedule-calendar-day--other-month",
                    isToday && "schedule-calendar-day--today",
                    allFull && "schedule-calendar-day--full",
                ]
                    .filter(Boolean)
                    .join(" ");

                return (
                    <div key={idx} className={dayClasses}>
                    <div className="schedule-calendar-day-header">
                        <span className="schedule-calendar-day-number">
                        {cell.date.getDate()}
                        </span>
                        {isToday && (
                        <span className="schedule-calendar-day-badge">Today</span>
                        )}
                    </div>

                    <div className="schedule-calendar-day-info">
                        <div className="schedule-calendar-day-slot">
                        <span className="schedule-calendar-day-slot-label">AM</span>
                        <span className="schedule-calendar-day-slot-status">
                            {amStatus}
                        </span>
                        </div>
                        <div className="schedule-calendar-day-slot">
                        <span className="schedule-calendar-day-slot-label">PM</span>
                        <span className="schedule-calendar-day-slot-status">
                            {pmStatus}
                        </span>
                        </div>
                    </div>

                    <div className="schedule-calendar-day-footer">
                        {isBookable ? (
                        <span className="schedule-calendar-day-bookable">Bookable</span>
                        ) : (
                        <span className="schedule-calendar-day-unbookable">Unavailable</span>
                        )}
                    </div>
                    </div>
                );
            })}
          </div>
        </div>
      </section>

      {/* Unscheduled projects (same as before) */}
      <section className="admin-section" style={{ marginTop: "1rem" }}>
        <div className="admin-section-header">
          <h2 className="admin-section-title">Unscheduled Projects</h2>
          <span className="admin-section-badge">
            {unscheduledProjects.length}
          </span>
        </div>

        {unscheduledProjects.length === 0 ? (
          <p className="admin-empty-state">
            All current projects have install dates and slots.
          </p>
        ) : (
          <ul className="admin-list">
            {unscheduledProjects.map((p) => (
              <li key={p.id} className="admin-list-item">
                <div className="admin-list-item-main">
                  <p className="admin-list-item-title">{p.name}</p>
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
                </div>
                <div className="schedule-project-actions">
                  <label className="schedule-date-label">
                    Install date:
                    <input
                      type="date"
                      disabled={savingProjectId === p.id}
                      onChange={(e) =>
                        handleSetInstallSlot(p.id, e.target.value, "am")
                      }
                    />
                  </label>
                  <div className="schedule-slot-select-row">
                    <label className="schedule-slot-select-label">
                      Slot:
                      <select
                        defaultValue=""
                        disabled={savingProjectId === p.id}
                        onChange={(e) => {
                          const dateInput =
                            e.target.closest("li").querySelector(
                              'input[type="date"]'
                            );
                          const dateValue = dateInput?.value;
                          const slotKey = e.target.value;
                          if (!dateValue || !slotKey) return;
                          handleSetInstallSlot(p.id, dateValue, slotKey);
                        }}
                      >
                        <option value="">Select slot</option>
                        <option value="am">8am – 12pm</option>
                        <option value="pm">12pm – 4pm</option>
                      </select>
                    </label>
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

export default AdminSchedule;
