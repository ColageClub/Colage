"use client";

import { useState } from "react";

export interface Column<T> {
  name: string;
  key: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export default function AdminTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data",
}: AdminTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      })
    : data;

  if (data.length === 0) {
    return (
      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-12 text-center text-[#666]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#333]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key, col.sortable)}
                  className={`text-left text-xs font-medium text-[#A0A0A0] uppercase tracking-wider px-6 py-4 ${
                    col.sortable ? "cursor-pointer hover:text-white select-none" : ""
                  }`}
                >
                  {col.name}
                  {sortKey === col.key && (
                    <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(item)}
                className={`border-b border-[#333]/50 last:border-b-0 ${
                  onRowClick ? "cursor-pointer hover:bg-[#252525]" : ""
                } transition-colors`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm text-white whitespace-nowrap">
                    {col.render ? col.render(item) : String(item[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
