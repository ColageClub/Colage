"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/schools", label: "Schools", icon: "🏫" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/ads", label: "Ads", icon: "📢" },
  { href: "/admin/revenue", label: "Revenue", icon: "💰" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6 border-b border-[#222]">
        <Link href="/admin" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-[#6C5CE7] flex items-center justify-center text-white font-bold text-lg">
            C
          </div>
          <span className="text-white font-semibold text-lg">colage admin</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.href)
                ? "bg-[#6C5CE7]/10 text-[#A29BFE] border-l-2 border-[#6C5CE7]"
                : "text-[#A0A0A0] hover:text-white hover:bg-[#1A1A1A]"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-[#222]">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#666] hover:text-white transition-colors"
        >
          Back to site →
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-[#1A1A1A] border border-[#333] rounded-lg flex items-center justify-center text-white"
      >
        {mobileOpen ? "✕" : "☰"}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-40 w-[260px] bg-[#111] border-r border-[#222] transform transition-transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:block fixed inset-y-0 left-0 w-[260px] bg-[#111] border-r border-[#222]">
        {sidebar}
      </aside>
    </>
  );
}
