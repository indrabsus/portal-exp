import Image from "next/image"
import { Play } from "lucide-react"

import { getYoutubeThumbnail } from "@/lib/youtube"

export function YoutubeThumbnail({ url }: { url: string | null }) {
  const thumbnail = getYoutubeThumbnail(url)
  if (!thumbnail || !url) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block aspect-video w-full overflow-hidden rounded-lg bg-muted"
    >
      <Image
        src={thumbnail}
        alt="Thumbnail video"
        fill
        unoptimized
        className="object-cover transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
        <div className="flex size-10 items-center justify-center rounded-full bg-white/90 text-black shadow-sm">
          <Play className="size-4 fill-current" />
        </div>
      </div>
    </a>
  )
}
