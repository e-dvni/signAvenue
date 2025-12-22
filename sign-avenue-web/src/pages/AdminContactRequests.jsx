import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AdminLayout from "../components/AdminLayout";

const API_BASE = "http://localhost:3000/api/v1";

const isUnread = (cr) => {
  const s = (cr?.status || "").toString().toLowerCase();
  return s === "" || s === "new" || s === "unopened";
};

const AdminContactRequests = () => {
  const { user, token } = useAuth();

  const [contactRequests, setContactRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | unread | opened
  const [sort, setSort] = useState("newest"); // newest | oldest

  useEffect(() => {
    const fetchRequests = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/admin/contact_requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json().catch(() => ([]));
        if (!res.ok) throw new Error(data?.error || "Failed to load contact requests");

        setContactRequests(Array.isArray(data) ? data : data?.contact_requests || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load contact requests.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "admin") {
      fetchRequests();
    } else {
      setLoading(false);
      setError("You are not authorized to view this page.");
    }
  }, [token, user]);

  const unreadCount = useMemo(
    () => contactRequests.filter((cr) => isUnread(cr)).length,
    [contactRequests]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = [...contactRequests];

    if (filter === "unread") list = list.filter((cr) => isUnread(cr));
    if (filter === "opened") list = list.filter((cr) => !isUnread(cr));

    if (q) {
      list = list.filter((cr) => {
        const name = (cr?.name || "").toLowerCase();
        const email = (cr?.email || "").toLowerCase();
        const city = (cr?.city || "").toLowerCase();
        return name.includes(q) || email.includes(q) || city.includes(q);
      });
    }

    list.sort((a, b) => {
      const at = new Date(a?.created_at || 0).getTime();
      const bt = new Date(b?.created_at || 0).getTime();
      return sort === "oldest" ? at - bt : bt - at;
    });

    return list;
  }, [contactRequests, query, filter, sort]);

  if (loading) {
    return (
      <AdminLayout title="Contact Requests" subtitle="All leads from the website.">
        <p>Loading contact requests...</p>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Contact Requests">
        <p className="admin-error">{error}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Contact Requests"
      subtitle="Inbox-style view. Unopened requests are highlighted."
    >
      <section className="admin-section">
        <div
          className="admin-section-header"
          style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}
        >
          <div>
            <h2 className="admin-section-title" style={{ margin: 0 }}>Inbox</h2>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
              Unopened: <strong>{unreadCount}</strong> • Total: <strong>{contactRequests.length}</strong>
            </div>
          </div>
          <span className="admin-section-badge">{filtered.length}</span>
        </div>

        {/* Controls */}
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 180px 180px", marginTop: 14 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, or city…"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
          >
            <option value="all">All</option>
            <option value="unread">Unopened</option>
            <option value="opened">Opened</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        {/* List */}
        <div style={{ marginTop: 16 }}>
          {filtered.length === 0 ? (
            <p className="admin-empty-state">No contact requests found.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {filtered.map((cr) => {
                const unread = isUnread(cr);

                return (
                  <li key={cr.id}>
                    <Link
                      to={`/admin/contact-requests/${cr.id}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        textDecoration: "none",
                        color: "inherit",
                        background: unread ? "white" : "#fafafa",
                        fontWeight: unread ? 700 : 500,
                        opacity: unread ? 1 : 0.75,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {cr.name || "Unknown"}
                          </div>
                          {cr.city && (
                            <span
                              style={{
                                fontSize: 12,
                                padding: "2px 8px",
                                borderRadius: 999,
                                border: "1px solid #ddd",
                                opacity: 0.8,
                                fontWeight: 600,
                              }}
                            >
                              {cr.city}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4, fontWeight: unread ? 600 : 400 }}>
                          {cr.email || "—"}
                        </div>
                      </div>

                      <div style={{ fontSize: 12, opacity: 0.7, flexShrink: 0 }}>
                        {cr.created_at ? new Date(cr.created_at).toLocaleString() : ""}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </AdminLayout>
  );
};

export default AdminContactRequests;
