import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AdminLayout from "../components/AdminLayout";
import { PROJECT_STATUSES, statusLabel } from "../utils/projectStatus";

const API_BASE = "http://localhost:3000/api/v1";

// Safe date display
const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return String(d);
  }
};

// Safely format "YYYY-MM-DD" + slot into a nice label
const formatInstallLabel = (install_date, install_slot) => {
  if (!install_date) return "Not scheduled";

  const parts = String(install_date).split("-");
  if (parts.length !== 3) return String(install_date);

  const [yearStr, monthStr, dayStr] = parts;
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const day = Number(dayStr);

  const date = new Date(year, monthIndex, day);
  const dateLabel = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const slotLabel =
    install_slot === "am" ? "AM" : install_slot === "pm" ? "PM" : null;

  return slotLabel ? `${dateLabel} (${slotLabel})` : dateLabel;
};

// Duration in days:
// - If complete -> created_at to updated_at (rough but good)
// - Else -> created_at to today
const durationDays = (createdAt, updatedAt, status) => {
  if (!createdAt) return "—";
  const start = new Date(createdAt).getTime();
  const end =
    status === "complete" && updatedAt ? new Date(updatedAt).getTime() : Date.now();

  if (Number.isNaN(start) || Number.isNaN(end)) return "—";
  const days = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  return `${days} day${days === 1 ? "" : "s"}`;
};

const thBase = {
  padding: 10,
  fontSize: 11,
  letterSpacing: 0.3,
  textTransform: "uppercase",
  opacity: 0.75,
  userSelect: "none",
  whiteSpace: "nowrap",
};

const clickableTh = {
  ...thBase,
  cursor: "pointer",
};

const tdBase = {
  padding: 10,
  fontSize: 13,
  verticalAlign: "top",
};

const ellipsisOneLine = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: "100%",
};

const wrapText = {
  whiteSpace: "normal",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

export default function AdminProjects() {
  const { token, user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Table sorting
  const [sortKey, setSortKey] = useState("created_at"); // name | created_at | install_date | status | user | assignee
  const [sortDir, setSortDir] = useState("desc"); // asc | desc

  useEffect(() => {
    let mounted = true;

    const fetchProjects = async () => {
      if (!token) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        if (mounted) {
          setLoading(true);
          setError(null);
        }

        const res = await fetch(`${API_BASE}/admin/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data?.error || "Unable to load projects.");

        if (mounted) setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || "Unable to load projects.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProjects();
    return () => {
      mounted = false;
    };
  }, [token]);

  const handleFieldChange = (projectId, patch) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, ...patch } : p))
    );
  };

  const handleSaveProject = async (project) => {
    if (!token) return;

    setSavingId(project.id);
    try {
      const res = await fetch(`${API_BASE}/admin/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project: {
            name: project.name,
            status: project.status,
            install_date: project.install_date,
            install_slot: project.install_slot,
            location: project.location,
            description: project.description,
            user_id: project.user?.id || project.user_id || null,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.errors?.join(", ") || data.error || "Update failed");
      }

      setProjects((prev) => prev.map((p) => (p.id === data.id ? data : p)));
    } catch (err) {
      console.error(err);
      alert(err.message || "Unable to update project.");
    } finally {
      setSavingId(null);
    }
  };

  const visibleProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...projects];

    if (q) {
      list = list.filter((p) => {
        const name = (p.name || "").toLowerCase();
        const userName = (p.user?.name || "").toLowerCase();
        const userEmail = (p.user?.email || "").toLowerCase();
        const assigneeName = (p.created_by?.name || "").toLowerCase();
        const assigneeEmail = (p.created_by?.email || "").toLowerCase();

        return (
          name.includes(q) ||
          userName.includes(q) ||
          userEmail.includes(q) ||
          assigneeName.includes(q) ||
          assigneeEmail.includes(q)
        );
      });
    }

    if (statusFilter) {
      list = list.filter((p) => (p.status || "") === statusFilter);
    }

    const dir = sortDir === "asc" ? 1 : -1;

    list.sort((a, b) => {
      // keep "complete" at bottom no matter what
      const aComplete = a.status === "complete";
      const bComplete = b.status === "complete";
      if (aComplete && !bComplete) return 1;
      if (!aComplete && bComplete) return -1;

      if (sortKey === "install_date") {
        const at = a.install_date ? new Date(a.install_date).getTime() : 0;
        const bt = b.install_date ? new Date(b.install_date).getTime() : 0;
        return (at - bt) * dir;
      }

      if (sortKey === "created_at") {
        const at = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
        return (at - bt) * dir;
      }

      if (sortKey === "user") {
        const as = (a.user?.name || a.user?.email || "").toLowerCase();
        const bs = (b.user?.name || b.user?.email || "").toLowerCase();
        if (as < bs) return -1 * dir;
        if (as > bs) return 1 * dir;
        return 0;
      }

      if (sortKey === "assignee") {
        const as = (a.created_by?.name || a.created_by?.email || "").toLowerCase();
        const bs = (b.created_by?.name || b.created_by?.email || "").toLowerCase();
        if (as < bs) return -1 * dir;
        if (as > bs) return 1 * dir;
        return 0;
      }

      const av = a?.[sortKey];
      const bv = b?.[sortKey];
      const as = (av ?? "").toString().toLowerCase();
      const bs = (bv ?? "").toString().toLowerCase();
      if (as < bs) return -1 * dir;
      if (as > bs) return 1 * dir;
      return 0;
    });

    return list;
  }, [projects, search, statusFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    setSortKey((current) => {
      if (current === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return current;
      }
      setSortDir("asc");
      return key;
    });
  };

  if (loading) {
    return (
      <AdminLayout title="Projects" subtitle="Project tracker for all customers.">
        <section className="admin-section">
          <p className="admin-empty-state">Loading projects...</p>
        </section>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Projects" subtitle="Project tracker for all customers.">
        <section className="admin-section">
          <p className="admin-empty-state">{error}</p>
        </section>
      </AdminLayout>
    );
  }

  if (!user || !token) {
    return (
      <AdminLayout title="Projects" subtitle="Project tracker for all customers.">
        <section className="admin-section">
          <p className="admin-empty-state">You must be logged in to view this page.</p>
        </section>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Projects" subtitle="Project tracker for all customers.">
      {/* Prevent any page-level horizontal overflow */}
      <section className="admin-section" style={{ maxWidth: "45%", overflowX: "hidden" }}>
        <div className="admin-section-header">
          <div>
            <h2 className="admin-section-title">Projects</h2>
            <p style={{ margin: "6px 0 0", opacity: 0.75 }}>
              Search, filter, sort, and update project status.
            </p>
          </div>
          <span className="admin-section-badge">{visibleProjects.length}</span>
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 12,
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Search project, customer, or assignee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "0.8rem 1rem",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              minWidth: 320,
              maxWidth: "100%",
              fontSize: 14,
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "0.7rem 0.9rem",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              maxWidth: "100%",
              fontSize: 14,
            }}
          >
            <option value="">All statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>

          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Sorting: <strong>{sortKey}</strong> ({sortDir})
          </div>
        </div>

        {/* Card */}
        {/* Scroll area (ONLY place that scrolls sideways) */}
        <div
          style={{
            marginTop: 14,
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            background: "white",
            overflow: "hidden",     // keeps the card clipped/rounded
            maxWidth: "100%",
            minWidth: 0,            // IMPORTANT: prevents flex parents from forcing width
          }}
        >
          {/* Scroll area: THIS fits in the browser and scrolls internally */}
          <div
            style={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,               // IMPORTANT
              overflowX: "auto",         // horizontal scroll INSIDE here
              overflowY: "auto",         // vertical scroll INSIDE here
              maxHeight: 480,            // your scroll height
              WebkitOverflowScrolling: "touch",
            }}
          >
            {visibleProjects.length === 0 ? (
              <div style={{ padding: 14 }}>No projects match your filters.</div>
            ) : (
              <table
                style={{
                  width: "100%",          // ✅ wrapper width (fits browser)
                  minWidth: 2200,         // ✅ forces internal horizontal scrolling
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                }}
              >
                <colgroup>
                  <col style={{ width: 80 }} /> {/* Project Name */}
                  <col style={{ width: 60 }} /> {/* Start Date */}
                  <col style={{ width: 75 }} /> {/* Installation Date */}
                  <col style={{ width: 60 }} /> {/* Assignee */}
                  <col style={{ width: 80 }} /> {/* Customer */}
                  <col style={{ width: 60 }} /> {/* Status */}
                  <col style={{ width: 60 }} /> {/* Invoice */}
                  <col style={{ width: 75 }} /> {/* Duration */}
                  <col style={{ width: 60 }} /> {/* Actions */}
                </colgroup>

                <thead>
                  <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                    <th style={clickableTh} onClick={() => toggleSort("name")}>Project Name</th>
                    <th style={clickableTh} onClick={() => toggleSort("created_at")}>Start Date</th>
                    <th style={clickableTh} onClick={() => toggleSort("install_date")}>Installation Date</th>
                    <th style={clickableTh} onClick={() => toggleSort("assignee")}>Assignee</th>
                    <th style={clickableTh} onClick={() => toggleSort("user")}>Customer</th>
                    <th style={clickableTh} onClick={() => toggleSort("status")}>Status</th>
                    <th style={thBase}>Invoice</th>
                    <th style={thBase}>Duration</th>
                    <th style={thBase}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleProjects.map((p) => {
                    const customerName = p.user?.name || "—";
                    const customerEmail = p.user?.email || "";
                    const canViewUser = Boolean(p.user?.id);

                    const assigneeName = p.created_by?.name || "—";
                    const assigneeEmail = p.created_by?.email || "";

                    return (
                      <tr key={p.id} style={{ borderTop: "1px solid #eef2f7" }}>
                        {/* Project */}
                        <td style={tdBase}>
                          <div style={{ fontWeight: 800, ...ellipsisOneLine }}>
                            {p.name || `Project #${p.id}`}
                          </div>
                          {p.location ? (
                            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6, ...ellipsisOneLine }}>
                              {p.location}
                            </div>
                          ) : null}
                        </td>

                        {/* Start */}
                        <td style={{ ...tdBase, whiteSpace: "nowrap" }}>{fmtDate(p.created_at)}</td>

                        {/* Install */}
                        <td style={tdBase}>
                          <div style={{ ...wrapText, fontSize: 13 }}>
                            {formatInstallLabel(p.install_date, p.install_slot)}
                          </div>
                        </td>

                        {/* Assignee */}
                        <td style={tdBase}>
                          <div style={{ fontWeight: 700, ...ellipsisOneLine }}>{assigneeName}</div>
                          <div style={{ fontSize: 12, opacity: 0.7, ...ellipsisOneLine }}>
                            {assigneeEmail || " "}
                          </div>
                        </td>

                        {/* Customer */}
                        <td style={tdBase}>
                          <div style={{ fontWeight: 700, ...ellipsisOneLine }}>{customerName}</div>
                          <div style={{ fontSize: 12, opacity: 0.7, ...ellipsisOneLine }}>{customerEmail}</div>
                          <div style={{ marginTop: 8 }}>
                            {canViewUser ? (
                              <Link
                                to={`/admin/users/${p.user.id}`}
                                className="btn btn-secondary"
                                style={{ fontSize: 12, padding: "6px 10px" }}
                              >
                                View Profile
                              </Link>
                            ) : (
                              <span style={{ fontSize: 12, opacity: 0.7 }}>—</span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={tdBase}>
                          <select
                            value={p.status || "draft"}
                            onChange={(e) => handleFieldChange(p.id, { status: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "0.55rem 0.65rem",
                              borderRadius: 10,
                              border: "1px solid #e5e7eb",
                              fontWeight: 800,
                              fontSize: 13,
                            }}
                          >
                            {PROJECT_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {statusLabel(s)}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Invoice */}
                        <td style={tdBase}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                              width: "100%",
                              fontSize: 12,
                              padding: "7px 8px",
                              opacity: 0.6,
                              cursor: "not-allowed",
                            }}
                            disabled
                            title="Invoice system coming soon"
                          >
                            View Invoice
                          </button>
                        </td>

                        {/* Duration */}
                        <td style={{ ...tdBase, whiteSpace: "nowrap" }}>
                          {durationDays(p.created_at, p.updated_at, p.status)}
                        </td>

                        {/* Actions */}
                        <td style={tdBase}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <Link
                              className="btn btn-secondary"
                              to={`/admin/projects/${p.id}/files`}
                              style={{ fontSize: 12, padding: "6px 10px" }}
                            >
                              Files
                            </Link>

                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => handleSaveProject(p)}
                              disabled={savingId === p.id}
                              style={{ fontSize: 12, padding: "6px 10px" }}
                            >
                              {savingId === p.id ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
