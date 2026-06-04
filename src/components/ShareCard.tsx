import { forwardRef } from 'react';
import { Pokemon, TYPE_COLORS, getArtwork, formatPokemonId, capitalize } from '@/lib/pokemon';

type Mode =
  | { kind: 'pokemon'; pokemon: Pokemon }
  | { kind: 'compare'; pair: [Pokemon, Pokemon] }
  | { kind: 'team'; team: (Pokemon | null)[] };

interface Props {
  mode: Mode;
}

const STAT_NAMES: Record<string, string> = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SP.A',
  'special-defense': 'SP.D',
  speed: 'SPD',
};

/**
 * Off-screen card optimized for social-media sharing (1080x1350, 4:5).
 * Pure inline styling — no Tailwind dependent on parent context — so
 * html-to-image renders consistently.
 */
const ShareCard = forwardRef<HTMLDivElement, Props>(({ mode }, ref) => {
  const W = 1080;
  const H = 1350;

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: 0,
        left: -99999, // off-screen
        width: W,
        height: H,
        background:
          'radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a12 60%), #0a0a12',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: 56,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Decorative grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 32,
        }}
      >
        <div
          style={{
            fontSize: 14,
            letterSpacing: 4,
            color: '#ef4444',
            fontWeight: 700,
          }}
        >
          ◆ POKÉDEX ARCHIVE
        </div>
        <div style={{ fontSize: 12, letterSpacing: 3, color: '#888' }}>
          {mode.kind === 'pokemon' && 'ENTRY'}
          {mode.kind === 'compare' && 'VERSUS'}
          {mode.kind === 'team' && 'SQUAD'}
        </div>
      </div>

      {mode.kind === 'pokemon' && <PokemonCardBody pokemon={mode.pokemon} />}
      {mode.kind === 'compare' && <CompareCardBody pair={mode.pair} />}
      {mode.kind === 'team' && <TeamCardBody team={mode.team} />}

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: 56,
          right: 56,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: '#666',
          letterSpacing: 2,
        }}
      >
        <span>POWERED BY POKEAPI</span>
        <span>{new Date().getFullYear()} • DIGITAL ARCHIVE</span>
      </div>
    </div>
  );
});

ShareCard.displayName = 'ShareCard';
export default ShareCard;

/* -------------------------------------------------------------------------- */
/* Pokemon card body                                                          */
/* -------------------------------------------------------------------------- */
const PokemonCardBody = ({ pokemon }: { pokemon: Pokemon }) => {
  const mainType = pokemon.types[0]?.type.name || 'normal';
  const color = TYPE_COLORS[mainType];
  const total = pokemon.stats.reduce((s, x) => s + x.base_stat, 0);

  return (
    <>
      {/* Hero */}
      <div
        style={{
          position: 'relative',
          height: 540,
          borderRadius: 24,
          background: `radial-gradient(circle at 50% 40%, hsl(${color} / 0.35), transparent 70%)`,
          border: `1px solid hsl(${color} / 0.3)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
        }}
      >
        <img
          src={getArtwork(pokemon)}
          alt={pokemon.name}
          crossOrigin="anonymous"
          style={{ width: 460, height: 460, objectFit: 'contain' }}
        />
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            fontSize: 14,
            color: '#888',
            letterSpacing: 2,
          }}
        >
          {formatPokemonId(pokemon.id)}
        </div>
      </div>

      {/* Name + types */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            fontSize: 64,
            fontWeight: 800,
            margin: 0,
            letterSpacing: -1,
          }}
        >
          {capitalize(pokemon.name)}
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {pokemon.types.map((t) => (
            <span
              key={t.type.name}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                background: `hsl(${TYPE_COLORS[t.type.name]} / 0.2)`,
                color: `hsl(${TYPE_COLORS[t.type.name]})`,
                border: `1px solid hsl(${TYPE_COLORS[t.type.name]} / 0.4)`,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {capitalize(t.type.name)}
            </span>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}
      >
        {pokemon.stats.map((s) => {
          const pct = Math.min((s.base_stat / 255) * 100, 100);
          return (
            <div
              key={s.stat.name}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: '12px 14px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 11, color: '#888', letterSpacing: 1 }}>
                  {STAT_NAMES[s.stat.name] || s.stat.name}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{s.base_stat}</span>
              </div>
              <div
                style={{
                  height: 4,
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: `hsl(${color})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 14,
          color: '#aaa',
        }}
      >
        <span>HEIGHT {(pokemon.height / 10).toFixed(1)}m</span>
        <span>WEIGHT {(pokemon.weight / 10).toFixed(1)}kg</span>
        <span style={{ color: `hsl(${color})`, fontWeight: 700 }}>
          TOTAL {total}
        </span>
      </div>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* Compare card body                                                          */
/* -------------------------------------------------------------------------- */
const CompareCardBody = ({ pair }: { pair: [Pokemon, Pokemon] }) => {
  const [a, b] = pair;
  const totalA = a.stats.reduce((s, x) => s + x.base_stat, 0);
  const totalB = b.stats.reduce((s, x) => s + x.base_stat, 0);
  const cA = TYPE_COLORS[a.types[0]?.type.name || 'normal'];
  const cB = TYPE_COLORS[b.types[0]?.type.name || 'normal'];

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {[a, b].map((p, i) => {
          const c = i === 0 ? cA : cB;
          return (
            <div key={i} style={{ textAlign: 'center' }}>
              <div
                style={{
                  height: 360,
                  borderRadius: 20,
                  background: `radial-gradient(circle, hsl(${c} / 0.3), transparent 70%)`,
                  border: `1px solid hsl(${c} / 0.3)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <img
                  src={getArtwork(p)}
                  alt={p.name}
                  crossOrigin="anonymous"
                  style={{ width: 300, height: 300, objectFit: 'contain' }}
                />
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>
                {formatPokemonId(p.id)}
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, marginTop: 4 }}>
                {capitalize(p.name)}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  justifyContent: 'center',
                  marginTop: 8,
                  flexWrap: 'wrap',
                }}
              >
                {p.types.map((t) => (
                  <span
                    key={t.type.name}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      background: `hsl(${TYPE_COLORS[t.type.name]} / 0.2)`,
                      color: `hsl(${TYPE_COLORS[t.type.name]})`,
                      border: `1px solid hsl(${TYPE_COLORS[t.type.name]} / 0.4)`,
                    }}
                  >
                    {capitalize(t.type.name)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        <div
          style={{
            gridColumn: 2,
            gridRow: 1,
            fontSize: 60,
            fontWeight: 900,
            color: '#ef4444',
            letterSpacing: 4,
            alignSelf: 'center',
          }}
        >
          VS
        </div>
      </div>

      {/* Stat duel */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          padding: 24,
        }}
      >
        {a.stats.map((s, i) => {
          const bv = b.stats[i]?.base_stat || 0;
          const av = s.base_stat;
          const max = Math.max(av, bv, 1);
          return (
            <div
              key={s.stat.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 1fr',
                alignItems: 'center',
                gap: 12,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  justifyContent: 'flex-end',
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: av > bv ? '#ef4444' : '#888',
                  }}
                >
                  {av}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 3,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(av / max) * 100}%`,
                      height: '100%',
                      background: `hsl(${cA})`,
                    }}
                  />
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  letterSpacing: 1,
                  color: '#888',
                  textAlign: 'center',
                }}
              >
                {STAT_NAMES[s.stat.name] || s.stat.name}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(bv / max) * 100}%`,
                      height: '100%',
                      background: `hsl(${cB})`,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: bv > av ? '#ef4444' : '#888',
                  }}
                >
                  {bv}
                </span>
              </div>
            </div>
          );
        })}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 80px 1fr',
            gap: 12,
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              textAlign: 'right',
              fontSize: 22,
              fontWeight: 800,
              color: totalA > totalB ? '#ef4444' : '#888',
            }}
          >
            {totalA}
          </div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 2,
              color: '#888',
              textAlign: 'center',
            }}
          >
            TOTAL
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: totalB > totalA ? '#ef4444' : '#888',
            }}
          >
            {totalB}
          </div>
        </div>
      </div>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* Team card body                                                             */
/* -------------------------------------------------------------------------- */
const TeamCardBody = ({ team }: { team: (Pokemon | null)[] }) => {
  const filled = team.filter((p): p is Pokemon => p !== null);
  const totalStats = filled.reduce(
    (sum, p) => sum + p.stats.reduce((s, x) => s + x.base_stat, 0),
    0
  );
  const typesUsed = new Set<string>();
  filled.forEach((p) => p.types.forEach((t) => typesUsed.add(t.type.name)));

  return (
    <>
      <h1
        style={{
          fontSize: 56,
          fontWeight: 800,
          margin: '0 0 8px 0',
          letterSpacing: -1,
        }}
      >
        My Squad
      </h1>
      <div style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>
        {filled.length}/6 PARTY MEMBERS · {typesUsed.size} TYPES · TOTAL{' '}
        {totalStats}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
          marginBottom: 32,
        }}
      >
        {team.map((p, i) => {
          if (!p) {
            return (
              <div
                key={i}
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 16,
                  border: '2px dashed rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#444',
                  fontSize: 18,
                }}
              >
                EMPTY
              </div>
            );
          }
          const c = TYPE_COLORS[p.types[0]?.type.name || 'normal'];
          return (
            <div
              key={i}
              style={{
                aspectRatio: '1 / 1',
                position: 'relative',
                borderRadius: 16,
                background: `radial-gradient(circle, hsl(${c} / 0.25), transparent 70%), rgba(255,255,255,0.03)`,
                border: `1px solid hsl(${c} / 0.3)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 10,
                  fontSize: 10,
                  color: '#888',
                }}
              >
                {formatPokemonId(p.id)}
              </div>
              <img
                src={getArtwork(p)}
                alt={p.name}
                crossOrigin="anonymous"
                style={{ width: '70%', height: '70%', objectFit: 'contain' }}
              />
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                {capitalize(p.name)}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                {p.types.map((t) => (
                  <span
                    key={t.type.name}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: `hsl(${TYPE_COLORS[t.type.name]})`,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
