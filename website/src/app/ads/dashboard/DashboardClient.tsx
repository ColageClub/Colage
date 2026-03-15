"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Ad {
  id: string;
  businessName: string;
  bio: string;
  deal: string;
  dailyBudget: number;
  status: "active" | "paused" | "pending";
  impressions: number;
  taps: number;
  totalSpend: number;
  schools: string[];
  createdAt: string;
}

interface Session {
  businessId: string;
  email: string;
  businessName: string;
}

export function DashboardClient({ session }: { session: Session }) {
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  async function fetchAds() {
    const res = await fetch("/api/ads");
    if (res.ok) {
      const data = await res.json();
      setAds(data.ads);
    }
    setLoading(false);
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
                  className="p-6 rounded-2xl bg-[var(--colage-surface)] border border-[var(--colage-border)] flex flex-col md:flex-row md:items-center gap-6"
                >
                  {/* Ad info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{ad.businessName}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          ad.status === "active"
                            ? "bg-[var(--colage-online)]/20 text-[var(--colage-online)]"
                            : "bg-[var(--colage-text-tertiary)]/20 text-[var(--colage-text-tertiary)]"
                        }`}
                      >
                        {ad.status}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--colage-text-secondary)]">{ad.deal}</p>
                    <div className="flex gap-4 mt-2 text-xs text-[var(--colage-text-tertiary)]">
                      <span>Schools: {ad.schools.join(", ")}</span>
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
