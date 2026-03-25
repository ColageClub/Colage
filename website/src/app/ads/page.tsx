import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export default async function AdsPage() {
  const session = await getSession();
  if (session) redirect("/ads/dashboard");

  const card: React.CSSProperties = { padding: 32, borderRadius: 20, background: "#fff", border: "1px solid #E8E3DB" };
  const badge: React.CSSProperties = { display: "inline-block", padding: "6px 16px", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(165,28,48,0.1)", color: "#A51C30", borderRadius: 999 };

  return (
    <div style={{ minHeight: "100vh", background: "#F9F6F2" }}>
      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, width: "100%", zIndex: 50, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8E3DB" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 300, color: "#1E1E1E", textDecoration: "none" }}>Colage</Link>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#A51C30" }}>Ad Manager</span>
        </div>
      </nav>

      <div style={{ paddingTop: 96, paddingBottom: 80, maxWidth: 1200, margin: "0 auto", padding: "96px 48px 80px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <span style={badge}>For Local Businesses</span>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 300, color: "#1E1E1E", marginTop: 16, lineHeight: 1.15 }}>
            Put your business in<br /><span style={{ color: "#A51C30" }}>every student&apos;s pocket</span>
          </h1>
          <p style={{ marginTop: 16, fontSize: 18, color: "#6B6B6B", fontWeight: 300, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
            Colage shows your ad to verified college students within walking distance of your business. Set your daily budget, create your ad in minutes, and watch the foot traffic roll in.
          </p>
        </div>

        {/* How it works */}
        <div className="grid-3" style={{ marginBottom: 80 }}>
          {[
            { step: "1", title: "Create Your Ad", desc: "Upload your logo, write a catchy deal, and set your daily budget. Takes 2 minutes." },
            { step: "2", title: "Pick Your Schools", desc: "Choose which campuses to target. Only pay for schools where you want visibility." },
            { step: "3", title: "Students See You", desc: "Your ad appears on the map view. Students tap to see your deal and get directions." },
          ].map((item) => (
            <div key={item.step} style={{ ...card, position: "relative", paddingTop: 40 }}>
              <div style={{ position: "absolute", top: -16, left: 24, width: 32, height: 32, borderRadius: "50%", background: "#A51C30", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
                {item.step}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1E1E1E", marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: "#6B6B6B", lineHeight: 1.6, fontWeight: 300 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* What students see */}
        <div style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 300, textAlign: "center", marginBottom: 32, color: "#1E1E1E" }}>What Students See</h2>
          <div style={{ maxWidth: 380, margin: "0 auto" }}>
            <div style={{ ...card, overflow: "hidden", padding: 0 }}>
              <div style={{ height: 160, background: "linear-gradient(135deg, rgba(165,28,48,0.15), #F9F6F2)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <span style={{ fontSize: 64, opacity: 0.15 }}>☕</span>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(to top, #fff, transparent)" }} />
              </div>
              <div style={{ padding: 24, marginTop: -24, position: "relative" }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(165,28,48,0.1)", border: "2px solid #A51C30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>☕</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1E1E1E" }}>Blue Brew Coffee</h3>
                <p style={{ fontSize: 14, color: "#6B6B6B", marginTop: 4 }}>Student-favorite coffee shop since 2019</p>
                <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>🎉 15% off any drink — show this ad</p>
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 12, color: "#6B6B6B" }}>
                  <span>📍 0.2 mi away</span>
                  <span>📸 Screenshot to redeem</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div style={{ marginBottom: 80, textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 300, marginBottom: 16, color: "#1E1E1E" }}>Simple Pricing</h2>
          <p style={{ color: "#6B6B6B", marginBottom: 32, fontWeight: 300 }}>You set your daily budget. No contracts. Pause anytime.</p>
          <div style={{ display: "inline-block", ...card, textAlign: "center" }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: "#A51C30" }}>$1 – $100</div>
            <div style={{ fontSize: 16, color: "#6B6B6B", marginTop: 8 }}>per day, per school</div>
            <div style={{ marginTop: 24, textAlign: "left" }}>
              {["Higher budget = more impressions", "Only charged when your ad is shown", "Real-time analytics dashboard", "Pause or cancel anytime"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 14 }}>
                  <span style={{ color: "#10b981" }}>✓</span> {t}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Login */}
        <div id="login" style={{ maxWidth: 440, margin: "0 auto" }}>
          <div style={card}>
            <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: "center", marginBottom: 4, color: "#1E1E1E" }}>Get Started</h2>
            <p style={{ fontSize: 14, color: "#6B6B6B", textAlign: "center", marginBottom: 24 }}>Create your business account to start running ads</p>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
