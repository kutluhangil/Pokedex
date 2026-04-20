import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Shield, Swords, Share2 } from 'lucide-react';
import { Pokemon, capitalize, getArtwork, getPixelSprite, formatPokemonId, TYPE_COLORS } from '@/lib/pokemon';
import { useTeam, TEAM_SIZE } from '@/hooks/useTeam';
import { ALL_TYPES, getDefensiveChart, getOffensiveChart, multiplierColor, multiplierLabel, PokeType } from '@/lib/typeChart';
import PokemonPicker from '@/components/PokemonPicker';
import PokemonDetail from '@/components/PokemonDetail';
import TeamShare from '@/components/TeamShare';
import { useFavorites } from '@/hooks/useFavorites';

const TeamTab = () => {
  const { team, setSlot, removeSlot, clear } = useTeam();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [pickingSlot, setPickingSlot] = useState<number | null>(null);
  const [viewing, setViewing] = useState<Pokemon | null>(null);
  const [activeTab, setActiveTab] = useState<'defense' | 'offense'>('defense');
  const [sharing, setSharing] = useState(false);

  const filled = useMemo(() => team.filter((p): p is Pokemon => p !== null), [team]);

  // Defensive: how vulnerable is the team to each attacker type?
  // Average team weakness — count how many members are weak / resistant
  const defenseAnalysis = useMemo(() => {
    const summary: Record<string, { weak: number; resist: number; immune: number }> = {};
    for (const t of ALL_TYPES) summary[t] = { weak: 0, resist: 0, immune: 0 };
    for (const p of filled) {
      const types = p.types.map(t => t.type.name);
      const chart = getDefensiveChart(types);
      for (const t of ALL_TYPES) {
        const m = chart[t];
        if (m === 0) summary[t].immune++;
        else if (m > 1) summary[t].weak++;
        else if (m < 1) summary[t].resist++;
      }
    }
    return summary;
  }, [filled]);

  // Offensive: best multiplier my team can deal vs each defender type
  const offenseAnalysis = useMemo(() => {
    const summary: Record<string, number> = {};
    for (const t of ALL_TYPES) summary[t] = 1;
    for (const p of filled) {
      const types = p.types.map(t => t.type.name);
      const chart = getOffensiveChart(types);
      for (const t of ALL_TYPES) {
        if (chart[t] > summary[t]) summary[t] = chart[t];
      }
    }
    return summary;
  }, [filled]);

  const handlePick = useCallback((p: Pokemon) => {
    if (pickingSlot !== null) setSlot(pickingSlot, p);
  }, [pickingSlot, setSlot]);

  return (
    <div className="min-h-full pb-32">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-lg md:text-xl text-poke-green text-glow-yellow">TEAM LAB</h1>
          <p className="text-xs text-muted-foreground mt-1">Build & analyze your squad</p>
        </div>
        {filled.length > 0 && (
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSharing(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass font-pixel text-[8px] text-muted-foreground hover:text-poke-blue transition-colors"
            >
              <Share2 className="w-3 h-3" />
              SHARE
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={clear}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass font-pixel text-[8px] text-muted-foreground hover:text-poke-red transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              CLEAR
            </motion.button>
          </div>
        )}
      </div>

      <TeamShare team={team} open={sharing} onClose={() => setSharing(false)} />

      {/* Slots */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {team.map((p, i) => (
            <TeamSlot
              key={i}
              index={i}
              pokemon={p}
              onAdd={() => setPickingSlot(i)}
              onRemove={() => removeSlot(i)}
              onView={() => p && setViewing(p)}
            />
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filled.length === 0 && (
        <div className="text-center py-12 px-6">
          <p className="font-pixel text-[10px] text-muted-foreground">
            Add Pokémon to see type analysis
          </p>
        </div>
      )}

      {/* Analysis */}
      {filled.length > 0 && (
        <div className="px-6 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('defense')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-pixel text-[8px] transition-colors ${
                activeTab === 'defense' ? 'neon-border-red text-foreground' : 'glass text-muted-foreground'
              }`}
            >
              <Shield className="w-3 h-3" /> DEFENSE
            </button>
            <button
              onClick={() => setActiveTab('offense')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-pixel text-[8px] transition-colors ${
                activeTab === 'offense' ? 'neon-border-blue text-foreground' : 'glass text-muted-foreground'
              }`}
            >
              <Swords className="w-3 h-3" /> OFFENSE
            </button>
          </div>

          {/* Defense heatmap */}
          {activeTab === 'defense' && (
            <div className="glass rounded-xl p-4">
              <h3 className="font-pixel text-[8px] text-muted-foreground mb-3 tracking-wider">
                INCOMING DAMAGE COVERAGE
              </h3>
              <p className="text-[10px] text-muted-foreground/70 mb-4">
                How many team members are weak / resistant to each attack type
              </p>
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5">
                {ALL_TYPES.map(t => {
                  const s = defenseAnalysis[t];
                  const net = s.weak - s.resist - s.immune;
                  const color = TYPE_COLORS[t];
                  let bg = 'hsl(240 5% 20%)';
                  if (net > 0) bg = `hsl(15 85% 55% / ${0.3 + net * 0.2})`;
                  else if (net < 0) bg = `hsl(142 55% 45% / ${0.3 + Math.abs(net) * 0.15})`;

                  return (
                    <div
                      key={t}
                      className="flex flex-col items-center justify-center rounded-md py-1.5 px-1"
                      style={{ background: bg }}
                      title={`${capitalize(t)} — Weak: ${s.weak}, Resist: ${s.resist}, Immune: ${s.immune}`}
                    >
                      <span
                        className="font-pixel text-[6px] tracking-wider uppercase"
                        style={{ color: `hsl(${color})`, textShadow: '0 1px 1px hsl(0 0% 0% / 0.6)' }}
                      >
                        {t.slice(0, 3)}
                      </span>
                      <div className="flex gap-1 mt-0.5 font-pixel text-[6px]">
                        {s.weak > 0 && <span className="text-poke-red">−{s.weak}</span>}
                        {s.resist > 0 && <span className="text-poke-green">+{s.resist}</span>}
                        {s.immune > 0 && <span className="text-poke-yellow">×{s.immune}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-border/30 text-[7px] font-pixel text-muted-foreground">
                <span><span className="text-poke-red">−n</span> weak</span>
                <span><span className="text-poke-green">+n</span> resist</span>
                <span><span className="text-poke-yellow">×n</span> immune</span>
              </div>
            </div>
          )}

          {/* Offense */}
          {activeTab === 'offense' && (
            <div className="glass rounded-xl p-4">
              <h3 className="font-pixel text-[8px] text-muted-foreground mb-3 tracking-wider">
                OUTGOING DAMAGE COVERAGE
              </h3>
              <p className="text-[10px] text-muted-foreground/70 mb-4">
                Best STAB multiplier your team can deal vs each defender type
              </p>
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5">
                {ALL_TYPES.map(t => {
                  const m = offenseAnalysis[t];
                  const bg = multiplierColor(m);
                  const isNeutral = m === 1;
                  return (
                    <div
                      key={t}
                      className="flex flex-col items-center justify-center rounded-md py-1.5"
                      style={{ background: bg, opacity: isNeutral ? 0.45 : 1 }}
                      title={`${capitalize(t)}: ${multiplierLabel(m)}`}
                    >
                      <span
                        className="font-pixel text-[6px] tracking-wider uppercase text-foreground/90"
                        style={{ textShadow: '0 1px 2px hsl(0 0% 0% / 0.6)' }}
                      >
                        {t.slice(0, 3)}
                      </span>
                      <span
                        className="font-pixel text-[7px] mt-0.5"
                        style={{ textShadow: '0 1px 2px hsl(0 0% 0% / 0.6)' }}
                      >
                        {multiplierLabel(m)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Picker modal */}
      <AnimatePresence>
        {pickingSlot !== null && (
          <PokemonPicker
            onPick={handlePick}
            onClose={() => setPickingSlot(null)}
          />
        )}
      </AnimatePresence>

      {/* Detail */}
      {viewing && (
        <PokemonDetail
          pokemon={viewing}
          onClose={() => setViewing(null)}
          isFavorite={isFavorite(viewing.id)}
          onToggleFavorite={() => toggleFavorite(viewing.id)}
        />
      )}
    </div>
  );
};

const TeamSlot = ({
  index,
  pokemon,
  onAdd,
  onRemove,
  onView,
}: {
  index: number;
  pokemon: Pokemon | null;
  onAdd: () => void;
  onRemove: () => void;
  onView: () => void;
}) => {
  if (!pokemon) {
    return (
      <motion.button
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={onAdd}
        className="aspect-square rounded-2xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center gap-1 hover:border-poke-blue/60 hover:text-poke-blue text-muted-foreground transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span className="font-pixel text-[7px]">SLOT {index + 1}</span>
      </motion.button>
    );
  }

  const mainType = pokemon.types[0]?.type.name || 'normal';
  const color = TYPE_COLORS[mainType];

  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative aspect-square rounded-2xl glass overflow-hidden cursor-pointer group"
      onClick={onView}
      style={{ boxShadow: `0 0 16px hsl(${color} / 0.15)` }}
    >
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(circle at center, hsl(${color} / 0.25), transparent 70%)` }}
      />
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-1.5 right-1.5 z-10 p-1 rounded-md glass hover:bg-poke-red/30 transition-colors"
      >
        <X className="w-2.5 h-2.5 text-foreground" />
      </button>
      <div className="absolute top-1.5 left-1.5 font-pixel text-[6px] text-muted-foreground">
        {formatPokemonId(pokemon.id)}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={getPixelSprite(pokemon)}
          alt={pokemon.name}
          className="w-3/4 h-3/4 object-contain group-hover:scale-110 transition-transform"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      <div className="absolute bottom-1.5 left-1.5 right-1.5 text-center">
        <p className="font-pixel text-[7px] text-foreground truncate">{capitalize(pokemon.name)}</p>
      </div>
    </motion.div>
  );
};

export default TeamTab;
