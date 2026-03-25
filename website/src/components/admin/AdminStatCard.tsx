"use client";

interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: { value: string; positive: boolean };
}

export default function AdminStatCard({ label, value, icon, trend }: AdminStatCardProps) {
  return (
    <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend.positive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          }`}>
            {trend.positive ? "+" : ""}{trend.value}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-[#A0A0A0]">{label}</div>
    </div>
  );
}
