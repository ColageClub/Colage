"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Session {
  businessId: string;
  email: string;
  businessName: string;
}

interface Ad {
  id: string;
  businessName: string;
  emoji: string;
  school: string;
  dailyBudget: number;
  totalSpend: number;
  todaySpend: number;
}

export function BillingClient({ session }: { session: Session }) {
  const [balance, setBalance] = useState(0);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [balanceRes, adsRes] = await Promise.all([
      fetch("/api/billing/balance"),
      fetch("/api/ads"),
    ]);

    if (balanceRes.ok) {
      const data = await balanceRes.json();
      setBalance(data.balance);
    }
    if (adsRes.ok) {
      const data = await adsRes.json();
      setAds(data.ads);
    }
    setLoading(false);
  }

  const totalSpend = ads.reduce((sum, a) => sum + a.totalSpend, 0);
  const todaySpend = ads.reduce((sum, a) => sum + (a.todaySpend || 0), 0);

  return (
    <div className="min-h-screen bg-[var(--colage-bg)]">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[var(--colage-bg)]/80 border-b border-[var(--colage-border)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/ads/dashboard" className="text-[var(--colage-text-secondary)] hover:text-[var(--colage-text)] transition">
              ← Back to Dashboard
            </Link>
          </div>
          <span className="text-sm font-semibold text-[var(--colage-primary)]">Billing</span>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Billing & Usage</h1>
          <p className="text-sm text-[var(--colage-text-secondary)] mb-8">
            Track your spending and manage your ad budget
          </p>

          {loading ? (
            <div className="text-center py-20 text-[var(--colage-text-tertiary)]">Loading...</div>
          ) : (
            <>
              {/* Balance overview */}
              <div className="grid md:grid-cols-3 gap-4 mb-10">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--colage-primary)]/10 to-[var(--colage-primary-light)]/5 border border-[var(--colage-primary)]/20">
                  <div className="text-xs font-medium text-[var(--colage-text-tertiary)] mb-1">Current Balance</div>
                  <div className="text-3xl font-extrabold text-[var(--colage-primary)]">${balance.toFixed(2)}</div>
                </div>
                <div className="p-6 rounded-2xl bg-[var(--colage-surface)] border border-[var(--colage-border)]">
                  <div className="text-xs font-medium text-[var(--colage-text-tertiary)] mb-1">Today&apos;s Spend</div>
                  <div className="text-3xl font-extrabold text-[var(--colage-warning)]">${todaySpend.toFixed(2)}</div>
                </div>
                <div className="p-6 rounded-2xl bg-[var(--colage-surface)] border border-[var(--colage-border)]">
                  <div className="text-xs font-medium text-[var(--colage-text-tertiary)] mb-1">Total Spend</div>
                  <div className="text-3xl font-extrabold text-[var(--colage-text)]">${totalSpend.toFixed(2)}</div>
                </div>
              </div>

              {/* Spend by ad */}
              <div className="mb-10">
                <h2 className="text-xl font-bold mb-4">Spend by Ad</h2>
                {ads.length === 0 ? (
                  <p className="text-sm text-[var(--colage-text-tertiary)]">No ads yet.</p>
                ) : (
                  <div className="space-y-3">
                    {ads.map((ad) => (
                      <div key={ad.id} className="p-4 rounded-xl bg-[var(--colage-surface)] border border-[var(--colage-border)] flex items-center gap-4">
                        <span className="text-2xl">{ad.emoji || "🏪"}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{ad.businessName}</div>
                          <div className="text-xs text-[var(--colage-text-tertiary)]">{ad.school}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">${(ad.todaySpend || 0).toFixed(2)} today</div>
                          <div className="text-xs text-[var(--colage-text-tertiary)]">${ad.totalSpend.toFixed(2)} total</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[var(--colage-text-tertiary)]">Budget</div>
                          <div className="text-sm font-semibold text-[var(--colage-primary)]">${ad.dailyBudget}/day</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Auto-reload placeholder */}
              <div className="p-6 rounded-2xl bg-[var(--colage-surface)] border border-[var(--colage-border)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold mb-1">Auto-Reload</h3>
                    <p className="text-sm text-[var(--colage-text-secondary)]">
                      Automatically add funds when your balance drops below a threshold.
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-[var(--colage-text-tertiary)]/10 text-[var(--colage-text-tertiary)] text-xs font-medium">
                    Coming Soon
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
