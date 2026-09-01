import { IMacIcon, type IMacColorway } from './imac-icon'

// Three lanes, offset speeds/directions, spread top-to-bottom so the field
// reads as depth rather than one flat row. Decorative only — aria-hidden,
// pointer-events-none (see .imac-marquee-field in globals.css) — the
// screen-reader content is the plain hero copy, same as glass-orb-field.
const LANES: { colors: IMacColorway[]; className: string }[] = [
  { colors: ['pink', 'blue', 'yellow', 'purple', 'orange', 'green'], className: 'imac-lane imac-lane--1' },
  { colors: ['orange', 'green', 'pink', 'blue', 'purple', 'yellow'], className: 'imac-lane imac-lane--2' },
  { colors: ['purple', 'yellow', 'green', 'orange', 'blue', 'pink'], className: 'imac-lane imac-lane--3' },
]

export function IMacMarqueeField() {
  return (
    <div aria-hidden="true" className="imac-marquee-field">
      {LANES.map((lane, i) => (
        <div key={i} className={lane.className}>
          <div className="imac-lane-track">
            {[...lane.colors, ...lane.colors].map((colorway, j) => (
              <div className="imac-lane-item" key={j} style={{ animationDelay: `${(j % lane.colors.length) * -1.3}s` }}>
                <IMacIcon colorway={colorway} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
