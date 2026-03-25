"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface School { domain: string; name: string; students: number; city: string; }
interface Session { businessId: string; email: string; businessName: string; }

const card: React.CSSProperties = { padding: 32, borderRadius: 20, background: "#fff", border: "1px solid #E8E3DB" };
const input: React.CSSProperties = { width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E8E3DB", background: "#F9F6F2", fontSize: 14, color: "#1E1E1E", outline: "none" };
const label: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#6B6B6B", marginBottom: 6 };
const btn: React.CSSProperties = { flex: 1, padding: "14px 0", borderRadius: 12, fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer" };

const commonEmojis = ["☕", "🍕", "🍔", "🏋️", "📚", "🎮", "✂️", "🚗", "🎵", "👕", "💊", "🏪", "🍣", "🌮", "🥗", "🧁"];

export function CreateAdClient({ session }: { session: Session }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [step, setStep] = useState(1);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [businessName, setBusinessName] = useState(session.businessName);
  const [bio, setBio] = useState("");
  const [deal, setDeal] = useState("");
  const [address, setAddress] = useState("");
  const [dailyBudget, setDailyBudget] = useState(5);
  const [logoEmoji, setLogoEmoji] = useState("🏪");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const r = await fetch("/api/ads"); if (!r.ok) return;
    const d = await r.json(); setSchools(d.schools);
    if (editId) { const ad = d.ads.find((a: { id: string }) => a.id === editId); if (ad) { setSelectedSchool(ad.school); setBusinessName(ad.businessName); setBio(ad.bio); setDeal(ad.deal); setDailyBudget(ad.dailyBudget); setLogoEmoji(ad.emoji || "🏪"); setAddress(ad.address || ""); setStep(2); } }
  }

  async function handleSubmit() {
    setIsLoading(true);
    const payload = { school: selectedSchool, businessName, bio, deal, emoji: logoEmoji, address, dailyBudget };
    const r = await fetch("/api/ads", { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editId ? { id: editId, ...payload } : payload) });
    if (r.ok) router.push("/ads/dashboard"); else { const d = await r.json(); alert(d.error || "Failed"); }
    setIsLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F9F6F2" }}>
      <nav style={{ position: "fixed", top: 0, width: "100%", zIndex: 50, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8E3DB" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/ads/dashboard" style={{ fontSize: 14, color: "#6B6B6B", textDecoration: "none" }}>← Back</Link>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#A51C30" }}>{editId ? "Edit Ad" : "Create Ad"}</span>
        </div>
      </nav>

      <div style={{ paddingTop: 96, maxWidth: 640, margin: "0 auto", padding: "96px 48px 80px" }}>
        {/* Progress */}
        <div style={{ display: "flex", gap: 8, marginBottom: 40 }}>
          {["School", "Details", "Budget", "Preview"].map((l, i) => (
            <div key={l} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 999, marginBottom: 8, background: i + 1 <= step ? "#A51C30" : "#E8E3DB", transition: "background 0.3s" }} />
              <div style={{ fontSize: 12, fontWeight: 500, color: i + 1 <= step ? "#A51C30" : "#6B6B6B" }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Step 1: School */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#1E1E1E" }}>Select a School</h2>
            <p style={{ fontSize: 14, color: "#6B6B6B", marginBottom: 32 }}>Choose which campus will see your ad</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {schools.map((s) => {
                const sel = selectedSchool === s.domain;
                return (
                  <button key={s.domain} onClick={() => setSelectedSchool(s.domain)} style={{ width: "100%", padding: 20, borderRadius: 16, border: sel ? "2px solid #A51C30" : "1px solid #E8E3DB", background: sel ? "rgba(165,28,48,0.04)" : "#fff", textAlign: "left", display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", border: sel ? "none" : "2px solid #E8E3DB", background: sel ? "#A51C30" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12 }}>{sel && "✓"}</div>
                    <div><div style={{ fontWeight: 600, color: "#1E1E1E" }}>{s.name}</div><div style={{ fontSize: 12, color: "#6B6B6B" }}>{s.city} · {s.students} students</div></div>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setStep(2)} disabled={!selectedSchool} style={{ ...btn, width: "100%", background: "#A51C30", color: "#fff", opacity: selectedSchool ? 1 : 0.3 }}>Continue</button>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#1E1E1E" }}>Ad Details</h2>
            <p style={{ fontSize: 14, color: "#6B6B6B", marginBottom: 32 }}>This is what students will see</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 32 }}>
              <div>
                <span style={label}>Logo / Icon</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {commonEmojis.map((e) => (
                    <button key={e} onClick={() => setLogoEmoji(e)} style={{ width: 48, height: 48, borderRadius: 12, fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", border: logoEmoji === e ? "2px solid #A51C30" : "1px solid #E8E3DB", background: logoEmoji === e ? "rgba(165,28,48,0.08)" : "#fff", cursor: "pointer" }}>{e}</button>
                  ))}
                </div>
              </div>
              <div><span style={label}>Business Name</span><input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} style={input} /></div>
              <div><span style={label}>Bio / Tagline</span><input type="text" value={bio} onChange={(e) => setBio(e.target.value.slice(0, 50))} placeholder="Student-favorite coffee shop since 2019" maxLength={50} style={input} /><div style={{ textAlign: "right", fontSize: 10, color: "#6B6B6B", marginTop: 4 }}>{bio.length}/50</div></div>
              <div><span style={label}>Deal</span><input type="text" value={deal} onChange={(e) => setDeal(e.target.value)} placeholder="15% off any drink — show this ad" style={input} /></div>
              <div><span style={label}>Business Address</span><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 S State St, Ann Arbor, MI 48104" style={input} /><div style={{ fontSize: 10, color: "#6B6B6B", marginTop: 4 }}>Used to show distance to students</div></div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(1)} style={{ ...btn, background: "#fff", color: "#6B6B6B", border: "1px solid #E8E3DB" }}>Back</button>
              <button onClick={() => setStep(3)} disabled={!businessName || !deal} style={{ ...btn, background: "#A51C30", color: "#fff", opacity: businessName && deal ? 1 : 0.3 }}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 3: Budget */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#1E1E1E" }}>Set Your Budget</h2>
            <p style={{ fontSize: 14, color: "#6B6B6B", marginBottom: 32 }}>Higher budget = more impressions. Only charged when shown.</p>
            <div style={{ ...card, marginBottom: 32 }}>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ fontSize: 48, fontWeight: 700, color: "#A51C30" }}>${dailyBudget}</div>
                <div style={{ fontSize: 14, color: "#6B6B6B", marginTop: 8 }}>per day</div>
              </div>
              <input type="range" min={1} max={100} value={dailyBudget} onChange={(e) => setDailyBudget(parseInt(e.target.value))} style={{ width: "100%", accentColor: "#A51C30", marginBottom: 16 }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B6B6B" }}><span>$1/day</span><span>$100/day</span></div>
              <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: "#F9F6F2" }}>
                {[
                  { l: "School", v: selectedSchool },
                  { l: "Daily budget", v: `$${dailyBudget}/day` },
                  { l: "Monthly estimate", v: `~$${(dailyBudget * 30).toLocaleString()}/mo` },
                ].map((r) => (
                  <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14 }}>
                    <span style={{ color: "#6B6B6B" }}>{r.l}</span><span style={{ fontWeight: 600 }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(2)} style={{ ...btn, background: "#fff", color: "#6B6B6B", border: "1px solid #E8E3DB" }}>Back</button>
              <button onClick={() => setStep(4)} style={{ ...btn, background: "#A51C30", color: "#fff" }}>Preview Ad</button>
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#1E1E1E" }}>Preview Your Ad</h2>
            <p style={{ fontSize: 14, color: "#6B6B6B", marginBottom: 32 }}>This is exactly what students will see</p>

            <div style={{ maxWidth: 380, margin: "0 auto", marginBottom: 32 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#6B6B6B", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 8 }}>Map Banner</div>
              <div style={{ height: 64, borderRadius: 16, background: "#fff", border: "1px solid #E8E3DB", display: "flex", alignItems: "center", padding: "0 16px", gap: 12, position: "relative", overflow: "hidden" }}>
                <span style={{ position: "absolute", right: 16, fontSize: 48, opacity: 0.08 }}>{logoEmoji}</span>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(165,28,48,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, zIndex: 1 }}>{logoEmoji}</div>
                <div style={{ flex: 1, zIndex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: "#1E1E1E" }}>{businessName}</div><div style={{ fontSize: 12, color: "#10b981" }}>{deal}</div></div>
                <span style={{ fontSize: 10, color: "#6B6B6B", zIndex: 1 }}>0.3 mi</span>
              </div>

              <div style={{ fontSize: 10, fontWeight: 600, color: "#6B6B6B", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginTop: 24, marginBottom: 8 }}>When Tapped</div>
              <div style={{ ...card, overflow: "hidden", padding: 0 }}>
                <div style={{ height: 140, background: "linear-gradient(135deg, rgba(165,28,48,0.12), #F9F6F2)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <span style={{ fontSize: 72, opacity: 0.12 }}>{logoEmoji}</span>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 48, background: "linear-gradient(to top, #fff, transparent)" }} />
                </div>
                <div style={{ padding: 24, marginTop: -20, position: "relative" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(165,28,48,0.08)", border: "2px solid #A51C30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 12 }}>{logoEmoji}</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1E1E1E" }}>{businessName}</h3>
                  {bio && <p style={{ fontSize: 14, color: "#6B6B6B", marginTop: 4 }}>{bio}</p>}
                  {address && <p style={{ fontSize: 12, color: "#6B6B6B", marginTop: 4 }}>{address}</p>}
                  <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>🎉 {deal}</p>
                  </div>
                  <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 12, color: "#6B6B6B" }}><span>📍 0.3 mi</span><span>📸 Screenshot to redeem</span></div>
                </div>
              </div>
            </div>

            <div style={{ ...card, marginBottom: 32 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16, color: "#1E1E1E" }}>Summary</h3>
              {[
                { l: "School", v: selectedSchool },
                ...(address ? [{ l: "Address", v: address }] : []),
                { l: "Daily budget", v: `$${dailyBudget}/day` },
              ].map((r) => (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14 }}>
                  <span style={{ color: "#6B6B6B" }}>{r.l}</span><span style={{ fontWeight: 600 }}>{r.v}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(3)} style={{ ...btn, background: "#fff", color: "#6B6B6B", border: "1px solid #E8E3DB" }}>Back</button>
              <button onClick={handleSubmit} disabled={isLoading} style={{ ...btn, background: "#10b981", color: "#fff", opacity: isLoading ? 0.5 : 1 }}>{isLoading ? "Creating..." : editId ? "Save Changes" : "Launch Ad"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
