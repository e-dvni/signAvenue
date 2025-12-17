// src/components/Layout.jsx
import { useState, useRef, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Layout = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dashboard route depends on role
  const dashboardPath = user?.role === "admin" ? "/admin" : "/dashboard";

  // Initial for the profile circle
  const userInitial = (user?.name || user?.email || "U")[0].toUpperCase();

return (
    <div>
        {/* Gradient text hover style (only for nav links, not the home logo) */}
        <style>{`
            .gradient-hover {
                position: relative;
                color: inherit;
                text-decoration: none;
                transition: background-position 0.35s ease, color 0.2s ease;
                -webkit-text-fill-color: currentColor;
            }
            .gradient-hover:hover,
            .gradient-hover:focus {
                background-image: linear-gradient(90deg, #10B981 0%, #3B82F6 100%);
                background-size: 200% auto;
                background-position: 0% 0;
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
                color: transparent;
                outline: none;
            }
        `}</style>

        {/* Gradient border wrapper */}
        <div>
            <header
                className="site-header"
                style={{
                    padding: "0.5rem 1rem",
                    borderBottom: "1px solid #ddd",
                    display: "flex",
                    alignItems: "center",
                    boxSizing: "border-box",
                    lineHeight: 1,
                    position: "relative",
                    backgroundColor: "#ffffff", // inner background
                    borderRadius: "10px", // slightly smaller than wrapper to reveal gradient border
                }}
            >
                <nav
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        position: "relative",
                    }}
                >
                    {/* Centered group: left links, logo, right links */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "2rem", // space between left-links, logo, right-links
                            transform: "translateX(-11px)", // shift nav links slightly to the left
                        }}
                    >
                        {/* Left of logo: Services & Portfolio */}
                        <div
                            style={{
                                display: "flex",
                                gap: "1.5rem",
                                alignItems: "center",
                            }}
                        >
                            <Link to="/services" className="gradient-hover">Services</Link>
                            <Link to="/portfolio" className="gradient-hover">Portfolio</Link>
                        </div>

                        {/* Center: Logo (Home) */}
                        <Link
                            to="/"
                            aria-label="Home"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0.15rem 0.25rem",
                                borderRadius: "0.5rem",
                                textDecoration: "none",
                            }}
                        >
                            <img
                                src="/images/LOGO.png"
                                alt="Sign Avenue Logo"
                                style={{ height: "50px", width: "auto", margin: 0 }}
                            />
                        </Link>

                        {/* Right of logo: About & Contact */}
                        <div
                            style={{
                                display: "flex",
                                gap: "1.5rem",
                                alignItems: "center",
                            }}
                        >
                            <Link to="/about" className="gradient-hover">About</Link>
                            <Link to="/contact" className="gradient-hover">Contact</Link>
                        </div>
                    </div>
                </nav>

                {/* Auth controls at the far right */}
                <div
                    style={{
                        position: "absolute",
                        right: "1rem",
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    {user ? (
                        <div
                            ref={profileRef}
                            style={{ position: "relative", display: "inline-block" }}
                        >
                            <button
                                type="button"
                                onClick={() => setMenuOpen((open) => !open)}
                                style={{
                                    border: "none",
                                    // gradient border around the account icon
                                    background: "linear-gradient(90deg, #10B981 0%, #3B82F6 100%)",
                                    padding: "2px", // thickness of miniature gradient border
                                    borderRadius: "999px",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <div
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "999px",
                                        backgroundColor: "#000000ff",
                                        color: "#ffffffff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "0.9rem",
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {userInitial}
                                </div>
                            </button>

                            {menuOpen && (
                                <div
                                    style={{
                                        position: "absolute",
                                        right: 0,
                                        marginTop: "0.5rem",
                                        backgroundColor: "#ffffff",
                                        borderRadius: "0.5rem",
                                        border: "1px solid #e5e7eb",
                                        boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
                                        minWidth: "160px",
                                        zIndex: 50,
                                    }}
                                >
                                    <Link
                                        to={dashboardPath}
                                        onClick={() => setMenuOpen(false)}
                                        style={{
                                            display: "block",
                                            padding: "0.5rem 0.85rem",
                                            fontSize: "0.9rem",
                                            color: "#111827",
                                            textDecoration: "none",
                                        }}
                                    >
                                        Dashboard
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            logout();
                                        }}
                                        style={{
                                            width: "100%",
                                            textAlign: "left",
                                            padding: "0.5rem 0.85rem",
                                            fontSize: "0.9rem",
                                            border: "none",
                                            background: "transparent",
                                            cursor: "pointer",
                                            color: "#6b7280",
                                        }}
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                            }}
                        >
                            <Link
                                to="/signup"
                                style={{
                                    color: "#111827",
                                    textDecoration: "none",
                                    fontSize: "0.95rem",
                                    fontWeight: 500,
                                }}
                            >
                                Sign Up
                            </Link>
                            <Link
                                to="/login"
                                style={{
                                    padding: "0.4rem 0.9rem",
                                    borderRadius: "999px",
                                    backgroundColor: "#111827",
                                    color: "#ffffff",
                                    textDecoration: "none",
                                    fontSize: "0.9rem",
                                    fontWeight: 500,
                                }}
                            >
                                Log In
                            </Link>
                        </div>
                    )}
                </div>
            </header>
        </div>

        <main style={{ padding: "0 1rem 1rem" }}>
            <Outlet />
        </main>
    </div>
);
};

export default Layout;
