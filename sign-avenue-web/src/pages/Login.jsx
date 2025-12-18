import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // normal login success
        login(data.user, data.token);
        navigate("/dashboard");
        return;
      }

      // If backend says email not confirmed, send them to verify page
      if (data?.needs_verification) {
        navigate(`/verify-email?email=${encodeURIComponent(data.email || form.email)}`);
        return;
      }

      setError(data.error || "Invalid email or password");
    } catch {
      setError("Unable to reach server. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h1>Customer Login</h1>

      <p style={{ opacity: 0.85 }}>
        Don&apos;t have an account? <Link to="/signup">Sign up</Link>
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Email<br />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
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
            />
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </section>
  );
};

export default Login;
