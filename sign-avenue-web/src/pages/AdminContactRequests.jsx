import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import AdminLayout from "../components/AdminLayout";

const AdminContactRequests = () => {
  const { user, token } = useAuth();
  const [contactRequests, setContactRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          "http://localhost:3000/api/v1/admin/contact_requests",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load contact requests");
        }

        setContactRequests(data);
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
      subtitle="All inquiries submitted via the Sign Avenue website."
    >
      <section className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">All Requests</h2>
          <span className="admin-section-badge">
            {contactRequests.length}
          </span>
        </div>

        {contactRequests.length === 0 ? (
          <p className="admin-empty-state">No contact requests yet.</p>
        ) : (
          <ul className="admin-list">
            {contactRequests.map((cr) => (
              <li key={cr.id} className="admin-list-item">
                <div className="admin-list-item-main">
                  <p className="admin-list-item-title">
                    {cr.name}{" "}
                    {cr.city && (
                      <span className="admin-list-item-tag">{cr.city}</span>
                    )}
                  </p>

                  <p className="admin-list-item-subtitle">
                    {cr.email} {cr.phone && `• ${cr.phone}`}
                  </p>

                  {cr.business_name && (
                    <p className="admin-list-item-body">
                      Business: {cr.business_name}
                    </p>
                  )}

                  {cr.message && (
                    <p className="admin-list-item-body">{cr.message}</p>
                  )}

                  {/* ✅ Step 3a: Show attachment link if one exists */}
                  {cr.file_url && (
                    <p className="admin-list-item-body">
                      <a
                        href={cr.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-file-link"
                      >
                        📎 View Attachment
                      </a>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminLayout>
  );
};

export default AdminContactRequests;
