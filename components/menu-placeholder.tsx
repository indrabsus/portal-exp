import { Construction } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function MenuPlaceholder({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="w-4 h-4 text-muted-foreground" />
            Menyusul
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Fitur {title.toLowerCase()} akan ditambahkan pada tahap pengembangan
          berikutnya.
        </CardContent>
      </Card>
    </div>
  )
}
