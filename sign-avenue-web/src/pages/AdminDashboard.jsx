import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AdminLayout from "../components/AdminLayout";

const API_BASE = "http://localhost:3000/api/v1";

const AdminDashboard = () => {
  const { user, token } = useAuth();

  const [contactRequests, setContactRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [reqRes, projRes, usersRes] = await Promise.all([
          fetch(`${API_BASE}/admin/contact_requests`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/admin/projects`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/admin/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const reqData = await reqRes.json().catch(() => ([]));
        const projData = await projRes.json().catch(() => ([]));
        const usersData = await usersRes.json().catch(() => ([]));

        if (!reqRes.ok) throw new Error(reqData?.error || "Failed to load contact requests");
        if (!projRes.ok) throw new Error(projData?.error || "Failed to load projects");
        if (!usersRes.ok) throw new Error(usersData?.error || "Failed to load users");

        setContactRequests(Array.isArray(reqData) ? reqData : reqData?.contact_requests || []);
        setProjects(Array.isArray(projData) ? projData : projData?.projects || []);
        setUsers(Array.isArray(usersData) ? usersData : usersData?.users || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load admin data.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "admin") {
      fetchAdminData();
    } else {
      setLoading(false);
      setError("You are not authorized to view this page.");
    }
  }, [token, user]);

  // --- Counts (frontend fallback) ---
  const unopenedContactCount = useMemo(() => {
    // Your ContactRequest model has `status`.
    // We'll treat these as "unopened": nil, "", "new", "unopened"
    return contactRequests.filter((cr) => {
      const s = (cr?.status || "").toString().toLowerCase();
      return s === "" || s === "new" || s === "unopened" || s === "open";
    }).length;
  }, [contactRequests]);

  const ongoingProjectsCount = useMemo(() => {
    // Ongoing = anything not completed
    return projects.filter((p) => (p?.status || "").toString().toLowerCase() !== "completed").length;
  }, [projects]);

  const usersCount = users.length;

  // Placeholder until invoices exist
  const accountsReceivableDisplay = "$0";

  if (loading) {
    return (
      <AdminLayout title="Admin Dashboard" subtitle="Overview of your admin activity.">
        <p>Loading admin dashboard...</p>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Admin Dashboard">
        <p className="admin-error">{error}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Quick overview of Sign Avenue operations."
    >
      {/* Summary cards ONLY */}
      <div className="admin-summary-grid">
        <Link
          to="/admin/contact-requests"
          className="admin-card"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <p className="admin-card-label">Contact Requests</p>
          <p className="admin-card-value">{unopenedContactCount}</p>
          <p className="admin-card-hint">Unopened requests that need attention.</p>
        </Link>

        <Link
          to="/admin/projects"
          className="admin-card"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <p className="admin-card-label">Ongoing Projects</p>
          <p className="admin-card-value">{ongoingProjectsCount}</p>
          <p className="admin-card-hint">Projects not marked completed.</p>
        </Link>

        <Link
          to="/admin/users"
          className="admin-card"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <p className="admin-card-label">Users</p>
          <p className="admin-card-value">{usersCount}</p>
          <p className="admin-card-hint">Customers in your system.</p>
        </Link>

        {/* Placeholder link until we build billing */}
        <Link
          to="/admin"
          className="admin-card"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <p className="admin-card-label">Accounts Receivable</p>
          <p className="admin-card-value">{accountsReceivableDisplay}</p>
          <p className="admin-card-hint">Unpaid invoices (coming soon).</p>
        </Link>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
