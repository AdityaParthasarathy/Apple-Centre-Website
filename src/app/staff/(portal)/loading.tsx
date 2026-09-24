// Shown the instant a portal tab is clicked, while its page loads — so a slow
// answer from Google never leaves the screen looking frozen.
export default function PortalLoading() {
  return (
    <div role="status" aria-busy="true" className="animate-pulse space-y-6">
      <span className="sr-only">Loading…</span>
      <div className="h-8 w-56 rounded-lg bg-muted/60" />
      <div className="h-4 w-full max-w-md rounded bg-muted/50" />
      <div className="mt-8 h-72 rounded-lg bg-muted/40" />
      <div className="space-y-3">
        <div className="h-20 rounded-lg bg-muted/30" />
        <div className="h-20 rounded-lg bg-muted/30" />
        <div className="h-20 rounded-lg bg-muted/30" />
      </div>
    </div>
  )
}
