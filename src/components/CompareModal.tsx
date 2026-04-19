import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Pokemon, TYPE_COLORS, getArtwork, formatPokemonId, capitalize } from '@/lib/pokemon';

interface Props {
  pokemon: [Pokemon, Pokemon];
  onClose: () => void;
}

const STAT_NAMES: Record<string, string> = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SP.ATK',
  'special-defense': 'SP.DEF',
  speed: 'SPD',
};

const CompareModal = ({ pokemon, onClose }: Props) => {
  const [a, b] = pokemon;

  const statRow = (name: string, av: number, bv: number) => {
    const max = Math.max(av, bv, 1);
    const aWins = av > bv;
    const bWins = bv > av;
    return (
      <div key={name} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-3">
        {/* A bar (right-anchored) */}
        <div className="flex items-center gap-2 justify-end">
          <span className={`font-pixel text-[8px] tabular-nums ${aWins ? 'text-poke-red' : 'text-muted-foreground'}`}>{av}</span>
          <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden flex justify-end">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(av / max) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: `hsl(${TYPE_COLORS[a.types[0]?.type.name] || TYPE_COLORS.normal})` }}
            />
          </div>
        </div>
        <span className="font-pixel text-[7px] text-muted-foreground w-14 text-center">{STAT_NAMES[name] || name}</span>
        {/* B bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(bv / max) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: `hsl(${TYPE_COLORS[b.types[0]?.type.name] || TYPE_COLORS.normal})` }}
            />
          </div>
          <span className={`font-pixel text-[8px] tabular-nums ${bWins ? 'text-poke-red' : 'text-muted-foreground'}`}>{bv}</span>
        </div>
      </div>
    );
  };

  const totalA = a.stats.reduce((s, x) => s + x.base_stat, 0);
  const totalB = b.stats.reduce((s, x) => s + x.base_stat, 0);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-background/85 backdrop-blur-2xl"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
        <motion.div
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl glass-strong pixel-corners z-10"
          initial={{ scale: 0.92, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 30, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        >
          <div className="flex items-center justify-between p-4">
            <h2 className="font-pixel text-[10px] text-poke-blue tracking-widest">VS</h2>
            <button onClick={onClose} className="p-2 rounded-lg glass hover:bg-muted/30 transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Headers */}
          <div className="grid grid-cols-2 gap-4 px-6 pb-4">
            {[a, b].map((p, i) => {
              const t = p.types[0]?.type.name || 'normal';
              const c = TYPE_COLORS[t];
              return (
                <div key={p.id + '-' + i} className="text-center">
                  <div
                    className="mx-auto w-32 h-32 rounded-2xl flex items-center justify-center mb-2"
                    style={{ background: `radial-gradient(ellipse at center, hsl(${c} / 0.2), transparent 70%)` }}
                  >
                    <img src={getArtwork(p)} alt={p.name} className="w-28 h-28 object-contain" loading="lazy" />
                  </div>
                  <p className="font-pixel text-[8px] text-muted-foreground">{formatPokemonId(p.id)}</p>
                  <p className="font-pixel text-[10px] text-foreground mt-1">{capitalize(p.name)}</p>
                  <div className="flex justify-center gap-1 mt-2 flex-wrap">
                    {p.types.map(tp => (
                      <span
                        key={tp.type.name}
                        className="px-2 py-0.5 rounded-full text-[8px]"
                        style={{
                          background: `hsl(${TYPE_COLORS[tp.type.name]} / 0.15)`,
                          color: `hsl(${TYPE_COLORS[tp.type.name]})`,
                          border: `1px solid hsl(${TYPE_COLORS[tp.type.name]} / 0.3)`,
                        }}
                      >
                        {capitalize(tp.type.name)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="px-6 pb-6">
            <h3 className="font-pixel text-[8px] text-muted-foreground mb-4 text-center tracking-wider">BASE STATS</h3>
            {a.stats.map((s, i) => statRow(s.stat.name, s.base_stat, b.stats[i]?.base_stat ?? 0))}

            {/* Total */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mt-4 pt-3 border-t border-border/30">
              <span className={`font-pixel text-[10px] text-right ${totalA > totalB ? 'text-poke-red' : 'text-muted-foreground'}`}>{totalA}</span>
              <span className="font-pixel text-[7px] text-muted-foreground w-14 text-center">TOTAL</span>
              <span className={`font-pixel text-[10px] ${totalB > totalA ? 'text-poke-red' : 'text-muted-foreground'}`}>{totalB}</span>
            </div>

            {/* Physical */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="glass rounded-lg p-3 text-center">
                <p className="font-pixel text-[7px] text-muted-foreground mb-1">HEIGHT</p>
                <p className="text-xs">{(a.height / 10).toFixed(1)}m vs {(b.height / 10).toFixed(1)}m</p>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <p className="font-pixel text-[7px] text-muted-foreground mb-1">WEIGHT</p>
                <p className="text-xs">{(a.weight / 10).toFixed(1)}kg vs {(b.weight / 10).toFixed(1)}kg</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CompareModal;
