import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AdminLayout from "../components/AdminLayout";

const API_BASE = "http://localhost:3000";

export default function AdminUsers() {
  const { token, user } = React.useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");

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

        if (!mounted) return;
        setUsers(Array.isArray(data) ? data : data?.users || []);
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

  const filteredAndSorted = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = Array.isArray(users) ? [...users] : [];

    if (q) {
      list = list.filter((u) => {
        const name = (u.name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }

    // Alphabetical by name (fallback to email)
    list.sort((a, b) => {
      const an = (a?.name || "").trim().toLowerCase();
      const bn = (b?.name || "").trim().toLowerCase();
      if (an && bn) return an.localeCompare(bn);
      if (an) return -1;
      if (bn) return 1;
      return (a?.email || "").toLowerCase().localeCompare((b?.email || "").toLowerCase());
    });

    return list;
  }, [users, query]);

  if (user?.role !== "admin") {
    return (
      <AdminLayout title="Users">
        <p style={{ color: "crimson" }}>Admin only.</p>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="Users" subtitle="Search and manage customer accounts.">
        <p>Loading…</p>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Users">
        <p style={{ color: "crimson" }}>{error}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Users" subtitle="Click a user to view their profile and projects.">
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email…"
            style={{
              padding: 10,
              borderRadius: 10,
              border: "1px solid #d1d5db",
              width: "100%",
              maxWidth: 520,
            }}
          />
          <div style={{ fontSize: 13, opacity: 0.75, whiteSpace: "nowrap" }}>
            Total: <strong>{filteredAndSorted.length}</strong>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {filteredAndSorted.length === 0 ? (
            <p>No users found.</p>
          ) : (
            filteredAndSorted.map((u) => (
              <Link
                key={u.id}
                to={`/admin/users/${u.id}`}
                style={{
                  display: "block",
                  padding: 14,
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                  background: "white",
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>
                  {u.name || `User #${u.id}`}
                </div>
                <div style={{ marginTop: 6, opacity: 0.85, fontSize: 13 }}>
                  {u.email}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                  Role: {u.role || "customer"}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
