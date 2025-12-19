import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const email = form.email.trim().toLowerCase();

    try {
      const res = await fetch("http://localhost:3000/api/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: form.password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        login(data.user, data.token);

        // ✅ Role-based landing
        if (data.user?.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
        return;
      }

      // ✅ If not verified, redirect to verify-email
      if (data?.needs_verification) {
        navigate(`/verify-email?email=${encodeURIComponent(data.email || email)}`);
        return;
      }

      setError(data?.error || "Invalid email or password");
    } catch {
      setError("Unable to reach server. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ maxWidth: 520, margin: "0 auto", padding: 24 }}>
      <h1>Login</h1>

      <p style={{ opacity: 0.85 }}>
        Don&apos;t have an account? <Link to="/signup">Sign up</Link>
      </p>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <div>
          <label>
            Email<br />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            />
          </label>
        </div>

        <div>
          <label>
            Password<br />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #222",
            background: "#222",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </section>
  );
};

export default Login;
