"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminTable, { type Column } from "@/components/admin/AdminTable";

interface University {
  domain: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  textColor?: string;
}

interface User {
  userId: string;
  name: string;
  email: string;
  major?: string;
  lastActive?: string;
  status: string;
  [key: string]: unknown;
}

export default function SchoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const domain = params.domain as string;
  const [university, setUniversity] = useState<University | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/schools/${encodeURIComponent(domain)}`)
      .then(r => r.json())
      .then(data => {
        setUniversity(data.university || null);
        setUsers(data.users || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [domain]);

  const userColumns: Column<User>[] = [
    { name: "Name", key: "name", sortable: true },
    { name: "Email", key: "email", sortable: true },
    { name: "Major", key: "major" },
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

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#666]">Loading...</div></div>;
  }

  if (!university) {
    return <div className="text-center text-[#666] py-12">School not found</div>;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.push("/admin/schools")} className="text-sm text-[#A29BFE] hover:text-white transition-colors">
        ← Back to Schools
      </button>

      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-2xl font-bold text-white">{university.name}</h1>
          <div className="flex gap-1.5">
            <div className="w-5 h-5 rounded-full border border-[#333]" style={{ backgroundColor: university.primaryColor }} />
            <div className="w-5 h-5 rounded-full border border-[#333]" style={{ backgroundColor: university.accentColor }} />
          </div>
        </div>
        <div className="flex gap-6 text-sm text-[#A0A0A0]">
          <span>Domain: <span className="text-white">{university.domain}</span></span>
          <span>Users: <span className="text-white">{users.length}</span></span>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Users at {university.name}</h2>
        <AdminTable
          columns={userColumns}
          data={users}
          onRowClick={(u) => router.push(`/admin/users/${u.userId}`)}
          emptyMessage="No users at this school"
        />
      </div>
    </div>
  );
}
