"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signUp,
  confirmSignUp,
  resendCode,
  signIn,
  forgotPassword,
  confirmNewPassword,
} from "@/lib/cognito-business";

// ─── Styles ────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px", borderRadius: 12,
  border: "1px solid #E8E3DB", background: "#F9F6F2",
  fontSize: 14, color: "#1E1E1E", outline: "none", transition: "border 0.2s",
  boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "#6B6B6B", marginBottom: 6,
};
const btnPrimary: React.CSSProperties = {
  width: "100%", padding: "14px 0", borderRadius: 12,
  background: "#A51C30", color: "#fff", fontWeight: 600,
  fontSize: 14, border: "none", cursor: "pointer", transition: "opacity 0.2s",
};
const btnLink: React.CSSProperties = {
  background: "none", border: "none", fontSize: 13,
  color: "#A51C30", cursor: "pointer", padding: 4, fontWeight: 500,
};
const errorStyle: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 10, fontSize: 13,
  background: "rgba(165,28,48,0.06)", color: "#A51C30",
  border: "1px solid rgba(165,28,48,0.12)", marginBottom: 8,
};
const successStyle: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 10, fontSize: 13,
  background: "rgba(16,185,129,0.06)", color: "#10b981",
  border: "1px solid rgba(16,185,129,0.12)", marginBottom: 8,
};

type View = "login" | "signup" | "verify" | "forgot" | "reset";

const categories = [
  "Food & Drink", "Retail", "Services", "Entertainment",
  "Health & Fitness", "Education", "Auto", "Other",
];

export function LoginForm() {
  const router = useRouter();
  const [view, setView] = useState<View>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("Food & Drink");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  function clearMessages() { setError(""); setSuccess(""); }

  // ─── Login ─────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const result = await signIn(email, password);
      // Store tokens in cookie via API route
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cognito-login",
          idToken: result.idToken,
          email: result.email,
          businessName: result.businessName,
          sub: result.sub,
        }),
      });
      router.push("/ads/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const cognitoErr = err as { code?: string; message?: string };
      if (cognitoErr.code === "UserNotConfirmedException") {
        setView("verify");
        setError("Please verify your email first.");
      } else {
        setError(cognitoErr.message || "Login failed");
      }
    }
    setLoading(false);
  }

  // ─── Sign Up ───────────────────────────────────────────
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    if (password !== confirmPw) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await signUp({ email, password, businessName, address, category, phone });
      setView("verify");
      setSuccess("Account created! Check your email for a verification code.");
    } catch (err: unknown) {
      const cognitoErr = err as { message?: string };
      setError(cognitoErr.message || "Signup failed");
    }
    setLoading(false);
  }

  // ─── Verify Email ──────────────────────────────────────
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      await confirmSignUp(email, code);
      setSuccess("Email verified! You can now log in.");
      setView("login");
      setCode("");
    } catch (err: unknown) {
      const cognitoErr = err as { message?: string };
      setError(cognitoErr.message || "Verification failed");
    }
    setLoading(false);
  }

  async function handleResend() {
    clearMessages();
    try {
      await resendCode(email);
      setSuccess("New code sent to your email.");
    } catch (err: unknown) {
      const cognitoErr = err as { message?: string };
      setError(cognitoErr.message || "Failed to resend code");
    }
  }

  // ─── Forgot Password ──────────────────────────────────
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    if (!email) { setError("Enter your email first"); return; }
    setLoading(true);
    try {
      await forgotPassword(email);
      setView("reset");
      setSuccess("Reset code sent to your email.");
    } catch (err: unknown) {
      const cognitoErr = err as { message?: string };
      setError(cognitoErr.message || "Failed to send reset code");
    }
    setLoading(false);
  }

  // ─── Reset Password ───────────────────────────────────
  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await confirmNewPassword(email, code, newPassword);
      setSuccess("Password reset! You can now log in.");
      setView("login");
      setCode("");
      setNewPassword("");
    } catch (err: unknown) {
      const cognitoErr = err as { message?: string };
      setError(cognitoErr.message || "Reset failed");
    }
    setLoading(false);
  }

  // ─── Render ────────────────────────────────────────────
  return (
    <div>
      {error && <div style={errorStyle}>{error}</div>}
      {success && <div style={successStyle}>{success}</div>}

      {/* ── LOGIN ── */}
      {view === "login" && (
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <span style={labelStyle}>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com" required style={inputStyle} />
          </div>
          <div>
            <span style={labelStyle}>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required style={inputStyle} />
          </div>
          <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.5 : 1 }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button type="button" onClick={() => { clearMessages(); setView("signup"); }} style={btnLink}>
              Create an account
            </button>
            <button type="button" onClick={(e) => handleForgot(e)} style={{ ...btnLink, color: "#6B6B6B" }}>
              Forgot password?
            </button>
          </div>
        </form>
      )}

      {/* ── SIGNUP ── */}
      {view === "signup" && (
        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <span style={labelStyle}>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com" required style={inputStyle} />
          </div>
          <div>
            <span style={labelStyle}>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars, uppercase + number" required style={inputStyle} />
          </div>
          <div>
            <span style={labelStyle}>Confirm Password</span>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="••••••••" required style={inputStyle} />
          </div>
          <div style={{ height: 1, background: "#E8E3DB", margin: "4px 0" }} />
          <div>
            <span style={labelStyle}>Business Name</span>
            <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Blue Brew Coffee" required style={inputStyle} />
          </div>
          <div>
            <span style={labelStyle}>Business Address</span>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="123 S State St, Ann Arbor, MI" required style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <span style={labelStyle}>Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <span style={labelStyle}>Phone</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="(734) 555-0123" style={inputStyle} />
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.5 : 1, marginTop: 4 }}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
          <div style={{ textAlign: "center" }}>
            <button type="button" onClick={() => { clearMessages(); setView("login"); }} style={btnLink}>
              Already have an account? Sign in
            </button>
          </div>
        </form>
      )}

      {/* ── VERIFY EMAIL ── */}
      {view === "verify" && (
        <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📧</div>
            <p style={{ fontSize: 14, color: "#6B6B6B", lineHeight: 1.5 }}>
              We sent a verification code to<br />
              <strong style={{ color: "#1E1E1E" }}>{email}</strong>
            </p>
          </div>
          <div>
            <span style={labelStyle}>Verification Code</span>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="123456" required style={{ ...inputStyle, textAlign: "center", fontSize: 20, letterSpacing: 8 }} />
          </div>
          <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.5 : 1 }}>
            {loading ? "Verifying..." : "Verify Email"}
          </button>
          <div style={{ textAlign: "center" }}>
            <button type="button" onClick={handleResend} style={btnLink}>
              Didn&apos;t get a code? Resend
            </button>
          </div>
        </form>
      )}

      {/* ── FORGOT PASSWORD ── */}
      {view === "forgot" && (
        <form onSubmit={handleForgot} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔑</div>
            <p style={{ fontSize: 14, color: "#6B6B6B", lineHeight: 1.5 }}>
              Enter your email and we&apos;ll send a reset code.
            </p>
          </div>
          <div>
            <span style={labelStyle}>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com" required style={inputStyle} />
          </div>
          <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.5 : 1 }}>
            {loading ? "Sending..." : "Send Reset Code"}
          </button>
          <div style={{ textAlign: "center" }}>
            <button type="button" onClick={() => { clearMessages(); setView("login"); }} style={btnLink}>
              Back to sign in
            </button>
          </div>
        </form>
      )}

      {/* ── RESET PASSWORD ── */}
      {view === "reset" && (
        <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔑</div>
            <p style={{ fontSize: 14, color: "#6B6B6B", lineHeight: 1.5 }}>
              Enter the code from your email and your new password.
            </p>
          </div>
          <div>
            <span style={labelStyle}>Reset Code</span>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="123456" required style={{ ...inputStyle, textAlign: "center", fontSize: 20, letterSpacing: 8 }} />
          </div>
          <div>
            <span style={labelStyle}>New Password</span>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 chars, uppercase + number" required style={inputStyle} />
          </div>
          <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.5 : 1 }}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          <div style={{ textAlign: "center" }}>
            <button type="button" onClick={() => { clearMessages(); setView("login"); }} style={btnLink}>
              Back to sign in
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
