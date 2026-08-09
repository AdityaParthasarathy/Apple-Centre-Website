/** Invisible until focused — lets keyboard users jump past the nav (the
 *  floating dock + header on the public site, or the portal nav on the
 *  staff side) straight to the page content, instead of tabbing through
 *  every nav item first on every single page. */
export function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-foreground focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      Skip to main content
    </a>
  )
}
