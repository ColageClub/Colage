import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export default async function AdsPage() {
  const session = await getSession();
  if (session) redirect("/ads/dashboard");

  return (
    <div className="min-h-screen bg-[var(--colage-bg)]">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[var(--colage-bg)]/80 border-b border-[var(--colage-border)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold tracking-tight">
            <span className="text-[var(--colage-primary)]">c</span>olage
          </Link>
          <span className="text-sm font-semibold text-[var(--colage-primary)]">Ad Manager</span>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--colage-primary)]/10 border border-[var(--colage-primary)]/20 mb-6">
              <span className="text-xs font-medium text-[var(--colage-primary-light)]">For Local Businesses</span>
            </div>
            <h1 className="text-5xl font-extrabold mb-6">
              Put your business in
              <br />
              <span className="text-[var(--colage-primary)]">every student&apos;s pocket</span>
            </h1>
            <p className="text-lg text-[var(--colage-text-secondary)] max-w-2xl mx-auto">
              Colage shows your ad to verified college students within walking distance of your business.
              Set your daily budget, create your ad in minutes, and watch the foot traffic roll in.
            </p>
          </div>

          {/* How it works */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {[
              {
                step: "1",
                title: "Create Your Ad",
                desc: "Upload your logo, write a catchy deal, and set your daily budget. Takes 2 minutes.",
              },
              {
                step: "2",
                title: "Pick Your Schools",
                desc: "Choose which campuses to target. Only pay for schools where you want visibility.",
              },
              {
                step: "3",
                title: "Students See You",
                desc: "Your ad appears on the map view. Students tap to see your deal and get directions.",
              },
            ].map((item) => (
              <div key={item.step} className="relative p-8 rounded-2xl bg-[var(--colage-surface)] border border-[var(--colage-border)]">
                <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-[var(--colage-primary)] flex items-center justify-center text-sm font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2 mt-2">{item.title}</h3>
                <p className="text-sm text-[var(--colage-text-secondary)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* What students see */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-center mb-8">What Students See</h2>
            <div className="max-w-sm mx-auto">
              <div className="rounded-2xl bg-[var(--colage-surface)] border border-[var(--colage-border)] overflow-hidden">
                {/* Ad preview */}
                <div className="relative h-48 bg-gradient-to-br from-[var(--colage-primary)]/20 to-[var(--colage-bg)] flex items-center justify-center">
                  <span className="text-6xl opacity-20">☕</span>
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--colage-surface)] to-transparent" />
                </div>
                <div className="p-6 -mt-8 relative">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--colage-primary)]/20 border-2 border-[var(--colage-primary)] flex items-center justify-center text-2xl mb-4">
                    ☕
                  </div>
                  <h3 className="text-xl font-bold">Blue Brew Coffee</h3>
                  <p className="text-sm text-[var(--colage-text-secondary)] mt-1">Student-favorite coffee shop since 2019</p>
                  <div className="mt-4 px-4 py-3 rounded-xl bg-[var(--colage-online)]/10 border border-[var(--colage-online)]/20">
                    <p className="text-sm font-semibold text-[var(--colage-online)]">🎉 15% off any drink — show this ad</p>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-[var(--colage-text-tertiary)]">
                    <span>📍 0.2 mi away</span>
                    <span>📸 Screenshot to redeem</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-20 text-center">
            <h2 className="text-2xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-[var(--colage-text-secondary)] mb-8">You set your daily budget. No contracts. Pause anytime.</p>
            <div className="inline-flex flex-col items-center p-8 rounded-2xl bg-[var(--colage-surface)] border border-[var(--colage-border)]">
              <div className="text-4xl font-extrabold text-[var(--colage-primary)]">$1 – $100</div>
              <div className="text-lg text-[var(--colage-text-secondary)] mt-2">per day, per school</div>
              <ul className="mt-6 space-y-3 text-sm text-left">
                <li className="flex items-center gap-2">
                  <span className="text-[var(--colage-online)]">✓</span> Higher budget = more impressions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--colage-online)]">✓</span> Only charged when your ad is shown
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--colage-online)]">✓</span> Real-time analytics dashboard
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--colage-online)]">✓</span> Pause or cancel anytime
                </li>
              </ul>
            </div>
          </div>

          {/* Login / Signup */}
          <div id="login" className="max-w-md mx-auto">
            <div className="p-8 rounded-2xl bg-[var(--colage-surface)] border border-[var(--colage-border)]">
              <h2 className="text-xl font-bold mb-2 text-center">Get Started</h2>
              <p className="text-sm text-[var(--colage-text-secondary)] text-center mb-6">
                Create your business account to start running ads
              </p>
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
