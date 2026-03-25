"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signUp,
  confirmSignUp,
  resendConfirmation,
  signIn,
  forgotPassword,
  confirmForgotPassword,
  getUser,
  parseIdToken,
} from "@/lib/cognito-business";

type View = "login" | "signup" | "verify" | "forgot" | "reset";

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
const btnStyle: React.CSSProperties = {
  width: "100%", padding: "14px 0", borderRadius: 12,
  background: "#A51C30", color: "#fff", fontWeight: 600,
  fontSize: 14, border: "none", cursor: "pointer", transition: "opacity 0.2s",
};
const linkBtn: React.CSSProperties = {
  background: "none", border: "none", fontSize: 13,
  color: "#A51C30", cursor: "pointer", padding: 0, fontWeight: 500,
};
const errorStyle: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 10, background: "rgba(165,28,48,0.06)",
  border: "1px solid rgba(165,28,48,0.15)", fontSize: 13, color: "#A51C30",
  marginBottom: 16,
};
const successStyle: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 10, background: "rgba(16,185,129,0.06)",
  border: "1px solid rgba(16,185,129,0.15)", fontSize: 13, color: "#10b981",
  marginBottom: 16,
};

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

  // Stash email between views
  const [pendingEmail, setPendingEmail] = useState("");

  function clearState() {
    setError(""); setSuccess(""); setCode(""); setNewPassword("");
  }

  // ─── LOGIN ──────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const tokens = await signIn(email, password);
      const user = await getUser(tokens.accessToken);
      const claims = parseIdToken(tokens.idToken);

      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email: user.email,
          businessName: user.businessName,
          sub: claims.sub,
          accessToken: tokens.accessToken,
          idToken: tokens.idToken,
          refreshToken: tokens.refreshToken,
        }),
      });

      router.push("/ads/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === "UserNotConfirmedException") {
        setPendingEmail(email);
        setView("verify");
        setSuccess("Your email isn't verified yet. Check your inbox for a code.");
      } else {
        setError(e.message || "Login failed");
      }
    }
    setLoading(false);
  }

  // ─── SIGN UP ────────────────────────────────────────────
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");

    if (password !== confirmPw) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      await signUp({
        email, password, businessName,
        businessAddress: address,
        businessCategory: category,
        phone: phone || undefined,
      });
      setPendingEmail(email);
      clearState();
      setView("verify");
      setSuccess("Check your email for a verification code.");
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === "UsernameExistsException") {
        setError("An account with this email already exists. Try logging in.");
      } else {
        setError(e.message || "Signup failed");
      }
    }
    setLoading(false);
  }

  // ─── VERIFY EMAIL ──────────────────────────────────────
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await confirmSignUp(pendingEmail, code);
      clearState();
      setView("login");
      setEmail(pendingEmail);
      setSuccess("Email verified! You can now log in.");
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      setError(e.message || "Verification failed");
    }
    setLoading(false);
  }

  async function handleResend() {
    setLoading(true); setError("");
    try {
      await resendConfirmation(pendingEmail);
      setSuccess("New code sent! Check your email.");
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      setError(e.message || "Failed to resend code");
    }
    setLoading(false);
  }

  // ─── FORGOT PASSWORD ──────────────────────────────────
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await forgotPassword(email);
      setPendingEmail(email);
      clearState();
      setView("reset");
      setSuccess("Check your email for a reset code.");
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      setError(e.message || "Failed to send reset code");
    }
    setLoading(false);
  }

  // ─── RESET PASSWORD ───────────────────────────────────
  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }
    try {
      await confirmForgotPassword(pendingEmail, code, newPassword);
      clearState();
      setView("login");
      setEmail(pendingEmail);
      setSuccess("Password reset! You can now log in.");
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      setError(e.message || "Reset failed");
    }
    setLoading(false);
  }

  // ─── RENDER ─────────────────────────────────────────────

  return (
    <div>
      {error && <div style={errorStyle}>{error}</div>}
      {success && <div style={successStyle}>{success}</div>}

      {/* ── LOGIN ── */}
      {view === "login" && (
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <span style={labelStyle}>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" required style={inputStyle} />
          </div>
          <div>
            <span style={labelStyle}>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={inputStyle} />
          </div>
          <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.5 : 1 }}>
            {loading ? "Logging in..." : "Log In"}
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button type="button" onClick={() => { clearState(); setView("signup"); }} style={linkBtn}>
              Create an account
            </button>
            <button type="button" onClick={() => { clearState(); setView("forgot"); }} style={{ ...linkBtn, color: "#6B6B6B" }}>
              Forgot password?
            </button>
          </div>
        </form>
      )}

      {/* ── SIGN UP ── */}
      {view === "signup" && (
        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <span style={labelStyle}>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" required style={inputStyle} />
          </div>
          <div>
            <span style={labelStyle}>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 chars, uppercase + number" required style={inputStyle} />
          </div>
          <div>
            <span style={labelStyle}>Confirm Password</span>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••" required style={inputStyle} />
          </div>
          <div style={{ height: 1, background: "#E8E3DB", margin: "4px 0" }} />
          <div>
            <span style={labelStyle}>Business Name</span>
            <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Blue Brew Coffee" required style={inputStyle} />
          </div>
          <div>
            <span style={labelStyle}>Business Address</span>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 S State St, Ann Arbor, MI" style={inputStyle} />
          </div>
          <div>
            <span style={labelStyle}>Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <span style={labelStyle}>Phone <span style={{ fontWeight: 400, color: "#999" }}>(optional)</span></span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" style={inputStyle} />
          </div>
          <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.5 : 1, marginTop: 4 }}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
          <div style={{ textAlign: "center" }}>
            <button type="button" onClick={() => { clearState(); setView("login"); }} style={linkBtn}>
              Already have an account? Log in
            </button>
          </div>
        </form>
      )}

      {/* ── VERIFY EMAIL ── */}
      {view === "verify" && (
        <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 14, color: "#4A4A4A", lineHeight: 1.5, margin: 0 }}>
            We sent a 6-digit code to <strong>{pendingEmail}</strong>. Enter it below to verify your email.
          </p>
          <div>
            <span style={labelStyle}>Verification Code</span>
            <input
              type="text" value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="123456" required maxLength={6}
              style={{ ...inputStyle, fontSize: 20, letterSpacing: 8, textAlign: "center", fontWeight: 600 }}
            />
          </div>
          <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.5 : 1 }}>
            {loading ? "Verifying..." : "Verify Email"}
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button type="button" onClick={handleResend} disabled={loading} style={linkBtn}>
              Resend code
            </button>
            <button type="button" onClick={() => { clearState(); setView("login"); }} style={{ ...linkBtn, color: "#6B6B6B" }}>
              Back to login
            </button>
          </div>
        </form>
      )}

      {/* ── FORGOT PASSWORD ── */}
      {view === "forgot" && (
        <form onSubmit={handleForgot} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 14, color: "#4A4A4A", lineHeight: 1.5, margin: 0 }}>
            Enter your email and we&apos;ll send you a code to reset your password.
          </p>
          <div>
            <span style={labelStyle}>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" required style={inputStyle} />
          </div>
          <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.5 : 1 }}>
            {loading ? "Sending..." : "Send Reset Code"}
          </button>
          <div style={{ textAlign: "center" }}>
            <button type="button" onClick={() => { clearState(); setView("login"); }} style={{ ...linkBtn, color: "#6B6B6B" }}>
              Back to login
            </button>
          </div>
        </form>
      )}

      {/* ── RESET PASSWORD ── */}
      {view === "reset" && (
        <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 14, color: "#4A4A4A", lineHeight: 1.5, margin: 0 }}>
            Enter the code sent to <strong>{pendingEmail}</strong> and your new password.
          </p>
          <div>
            <span style={labelStyle}>Reset Code</span>
            <input
              type="text" value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="123456" required maxLength={6}
              style={{ ...inputStyle, fontSize: 20, letterSpacing: 8, textAlign: "center", fontWeight: 600 }}
            />
          </div>
          <div>
            <span style={labelStyle}>New Password</span>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 chars, uppercase + number" required style={inputStyle} />
          </div>
          <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.5 : 1 }}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          <div style={{ textAlign: "center" }}>
            <button type="button" onClick={() => { clearState(); setView("login"); }} style={{ ...linkBtn, color: "#6B6B6B" }}>
              Back to login
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
