import { Construction } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function DashboardPlaceholder({
  roleLabel,
  description,
}: {
  roleLabel: string
  description: string
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Dashboard {roleLabel}
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="w-4 h-4 text-muted-foreground" />
            Menyusul
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Login dan navigasi peran {roleLabel.toLowerCase()} sudah aktif.
          Menu dan fitur lainnya akan ditambahkan bertahap di sesi
          berikutnya.
        </CardContent>
      </Card>
    </div>
  )
}
