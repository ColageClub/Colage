"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import AdminSearch from "@/components/admin/AdminSearch";
import AdminModal from "@/components/admin/AdminModal";

interface School {
  domain: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  textColor?: string;
  userCount: number;
  [key: string]: unknown;
}

export default function SchoolsPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [filtered, setFiltered] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ domain: "", name: "", primaryColor: "#6C5CE7", accentColor: "#00CEC9", textColor: "#FFFFFF" });
  const [saving, setSaving] = useState(false);

  const fetchSchools = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/schools");
      const data = await res.json();
      setSchools(data.schools || []);
      setFiltered(data.schools || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);

  const handleSearch = useCallback((q: string) => {
    if (!q) { setFiltered(schools); return; }
    const lower = q.toLowerCase();
    setFiltered(schools.filter(s =>
      s.name.toLowerCase().includes(lower) || s.domain.toLowerCase().includes(lower)
    ));
  }, [schools]);

  const handleAdd = async () => {
    if (!form.domain || !form.name) return;
    setSaving(true);
    try {
      await fetch("/api/admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setModalOpen(false);
      setForm({ domain: "", name: "", primaryColor: "#6C5CE7", accentColor: "#00CEC9", textColor: "#FFFFFF" });
      fetchSchools();
    } catch { /* empty */ }
    setSaving(false);
  };

  const columns: Column<School>[] = [
    { name: "School Name", key: "name", sortable: true },
    { name: "Domain", key: "domain", sortable: true },
    { name: "Users", key: "userCount", sortable: true },
    {
      name: "Colors",
      key: "primaryColor",
      render: (s) => (
        <div className="flex gap-1.5">
          <div className="w-5 h-5 rounded-full border border-[#333]" style={{ backgroundColor: s.primaryColor }} title={s.primaryColor} />
          <div className="w-5 h-5 rounded-full border border-[#333]" style={{ backgroundColor: s.accentColor }} title={s.accentColor} />
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#666]">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Schools</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-[#6C5CE7] text-white text-sm font-medium rounded-xl hover:bg-[#5B4BD5] transition-colors"
        >
          Add School
        </button>
      </div>

      <AdminSearch placeholder="Search schools..." onChange={handleSearch} />

      <AdminTable
        columns={columns}
        data={filtered}
        onRowClick={(s) => router.push(`/admin/schools/${s.domain}`)}
        emptyMessage="No schools found"
      />

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title="Add School">
        <div className="space-y-4">
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
            className="w-full py-2.5 bg-[#6C5CE7] text-white text-sm font-medium rounded-xl hover:bg-[#5B4BD5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Adding..." : "Add School"}
          </button>
        </div>
      </AdminModal>
    </div>
  );
}
