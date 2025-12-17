import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

const STATUSES = [
  "draft",
  "quote_sent",
  "in_production",
  "ready_for_install",
  "scheduled",
  "installed",
  "completed",
  "cancelled",
];

const AdminProjects = () => {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState("name"); // name | status | created_at | install_date
  const [sortDir, setSortDir] = useState("asc");

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);

  const apiBase = "http://localhost:3000/api/v1";

  useEffect(() => {
    const fetchProjects = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${apiBase}/admin/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load projects.");

        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Unable to load projects.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
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
      const res = await fetch(`${apiBase}/admin/projects/${project.id}`, {
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

      const data = await res.json();
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
      list = list.filter((p) => (p.name || "").toLowerCase().includes(q));
    }
    if (statusFilter) {
      list = list.filter((p) => p.status === statusFilter);
    }

    const dir = sortDir === "asc" ? 1 : -1;

    list.sort((a, b) => {
      // Put completed at the bottom (regardless of sort)
      const aCompleted = a.status === "completed";
      const bCompleted = b.status === "completed";
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;

      if (sortKey === "install_date") {
        const ad = a.install_date ? new Date(a.install_date).getTime() : 0;
        const bd = b.install_date ? new Date(b.install_date).getTime() : 0;
        return (ad - bd) * dir;
      }

      if (sortKey === "created_at") {
        const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
        return (ad - bd) * dir;
      }

      const as = (a?.[sortKey] ?? "").toString().toLowerCase();
      const bs = (b?.[sortKey] ?? "").toString().toLowerCase();
      if (as < bs) return -1 * dir;
      if (as > bs) return 1 * dir;
      return 0;
    });

    return list;
  }, [projects, search, statusFilter, sortKey, sortDir]);

  if (loading) {
    return (
      <AdminLayout title="Projects" subtitle="All customer sign projects managed by Sign Avenue.">
        <section className="admin-section">
          <p className="admin-empty-state">Loading projects...</p>
        </section>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Projects" subtitle="All customer sign projects managed by Sign Avenue.">
        <section className="admin-section">
          <p className="admin-empty-state">{error}</p>
        </section>
      </AdminLayout>
    );
  }

  if (!user || !token) {
    return (
      <AdminLayout title="Projects" subtitle="All customer sign projects managed by Sign Avenue.">
        <section className="admin-section">
          <p className="admin-empty-state">You must be logged in to view this page.</p>
        </section>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Projects" subtitle="Project tracker for all customers.">
      <section className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2 className="admin-section-title">Project Tracker</h2>
            <p style={{ margin: "6px 0 0", opacity: 0.75 }}>
              Search, filter, sort, and update project status.
            </p>
          </div>
          <span className="admin-section-badge">{visibleProjects.length}</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12, alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search by project name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "0.6rem 0.8rem", borderRadius: 10, border: "1px solid #e5e7eb", minWidth: 260 }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "0.6rem 0.8rem", borderRadius: 10, border: "1px solid #e5e7eb" }}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            style={{ padding: "0.6rem 0.8rem", borderRadius: 10, border: "1px solid #e5e7eb" }}
          >
            <option value="name">Sort: Name</option>
            <option value="status">Sort: Status</option>
            <option value="created_at">Sort: Date created</option>
            <option value="install_date">Sort: Install date</option>
          </select>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          >
            {sortDir === "asc" ? "Asc" : "Desc"}
          </button>
        </div>

        {visibleProjects.length === 0 ? (
          <p className="admin-empty-state" style={{ marginTop: 14 }}>
            No projects match your filters.
          </p>
        ) : (
          <ul className="admin-list" style={{ marginTop: 14 }}>
            {visibleProjects.map((p) => {
              const isExpanded = expandedId === p.id;

              return (
                <li key={p.id} className="admin-list-item">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                    <button
                      type="button"
                      onClick={() => setExpandedId((cur) => (cur === p.id ? null : p.id))}
                      style={{
                        flex: 1,
                        textAlign: "left",
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                      }}
                    >
                      <p className="admin-list-item-title">
                        {p.name || `Project #${p.id}`}
                        {p.status && <span className="admin-status-badge">{p.status}</span>}
                      </p>

                      <p className="admin-list-item-subtitle">
                        {p.user ? `${p.user.name} (${p.user.email})` : "Unassigned"}
                      </p>

                      <p className="admin-list-item-body">
                        Install: {formatInstallLabel(p.install_date, p.install_slot)}
                      </p>

                      {p.location && (
                        <p className="admin-list-item-body">
                          Location: {p.location}
                        </p>
                      )}
                    </button>

                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <label style={{ fontSize: "0.85rem", display: "inline-flex", flexDirection: "column", gap: "0.25rem" }}>
                        Status
                        <select
                          value={p.status || ""}
                          onChange={(e) => handleFieldChange(p.id, { status: e.target.value })}
                          style={{ fontSize: "0.85rem", padding: "0.35rem 0.5rem", borderRadius: 8 }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleSaveProject(p)}
                        disabled={savingId === p.id}
                        className="btn btn-primary"
                        style={{ fontSize: "0.85rem" }}
                      >
                        {savingId === p.id ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
                      {p.description && (
                        <p className="admin-list-item-body" style={{ marginTop: 6 }}>
                          <strong>Description:</strong> {p.description}
                        </p>
                      )}

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                        <Link className="btn btn-secondary" to={`/admin/projects/${p.id}/files`}>
                          Manage Files
                        </Link>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setExpandedId(null)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AdminLayout>
  );
};

export default AdminProjects;
