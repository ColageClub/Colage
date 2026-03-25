"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Session { businessId: string; email: string; businessName: string; }
interface Ad { id: string; businessName: string; emoji: string; school: string; dailyBudget: number; totalSpend: number; todaySpend: number; }

const card: React.CSSProperties = { padding: 24, borderRadius: 20, background: "#fff", border: "1px solid #E8E3DB" };

export function BillingClient({ session }: { session: Session }) {
  const [balance, setBalance] = useState(0);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const [bRes, aRes] = await Promise.all([fetch("/api/billing/balance"), fetch("/api/ads")]);
    if (bRes.ok) { const d = await bRes.json(); setBalance(d.balance); }
    if (aRes.ok) { const d = await aRes.json(); setAds(d.ads); }
    setLoading(false);
  }

  const totalSpend = ads.reduce((s, a) => s + a.totalSpend, 0);
  const todaySpend = ads.reduce((s, a) => s + (a.todaySpend || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: "#F9F6F2" }}>
      <nav style={{ position: "fixed", top: 0, width: "100%", zIndex: 50, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8E3DB" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/ads/dashboard" style={{ fontSize: 14, color: "#6B6B6B", textDecoration: "none" }}>← Back to Dashboard</Link>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#A51C30" }}>Billing</span>
        </div>
      </nav>

      <div style={{ paddingTop: 96, maxWidth: 900, margin: "0 auto", padding: "96px 48px 80px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: "#1E1E1E" }}>Billing & Usage</h1>
        <p style={{ fontSize: 14, color: "#6B6B6B", marginBottom: 32 }}>Track your spending and manage your ad budget</p>

        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "#6B6B6B" }}>Loading...</div>
        ) : (
          <>
            <div className="grid-3" style={{ marginBottom: 40 }}>
              <div style={{ ...card, background: "linear-gradient(135deg, rgba(165,28,48,0.04), rgba(165,28,48,0.01))", border: "1px solid rgba(165,28,48,0.15)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", marginBottom: 4 }}>Current Balance</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#A51C30" }}>${balance.toFixed(2)}</div>
              </div>
              <div style={card}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", marginBottom: 4 }}>Today&apos;s Spend</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#BF5700" }}>${todaySpend.toFixed(2)}</div>
              </div>
              <div style={card}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", marginBottom: 4 }}>Total Spend</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#1E1E1E" }}>${totalSpend.toFixed(2)}</div>
              </div>
            </div>

            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#1E1E1E" }}>Spend by Ad</h2>
              {ads.length === 0 ? (
                <p style={{ fontSize: 14, color: "#6B6B6B" }}>No ads yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {ads.map((ad) => (
                    <div key={ad.id} style={{ ...card, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 24 }}>{ad.emoji || "🏪"}</span>
                      <div style={{ flex: "1 1 200px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1E1E1E" }}>{ad.businessName}</div>
                        <div style={{ fontSize: 12, color: "#6B6B6B" }}>{ad.school}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>${(ad.todaySpend || 0).toFixed(2)} today</div>
                        <div style={{ fontSize: 12, color: "#6B6B6B" }}>${ad.totalSpend.toFixed(2)} total</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: "#6B6B6B" }}>Budget</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#A51C30" }}>${ad.dailyBudget}/day</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: 4, color: "#1E1E1E" }}>Auto-Reload</h3>
                  <p style={{ fontSize: 14, color: "#6B6B6B" }}>Automatically add funds when balance drops below a threshold.</p>
                </div>
                <span style={{ padding: "4px 12px", borderRadius: 999, background: "rgba(107,107,107,0.1)", color: "#6B6B6B", fontSize: 12, fontWeight: 500 }}>Coming Soon</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
