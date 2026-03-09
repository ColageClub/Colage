"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface School {
  domain: string;
  name: string;
  students: number;
  city: string;
}

interface Session {
  businessId: string;
  email: string;
  businessName: string;
}

export function CreateAdClient({ session }: { session: Session }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [step, setStep] = useState(1); // 1: schools, 2: ad details, 3: budget, 4: preview
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [businessName, setBusinessName] = useState(session.businessName);
  const [bio, setBio] = useState("");
  const [deal, setDeal] = useState("");
  const [dailyBudget, setDailyBudget] = useState(5);
  const [logoEmoji, setLogoEmoji] = useState("🏪");
  const [isLoading, setIsLoading] = useState(false);

  const commonEmojis = ["☕", "🍕", "🍔", "🏋️", "📚", "🎮", "✂️", "🚗", "🎵", "👕", "💊", "🏪", "🍣", "🌮", "🥗", "🧁"];

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const res = await fetch("/api/ads");
    if (res.ok) {
      const data = await res.json();
      setSchools(data.schools);

      // If editing, load existing ad
      if (editId) {
        const ad = data.ads.find((a: { id: string }) => a.id === editId);
        if (ad) {
          setSelectedSchools(ad.schools);
          setBusinessName(ad.businessName);
          setBio(ad.bio);
          setDeal(ad.deal);
          setDailyBudget(ad.dailyBudget);
          setStep(2);
        }
      }
    }
  }

  function toggleSchool(domain: string) {
    setSelectedSchools((prev) =>
      prev.includes(domain) ? prev.filter((s) => s !== domain) : [...prev, domain]
    );
  }

  async function handleSubmit() {
    setIsLoading(true);

    const payload = {
      schools: selectedSchools,
      businessName,
      bio,
      deal,
      dailyBudget,
      logoUrl: null,
    };

    const res = await fetch("/api/ads", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editId ? { id: editId, ...payload } : payload),
    });

    if (res.ok) {
      router.push("/ads/dashboard");
    } else {
      const data = await res.json();
      alert(data.error || "Failed to create ad");
    }
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen bg-[var(--colage-bg)]">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[var(--colage-bg)]/80 border-b border-[var(--colage-border)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/ads/dashboard" className="text-[var(--colage-text-secondary)] hover:text-white transition">
              ← Back
            </Link>
          </div>
          <span className="text-sm font-semibold text-[var(--colage-primary)]">
            {editId ? "Edit Ad" : "Create Ad"}
          </span>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="flex gap-2 mb-10">
            {["Schools", "Details", "Budget", "Preview"].map((label, i) => (
              <div key={label} className="flex-1">
                <div
                  className={`h-1 rounded-full mb-2 transition ${
                    i + 1 <= step ? "bg-[var(--colage-primary)]" : "bg-[var(--colage-border)]"
                  }`}
                />
                <div className={`text-xs font-medium ${i + 1 <= step ? "text-[var(--colage-primary-light)]" : "text-[var(--colage-text-tertiary)]"}`}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Step 1: Select Schools */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Select Schools</h2>
              <p className="text-sm text-[var(--colage-text-secondary)] mb-8">
                Choose which campuses will see your ad
              </p>

              <div className="space-y-3 mb-8">
                {schools.map((school) => {
                  const isSelected = selectedSchools.includes(school.domain);
                  return (
                    <button
                      key={school.domain}
                      onClick={() => toggleSchool(school.domain)}
                      className={`w-full p-5 rounded-2xl border text-left flex items-center gap-4 transition ${
                        isSelected
                          ? "bg-[var(--colage-primary)]/10 border-[var(--colage-primary)]/40"
                          : "bg-[var(--colage-surface)] border-[var(--colage-border)] hover:border-[var(--colage-primary)]/20"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                          isSelected ? "border-[var(--colage-primary)] bg-[var(--colage-primary)]" : "border-[var(--colage-border)]"
                        }`}
                      >
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{school.name}</div>
                        <div className="text-xs text-[var(--colage-text-tertiary)]">
                          {school.city} · {school.students} students
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={selectedSchools.length === 0}
                className="w-full py-3 rounded-xl bg-[var(--colage-primary)] text-white font-semibold hover:bg-[var(--colage-primary-light)] transition disabled:opacity-30"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Ad Details */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Ad Details</h2>
              <p className="text-sm text-[var(--colage-text-secondary)] mb-8">
                This is what students will see
              </p>

              <div className="space-y-5 mb-8">
                {/* Logo emoji picker */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--colage-text-secondary)] mb-2">Logo / Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {commonEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setLogoEmoji(emoji)}
                        className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition ${
                          logoEmoji === emoji
                            ? "bg-[var(--colage-primary)]/20 border-2 border-[var(--colage-primary)]"
                            : "bg-[var(--colage-surface)] border border-[var(--colage-border)] hover:border-[var(--colage-primary)]/30"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[var(--colage-text-tertiary)] mt-2">Logo upload coming soon — pick an emoji for now</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--colage-text-secondary)] mb-1.5">Business Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--colage-surface)] border border-[var(--colage-border)] text-white text-sm focus:outline-none focus:border-[var(--colage-primary)] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--colage-text-secondary)] mb-1.5">Bio / Tagline</label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 50))}
                    placeholder="Student-favorite coffee shop since 2019"
                    maxLength={50}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--colage-surface)] border border-[var(--colage-border)] text-white text-sm focus:outline-none focus:border-[var(--colage-primary)] transition"
                  />
                  <div className="text-right text-[10px] text-[var(--colage-text-tertiary)] mt-1">{bio.length}/50</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--colage-text-secondary)] mb-1.5">Deal</label>
                  <input
                    type="text"
                    value={deal}
                    onChange={(e) => setDeal(e.target.value)}
                    placeholder="15% off any drink — show this ad"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--colage-surface)] border border-[var(--colage-border)] text-white text-sm focus:outline-none focus:border-[var(--colage-primary)] transition"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl bg-[var(--colage-surface)] text-[var(--colage-text-secondary)] font-semibold border border-[var(--colage-border)] hover:bg-[var(--colage-surface-elevated)] transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!businessName || !deal}
                  className="flex-1 py-3 rounded-xl bg-[var(--colage-primary)] text-white font-semibold hover:bg-[var(--colage-primary-light)] transition disabled:opacity-30"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Budget */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Set Your Budget</h2>
              <p className="text-sm text-[var(--colage-text-secondary)] mb-8">
                Higher budget = more impressions. You&apos;re only charged when your ad is shown.
              </p>

              <div className="p-8 rounded-2xl bg-[var(--colage-surface)] border border-[var(--colage-border)] mb-8">
                <div className="text-center mb-8">
                  <div className="text-5xl font-extrabold text-[var(--colage-primary)]">${dailyBudget}</div>
                  <div className="text-sm text-[var(--colage-text-secondary)] mt-2">per day, per school</div>
                </div>

                <input
                  type="range"
                  min={1}
                  max={100}
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(parseInt(e.target.value))}
                  className="w-full accent-[var(--colage-primary)] mb-4"
                />

                <div className="flex justify-between text-xs text-[var(--colage-text-tertiary)]">
                  <span>$1/day</span>
                  <span>$100/day</span>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-[var(--colage-bg)] space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--colage-text-secondary)]">Schools selected</span>
                    <span className="font-semibold">{selectedSchools.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--colage-text-secondary)]">Daily total</span>
                    <span className="font-semibold text-[var(--colage-primary)]">
                      ${dailyBudget * selectedSchools.length}/day
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--colage-text-secondary)]">Monthly estimate</span>
                    <span className="font-semibold text-[var(--colage-warning)]">
                      ~${(dailyBudget * selectedSchools.length * 30).toLocaleString()}/mo
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl bg-[var(--colage-surface)] text-[var(--colage-text-secondary)] font-semibold border border-[var(--colage-border)] hover:bg-[var(--colage-surface-elevated)] transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 py-3 rounded-xl bg-[var(--colage-primary)] text-white font-semibold hover:bg-[var(--colage-primary-light)] transition"
                >
                  Preview Ad
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Preview & Confirm */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Preview Your Ad</h2>
              <p className="text-sm text-[var(--colage-text-secondary)] mb-8">
                This is exactly what students will see on their phone
              </p>

              {/* Phone mockup with ad */}
              <div className="max-w-sm mx-auto mb-8">
                {/* Banner preview (what shows on the map) */}
                <div className="mb-4">
                  <div className="text-xs font-semibold text-[var(--colage-text-tertiary)] mb-2 uppercase tracking-wider">Map Banner</div>
                  <div className="h-16 rounded-2xl bg-[var(--colage-surface)] border border-[var(--colage-border)] flex items-center px-4 gap-3 relative overflow-hidden">
                    {/* Transparent logo bg */}
                    <div className="absolute right-4 text-6xl opacity-10">{logoEmoji}</div>
                    <div className="w-11 h-11 rounded-xl bg-[var(--colage-primary)]/20 flex items-center justify-center text-xl z-10">
                      {logoEmoji}
                    </div>
                    <div className="flex-1 z-10">
                      <div className="text-sm font-bold">{businessName}</div>
                      <div className="text-xs text-[var(--colage-online)]">{deal}</div>
                    </div>
                    <div className="text-[10px] text-[var(--colage-text-tertiary)] z-10">0.3 mi</div>
                  </div>
                </div>

                {/* Expanded preview (what shows on tap) */}
                <div className="text-xs font-semibold text-[var(--colage-text-tertiary)] mb-2 uppercase tracking-wider">When Tapped</div>
                <div className="rounded-2xl bg-[var(--colage-surface)] border border-[var(--colage-border)] overflow-hidden">
                  <div className="relative h-40 bg-gradient-to-br from-[var(--colage-primary)]/20 to-[var(--colage-bg)] flex items-center justify-center">
                    <span className="text-8xl opacity-15">{logoEmoji}</span>
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--colage-surface)] to-transparent" />
                  </div>
                  <div className="p-6 -mt-6 relative">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--colage-primary)]/20 border-2 border-[var(--colage-primary)] flex items-center justify-center text-2xl mb-3">
                      {logoEmoji}
                    </div>
                    <h3 className="text-xl font-bold">{businessName}</h3>
                    {bio && <p className="text-sm text-[var(--colage-text-secondary)] mt-1">{bio}</p>}
                    <div className="mt-4 px-4 py-3 rounded-xl bg-[var(--colage-online)]/10 border border-[var(--colage-online)]/20">
                      <p className="text-sm font-semibold text-[var(--colage-online)]">🎉 {deal}</p>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-[var(--colage-text-tertiary)]">
                      <span>📍 0.3 mi away</span>
                      <span>📸 Screenshot to redeem</span>
                    </div>
                    <button className="w-full mt-4 py-3 rounded-xl bg-[var(--colage-primary)]/10 text-[var(--colage-primary)] font-semibold text-sm">
                      Get Directions
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="p-6 rounded-2xl bg-[var(--colage-surface)] border border-[var(--colage-border)] mb-8">
                <h3 className="font-bold mb-4">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--colage-text-secondary)]">Schools</span>
                    <span>{selectedSchools.join(", ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--colage-text-secondary)]">Daily budget</span>
                    <span>${dailyBudget}/school/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--colage-text-secondary)]">Daily total</span>
                    <span className="font-bold text-[var(--colage-primary)]">
                      ${dailyBudget * selectedSchools.length}/day
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-xl bg-[var(--colage-surface)] text-[var(--colage-text-secondary)] font-semibold border border-[var(--colage-border)] hover:bg-[var(--colage-surface-elevated)] transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-xl bg-[var(--colage-online)] text-white font-semibold hover:bg-[var(--colage-online)]/80 transition disabled:opacity-50"
                >
                  {isLoading ? "Creating..." : editId ? "Save Changes" : "🚀 Launch Ad"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
