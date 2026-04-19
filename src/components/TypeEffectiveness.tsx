import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ALL_TYPES, getDefensiveChart, multiplierColor, multiplierLabel, PokeType } from '@/lib/typeChart';
import { TYPE_COLORS, capitalize } from '@/lib/pokemon';

interface Props {
  defenderTypes: string[];
}

const TypeEffectiveness = ({ defenderTypes }: Props) => {
  const chart = useMemo(() => getDefensiveChart(defenderTypes), [defenderTypes]);

  const grouped = useMemo(() => {
    const weak: PokeType[] = [];
    const strong: PokeType[] = [];
    const immune: PokeType[] = [];
    const neutral: PokeType[] = [];
    for (const t of ALL_TYPES) {
      const m = chart[t];
      if (m === 0) immune.push(t);
      else if (m > 1) weak.push(t);
      else if (m < 1) strong.push(t);
      else neutral.push(t);
    }
    weak.sort((a, b) => chart[b] - chart[a]);
    strong.sort((a, b) => chart[a] - chart[b]);
    return { weak, strong, immune, neutral };
  }, [chart]);

  return (
    <div className="glass rounded-xl p-4">
      <h3 className="font-pixel text-[8px] text-muted-foreground mb-4 tracking-wider">
        TYPE EFFECTIVENESS
      </h3>

      {/* Full grid — every type with multiplier */}
      <div className="grid grid-cols-6 gap-1.5 mb-5">
        {ALL_TYPES.map((t, i) => {
          const m = chart[t];
          const bg = multiplierColor(m);
          const isNeutral = m === 1;
          return (
            <motion.div
              key={t}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02, duration: 0.25 }}
              className="relative flex flex-col items-center justify-center rounded-md py-1.5"
              style={{
                background: bg,
                opacity: isNeutral ? 0.5 : 1,
                boxShadow: m > 1 ? `0 0 8px ${bg}` : 'none',
              }}
              title={`${capitalize(t)}: ${multiplierLabel(m)}`}
            >
              <span
                className="font-pixel text-[6px] tracking-wider uppercase text-foreground/90"
                style={{ textShadow: '0 1px 2px hsl(0 0% 0% / 0.6)' }}
              >
                {t.slice(0, 3)}
              </span>
              <span className="font-pixel text-[7px] text-foreground mt-0.5"
                style={{ textShadow: '0 1px 2px hsl(0 0% 0% / 0.6)' }}>
                {multiplierLabel(m)}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Quick summary */}
      <div className="space-y-2 text-xs">
        {grouped.weak.length > 0 && (
          <Row label="WEAK TO" items={grouped.weak} chart={chart} accent="hsl(15 85% 55%)" />
        )}
        {grouped.strong.length > 0 && (
          <Row label="RESISTS" items={grouped.strong} chart={chart} accent="hsl(142 55% 50%)" />
        )}
        {grouped.immune.length > 0 && (
          <Row label="IMMUNE" items={grouped.immune} chart={chart} accent="hsl(0 0% 50%)" />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-border/30 flex-wrap">
        {[0, 0.25, 0.5, 1, 2, 4].map(m => (
          <div key={m} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: multiplierColor(m) }} />
            <span className="font-pixel text-[6px] text-muted-foreground">{multiplierLabel(m)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Row = ({
  label,
  items,
  chart,
  accent,
}: {
  label: string;
  items: PokeType[];
  chart: Record<PokeType, number>;
  accent: string;
}) => (
  <div className="flex items-start gap-2">
    <span
      className="font-pixel text-[7px] tracking-wider w-14 shrink-0 pt-1"
      style={{ color: accent }}
    >
      {label}
    </span>
    <div className="flex flex-wrap gap-1">
      {items.map(t => {
        const color = TYPE_COLORS[t];
        return (
          <span
            key={t}
            className="px-1.5 py-0.5 rounded text-[9px]"
            style={{
              background: `hsl(${color} / 0.18)`,
              color: `hsl(${color})`,
              border: `1px solid hsl(${color} / 0.3)`,
            }}
          >
            {capitalize(t)} {multiplierLabel(chart[t])}
          </span>
        );
      })}
    </div>
  </div>
);

export default TypeEffectiveness;
