import Link from "next/link";
import { PhoneMockup } from "@/components/PhoneMockup";
import { FloatingStudents } from "@/components/FloatingStudents";
import { FeatureShowcase } from "@/components/FeatureShowcase";
import { SchoolCarousel } from "@/components/SchoolCarousel";
import { StatsCounter } from "@/components/StatsCounter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-[#1a1a2e] overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-2xl bg-white/80 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6C5CE7] to-[#a29bfe] flex items-center justify-center text-sm font-black text-white">
              C
            </div>
            <span className="text-xl font-extrabold tracking-tight">colage</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-gray-400 hover:text-[#1a1a2e] transition duration-300">Features</Link>
            <Link href="#schools" className="text-sm text-gray-400 hover:text-[#1a1a2e] transition duration-300">Schools</Link>
            <Link href="#download" className="text-sm text-gray-400 hover:text-[#1a1a2e] transition duration-300">Download</Link>
            <Link
              href="/ads"
              className="text-sm font-semibold px-5 py-2 rounded-full bg-[#6C5CE7]/5 border border-[#6C5CE7]/15 text-[#6C5CE7] hover:bg-[#6C5CE7]/10 transition duration-300"
            >
              Ad Manager
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-32 px-6 min-h-screen flex items-center">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(108,92,231,0.06) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
          {/* Soft glow orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6C5CE7]/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#00CEC9]/6 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-[#a29bfe]/8 rounded-full blur-[80px]" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#6C5CE7]/5 border border-[#6C5CE7]/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00b894] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00b894]"></span>
                </span>
                <span className="text-xs font-medium text-[#5a5a7a]">Live on 3 campuses</span>
              </div>

              {/* Main headline */}
              <div>
                <h1 className="text-6xl lg:text-8xl font-black leading-[0.9] tracking-tight">
                  <span className="block text-[#1a1a2e]">Be</span>
                  <span className="block bg-gradient-to-r from-[#6C5CE7] via-[#a29bfe] to-[#00CEC9] bg-clip-text text-transparent">
                    You.
                  </span>
                </h1>
                <p className="mt-6 text-lg lg:text-xl text-[#9090a8] max-w-md leading-relaxed font-light">
                  Discover who&apos;s around you. Connect through social links. 
                  No DMs. No pressure. Just <span className="text-[#5a5a7a] font-medium">real campus life</span>.
                </p>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <a
                  href="#download"
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe] text-white font-bold text-base hover:shadow-lg hover:shadow-[#6C5CE7]/20 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Download for iOS
                  <span className="text-white/60 group-hover:translate-x-1 transition-transform">→</span>
                </a>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-gray-200 text-[#5a5a7a] font-semibold hover:bg-gray-50 hover:text-[#1a1a2e] transition-all duration-300"
                >
                  See how it works
                </a>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {["🧑‍🎓", "👩‍🎓", "🧑‍💻", "👨‍🎨", "👩‍🔬"].map((emoji, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f3f2ff] to-[#ebe9ff] border-2 border-white flex items-center justify-center text-sm shadow-sm"
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1a1a2e]">1,982 students</div>
                  <div className="text-xs text-[#9090a8]">discovering their campus</div>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="flex-1 flex justify-center">
              <PhoneMockup />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-5 h-8 rounded-full border-2 border-[#6C5CE7]/20 flex justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-[#6C5CE7]/30" />
          </div>
        </div>
      </section>

      {/* FLOATING STUDENTS SECTION */}
      <section className="relative py-32 px-6 bg-[#f8f7ff]">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black mb-4 text-[#1a1a2e]">
              Your campus is <span className="text-[#6C5CE7]">alive</span>
            </h2>
            <p className="text-lg text-[#9090a8] max-w-xl mx-auto">
              Every dot is a real, verified student. See them on the map, in a list, or through your camera in AR.
            </p>
          </div>
          <FloatingStudents />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-32 px-6 relative bg-white">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6C5CE7]/5 border border-[#6C5CE7]/10 mb-6">
              <span className="text-xs font-medium text-[#5a5a7a]">Three ways to discover</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-[#1a1a2e]">
              Map. List. <span className="bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] bg-clip-text text-transparent">AR.</span>
            </h2>
          </div>
          <FeatureShowcase />
        </div>
      </section>

      {/* PRIVACY/VIBE SECTION */}
      <section className="py-32 px-6 relative overflow-hidden bg-[#f8f7ff]">
        {/* Background accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6C5CE7]/5 rounded-full blur-[150px]" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-black leading-tight text-[#1a1a2e]">
                Discovery only.
                <br />
                <span className="text-[#9090a8]">No creepy DMs.</span>
              </h2>
              <p className="text-[#5a5a7a] leading-relaxed">
                Colage is built around a simple idea: you should be able to discover people near you 
                without the pressure of in-app messaging. See someone interesting? Tap their profile, 
                find their Instagram or TikTok, and connect on your terms.
              </p>
              <div className="space-y-4">
                {[
                  { icon: "🔒", text: "Verified .edu email required" },
                  { icon: "👻", text: "Go invisible anytime with one tap" },
                  { icon: "📍", text: "Location never stored permanently" },
                  { icon: "🔗", text: "Connect through social links, not in-app chat" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-lg">
                      {item.icon}
                    </div>
                    <span className="text-sm text-[#5a5a7a]">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual */}
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-white border border-gray-100 shadow-sm p-8 flex items-center justify-center">
                <div className="text-center space-y-6">
                  <div className="text-8xl">🛡️</div>
                  <div>
                    <div className="text-2xl font-black text-[#1a1a2e]">Your Privacy</div>
                    <div className="text-sm text-[#9090a8] mt-1">is not negotiable</div>
                  </div>
                  <div className="flex justify-center gap-3">
                    {["end-to-end", "no-tracking", "your-data"].map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-[#f3f2ff] text-[10px] font-medium text-[#6C5CE7] border border-[#6C5CE7]/10">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 px-3 py-1.5 rounded-full bg-[#00b894]/10 border border-[#00b894]/20 text-xs font-semibold text-[#00b894] shadow-sm">
                ✓ .edu verified
              </div>
              <div className="absolute -bottom-4 -left-4 px-3 py-1.5 rounded-full bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 text-xs font-semibold text-[#6C5CE7] shadow-sm">
                ✓ No permanent location storage
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-24 px-6 relative bg-white">
        <div className="max-w-5xl mx-auto relative z-10">
          <StatsCounter />
        </div>
      </section>

      {/* SCHOOLS */}
      <section id="schools" className="py-32 px-6 relative bg-[#f8f7ff]">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black mb-4 text-[#1a1a2e]">
              Live at <span className="text-[#6C5CE7]">your school</span>
            </h2>
            <p className="text-[#9090a8] max-w-lg mx-auto">
              Each campus gets its own colors, vibe, and community. Yours not here? Be the first.
            </p>
          </div>
          <SchoolCarousel />
        </div>
      </section>

      {/* DOWNLOAD CTA */}
      <section id="download" className="py-32 px-6 relative overflow-hidden bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#6C5CE7]/8 to-transparent rounded-full blur-[100px]" />

        <div className="max-w-3xl mx-auto relative z-10 text-center">
          <h2 className="text-5xl lg:text-7xl font-black mb-6 leading-tight text-[#1a1a2e]">
            Ready to
            <br />
            <span className="bg-gradient-to-r from-[#6C5CE7] via-[#a29bfe] to-[#00CEC9] bg-clip-text text-transparent">Be You?</span>
          </h2>
          <p className="text-lg text-[#9090a8] mb-10 max-w-md mx-auto">
            Download Colage and discover your campus like never before.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <a
              href="#"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#1a1a2e] text-white font-bold text-base hover:bg-[#2a2a4e] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#1a1a2e]/15"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Download for iOS
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl border border-gray-200 text-[#5a5a7a] font-bold text-base hover:bg-gray-50 hover:text-[#1a1a2e] transition-all duration-300 hover:-translate-y-0.5"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35zm13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27zm.91-.91L19.3 12 17.72 10.79l-2.27 2.27 2.27 2.15zM6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z"/>
              </svg>
              Google Play (Soon)
            </a>
          </div>

          <p className="text-xs text-[#9090a8]">Requires a valid .edu email address</p>
        </div>
      </section>

      {/* BUSINESS CTA */}
      <section className="py-20 px-6 border-t border-gray-100 bg-[#f8f7ff]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-2 text-[#1a1a2e]">Own a business near campus?</h3>
            <p className="text-[#9090a8]">Reach verified students within walking distance. Set your own daily budget.</p>
          </div>
          <Link
            href="/ads"
            className="shrink-0 px-8 py-3 rounded-xl bg-[#6C5CE7] text-white font-semibold hover:bg-[#5b4bd6] transition duration-300"
          >
            Open Ad Manager →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#6C5CE7] to-[#a29bfe] flex items-center justify-center text-[10px] font-black text-white">
              C
            </div>
            <span className="text-sm text-[#9090a8]">© 2026 Colage. Be You.</span>
          </div>
          <div className="flex gap-8 text-sm text-[#9090a8]">
            <Link href="#" className="hover:text-[#6C5CE7] transition">Privacy</Link>
            <Link href="#" className="hover:text-[#6C5CE7] transition">Terms</Link>
            <Link href="/ads" className="hover:text-[#6C5CE7] transition">Advertise</Link>
            <Link href="#" className="hover:text-[#6C5CE7] transition">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
