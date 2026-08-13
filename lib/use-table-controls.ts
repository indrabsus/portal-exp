"use client"

import { useMemo, useState } from "react"

export type SortDir = "asc" | "desc"
type SortValue = string | number | boolean | null | undefined

export function useTableControls<T>(
  rows: T[],
  options: {
    searchFields?: (row: T) => (string | null | undefined)[]
    getSortValue?: (row: T, key: string) => SortValue
    initialSortKey?: string | null
    initialSortDir?: SortDir
    initialPageSize?: number
  } = {}
) {
  const {
    searchFields,
    getSortValue,
    initialSortKey = null,
    initialSortDir = "asc",
    initialPageSize = 10,
  } = options

  const [search, setSearchState] = useState("")
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey)
  const [sortDir, setSortDir] = useState<SortDir>(initialSortDir)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(initialPageSize)

  const setSearch = (value: string) => {
    setSearchState(value)
    setPage(1)
  }

  const setPageSize = (size: number) => {
    setPageSizeState(size)
    setPage(1)
  }

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim() || !searchFields) return rows
    const q = search.trim().toLowerCase()
    return rows.filter((row) =>
      searchFields(row).some((v) => v?.toLowerCase().includes(q))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search])

  const sorted = useMemo(() => {
    if (!sortKey || !getSortValue) return filtered

    const withIndex = filtered.map((row, index) => ({ row, index }))

    withIndex.sort((a, b) => {
      const va = getSortValue(a.row, sortKey)
      const vb = getSortValue(b.row, sortKey)

      let cmp: number

      if (va == null && vb == null) cmp = 0
      else if (va == null) cmp = -1
      else if (vb == null) cmp = 1
      else if (typeof va === "number" && typeof vb === "number") cmp = va - vb
      else if (typeof va === "boolean" && typeof vb === "boolean")
        cmp = Number(va) - Number(vb)
      else
        cmp = String(va).localeCompare(String(vb), "id", {
          numeric: true,
          sensitivity: "base",
        })

      if (cmp === 0) cmp = a.index - b.index

      return sortDir === "asc" ? cmp : -cmp
    })

    return withIndex.map((item) => item.row)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, sortKey, sortDir])

  const totalRows = sorted.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const currentPage = Math.min(page, totalPages)

  const pageRows = useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sorted, currentPage, pageSize]
  )

  return {
    rows: pageRows,
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    page: currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalRows,
  }
}
