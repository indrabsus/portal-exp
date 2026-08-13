"use client"

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import type { SortDir } from "@/lib/use-table-controls"

export function SortableTh({
  label,
  sortKey,
  activeKey,
  sortDir,
  onSort,
  className,
}: {
  label: React.ReactNode
  sortKey: string
  activeKey: string | null
  sortDir: SortDir
  onSort: (key: string) => void
  className?: string
}) {
  const active = activeKey === sortKey
  const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <th
      className={`px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase ${className || ""}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex cursor-pointer items-center gap-1.5 hover:text-foreground"
      >
        {label}
        <Icon className={`w-3.5 h-3.5 ${active ? "opacity-100" : "opacity-40"}`} />
      </button>
    </th>
  )
}
