"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const input: React.CSSProperties = {
  width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E8E3DB",
  background: "#F9F6F2", fontSize: 14, color: "#1E1E1E", outline: "none", transition: "border 0.2s",
};
const label: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#6B6B6B", marginBottom: 6 };

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("Food & Drink");
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);

  const categories = ["Food & Drink", "Retail", "Services", "Entertainment", "Health & Fitness", "Education", "Auto", "Other"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: isLogin ? "login" : "signup", email, businessName, address, category }),
    });
    if (res.ok) { router.push("/ads/dashboard"); router.refresh(); }
    else { const data = await res.json(); alert(data.error || "Something went wrong"); }
    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <span style={label}>Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" required style={input} />
      </div>
      {!isLogin && (
        <>
          <div>
            <span style={label}>Business Name</span>
            <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Blue Brew Coffee" required style={input} />
          </div>
          <div>
            <span style={label}>Business Address</span>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 S State St, Ann Arbor, MI" required style={input} />
          </div>
          <div>
            <span style={label}>Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={input}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </>
      )}
      <button type="submit" disabled={isLoading} style={{ width: "100%", padding: "14px 0", borderRadius: 12, background: "#A51C30", color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer", opacity: isLoading ? 0.5 : 1, transition: "opacity 0.2s" }}>
        {isLoading ? "..." : isLogin ? "Log In" : "Create Account"}
      </button>
      <button type="button" onClick={() => setIsLogin(!isLogin)} style={{ background: "none", border: "none", fontSize: 14, color: "#6B6B6B", cursor: "pointer", padding: 8 }}>
        {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
      </button>
    </form>
  );
}
