import { Code2, LayoutGrid, Hammer, Box, Rocket, Store, Blocks, Shapes, BrainCircuit, Cloud, PenTool, Zap } from 'lucide-react'

// Generic lucide icons, not recreations of Apple's own trademarked app
// icons — same reasoning as leaving the hotlinked wallpaper image out of
// the glass-orb component: don't reproduce someone else's IP.
const TOOLS = [
  { name: 'Swift', icon: Code2 },
  { name: 'SwiftUI', icon: LayoutGrid },
  { name: 'Xcode', icon: Hammer },
  { name: 'ARKit', icon: Box },
  { name: 'TestFlight', icon: Rocket },
  { name: 'App Store Connect', icon: Store },
  { name: 'Swift Playgrounds', icon: Blocks },
  { name: 'SF Symbols', icon: Shapes },
  { name: 'Core ML', icon: BrainCircuit },
  { name: 'CloudKit', icon: Cloud },
  { name: 'Figma', icon: PenTool },
  { name: 'Metal', icon: Zap },
]

// Reinvented, not the pattern that got rejected earlier this session — the
// chips use the same Liquid Glass recipe as Card (bg-card/70,
// backdrop-blur-lg, white/40 border) so this reads as part of this site's
// own material system rather than a generic scrolling logo strip. Content
// is duplicated once for a seamless loop; the visible track is aria-hidden
// with a plain text list underneath for screen readers.
export function ToolsMarquee() {
  return (
    <div className="tools-marquee">
      <span className="sr-only">Tools and technologies: {TOOLS.map((t) => t.name).join(', ')}</span>
      <div className="tools-marquee-track" aria-hidden="true">
        {[...TOOLS, ...TOOLS].map((tool, i) => {
          const Icon = tool.icon
          return (
            <div
              key={i}
              className="flex shrink-0 items-center gap-2 rounded-full border border-white/40 bg-card/70 px-4.5 py-2.5 text-sm font-medium text-foreground backdrop-blur-lg"
            >
              <Icon className="h-4 w-4 text-accent" />
              <span>{tool.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
