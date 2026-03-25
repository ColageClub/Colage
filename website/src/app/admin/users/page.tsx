"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import AdminSearch from "@/components/admin/AdminSearch";

interface User {
  userId: string;
  name: string;
  email: string;
  universityDomain: string;
  major?: string;
  createdAt: string;
  lastActive?: string;
  status: string;
  [key: string]: unknown;
}

interface School {
  domain: string;
  name: string;
  [key: string]: unknown;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchUsers = useCallback(async (append = false, key?: string | null) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (schoolFilter) params.set("school", schoolFilter);
    if (statusFilter) params.set("status", statusFilter);
    params.set("limit", "50");
    if (key) params.set("lastKey", key);

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (append) {
        setUsers(prev => [...prev, ...(data.users || [])]);
      } else {
        setUsers(data.users || []);
      }
      setLastKey(data.lastKey || null);
    } catch { /* empty */ }

    setLoading(false);
    setLoadingMore(false);
  }, [search, schoolFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    fetch("/api/admin/schools").then(r => r.json()).then(d => setSchools(d.schools || [])).catch(() => {});
  }, []);

  const columns: Column<User>[] = [
    { name: "Name", key: "name", sortable: true },
    { name: "Email", key: "email", sortable: true },
    { name: "School", key: "universityDomain", sortable: true },
    { name: "Major", key: "major" },
    {
      name: "Joined",
      key: "createdAt",
      sortable: true,
      render: (u) => u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—",
    },
    {
      name: "Last Active",
      key: "lastActive",
      sortable: true,
      render: (u) => u.lastActive ? new Date(u.lastActive).toLocaleDateString() : "—",
    },
    {
      name: "Status",
      key: "status",
      render: (u) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          u.status === "active" ? "bg-green-500/10 text-green-400" :
          u.status === "suspended" ? "bg-yellow-500/10 text-yellow-400" :
          "bg-red-500/10 text-red-400"
        }`}>
          {u.status}
        </span>
      ),
    },
  ];

  const displayed = statusFilter
    ? users.filter(u => u.status === statusFilter)
    : users;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Users</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <AdminSearch placeholder="Search users by name or email..." onChange={setSearch} />
        </div>
        <select
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
          className="bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#6C5CE7]"
        >
          <option value="">All Schools</option>
          {schools.map(s => (
            <option key={s.domain} value={s.domain}>{s.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#6C5CE7]"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="text-[#666]">Loading...</div></div>
      ) : (
        <>
          <AdminTable
            columns={columns}
            data={displayed}
            onRowClick={(u) => router.push(`/admin/users/${u.userId}`)}
            emptyMessage="No users found"
          />
          {lastKey && (
            <div className="flex justify-center">
              <button
                onClick={() => fetchUsers(true, lastKey)}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-[#1A1A1A] border border-[#333] text-sm text-white rounded-xl hover:bg-[#252525] transition-colors disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
