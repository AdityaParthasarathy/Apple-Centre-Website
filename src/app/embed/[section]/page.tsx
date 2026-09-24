import { notFound } from 'next/navigation'
import { AboutSection } from '@/components/sections/about'
import { LabsFacilitiesSection } from '@/components/sections/labs-facilities'
import { ProjectsSection } from '@/components/sections/projects'

// One page per iMac window on the home page. Pre-built and refreshed every
// minute like the other content pages, so opening a window is a static file
// rather than a server render that waits on Google.
const SECTIONS = {
  about: AboutSection,
  facilities: LabsFacilitiesSection,
  projects: ProjectsSection,
} as const

export const revalidate = 60
export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(SECTIONS).map((section) => ({ section }))
}

// Only ever framed by our own home page — not something to index.
export const metadata = { robots: { index: false, follow: false } }

export default async function EmbedPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  const Section = SECTIONS[section as keyof typeof SECTIONS]
  if (!Section) notFound()
  return <Section />
}
