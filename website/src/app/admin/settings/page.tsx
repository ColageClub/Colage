"use client";

import { useState } from "react";

const ADMIN_EMAILS = ["amcarbonaro@icloud.com", "admin@colageclub.com"];

export default function SettingsPage() {
  const [form, setForm] = useState({ domain: "", name: "", primaryColor: "#6C5CE7", accentColor: "#00CEC9", textColor: "#FFFFFF" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleAdd = async () => {
    if (!form.domain || !form.name) return;
    setSaving(true);
    try {
      await fetch("/api/admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSaved(true);
      setForm({ domain: "", name: "", primaryColor: "#6C5CE7", accentColor: "#00CEC9", textColor: "#FFFFFF" });
      setTimeout(() => setSaved(false), 3000);
    } catch { /* empty */ }
    setSaving(false);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Add School */}
      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Add School</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm text-[#A0A0A0] mb-1">Domain</label>
            <input
              type="text"
              placeholder="umich.edu"
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              className="w-full bg-[#252525] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#6C5CE7]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#A0A0A0] mb-1">Name</label>
            <input
              type="text"
              placeholder="University of Michigan"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-[#252525] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#6C5CE7]"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-[#A0A0A0] mb-1">Primary</label>
              <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
            </div>
            <div>
              <label className="block text-sm text-[#A0A0A0] mb-1">Accent</label>
              <input type="color" value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
            </div>
            <div>
              <label className="block text-sm text-[#A0A0A0] mb-1">Text</label>
              <input type="color" value={form.textColor} onChange={(e) => setForm({ ...form, textColor: e.target.value })} className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !form.domain || !form.name}
            className="px-6 py-2.5 bg-[#6C5CE7] text-white text-sm font-medium rounded-xl hover:bg-[#5B4BD5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Adding..." : saved ? "Added!" : "Add School"}
          </button>
        </div>
      </div>

      {/* Admin Emails */}
      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Admin Emails</h2>
        <div className="space-y-2">
          {ADMIN_EMAILS.map((email) => (
            <div key={email} className="flex items-center gap-3 px-4 py-2.5 bg-[#252525] rounded-xl">
              <span className="text-sm text-white">{email}</span>
              <span className="ml-auto text-xs text-[#666]">admin</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Feature Flags</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { name: "AR Mode", description: "Augmented reality campus view", enabled: true },
            { name: "Ads System", description: "Business ad serving and billing", enabled: true },
            { name: "Location Sharing", description: "Real-time location updates", enabled: true },
            { name: "Push Notifications", description: "Mobile push notifications", enabled: false },
          ].map((flag) => (
            <div key={flag.name} className="flex items-center justify-between px-4 py-3 bg-[#252525] rounded-xl">
              <div>
                <div className="text-sm font-medium text-white">{flag.name}</div>
                <div className="text-xs text-[#666]">{flag.description}</div>
              </div>
              <div className={`w-10 h-6 rounded-full flex items-center px-1 ${
                flag.enabled ? "bg-[#6C5CE7]" : "bg-[#333]"
              }`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  flag.enabled ? "translate-x-4" : ""
                }`} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#666] mt-3">Feature flags are display-only placeholders.</p>
      </div>
    </div>
  );
}
