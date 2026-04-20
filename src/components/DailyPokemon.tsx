import { motion } from 'framer-motion';
import { Flame, Trophy, Calendar } from 'lucide-react';
import { useDailyPokemon, BADGE_MILESTONES } from '@/hooks/useDailyPokemon';
import { capitalize, formatPokemonId, getArtwork, TYPE_COLORS } from '@/lib/pokemon';

interface Props {
  onClick?: (id: number) => void;
}

const DailyPokemon = ({ onClick }: Props) => {
  const { pokemon, loading, streak, earnedBadges, nextBadge } = useDailyPokemon();

  if (loading || !pokemon) {
    return (
      <div className="relative w-full max-w-md mx-auto rounded-2xl glass p-6 h-44 animate-pulse" />
    );
  }

  const mainType = pokemon.types[0]?.type.name || 'normal';
  const color = TYPE_COLORS[mainType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-md mx-auto"
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-poke-yellow" />
          <p className="font-pixel text-[8px] tracking-[0.25em] text-muted-foreground">
            DAILY POKÉMON
          </p>
        </div>
        <div className="flex items-center gap-1.5 font-pixel text-[8px]">
          <Flame className="w-3 h-3 text-poke-red" />
          <span className="text-foreground">{streak.streak}d</span>
          <span className="text-muted-foreground/50">·</span>
          <Trophy className="w-3 h-3 text-poke-yellow" />
          <span className="text-muted-foreground">{streak.longest}d</span>
        </div>
      </div>

      <motion.button
        onClick={() => onClick?.(pokemon.id)}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-full overflow-hidden rounded-2xl glass-strong pixel-corners p-5 text-left group"
        style={{ boxShadow: `0 0 30px hsl(${color} / 0.15)` }}
      >
        {/* Type aura */}
        <div
          className="absolute inset-0 opacity-50"
          style={{ background: `radial-gradient(circle at 80% 30%, hsl(${color} / 0.25), transparent 60%)` }}
        />
        <motion.div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, hsl(${color} / 0.5), transparent)` }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        <div className="relative flex items-center gap-4">
          <motion.img
            src={getArtwork(pokemon)}
            alt={pokemon.name}
            className="w-24 h-24 md:w-28 md:h-28 object-contain shrink-0 drop-shadow-2xl"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-pixel text-[8px] text-muted-foreground">
              {formatPokemonId(pokemon.id)}
            </p>
            <h3 className="font-pixel text-[12px] md:text-[14px] text-foreground mt-1 truncate">
              {capitalize(pokemon.name)}
            </h3>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {pokemon.types.map(t => (
                <span
                  key={t.type.name}
                  className="px-2 py-0.5 rounded-full text-[9px]"
                  style={{
                    background: `hsl(${TYPE_COLORS[t.type.name]} / 0.18)`,
                    color: `hsl(${TYPE_COLORS[t.type.name]})`,
                  }}
                >
                  {capitalize(t.type.name)}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/70 mt-2 group-hover:text-foreground/80 transition-colors">
              Today's featured Pokémon →
            </p>
          </div>
        </div>
      </motion.button>

      {/* Badges */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 justify-center">
        {earnedBadges.map(b => (
          <span
            key={b.id}
            title={b.label}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full glass font-pixel text-[7px] text-foreground"
          >
            <span>{b.icon}</span>
            <span className="text-muted-foreground">{b.label}</span>
          </span>
        ))}
        {nextBadge && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border/40 font-pixel text-[7px] text-muted-foreground/60">
            <span>{nextBadge.icon}</span>
            <span>Next: {nextBadge.days}d</span>
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default DailyPokemon;
