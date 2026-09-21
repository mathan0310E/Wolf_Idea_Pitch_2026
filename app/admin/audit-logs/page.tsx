"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ScrollText } from "lucide-react"

import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { AuditLog } from "@/lib/types"

function adminToken(): string | null {
  try {
    return sessionStorage.getItem("wolf_admin_session")
  } catch {
    return null
  }
}

export default function AuditLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = React.useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    const token = adminToken()
    if (!token) {
      router.push("/admin/login")
      return
    }

    const controller = new AbortController()

    fetch("/api/admin/audit-logs", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          sessionStorage.removeItem("wolf_admin_session")
          router.push("/admin/login")
          return
        }
        if (!res.ok) {
          setError(true)
          return
        }
        const data = await res.json()
        setLogs(Array.isArray(data?.logs) ? data.logs : [])
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setError(true)
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [router])

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <AdminHeader title="Audit Logs" />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:p-6 space-y-6">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-white">Audit Logs</h2>
          <p className="text-xs text-zinc-400 mt-1">
            All admin actions recorded on this account.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-[#E50914]/10 border border-[#E50914]/30 text-xs text-[#E50914] font-medium">
            Failed to load audit logs. Please try again.
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            title="No audit logs"
            description="No admin actions have been recorded yet."
            icon={<ScrollText className="w-10 h-10 text-zinc-500" />}
          />
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <Card key={log.id || `${log.actorUid}-${log.timestamp}`}>
                <CardHeader>
                  <CardTitle>{log.action}</CardTitle>
                  {log.id && <p className="text-xs font-mono text-zinc-500">{log.id}</p>}
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Actor
                    </p>
                    <p className="font-mono text-xs text-zinc-300">{log.actorUid}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Target
                    </p>
                    <p className="font-mono text-xs text-zinc-300">{log.targetId}</p>
                  </div>
                  {(log.before !== undefined || log.after !== undefined) && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {log.before !== undefined && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                            Before
                          </p>
                          <pre className="p-3 rounded bg-[#151515] border border-white/10 text-xs text-zinc-300 overflow-x-auto">
                            {JSON.stringify(log.before, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.after !== undefined && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                            After
                          </p>
                          <pre className="p-3 rounded bg-[#151515] border border-white/10 text-xs text-zinc-300 overflow-x-auto">
                            {JSON.stringify(log.after, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Timestamp
                    </p>
                    <p className="font-mono text-xs text-zinc-300">{log.timestamp}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}