export function getYoutubeId(url: string | null): string | null {
  if (!url) return null
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match?.[1] ?? null
}

export function getYoutubeThumbnail(url: string | null): string | null {
  const id = getYoutubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}
