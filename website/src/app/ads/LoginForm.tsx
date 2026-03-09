"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("Food & Drink");
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);

  const categories = [
    "Food & Drink", "Retail", "Services", "Entertainment",
    "Health & Fitness", "Education", "Auto", "Other"
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: isLogin ? "login" : "signup",
        email,
        businessName,
        address,
        category,
      }),
    });

    if (res.ok) {
      router.push("/ads/dashboard");
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Something went wrong");
    }
    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[var(--colage-text-secondary)] mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@business.com"
          required
          className="w-full px-4 py-3 rounded-xl bg-[var(--colage-bg)] border border-[var(--colage-border)] text-white text-sm focus:outline-none focus:border-[var(--colage-primary)] transition"
        />
      </div>

      {!isLogin && (
        <>
          <div>
            <label className="block text-xs font-semibold text-[var(--colage-text-secondary)] mb-1.5">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Blue Brew Coffee"
              required={!isLogin}
              className="w-full px-4 py-3 rounded-xl bg-[var(--colage-bg)] border border-[var(--colage-border)] text-white text-sm focus:outline-none focus:border-[var(--colage-primary)] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--colage-text-secondary)] mb-1.5">Business Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 S State St, Ann Arbor, MI"
              required={!isLogin}
              className="w-full px-4 py-3 rounded-xl bg-[var(--colage-bg)] border border-[var(--colage-border)] text-white text-sm focus:outline-none focus:border-[var(--colage-primary)] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--colage-text-secondary)] mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--colage-bg)] border border-[var(--colage-border)] text-white text-sm focus:outline-none focus:border-[var(--colage-primary)] transition"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 rounded-xl bg-[var(--colage-primary)] text-white font-semibold text-sm hover:bg-[var(--colage-primary-light)] transition disabled:opacity-50"
      >
        {isLoading ? "..." : isLogin ? "Log In" : "Create Account"}
      </button>

      <button
        type="button"
        onClick={() => setIsLogin(!isLogin)}
        className="w-full text-sm text-[var(--colage-text-secondary)] hover:text-white transition"
      >
        {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
      </button>
    </form>
  );
}
