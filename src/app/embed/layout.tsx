import { EmbedLinksTop } from '@/components/patterns/embed-links-top'

// The shell for the pages shown inside the iMac scroll windows on the home
// page (see imac-scroll-windows.tsx). Deliberately NOT the public site's
// layout: that one builds the whole search index (seven Google calls), and
// mounts the header, dock, footer, the drifting background and a second
// copy of the smooth-scroll engine — and each of the three windows used to
// load all of it again inside its iframe. Here there is just the section
// itself on a static backdrop, so it is pre-built like any other page and
// costs almost nothing to run.
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div aria-hidden="true" className="embed-backdrop fixed inset-0 -z-10" />
      <EmbedLinksTop />
      <main>{children}</main>
    </>
  )
}
