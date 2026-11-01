/** The quiet moving background behind every page. Styles live in globals.css. */
export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="candor-ambient">
      <div className="candor-grid" />
      <div className="candor-orb candor-orb-a" />
      <div className="candor-orb candor-orb-b" />
      <div className="candor-orb candor-orb-c" />
    </div>
  );
}
