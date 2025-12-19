import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const API_BASE = "http://localhost:3000";

export default function AdminUsers() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");

  const [sortKey, setSortKey] = useState("name"); // name | email | project | status
  const [sortDir, setSortDir] = useState("asc");  // asc | desc

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/api/v1/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load users.");

        const list = Array.isArray(data) ? data : data?.users || [];
        if (!mounted) return;

        // filter invalid
        setUsers(list.filter((u) => u && u.id));
      } catch (e) {
        if (!mounted) return;
        setError(e.message || "Failed to load users.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (token) load();
    return () => {
      mounted = false;
    };
  }, [token]);

  function toggleSort(nextKey) {
    if (sortKey === nextKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(nextKey);
      setSortDir("asc");
    }
  }

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = [...users];

    if (q) {
      list = list.filter((u) => {
        const name = (u.name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const projectName = (u.latest_project?.name || "").toLowerCase();
        return name.includes(q) || email.includes(q) || projectName.includes(q);
      });
    }

    const getVal = (u) => {
      if (sortKey === "name") return (u.name || "").toLowerCase();
      if (sortKey === "email") return (u.email || "").toLowerCase();
      if (sortKey === "project") return (u.latest_project?.name || "").toLowerCase();
      if (sortKey === "status") return (u.latest_project?.status || "").toLowerCase();
      return "";
    };

    list.sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [users, query, sortKey, sortDir]);

  const sortArrow = (key) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  if (user?.role !== "admin") {
    return (
      <div style={{ padding: 24 }}>
        <h1>Admin</h1>
        <p style={{ color: "crimson" }}>Admin only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Users</h1>
        <p>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Users</h1>
        <p style={{ color: "crimson" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h1>Users</h1>

      <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, or project…"
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
            width: "100%",
            maxWidth: 520,
          }}
        />
        <div style={{ fontSize: 13, opacity: 0.75 }}>
          {filteredSorted.length} user{filteredSorted.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Scrollable table container */}
      <div
        style={{
          marginTop: 16,
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ maxHeight: 520, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: "white", zIndex: 1 }}>
              <tr>
                <th
                  onClick={() => toggleSort("name")}
                  style={thStyle}
                  title="Sort by name"
                >
                  Name{sortArrow("name")}
                </th>
                <th
                  onClick={() => toggleSort("email")}
                  style={thStyle}
                  title="Sort by email"
                >
                  Email{sortArrow("email")}
                </th>
                <th
                  onClick={() => toggleSort("project")}
                  style={thStyle}
                  title="Sort by project"
                >
                  Project{sortArrow("project")}
                </th>
                <th
                  onClick={() => toggleSort("status")}
                  style={thStyle}
                  title="Sort by status"
                >
                  Status{sortArrow("status")}
                </th>
                <th style={{ ...thStyle, cursor: "default" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredSorted.map((u) => {
                const lp = u.latest_project;
                const projectIsCompleted = (lp?.status || "").toLowerCase() === "completed";

                // Your rule:
                // - If no project OR if completed -> show blank project name
                const projectNameToShow = !lp || projectIsCompleted ? "" : (lp.name || "");

                return (
                  <tr key={u.id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={tdStyle}>{u.name || `User #${u.id}`}</td>
                    <td style={tdStyle}>{u.email}</td>
                    <td style={tdStyle}>{projectNameToShow}</td>
                    <td style={tdStyle}>{lp?.status || ""}</td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/users/${u.id}`)}
                        style={btnStyle}
                      >
                        Create Project
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredSorted.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 16, opacity: 0.75 }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ marginTop: 10, fontSize: 13, opacity: 0.7 }}>
        Tip: click a column header to sort.
      </p>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "12px 12px",
  fontSize: 13,
  opacity: 0.85,
  borderBottom: "1px solid #eee",
  cursor: "pointer",
  userSelect: "none",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px 12px",
  fontSize: 14,
  whiteSpace: "nowrap",
};

const btnStyle = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #222",
  background: "#222",
  color: "white",
  cursor: "pointer",
  fontSize: 13,
};
