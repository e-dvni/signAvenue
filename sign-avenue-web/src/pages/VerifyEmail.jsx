import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3000";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function VerifyEmail() {
  const navigate = useNavigate();
  const query = useQuery();

  const [email, setEmail] = useState(query.get("email") || "");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // If someone lands here without an email in the query, send them to signup
  useEffect(() => {
    const qEmail = query.get("email");
    if (qEmail && !email) setEmail(qEmail);

    if (!qEmail && !email) {
      navigate("/signup");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanEmail = email.trim();
  const canVerify = code.length === 6 && /^\d{6}$/.test(code);

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!cleanEmail) return setError("Email is required.");
    if (!canVerify) return setError("Enter the 6-digit code.");

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/v1/users/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, code }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // If already confirmed, treat as success UX-wise
        if (data?.message?.toLowerCase().includes("already confirmed")) {
          setInfo("Email already confirmed. Redirecting to login…");
          setTimeout(() => navigate("/login"), 600);
          return;
        }

        throw new Error(data?.error || "Verification failed.");
      }

      setInfo("Email confirmed! Redirecting to login…");
      setTimeout(() => navigate("/login"), 600);
    } catch (err) {
      setError(err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setInfo("");

    if (!cleanEmail) return setError("Email is required.");

    try {
      setResending(true);

      const res = await fetch(`${API_BASE}/api/v1/users/resend-confirmation-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(data?.error || "Too many codes sent. Please wait and try again.");
        }
        throw new Error(data?.error || "Could not resend code.");
      }

      setInfo("Confirmation code sent. Check your email.");
    } catch (err) {
      setError(err.message || "Could not resend code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 24 }}>
      <h1>Verify your email</h1>

      <p style={{ opacity: 0.85 }}>
        Enter the 6-digit code we sent to your email.
      </p>

      <p style={{ opacity: 0.85 }}>
        Back to <Link to="/login">Log in</Link> • Need an account? <Link to="/signup">Sign up</Link>
      </p>

      {error && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 10, border: "1px solid #f5c2c7", background: "#f8d7da" }}>
          {error}
        </div>
      )}

      {info && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 10, border: "1px solid #badbcc", background: "#d1e7dd" }}>
          {info}
        </div>
      )}

      <form onSubmit={handleVerify} style={{ marginTop: 16, display: "grid", gap: 12 }}>
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
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            Wrong email? Change it here, then click “Resend code”.
          </span>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Confirmation code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc", letterSpacing: 3 }}
          />
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            Tip: codes can start with 0 — keep it as text.
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || !canVerify}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #222",
            background: "#222",
            color: "white",
            cursor: loading || !canVerify ? "not-allowed" : "pointer",
            opacity: loading || !canVerify ? 0.7 : 1,
          }}
        >
          {loading ? "Verifying..." : "Verify email"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ccc",
            background: "white",
            cursor: resending ? "not-allowed" : "pointer",
            opacity: resending ? 0.7 : 1,
          }}
        >
          {resending ? "Resending..." : "Resend code"}
        </button>
      </form>
    </div>
  );
}
