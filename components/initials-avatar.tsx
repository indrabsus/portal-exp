function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function InitialsAvatar({
  name,
  className = "size-10 text-sm",
}: {
  name: string
  className?: string
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary ${className}`}
    >
      {getInitials(name)}
    </div>
  )
}
