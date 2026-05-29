'use client';

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* ── Multi-stop gradient base ── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #020014 0%, #050014 25%, #08001F 55%, #0B1026 100%)',
        }}
      />

      {/* ── Brighter aurora bands ── */}
      <div
        className="absolute inset-0 animate-aurora opacity-70"
        style={{
          background:
            'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(34,211,238,0.12) 20%, rgba(217,70,239,0.10) 40%, rgba(99,102,241,0.14) 60%, rgba(34,211,238,0.08) 80%, rgba(139,92,246,0.16) 100%)',
          backgroundSize: '400% 400%',
        }}
      />

      {/* ── Large drifting orbs ── */}
      <div
        className="glow-orb animate-blob-drift"
        style={{
          top: '-12%',
          left: '10%',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 65%)',
        }}
      />
      <div
        className="glow-orb animate-blob-drift"
        style={{
          top: '-8%',
          right: '5%',
          width: '700px',
          height: '700px',
          background: 'radial-gradient(circle, rgba(34,211,238,0.18) 0%, transparent 65%)',
          animationDelay: '-8s',
        }}
      />
      <div
        className="glow-orb animate-blob-drift"
        style={{
          top: '40%',
          left: '35%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(217,70,239,0.12) 0%, transparent 60%)',
          animationDelay: '-15s',
        }}
      />
      <div
        className="glow-orb animate-blob-drift"
        style={{
          bottom: '-10%',
          right: '20%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 60%)',
          animationDelay: '-5s',
        }}
      />

      {/* ── Perspective cyber grid floor ── */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '45vh',
          background: 'linear-gradient(to top, rgba(139,92,246,0.06) 0%, transparent 100%)',
          maskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage:
              `linear-gradient(rgba(139,92,246,0.08) 1px, transparent 1px),
               linear-gradient(90deg, rgba(139,92,246,0.08) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
            transform: 'perspective(500px) rotateX(55deg)',
            transformOrigin: 'center top',
          }}
        />
      </div>

      {/* ── Flat grid overlay ── */}
      <div className="absolute inset-0 grid-overlay opacity-30" />

      {/* ── CSS star particles (no canvas) ── */}
      <div className="absolute inset-0">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              top: `${(i * 2.5) % 100}%`,
              left: `${(i * 7.3 + 5) % 100}%`,
              background: i % 3 === 0
                ? 'rgba(139,92,246,0.6)'
                : i % 3 === 1
                  ? 'rgba(34,211,238,0.5)'
                  : 'rgba(217,70,239,0.4)',
              boxShadow: `0 0 ${3 + (i % 4)}px ${
                i % 3 === 0 ? 'rgba(139,92,246,0.3)' : i % 3 === 1 ? 'rgba(34,211,238,0.25)' : 'rgba(217,70,239,0.2)'
              }`,
              animationDelay: `${(i * 0.4) % 6}s`,
              animationDuration: `${4 + (i % 5)}s`,
              opacity: 0.4 + (i % 5) * 0.12,
            }}
          />
        ))}
      </div>

      {/* ── Edge vignette ── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 35%, rgba(2,0,20,0.6) 100%)',
        }}
      />
    </div>
  );
}
