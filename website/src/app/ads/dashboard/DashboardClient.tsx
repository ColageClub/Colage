"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface Ad {
  id: string;
  businessName: string;
  bio: string;
  deal: string;
  emoji: string;
  school: string;
  address: string;
  dailyBudget: number;
  status: "draft" | "pending" | "active" | "paused" | "completed" | "rejected";
  impressions: number;
  taps: number;
  totalSpend: number;
  todaySpend: number;
  todayImpressions: number;
  createdAt: string;
}

interface Session {
  businessId: string;
  email: string;
  businessName: string;
}

const FUND_AMOUNTS = [25, 50, 100, 250, 500];

export function DashboardClient({ session }: { session: Session }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justFunded = searchParams.get("funded") === "true";

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [showFundModal, setShowFundModal] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [fundingLoading, setFundingLoading] = useState(false);
  const [showFundedBanner, setShowFundedBanner] = useState(justFunded);

  useEffect(() => {
    fetchAds();
    fetchBalance();
  }, []);

  useEffect(() => {
    if (justFunded) {
      const timer = setTimeout(() => setShowFundedBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [justFunded]);

  async function fetchAds() {
    const res = await fetch("/api/ads");
    if (res.ok) {
      const data = await res.json();
      setAds(data.ads);
    }
    setLoading(false);
  }

  async function fetchBalance() {
    const res = await fetch("/api/billing/balance");
    if (res.ok) {
      const data = await res.json();
      setBalance(data.balance);
    }
  }

  async function addFunds(amount: number) {
    setFundingLoading(true);
    try {
      const res = await fetch("/api/billing/add-funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create payment session");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }
    setFundingLoading(false);
  }

  async function toggleAdStatus(ad: Ad) {
    const newStatus = ad.status === "active" ? "paused" : "active";
    await fetch("/api/ads", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ad.id, status: newStatus }),
    });
    fetchAds();
  }

  async function deleteAd(adId: string) {
    if (!confirm("Delete this ad? This cannot be undone.")) return;
    await fetch(`/api/ads?id=${adId}`, { method: "DELETE" });
    fetchAds();
  }

  async function handleLogout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/ads");
    router.refresh();
  }

  const totalImpressions = ads.reduce((sum, a) => sum + a.impressions, 0);
  const totalTaps = ads.reduce((sum, a) => sum + a.taps, 0);
  const totalSpend = ads.reduce((sum, a) => sum + a.totalSpend, 0);
  const activeAds = ads.filter((a) => a.status === "active").length;

  return (
    <div className="min-h-screen bg-[var(--colage-bg)]">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[var(--colage-bg)]/80 border-b border-[var(--colage-border)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-2xl font-extrabold tracking-tight">
              <span className="text-[var(--colage-primary)]">c</span>olage
            </Link>
            <span className="text-xs font-medium text-[var(--colage-text-tertiary)] bg-[var(--colage-surface)] px-2 py-0.5 rounded-full">
              Ad Manager
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--colage-text-secondary)]">{session.businessName}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-[var(--colage-text-tertiary)] hover:text-[var(--colage-text)] transition"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Funded success banner */}
          {showFundedBanner && (
            <div className="mb-6 p-4 rounded-2xl bg-[var(--colage-online)]/10 border border-[var(--colage-online)]/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">✅</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--colage-online)]">Funds added successfully!</p>
                  <p className="text-xs text-[var(--colage-text-secondary)]">Your balance has been updated.</p>
                </div>
              </div>
              <button onClick={() => setShowFundedBanner(false)} className="text-[var(--colage-text-tertiary)] hover:text-[var(--colage-text)] text-sm">
                ✕
              </button>
            </div>
          )}

          {/* Balance Card */}
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-[var(--colage-primary)]/10 to-[var(--colage-primary-light)]/10 border border-[var(--colage-primary)]/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-[var(--colage-text-tertiary)] mb-1">Prepaid Balance</div>
                <div className="text-4xl font-extrabold text-[var(--colage-primary)]">${balance.toFixed(2)}</div>
                {balance < 10 && balance > 0 && (
                  <p className="text-xs text-[var(--colage-warning)] mt-1 font-medium">
                    Low balance — add funds to keep your ads running
                  </p>
                )}
                {balance === 0 && (
                  <p className="text-xs text-[var(--colage-error)] mt-1 font-medium">
                    No funds — add money to activate ads
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFundModal(!showFundModal)}
                  className="px-5 py-2.5 rounded-xl bg-[var(--colage-primary)] text-white text-sm font-semibold hover:bg-[var(--colage-primary-light)] transition"
                >
                  + Add Funds
                </button>
                <Link
                  href="/ads/billing"
                  className="px-4 py-2.5 rounded-xl bg-[var(--colage-surface)] text-[var(--colage-text-secondary)] text-sm font-semibold border border-[var(--colage-border)] hover:bg-[var(--colage-surface-elevated)] transition"
                >
                  History
                </Link>
              </div>
            </div>

            {/* Add Funds Dropdown */}
            {showFundModal && (
              <div className="mt-4 p-4 rounded-xl bg-[var(--colage-bg)] border border-[var(--colage-border)]">
                <p className="text-xs font-semibold text-[var(--colage-text-secondary)] mb-3">Select amount</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {FUND_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => addFunds(amt)}
                      disabled={fundingLoading}
                      className="px-4 py-2 rounded-lg bg-[var(--colage-surface)] border border-[var(--colage-border)] text-sm font-semibold hover:border-[var(--colage-primary)] hover:bg-[var(--colage-primary)]/10 transition disabled:opacity-50"
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Custom amount"
                    min={5}
                    max={1000}
                    className="flex-1 px-3 py-2 rounded-lg bg-[var(--colage-surface)] border border-[var(--colage-border)] text-sm focus:outline-none focus:border-[var(--colage-primary)] transition"
                  />
                  <button
                    onClick={() => {
                      const amt = parseFloat(customAmount);
                      if (amt >= 5 && amt <= 1000) addFunds(amt);
                      else alert("Amount must be between $5 and $1,000");
                    }}
                    disabled={fundingLoading || !customAmount}
                    className="px-4 py-2 rounded-lg bg-[var(--colage-primary)] text-white text-sm font-semibold hover:bg-[var(--colage-primary-light)] transition disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                <p className="text-[10px] text-[var(--colage-text-tertiary)] mt-2">
                  A small processing fee will be added at checkout to cover payment costs.
                </p>
              </div>
            )}
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-sm text-[var(--colage-text-secondary)] mt-1">
                Manage your ads across campuses
              </p>
            </div>
            <Link
              href="/ads/create"
              className="px-5 py-2.5 rounded-xl bg-[var(--colage-primary)] text-white text-sm font-semibold hover:bg-[var(--colage-primary-light)] transition"
            >
              + Create Ad
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Active Ads", value: activeAds.toString(), color: "var(--colage-online)" },
              { label: "Impressions", value: totalImpressions.toLocaleString(), color: "var(--colage-primary)" },
              { label: "Taps", value: totalTaps.toLocaleString(), color: "var(--colage-primary-light)" },
              { label: "Total Spend", value: `$${totalSpend.toFixed(2)}`, color: "var(--colage-warning)" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-5 rounded-2xl bg-[var(--colage-surface)] border border-[var(--colage-border)]"
              >
                <div className="text-xs font-medium text-[var(--colage-text-tertiary)] mb-1">{stat.label}</div>
                <div className="text-2xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Ads List */}
          {loading ? (
            <div className="text-center py-20 text-[var(--colage-text-tertiary)]">Loading...</div>
          ) : ads.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">📢</div>
              <h3 className="text-xl font-bold mb-2">No ads yet</h3>
              <p className="text-sm text-[var(--colage-text-secondary)] mb-6">
                Create your first ad and start reaching students
              </p>
              <Link
                href="/ads/create"
                className="px-6 py-3 rounded-xl bg-[var(--colage-primary)] text-white font-semibold hover:bg-[var(--colage-primary-light)] transition"
              >
                Create Your First Ad
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="p-6 rounded-2xl bg-[var(--colage-surface)] border border-[var(--colage-border)]"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Ad info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{ad.emoji || "🏪"}</span>
                        <h3 className="text-lg font-bold">{ad.businessName}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            ad.status === "active"
                              ? "bg-[var(--colage-online)]/20 text-[var(--colage-online)]"
                              : ad.status === "paused"
                              ? "bg-[var(--colage-text-tertiary)]/20 text-[var(--colage-text-tertiary)]"
                              : "bg-[var(--colage-warning)]/20 text-[var(--colage-warning)]"
                          }`}
                        >
                          {ad.status}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--colage-text-secondary)]">{ad.deal}</p>
                      <div className="flex gap-4 mt-2 text-xs text-[var(--colage-text-tertiary)]">
                        <span>{ad.school}</span>
                        <span>Budget: ${ad.dailyBudget}/day</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-[var(--colage-primary)]">{ad.impressions.toLocaleString()}</div>
                        <div className="text-[10px] text-[var(--colage-text-tertiary)]">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-[var(--colage-online)]">{ad.taps.toLocaleString()}</div>
                        <div className="text-[10px] text-[var(--colage-text-tertiary)]">Taps</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-[var(--colage-warning)]">
                          {ad.impressions > 0 ? ((ad.taps / ad.impressions) * 100).toFixed(1) : 0}%
                        </div>
                        <div className="text-[10px] text-[var(--colage-text-tertiary)]">CTR</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleAdStatus(ad)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                          ad.status === "active"
                            ? "bg-[var(--colage-text-tertiary)]/10 text-[var(--colage-text-secondary)] hover:bg-[var(--colage-text-tertiary)]/20"
                            : "bg-[var(--colage-online)]/10 text-[var(--colage-online)] hover:bg-[var(--colage-online)]/20"
                        }`}
                      >
                        {ad.status === "active" ? "Pause" : "Resume"}
                      </button>
                      <Link
                        href={`/ads/create?edit=${ad.id}`}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--colage-primary)]/10 text-[var(--colage-primary)] hover:bg-[var(--colage-primary)]/20 transition"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteAd(ad.id)}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--colage-error)]/10 text-[var(--colage-error)] hover:bg-[var(--colage-error)]/20 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Today's spend bar */}
                  <div className="mt-4 pt-4 border-t border-[var(--colage-border)]">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[var(--colage-text-tertiary)]">Today&apos;s spend</span>
                      <span className="font-semibold">
                        ${(ad.todaySpend || 0).toFixed(2)} / ${ad.dailyBudget.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--colage-border)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--colage-primary)] transition-all"
                        style={{ width: `${Math.min(100, ((ad.todaySpend || 0) / ad.dailyBudget) * 100)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-[var(--colage-text-tertiary)] mt-1">
                      {ad.todayImpressions || 0} impressions today
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
