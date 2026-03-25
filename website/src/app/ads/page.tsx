import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import Image from "next/image";

export default async function AdsPage() {
  const session = await getSession();
  if (session) redirect("/ads/dashboard");

  return (
    <div style={{ minHeight: "100vh", background: "#F9F6F2", color: "#1E1E1E" }}>
      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, width: "100%", zIndex: 50, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8E3DB" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 300, color: "#1E1E1E", textDecoration: "none" }}>Colage</Link>
          <a href="#get-started" style={{ fontSize: 14, fontWeight: 600, color: "#A51C30", textDecoration: "none" }}>Get Started →</a>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════ */}
      {/* HERO */}
      {/* ═══════════════════════════════════════════ */}
      <section style={{ paddingTop: 140, paddingBottom: 80, maxWidth: 900, margin: "0 auto", padding: "140px 32px 80px", textAlign: "center" }}>
        <h1 style={{
          fontFamily: "var(--font-serif)", fontSize: "clamp(38px, 5vw, 60px)",
          fontWeight: 300, lineHeight: 1.1, color: "#1E1E1E", marginBottom: 24,
        }}>
          Every student remembers<br />their college spots.
        </h1>
        <p style={{
          fontSize: "clamp(17px, 2vw, 20px)", fontWeight: 300, color: "#6B6B6B",
          maxWidth: 580, margin: "0 auto", lineHeight: 1.6,
        }}>
          The study café before finals. The pizza place after the game. The 2am burrito run.
          Those places become part of the story students tell for the rest of their lives.
          Colage puts your business in that story.
        </p>
        <a
          href="#get-started"
          style={{
            display: "inline-block", marginTop: 40, padding: "16px 40px",
            background: "#A51C30", color: "#fff", fontSize: 15, fontWeight: 600,
            borderRadius: 999, textDecoration: "none", transition: "background 0.2s",
          }}
        >
          Become a Campus Spot
        </a>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* THE REAL PITCH */}
      {/* ═══════════════════════════════════════════ */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 32px 80px" }}>
        <div style={{
          padding: "48px 40px", borderRadius: 20, background: "#fff",
          border: "1px solid #E8E3DB",
        }}>
          <h2 style={{
            fontFamily: "var(--font-serif)", fontSize: "clamp(26px, 3vw, 36px)",
            fontWeight: 300, lineHeight: 1.2, marginBottom: 24, color: "#1E1E1E",
          }}>
            Students don&apos;t find places the way they used to.
          </h2>
          <div style={{ fontSize: 16, color: "#4A4A4A", lineHeight: 1.75, fontWeight: 300 }}>
            <p style={{ marginBottom: 16 }}>
              They&apos;re not reading flyers on bulletin boards. They&apos;re not searching Yelp. They open Colage
              to see who&apos;s around them — and while they&apos;re exploring, your business shows up right on their map.
            </p>
            <p style={{ marginBottom: 16 }}>
              Not as an interruption. Not as a banner they scroll past. As a place on the map they&apos;re already looking at.
              They tap it, see your deal, get directions, and walk through your door.
            </p>
            <p style={{ marginBottom: 0 }}>
              That&apos;s not advertising. That&apos;s becoming part of their daily routine.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* WHY NOT FACEBOOK */}
      {/* ═══════════════════════════════════════════ */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 32px 80px" }}>
        <h2 style={{
          fontFamily: "var(--font-serif)", fontSize: "clamp(26px, 3vw, 36px)",
          fontWeight: 300, textAlign: "center", marginBottom: 40, color: "#1E1E1E",
        }}>
          Why not just use Facebook Ads?
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            {
              them: "Facebook targets 18-22 year olds in a zip code.",
              us: "Colage targets verified students enrolled at a specific campus.",
            },
            {
              them: "Instagram can't tell a student from a townie.",
              us: "Every Colage user verified with their .edu email. You know it's a student.",
            },
            {
              them: "Social media ads interrupt people mid-scroll.",
              us: "Colage students are in discovery mode — actively exploring what's around them.",
            },
            {
              them: "Broad targeting means paying to reach people who'll never visit.",
              us: "Your ad only shows to students within walking distance of your business.",
            },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", gap: 0, borderRadius: 16, overflow: "hidden",
              border: "1px solid #E8E3DB",
            }}>
              <div style={{
                flex: 1, padding: "20px 24px", background: "#f0ece6",
                fontSize: 14, color: "#8a8a8a", lineHeight: 1.6, fontWeight: 400,
                display: "flex", alignItems: "center",
              }}>
                <span>{item.them}</span>
              </div>
              <div style={{
                flex: 1, padding: "20px 24px", background: "#fff",
                fontSize: 14, color: "#1E1E1E", lineHeight: 1.6, fontWeight: 500,
                display: "flex", alignItems: "center",
              }}>
                <span>{item.us}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* WHAT STUDENTS SEE — MAP CONTEXT */}
      {/* ═══════════════════════════════════════════ */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 32px 80px" }}>
        <h2 style={{
          fontFamily: "var(--font-serif)", fontSize: "clamp(26px, 3vw, 36px)",
          fontWeight: 300, textAlign: "center", marginBottom: 16, color: "#1E1E1E",
        }}>
          Your ad lives where students explore.
        </h2>
        <p style={{
          textAlign: "center", fontSize: 16, color: "#6B6B6B", fontWeight: 300,
          maxWidth: 520, margin: "0 auto 40px",
        }}>
          Students open Colage to discover people and places around campus.
          Your business shows up right on their map — not buried in a feed.
        </p>

        <div className="ads-map-grid" style={{
          display: "flex", gap: 32, alignItems: "center", justifyContent: "center",
        }}>
          {/* Phone mockup with map screenshot */}
          <div style={{
            width: 280, flexShrink: 0,
            borderRadius: 32, overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
            border: "8px solid #1E1E1E",
          }}>
            <Image
              src="/screenshots/map.png"
              alt="Colage map view showing businesses and students"
              width={280}
              height={560}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>

          {/* Ad card preview */}
          <div style={{ maxWidth: 340 }}>
            <div style={{
              padding: 0, borderRadius: 20, background: "#fff",
              border: "1px solid #E8E3DB", overflow: "hidden",
            }}>
              <div style={{
                height: 120, background: "linear-gradient(135deg, rgba(165,28,48,0.12), #F9F6F2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 48, opacity: 0.2 }}>☕</span>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: "rgba(165,28,48,0.08)", border: "2px solid #A51C30",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, marginBottom: 12, marginTop: -40,
                }}>☕</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1E1E1E" }}>Blue Brew Coffee</h3>
                <p style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>Student-favorite since 2019</p>
                <div style={{
                  marginTop: 14, padding: "10px 14px", borderRadius: 10,
                  background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)",
                }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#10b981" }}>🎉 15% off any drink — show this ad</p>
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 14, fontSize: 11, color: "#999" }}>
                  <span>📍 0.2 mi</span>
                  <span>📸 Screenshot to redeem</span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#999", textAlign: "center", marginTop: 12, fontStyle: "italic" }}>
              This is what students see when they tap your pin.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* HOW IT WORKS */}
      {/* ═══════════════════════════════════════════ */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 32px 80px" }}>
        <h2 style={{
          fontFamily: "var(--font-serif)", fontSize: "clamp(26px, 3vw, 36px)",
          fontWeight: 300, textAlign: "center", marginBottom: 40, color: "#1E1E1E",
        }}>
          Three steps. Two minutes.
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {[
            { num: "1", title: "Tell us about your business", desc: "Name, location, category. We place you on the campus map automatically." },
            { num: "2", title: "Create your deal", desc: "Write an offer students can't ignore. Upload your logo. Preview exactly what they'll see." },
            { num: "3", title: "Set your budget and go", desc: "Pick a daily amount that works for you. Your ad goes live on campus immediately." },
          ].map((step) => (
            <div key={step.num} style={{
              display: "flex", gap: 20, alignItems: "flex-start",
              padding: "28px 32px", borderRadius: 16, background: "#fff",
              border: "1px solid #E8E3DB",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", background: "#A51C30",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 700, flexShrink: 0,
              }}>
                {step.num}
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: "#1E1E1E", marginBottom: 4 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "#6B6B6B", lineHeight: 1.6, fontWeight: 300 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* PRICING — HONEST AND SIMPLE */}
      {/* ═══════════════════════════════════════════ */}
      <section style={{ maxWidth: 600, margin: "0 auto", padding: "0 32px 80px", textAlign: "center" }}>
        <h2 style={{
          fontFamily: "var(--font-serif)", fontSize: "clamp(26px, 3vw, 36px)",
          fontWeight: 300, marginBottom: 12, color: "#1E1E1E",
        }}>
          Pricing that makes sense.
        </h2>
        <p style={{ fontSize: 16, color: "#6B6B6B", fontWeight: 300, marginBottom: 32 }}>
          No contracts. No minimums. No agency fees.
        </p>
        <div style={{
          padding: "40px 36px", borderRadius: 20, background: "#fff",
          border: "1px solid #E8E3DB", textAlign: "center",
        }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#A51C30", marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            You set the budget
          </div>
          <div style={{ fontSize: 48, fontWeight: 700, color: "#1E1E1E" }}>
            $1 – $100
          </div>
          <div style={{ fontSize: 15, color: "#6B6B6B", marginTop: 4 }}>per day, per campus</div>
          <div style={{
            width: 60, height: 1, background: "#E8E3DB", margin: "28px auto",
          }} />
          <div style={{ textAlign: "left", maxWidth: 320, margin: "0 auto" }}>
            {[
              "Higher budget = more visibility on the map",
              "Only charged when students see your ad",
              "Real-time analytics in your dashboard",
              "Pause or stop anytime — no questions asked",
            ].map((line) => (
              <div key={line} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 0", fontSize: 14, color: "#4A4A4A", lineHeight: 1.5 }}>
                <span style={{ color: "#A51C30", fontWeight: 700, marginTop: 1 }}>✓</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 24, fontSize: 14, color: "#999", fontWeight: 300, fontStyle: "italic" }}>
            Less than a coffee per day to reach every student on campus.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* THE BIGGER PICTURE */}
      {/* ═══════════════════════════════════════════ */}
      <section style={{
        maxWidth: 800, margin: "0 auto", padding: "0 32px 80px",
      }}>
        <div style={{
          padding: "48px 40px", borderRadius: 20,
          background: "#1E1E1E", color: "#fff",
        }}>
          <h2 style={{
            fontFamily: "var(--font-serif)", fontSize: "clamp(24px, 3vw, 32px)",
            fontWeight: 300, lineHeight: 1.2, marginBottom: 20,
          }}>
            You&apos;re not buying ads.<br />You&apos;re becoming part of college.
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, fontWeight: 300 }}>
            Think about the brands you loved in college. The ones that felt like yours — not because they
            marketed to you, but because they showed up where you already were. That&apos;s what Colage
            does for local businesses. You&apos;re not running a campaign. You&apos;re becoming a campus staple.
            The kind of place students bring their friends to, post about, and come back to years later
            saying &ldquo;this was our spot.&rdquo;
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* GET STARTED — LOGIN/SIGNUP */}
      {/* ═══════════════════════════════════════════ */}
      <section id="get-started" style={{ maxWidth: 460, margin: "0 auto", padding: "0 32px 100px" }}>
        <div style={{
          padding: "36px 32px", borderRadius: 20, background: "#fff",
          border: "1px solid #E8E3DB",
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 4, color: "#1E1E1E" }}>
            Get on the map.
          </h2>
          <p style={{ fontSize: 14, color: "#6B6B6B", textAlign: "center", marginBottom: 28 }}>
            Create your business account and start reaching students today.
          </p>
          <LoginForm />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #E8E3DB", padding: "24px 32px", textAlign: "center" }}>
        <Link href="/" style={{ fontSize: 13, color: "#999", textDecoration: "none" }}>
          ← Back to Colage
        </Link>
      </footer>

      {/* Responsive styles */}
      <style jsx global>{`
        .ads-map-grid {
          flex-wrap: wrap;
        }
        @media (max-width: 680px) {
          .ads-map-grid {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}
