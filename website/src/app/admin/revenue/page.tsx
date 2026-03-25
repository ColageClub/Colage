"use client";

import { useEffect, useState } from "react";
import AdminStatCard from "@/components/admin/AdminStatCard";

interface DailyRevenue {
  date: string;
  revenue: number;
  impressions: number;
}

export default function RevenuePage() {
  const [daily, setDaily] = useState<DailyRevenue[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/revenue")
      .then(r => r.json())
      .then(data => {
        setDaily(data.daily || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxRevenue = Math.max(...daily.map(d => d.revenue), 1);
  const totalImpressions = daily.reduce((sum, d) => sum + d.impressions, 0);

  // This month's revenue
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthlyRevenue = daily
    .filter(d => d.date.startsWith(thisMonth))
    .reduce((sum, d) => sum + d.revenue, 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#666]">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Revenue</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard label="This Month" value={`$${monthlyRevenue.toFixed(2)}`} icon="💰" />
        <AdminStatCard label="Last 30 Days" value={`$${total.toFixed(2)}`} icon="📈" />
        <AdminStatCard label="Total Impressions" value={totalImpressions.toLocaleString()} icon="👁" />
      </div>

      {/* Bar Chart */}
      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6">
        <h2 className="text-sm font-medium text-[#A0A0A0] uppercase tracking-wider mb-6">Daily Revenue (Last 30 Days)</h2>
        {daily.length === 0 ? (
          <div className="text-center text-[#666] py-8">No revenue data</div>
        ) : (
          <div className="flex items-end gap-1 h-48">
            {daily.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center group relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#252525] border border-[#333] rounded-lg px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {d.date}: ${d.revenue.toFixed(2)}
                </div>
                <div
                  className="w-full bg-[#6C5CE7]/60 hover:bg-[#6C5CE7] rounded-t transition-colors"
                  style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: d.revenue > 0 ? "4px" : "0" }}
                />
              </div>
            ))}
          </div>
        )}
        {daily.length > 0 && (
          <div className="flex justify-between mt-2 text-xs text-[#666]">
            <span>{daily[0]?.date}</span>
            <span>{daily[daily.length - 1]?.date}</span>
          </div>
        )}
      </div>

      {/* Revenue Table */}
      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#333]">
              <th className="text-left text-xs font-medium text-[#A0A0A0] uppercase tracking-wider px-6 py-4">Date</th>
              <th className="text-left text-xs font-medium text-[#A0A0A0] uppercase tracking-wider px-6 py-4">Impressions</th>
              <th className="text-left text-xs font-medium text-[#A0A0A0] uppercase tracking-wider px-6 py-4">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {daily.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-[#666]">No data</td>
              </tr>
            ) : (
              [...daily].reverse().map((d) => (
                <tr key={d.date} className="border-b border-[#333]/50 last:border-b-0 hover:bg-[#252525] transition-colors">
                  <td className="px-6 py-3 text-sm text-white">{d.date}</td>
                  <td className="px-6 py-3 text-sm text-[#A0A0A0]">{d.impressions.toLocaleString()}</td>
                  <td className="px-6 py-3 text-sm text-white font-medium">${d.revenue.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
