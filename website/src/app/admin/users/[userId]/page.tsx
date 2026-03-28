"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminModal from "@/components/admin/AdminModal";

interface User {
  userId: string;
  name: string;
  displayName?: string;
  email: string;
  universityDomain: string;
  major?: string;
  bio?: string;
  photoUrl?: string;
  profilePhotoURL?: string;
  socialLinks?: Array<{ platform: string; handle: string }>;
  socials?: Record<string, string>;
  status: string;
  isVisible?: boolean;
  createdAt: string;
  updatedAt?: string;
  lastActive?: string;
}

interface Location {
  lat: number;
  lng: number;
  lastUpdated: string;
}

function getDisplayName(user: User): string {
  return user.displayName || user.name || user.email?.split("@")[0] || "Unknown";
}

function getPhoto(user: User): string | undefined {
  return user.profilePhotoURL || user.photoUrl;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [user, setUser] = useState<User | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then(data => {
        setUser(data.user || null);
        setLocation(data.location || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handleAction = async (action: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === "delete") {
          router.push("/admin/users");
        } else {
          setUser(prev => prev ? { ...prev, status: data.status } : null);
        }
      }
    } catch { /* empty */ }
    setActionLoading(false);
    setConfirmAction(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#666]">Loading...</div></div>;
  }

  if (!user) {
    return <div className="text-center text-[#666] py-12">User not found</div>;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.push("/admin/users")} className="text-sm text-[#A29BFE] hover:text-white transition-colors">
        ← Back to Users
      </button>

      {/* Profile Card */}
      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-[#252525] border border-[#333] flex items-center justify-center text-2xl text-[#666] shrink-0 overflow-hidden">
            {getPhoto(user) ? (
              <img src={getPhoto(user)} alt={getDisplayName(user)} className="w-full h-full rounded-full object-cover" />
            ) : (
              getDisplayName(user)[0]?.toUpperCase() || "?"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-white">{getDisplayName(user)}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                (user.status || "active") === "active" ? "bg-green-500/10 text-green-400" :
                user.status === "suspended" ? "bg-yellow-500/10 text-yellow-400" :
                "bg-red-500/10 text-red-400"
              }`}>
                {user.status || "active"}
              </span>
            </div>
            <p className="text-sm text-[#A0A0A0]">{user.email}</p>
            {user.bio && <p className="text-sm text-[#A0A0A0] mt-2">{user.bio}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* School Info */}
        <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6">
          <h2 className="text-sm font-medium text-[#A0A0A0] uppercase tracking-wider mb-4">School</h2>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-[#666]">University</span>
              <p className="text-sm text-white">{user.universityDomain}</p>
            </div>
            {user.major && (
              <div>
                <span className="text-xs text-[#666]">Major</span>
                <p className="text-sm text-white">{user.major}</p>
              </div>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6">
          <h2 className="text-sm font-medium text-[#A0A0A0] uppercase tracking-wider mb-4">Account</h2>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-[#666]">User ID</span>
              <p className="text-sm text-white font-mono">{user.userId}</p>
            </div>
            <div>
              <span className="text-xs text-[#666]">Joined</span>
              <p className="text-sm text-white">{user.createdAt ? new Date(user.createdAt).toLocaleString() : "—"}</p>
            </div>
            <div>
              <span className="text-xs text-[#666]">Last Active</span>
              <p className="text-sm text-white">{(user.lastActive || user.updatedAt) ? new Date(user.lastActive || user.updatedAt!).toLocaleString() : "—"}</p>
            </div>
            {location && (
              <div>
                <span className="text-xs text-[#666]">Last Location</span>
                <p className="text-sm text-white">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Socials */}
      {((user.socialLinks && user.socialLinks.length > 0) || (user.socials && Object.keys(user.socials).length > 0)) && (
        <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6">
          <h2 className="text-sm font-medium text-[#A0A0A0] uppercase tracking-wider mb-4">Socials</h2>
          <div className="flex flex-wrap gap-3">
            {user.socialLinks?.map((link) => (
              <span key={link.platform} className="px-3 py-1.5 bg-[#252525] rounded-lg text-sm text-white">
                <span className="text-[#A0A0A0] capitalize">{link.platform}:</span> {link.handle}
              </span>
            ))}
            {!user.socialLinks && user.socials && Object.entries(user.socials).map(([platform, handle]) => (
              <span key={platform} className="px-3 py-1.5 bg-[#252525] rounded-lg text-sm text-white">
                <span className="text-[#A0A0A0]">{platform}:</span> {handle}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-[#1A1A1A] border border-red-500/20 rounded-2xl p-6">
        <h2 className="text-sm font-medium text-red-400 uppercase tracking-wider mb-4">Danger Zone</h2>
        <div className="flex flex-wrap gap-3">
          {user.status === "active" ? (
            <button
              onClick={() => setConfirmAction("suspend")}
              className="px-4 py-2 bg-yellow-500/10 text-yellow-400 text-sm font-medium rounded-xl hover:bg-yellow-500/20 transition-colors"
            >
              Suspend User
            </button>
          ) : user.status === "suspended" ? (
            <button
              onClick={() => setConfirmAction("unsuspend")}
              className="px-4 py-2 bg-green-500/10 text-green-400 text-sm font-medium rounded-xl hover:bg-green-500/20 transition-colors"
            >
              Unsuspend User
            </button>
          ) : null}
          {user.status !== "banned" && (
            <button
              onClick={() => setConfirmAction("ban")}
              className="px-4 py-2 bg-red-500/10 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/20 transition-colors"
            >
              Ban User
            </button>
          )}
          <button
            onClick={() => setConfirmAction("delete")}
            className="px-4 py-2 bg-red-500/10 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/20 transition-colors"
          >
            Delete User
          </button>
        </div>
      </div>

      <AdminModal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={`Confirm ${confirmAction}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#A0A0A0]">
            Are you sure you want to <span className="text-white font-medium">{confirmAction}</span> user{" "}
            <span className="text-white font-medium">{getDisplayName(user)}</span>?
            {confirmAction === "delete" && " This action cannot be undone."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmAction(null)}
              className="flex-1 py-2.5 bg-[#252525] text-white text-sm font-medium rounded-xl hover:bg-[#333] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => confirmAction && handleAction(confirmAction)}
              disabled={actionLoading}
              className="flex-1 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {actionLoading ? "Processing..." : `Yes, ${confirmAction}`}
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
