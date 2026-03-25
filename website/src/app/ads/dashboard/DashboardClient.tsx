"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface Ad { id: string; businessName: string; bio: string; deal: string; emoji: string; school: string; address: string; dailyBudget: number; status: "draft"|"pending"|"active"|"paused"|"completed"|"rejected"; impressions: number; taps: number; totalSpend: number; todaySpend: number; todayImpressions: number; createdAt: string; }
interface Session { businessId: string; email: string; businessName: string; }

const card: React.CSSProperties = { padding: 24, borderRadius: 20, background: "#fff", border: "1px solid #E8E3DB" };
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

  useEffect(() => { fetchAds(); fetchBalance(); }, []);
  useEffect(() => { if (justFunded) { const t = setTimeout(() => setShowFundedBanner(false), 5000); return () => clearTimeout(t); } }, [justFunded]);

  async function fetchAds() { const r = await fetch("/api/ads"); if (r.ok) { const d = await r.json(); setAds(d.ads); } setLoading(false); }
  async function fetchBalance() { const r = await fetch("/api/billing/balance"); if (r.ok) { const d = await r.json(); setBalance(d.balance); } }

  async function addFunds(amount: number) {
    setFundingLoading(true);
    try { const r = await fetch("/api/billing/add-funds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount }) }); if (r.ok) { const d = await r.json(); window.location.href = d.url; } else { const d = await r.json(); alert(d.error || "Failed"); } } catch { alert("Something went wrong."); }
    setFundingLoading(false);
  }

  async function toggleAdStatus(ad: Ad) {
    const s = ad.status === "active" ? "paused" : "active";
    await fetch("/api/ads", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ad.id, status: s }) });
    fetchAds();
  }

  async function deleteAd(id: string) { if (!confirm("Delete this ad?")) return; await fetch(`/api/ads?id=${id}`, { method: "DELETE" }); fetchAds(); }
  async function handleLogout() { await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) }); router.push("/ads"); router.refresh(); }

  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0);
  const totalTaps = ads.reduce((s, a) => s + a.taps, 0);
  const totalSpend = ads.reduce((s, a) => s + a.totalSpend, 0);
  const activeAds = ads.filter((a) => a.status === "active").length;

  return (
    <div style={{ minHeight: "100vh", background: "#F9F6F2" }}>
      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, width: "100%", zIndex: 50, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8E3DB" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/" style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 300, color: "#1E1E1E", textDecoration: "none" }}>Colage</Link>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#6B6B6B", background: "#F9F6F2", padding: "2px 10px", borderRadius: 999 }}>Ad Manager</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 14, color: "#6B6B6B" }}>{session.businessName}</span>
            <button onClick={handleLogout} style={{ background: "none", border: "none", fontSize: 13, color: "#6B6B6B", cursor: "pointer" }}>Log Out</button>
          </div>
        </div>
      </nav>

      <div style={{ paddingTop: 96, maxWidth: 1200, margin: "0 auto", padding: "96px 48px 80px" }}>
        {/* Funded banner */}
        {showFundedBanner && (
          <div style={{ marginBottom: 24, padding: 16, borderRadius: 16, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span>✅</span>
              <div><p style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>Funds added!</p><p style={{ fontSize: 12, color: "#6B6B6B" }}>Your balance has been updated.</p></div>
            </div>
            <button onClick={() => setShowFundedBanner(false)} style={{ background: "none", border: "none", color: "#6B6B6B", cursor: "pointer" }}>✕</button>
          </div>
        )}

        {/* Balance */}
        <div style={{ ...card, marginBottom: 32, background: "linear-gradient(135deg, rgba(165,28,48,0.04), rgba(165,28,48,0.01))", border: "1px solid rgba(165,28,48,0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", marginBottom: 4 }}>Prepaid Balance</div>
              <div style={{ fontSize: 40, fontWeight: 700, color: "#A51C30" }}>${balance.toFixed(2)}</div>
              {balance < 10 && balance > 0 && <p style={{ fontSize: 12, color: "#BF5700", marginTop: 4, fontWeight: 500 }}>Low balance — add funds to keep ads running</p>}
              {balance === 0 && <p style={{ fontSize: 12, color: "#A51C30", marginTop: 4, fontWeight: 500 }}>No funds — add money to activate ads</p>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowFundModal(!showFundModal)} style={{ padding: "10px 20px", borderRadius: 12, background: "#A51C30", color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer" }}>+ Add Funds</button>
              <Link href="/ads/billing" style={{ padding: "10px 20px", borderRadius: 12, background: "#fff", color: "#6B6B6B", fontWeight: 600, fontSize: 14, border: "1px solid #E8E3DB", textDecoration: "none" }}>History</Link>
            </div>
          </div>

          {showFundModal && (
            <div style={{ marginTop: 20, padding: 20, borderRadius: 16, background: "#fff", border: "1px solid #E8E3DB" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", marginBottom: 12 }}>Select amount</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {FUND_AMOUNTS.map((a) => (
                  <button key={a} onClick={() => addFunds(a)} disabled={fundingLoading} style={{ padding: "8px 16px", borderRadius: 10, background: "#F9F6F2", border: "1px solid #E8E3DB", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: fundingLoading ? 0.5 : 1 }}>${a}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="Custom amount" min={5} max={1000} style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid #E8E3DB", background: "#F9F6F2", fontSize: 14, outline: "none" }} />
                <button onClick={() => { const a = parseFloat(customAmount); if (a >= 5 && a <= 1000) addFunds(a); else alert("$5 - $1,000"); }} disabled={fundingLoading || !customAmount} style={{ padding: "8px 16px", borderRadius: 10, background: "#A51C30", color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer", opacity: fundingLoading || !customAmount ? 0.5 : 1 }}>Add</button>
              </div>
            </div>
          )}
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1E1E1E" }}>Dashboard</h1>
            <p style={{ fontSize: 14, color: "#6B6B6B", marginTop: 4 }}>Manage your ads across campuses</p>
          </div>
          <Link href="/ads/create" style={{ padding: "10px 20px", borderRadius: 12, background: "#A51C30", color: "#fff", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>+ Create Ad</Link>
        </div>

        {/* Stats */}
        <div className="grid-2" style={{ marginBottom: 40 }}>
          {[
            { label: "Active Ads", value: activeAds.toString(), color: "#10b981" },
            { label: "Impressions", value: totalImpressions.toLocaleString(), color: "#A51C30" },
            { label: "Taps", value: totalTaps.toLocaleString(), color: "#6B6B6B" },
            { label: "Total Spend", value: `$${totalSpend.toFixed(2)}`, color: "#BF5700" },
          ].map((s) => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Ads */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "#6B6B6B" }}>Loading...</div>
        ) : ads.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📢</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#1E1E1E" }}>No ads yet</h3>
            <p style={{ fontSize: 14, color: "#6B6B6B", marginBottom: 24 }}>Create your first ad and start reaching students</p>
            <Link href="/ads/create" style={{ padding: "12px 24px", borderRadius: 12, background: "#A51C30", color: "#fff", fontWeight: 600, textDecoration: "none" }}>Create Your First Ad</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {ads.map((ad) => (
              <div key={ad.id} style={card}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24 }}>
                  <div style={{ flex: "1 1 300px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <span style={{ fontSize: 24 }}>{ad.emoji || "🏪"}</span>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1E1E1E" }}>{ad.businessName}</h3>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, textTransform: "uppercase" as const, background: ad.status === "active" ? "rgba(16,185,129,0.1)" : ad.status === "paused" ? "rgba(107,107,107,0.1)" : "rgba(191,87,0,0.1)", color: ad.status === "active" ? "#10b981" : ad.status === "paused" ? "#6B6B6B" : "#BF5700" }}>{ad.status}</span>
                    </div>
                    <p style={{ fontSize: 14, color: "#6B6B6B" }}>{ad.deal}</p>
                    <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: "#6B6B6B" }}>
                      <span>{ad.school}</span>
                      <span>Budget: ${ad.dailyBudget}/day</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 24 }}>
                    {[
                      { val: ad.impressions.toLocaleString(), label: "Views", color: "#A51C30" },
                      { val: ad.taps.toLocaleString(), label: "Taps", color: "#10b981" },
                      { val: ad.impressions > 0 ? ((ad.taps / ad.impressions) * 100).toFixed(1) + "%" : "0%", label: "CTR", color: "#BF5700" },
                    ].map((s) => (
                      <div key={s.label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: 10, color: "#6B6B6B" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => toggleAdStatus(ad)} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: ad.status === "active" ? "rgba(107,107,107,0.1)" : "rgba(16,185,129,0.1)", color: ad.status === "active" ? "#6B6B6B" : "#10b981" }}>{ad.status === "active" ? "Pause" : "Resume"}</button>
                    <Link href={`/ads/create?edit=${ad.id}`} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, background: "rgba(165,28,48,0.08)", color: "#A51C30", textDecoration: "none" }}>Edit</Link>
                    <button onClick={() => deleteAd(ad.id)} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: "rgba(220,38,38,0.08)", color: "#dc2626" }}>Delete</button>
                  </div>
                </div>

                {/* Spend bar */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #E8E3DB" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "#6B6B6B" }}>Today&apos;s spend</span>
                    <span style={{ fontWeight: 600 }}>${(ad.todaySpend || 0).toFixed(2)} / ${ad.dailyBudget.toFixed(2)}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: "#E8E3DB", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 999, background: "#A51C30", width: `${Math.min(100, ((ad.todaySpend || 0) / ad.dailyBudget) * 100)}%`, transition: "width 0.3s" }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#6B6B6B", marginTop: 4 }}>{ad.todayImpressions || 0} impressions today</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
