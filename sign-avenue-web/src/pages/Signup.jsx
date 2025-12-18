import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3000";

export default function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordHint = useMemo(() => {
    if (!password) return "";
    if (password.length < 8) return "Password should be at least 8 characters.";
    return "";
  }, [password]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim()) return setError("Email is required.");
    if (!firstName.trim()) return setError("First name is required.");
    if (!lastName.trim()) return setError("Last name is required.");
    if (!password) return setError("Password is required.");
    if (password !== passwordConfirmation) return setError("Passwords do not match.");

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/v1/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            email: email.trim(),
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            password,
            password_confirmation: passwordConfirmation,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.error ||
          (Array.isArray(data?.errors) ? data.errors.join(", ") : null) ||
          "Signup failed.";
        throw new Error(msg);
      }

      // Backend returns: { needs_verification: true, email: "..." }
      if (data?.needs_verification) {
        navigate(`/verify-email?email=${encodeURIComponent(data.email || email.trim())}`);
        return;
      }

      // If you ever change backend to auto-login, handle it here:
      navigate("/login");
    } catch (err) {
      setError(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleSignup() {
    // Placeholder: we’ll wire this after Google backend is added.
    alert("Google sign-in will be added next.");
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 24 }}>
      <h1>Create Account</h1>
      <p style={{ opacity: 0.8 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>

      {error && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 10, border: "1px solid #f5c2c7", background: "#f8d7da" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
          />
        </label>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>First name</span>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              type="text"
              autoComplete="given-name"
              placeholder="First"
              style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Last name</span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              type="text"
              autoComplete="family-name"
              placeholder="Last"
              style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            />
          </label>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            placeholder="Create a password"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
          />
          {passwordHint && <span style={{ fontSize: 12, opacity: 0.8 }}>{passwordHint}</span>}
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Confirm password</span>
          <input
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            type="password"
            autoComplete="new-password"
            placeholder="Confirm password"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
          />
        </label>

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
          {loading ? "Creating..." : "Create account"}
        </button>

        <div style={{ textAlign: "center", opacity: 0.7 }}>or</div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ccc",
            background: "white",
            cursor: "pointer",
          }}
        >
          Continue with Google
        </button>
      </form>
    </div>
  );
}
