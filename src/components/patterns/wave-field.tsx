// Pure CSS — no hooks, no canvas, no JS animation loop. A calm, slow drift
// of blurred pastel blobs in Big Sur's own hue path, adapted for the site's
// light theme (see the .wave-blob rules and --wave-* tokens in globals.css).
// Deliberately not WebGL: this project has had two rough shader experiences
// already, and a drift this gentle doesn't need a GPU to look right — it
// needs to be easy to get right on the first try and easy to verify.
export function WaveField() {
  return (
    <div aria-hidden="true" className="wave-field">
      <div className="wave-blob wave-blob--a" />
      <div className="wave-blob wave-blob--b" />
      <div className="wave-blob wave-blob--c" />
      <div className="wave-blob wave-blob--d" />
    </div>
  )
}
