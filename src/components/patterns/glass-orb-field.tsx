// Pure CSS, like wave-field.tsx — circular panes that refract whatever
// color is behind them (the sitewide wave gradient) via backdrop-blur +
// backdrop-contrast, the same real "glass" trick as Apple's own Liquid
// Glass material. No external image: refracting our own gradient keeps
// this self-contained and avoids hotlinking/rehosting anyone else's art.
// Meant to be mounted inside a `relative` section (e.g. Hero), not
// sitewide — see hero.tsx.
export function GlassOrbField() {
  return (
    <div aria-hidden="true" className="glass-orb-field">
      <div className="glass-orb glass-orb--1" />
      <div className="glass-orb glass-orb--2" />
      <div className="glass-orb glass-orb--3" />
    </div>
  )
}
