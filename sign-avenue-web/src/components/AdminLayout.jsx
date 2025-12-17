import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const AdminLayout = ({ title, subtitle, children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <section className="admin-page">
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-logo">
            <span className="admin-logo-mark">SA</span>
            <span className="admin-logo-text">Sign Avenue</span>
          </div>

          <nav className="admin-nav">
            <p className="admin-nav-section-label">Admin</p>
            <ul className="admin-nav-list">
                <li
                    className={
                        "admin-nav-item" +
                        (isActive("/admin") ? " admin-nav-item--active" : "")
                    }
                >
                    <Link to="/admin" className="admin-nav-link">
                        Dashboard
                    </Link>
                </li>
                <li
                    className={
                        "admin-nav-item" +
                        (isActive("/admin/contact-requests")
                        ? " admin-nav-item--active"
                        : "")
                    }
                >
                    <Link to="/admin/contact-requests" className="admin-nav-link">
                        Contact Requests
                    </Link>
                </li>
                <li
                    className={
                        "admin-nav-item" +
                        (isActive("/admin/projects") ? " admin-nav-item--active" : "")
                    }
                >
                    <Link to="/admin/projects" className="admin-nav-link">
                        Projects
                    </Link>
                </li>
                <li
                    className={
                        "admin-nav-item" +
                        (isActive("/admin/schedule") ? " admin-nav-item--active" : "")
                    }
                >
                    <Link to="/admin/schedule" className="admin-nav-link">
                        Schedule
                    </Link>
                </li>
            </ul>
          </nav>

          <div className="admin-sidebar-footer">
            <p className="admin-sidebar-user">
              Logged in as<br />
              <strong>{user?.name}</strong>
            </p>
            <Link to="/dashboard" className="admin-sidebar-link">
              View customer dashboard
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <div className="admin-main">
          <header className="admin-header">
            <div>
              <h1 className="admin-title">{title}</h1>
              {subtitle && <p className="admin-subtitle">{subtitle}</p>}
            </div>
          </header>

          <div className="admin-content">{children}</div>
        </div>
      </div>
    </section>
  );
};

export default AdminLayout;
