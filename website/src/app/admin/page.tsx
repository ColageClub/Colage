"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminTable, { type Column } from "@/components/admin/AdminTable";

interface Stats {
  totalUsers: number;
  totalSchools: number;
  activeAds: number;
  totalRevenue: number;
}

interface UserRow {
  userId: string;
  name: string;
  email: string;
  universityDomain: string;
  createdAt: string;
  status: string;
  [key: string]: unknown;
}

interface SchoolRow {
  domain: string;
  name: string;
  userCount: number;
  [key: string]: unknown;
}

export default function AdminOverview() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalSchools: 0, activeAds: 0, totalRevenue: 0 });
  const [users, setUsers] = useState<UserRow[]>([]);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then(r => r.json()),
      fetch("/api/admin/users?limit=10").then(r => r.json()),
      fetch("/api/admin/schools").then(r => r.json()),
    ]).then(([statsData, usersData, schoolsData]) => {
      setStats(statsData);
      setUsers(usersData.users || []);
      setSchools(schoolsData.schools || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const userColumns: Column<UserRow>[] = [
    { name: "Name", key: "name", sortable: true },
    { name: "Email", key: "email", sortable: true },
    { name: "School", key: "universityDomain", sortable: true },
    {
      name: "Joined",
      key: "createdAt",
      sortable: true,
      render: (u) => u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—",
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

  const schoolColumns: Column<SchoolRow>[] = [
    { name: "School", key: "name", sortable: true },
    { name: "Domain", key: "domain" },
    { name: "Users", key: "userCount", sortable: true },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#666]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Total Users" value={stats.totalUsers} icon="👥" />
        <AdminStatCard label="Total Schools" value={stats.totalSchools} icon="🏫" />
        <AdminStatCard label="Active Ads" value={stats.activeAds} icon="📢" />
        <AdminStatCard
          label="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          icon="💰"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Users</h2>
          <button
            onClick={() => router.push("/admin/users")}
            className="text-sm text-[#A29BFE] hover:text-white transition-colors"
          >
            View all →
          </button>
        </div>
        <AdminTable
          columns={userColumns}
          data={users}
          onRowClick={(u) => router.push(`/admin/users/${u.userId}`)}
          emptyMessage="No users yet"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Schools</h2>
          <button
            onClick={() => router.push("/admin/schools")}
            className="text-sm text-[#A29BFE] hover:text-white transition-colors"
          >
            View all →
          </button>
        </div>
        <AdminTable
          columns={schoolColumns}
          data={schools}
          onRowClick={(s) => router.push(`/admin/schools/${s.domain}`)}
          emptyMessage="No schools yet"
        />
      </div>
    </div>
  );
}
