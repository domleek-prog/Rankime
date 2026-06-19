// Fixed full-viewport decoration layer behind all app content: violet/indigo
// aurora glows in the corners plus slowly falling sakura petals. Purely
// decorative and non-interactive; honours prefers-reduced-motion via index.css.

const PETALS = [
  { left: '8%',  bg: 'rgba(247,170,197,0.46)', dur: '15s', delay: '-2s',  sway: '24px',  pop: 0.6 },
  { left: '22%', bg: 'rgba(186,162,255,0.44)', dur: '19s', delay: '-11s', sway: '-18px', pop: 0.55 },
  { left: '36%', bg: 'rgba(247,170,197,0.38)', dur: '13s', delay: '-6s',  sway: '16px',  pop: 0.5, sm: true },
  { left: '50%', bg: 'rgba(186,162,255,0.42)', dur: '18s', delay: '-1s',  sway: '-26px', pop: 0.6 },
  { left: '63%', bg: 'rgba(247,170,197,0.40)', dur: '16s', delay: '-13s', sway: '20px',  pop: 0.55 },
  { left: '77%', bg: 'rgba(186,162,255,0.36)', dur: '21s', delay: '-8s',  sway: '-14px', pop: 0.5, sm: true },
  { left: '90%', bg: 'rgba(247,170,197,0.34)', dur: '23s', delay: '-16s', sway: '28px',  pop: 0.45 },
];

export default function AppBackground() {
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none', background: 'var(--page)' }}>
      {/* Aurora corner glows */}
      <div style={{ position: 'absolute', width: '46vmax', height: '46vmax', top: '-18vmax', left: '-16vmax', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.30), transparent 70%)' }} />
      <div style={{ position: 'absolute', width: '50vmax', height: '50vmax', bottom: '-22vmax', right: '-18vmax', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,130,246,0.26), transparent 70%)' }} />

      {/* Drifting petals */}
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="rk-petal"
          style={{
            left: p.left,
            background: p.bg,
            animationDuration: p.dur,
            animationDelay: p.delay,
            '--sway': p.sway,
            '--pop': p.pop,
            ...(p.sm ? { width: '7px', height: '11px' } : null),
          }}
        />
      ))}
    </div>
  );
}
