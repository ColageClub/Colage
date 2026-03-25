"use client";

import { useEffect, useState, useCallback } from "react";

interface Ad {
  id: string;
  businessId: string;
  school: string;
  emoji: string;
  businessName: string;
  bio: string;
  deal: string;
  address: string;
  dailyBudget: number;
  status: string;
  impressions: number;
  taps: number;
  totalSpend: number;
  createdAt: string;
  rejectionReason?: string;
}

export default function AdsPage() {
  const [tab, setTab] = useState<"review" | "all">("review");
  const [pendingAds, setPendingAds] = useState<Ad[]>([]);
  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const [reviewRes, allRes] = await Promise.all([
        fetch("/api/admin/ads/review").then(r => r.json()),
        fetch("/api/admin/ads").then(r => r.json()),
      ]);
      setPendingAds(reviewRes.ads || []);
      setAllAds(allRes.ads || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const handleReview = async (adId: string, decision: "approve" | "reject") => {
    setActionLoading(adId);
    try {
      await fetch(`/api/admin/ads/${adId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      setPendingAds(prev => prev.filter(a => a.id !== adId));
    } catch { /* empty */ }
    setActionLoading(null);
  };

  const ads = tab === "review" ? pendingAds : allAds;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#666]">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Ads</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setTab("review")}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
            tab === "review"
              ? "bg-[#6C5CE7] text-white"
              : "bg-[#1A1A1A] text-[#A0A0A0] hover:text-white border border-[#333]"
          }`}
        >
          Review Queue ({pendingAds.length})
        </button>
        <button
          onClick={() => setTab("all")}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
            tab === "all"
              ? "bg-[#6C5CE7] text-white"
              : "bg-[#1A1A1A] text-[#A0A0A0] hover:text-white border border-[#333]"
          }`}
        >
          All Ads
        </button>
      </div>

      {tab === "review" && pendingAds.length === 0 && (
        <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-12 text-center text-[#666]">
          No ads pending review
        </div>
      )}

      {tab === "all" && allAds.length === 0 && (
        <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-12 text-center text-[#666]">
          No ads to display
        </div>
      )}

      <div className="space-y-3">
        {ads.map((ad) => (
          <div key={ad.id} className="bg-[#1A1A1A] border border-[#333] rounded-2xl overflow-hidden">
            <div
              onClick={() => setExpanded(expanded === ad.id ? null : ad.id)}
              className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-[#252525] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{ad.emoji}</span>
                <div>
                  <div className="text-sm font-medium text-white">{ad.businessName}</div>
                  <div className="text-xs text-[#A0A0A0]">{ad.school} · {ad.deal}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  ad.status === "active" ? "bg-green-500/10 text-green-400" :
                  ad.status === "pending" ? "bg-yellow-500/10 text-yellow-400" :
                  ad.status === "rejected" ? "bg-red-500/10 text-red-400" :
                  "bg-[#252525] text-[#A0A0A0]"
                }`}>
                  {ad.status}
                </span>
                <span className="text-[#666] text-sm">{expanded === ad.id ? "▲" : "▼"}</span>
              </div>
            </div>

            {expanded === ad.id && (
              <div className="px-6 py-4 border-t border-[#333] space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-[#666]">Daily Budget</span>
                    <p className="text-white">${ad.dailyBudget}</p>
                  </div>
                  <div>
                    <span className="text-[#666]">Total Spend</span>
                    <p className="text-white">${ad.totalSpend?.toFixed(2) || "0.00"}</p>
                  </div>
                  <div>
                    <span className="text-[#666]">Impressions</span>
                    <p className="text-white">{ad.impressions || 0}</p>
                  </div>
                  <div>
                    <span className="text-[#666]">Taps</span>
                    <p className="text-white">{ad.taps || 0}</p>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-[#666]">Bio:</span>
                  <p className="text-[#A0A0A0]">{ad.bio}</p>
                </div>
                <div className="text-sm">
                  <span className="text-[#666]">Address:</span>
                  <p className="text-[#A0A0A0]">{ad.address}</p>
                </div>

                {tab === "review" && ad.status === "pending" && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleReview(ad.id, "approve")}
                      disabled={actionLoading === ad.id}
                      className="px-4 py-2 bg-green-500/10 text-green-400 text-sm font-medium rounded-xl hover:bg-green-500/20 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === ad.id ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReview(ad.id, "reject")}
                      disabled={actionLoading === ad.id}
                      className="px-4 py-2 bg-red-500/10 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === ad.id ? "..." : "Reject"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
