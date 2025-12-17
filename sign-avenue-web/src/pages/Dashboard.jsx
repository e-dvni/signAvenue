import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

// If you already have an api helper, import it instead.
// Example: import api from "../lib/api";
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token"); // adjust if you store auth differently
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  // Some endpoints might return 204
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  return res.json();
}

const STATUS_LABELS = {
  draft: "Draft",
  in_progress: "In progress",
  ready_for_install: "Ready for install",
  completed: "Completed",
};

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at_desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // If you later add a cancel flow, keep this; for now we won’t define unused state.
  // const [cancelingProjectId, setCancelingProjectId] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        // Customer projects endpoint (should already be scoped to current user)
        const data = await apiFetch("/api/v1/projects");
        if (!mounted) return;

        // normalize expected payload shapes: either {projects: []} or []
        const list = Array.isArray(data) ? data : data?.projects || [];
        setProjects(list);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || "Failed to load projects.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredAndSorted = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = [...projects];

    // filter: search
    if (q) {
      list = list.filter((p) => {
        const name = (p.name || p.title || "").toLowerCase();
        return name.includes(q);
      });
    }

    // filter: status
    if (statusFilter !== "all") {
      list = list.filter((p) => (p.status || "").toLowerCase() === statusFilter);
    }

    // sort + "completed to bottom" rule
    const isCompleted = (p) => (p.status || "").toLowerCase() === "completed";

    const compare = (a, b) => {
      // Always push completed to bottom
      const ac = isCompleted(a);
      const bc = isCompleted(b);
      if (ac !== bc) return ac ? 1 : -1;

      const aname = (a.name || a.title || "").toLowerCase();
      const bname = (b.name || b.title || "").toLowerCase();

      const aCreated = new Date(a.created_at || 0).getTime();
      const bCreated = new Date(b.created_at || 0).getTime();

      const aInstall = new Date(a.install_date || a.installAt || 0).getTime();
      const bInstall = new Date(b.install_date || b.installAt || 0).getTime();

      switch (sortBy) {
        case "name_asc":
          return aname.localeCompare(bname);
        case "name_desc":
          return bname.localeCompare(aname);
        case "status_asc":
          return (a.status || "").localeCompare(b.status || "");
        case "status_desc":
          return (b.status || "").localeCompare(a.status || "");
        case "install_date_asc":
          return aInstall - bInstall;
        case "install_date_desc":
          return bInstall - aInstall;
        case "created_at_asc":
          return aCreated - bCreated;
        case "created_at_desc":
        default:
          return bCreated - aCreated;
      }
    };

    list.sort(compare);
    return list;
  }, [projects, query, statusFilter, sortBy]);

  function toggleExpand(projectId) {
    setExpandedId((prev) => (prev === projectId ? null : projectId));
  }

  function handleOpenScheduleForProject(project) {
    // If you already have a schedule route, link there instead.
    // Example: navigate(`/schedule?projectId=${project.id}`)
    alert(`Schedule install for: ${project.name || project.title || "Project"} (id: ${project.id})`);
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Dashboard</h1>
        <p>Loading projects…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Dashboard</h1>
        <p style={{ color: "crimson" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>My Projects</h1>

      {/* Controls */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 200px 220px", marginTop: 16 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by project name…"
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="in_progress">In progress</option>
          <option value="ready_for_install">Ready for install</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
        >
          <option value="created_at_desc">Newest created</option>
          <option value="created_at_asc">Oldest created</option>
          <option value="name_asc">Name (A → Z)</option>
          <option value="name_desc">Name (Z → A)</option>
          <option value="status_asc">Status (A → Z)</option>
          <option value="status_desc">Status (Z → A)</option>
          <option value="install_date_asc">Install date (soonest)</option>
          <option value="install_date_desc">Install date (latest)</option>
        </select>
      </div>

      {/* List */}
      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {filteredAndSorted.length === 0 ? (
          <p>No projects found.</p>
        ) : (
          filteredAndSorted.map((p) => {
            const name = p.name || p.title || `Project #${p.id}`;
            const status = (p.status || "unknown").toLowerCase();
            const isExpanded = expandedId === p.id;
            const canSchedule = status === "ready_for_install";

            return (
              <div
                key={p.id}
                style={{
                  border: "1px solid #e5e5e5",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(p.id)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{name}</div>
                      <div style={{ fontSize: 13, opacity: 0.75 }}>
                        Status: {STATUS_LABELS[status] || status}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>
                      {p.install_date ? `Install: ${p.install_date}` : ""}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    {/* Example “details” — adjust field names to match your API */}
                    <div style={{ fontSize: 14, opacity: 0.9 }}>
                      <div><strong>Created:</strong> {p.created_at || "—"}</div>
                      <div><strong>Install date:</strong> {p.install_date || "—"}</div>
                      <div><strong>Notes:</strong> {p.notes || "—"}</div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {/* Files link per project */}
                      <Link
                        to={`/projects/${p.id}/files`}
                        style={{
                          display: "inline-block",
                          padding: "8px 12px",
                          borderRadius: 10,
                          border: "1px solid #ccc",
                          textDecoration: "none",
                        }}
                      >
                        View Files
                      </Link>

                      {/* Schedule install only when ready_for_install */}
                      {canSchedule && (
                        <button
                          type="button"
                          onClick={() => handleOpenScheduleForProject(p)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 10,
                            border: "1px solid #ccc",
                            background: "white",
                            cursor: "pointer",
                          }}
                        >
                          Schedule Installation
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
