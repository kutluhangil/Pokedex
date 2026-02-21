import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Sparkles } from 'lucide-react';
import { Pokemon, PokemonSpecies, TYPE_COLORS, getArtwork, getPixelSprite, formatPokemonId, capitalize } from '@/lib/pokemon';
import { fetchPokemonSpecies, fetchEvolutionChain, fetchPokemon } from '@/lib/api';

interface PokemonDetailProps {
  pokemon: Pokemon;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const STAT_NAMES: Record<string, string> = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SP.ATK',
  'special-defense': 'SP.DEF',
  speed: 'SPD',
};

const STAT_COLORS: Record<string, string> = {
  hp: 'var(--poke-green)',
  attack: 'var(--poke-red)',
  defense: 'var(--poke-blue)',
  'special-attack': 'var(--poke-yellow)',
  'special-defense': 'var(--accent)',
  speed: 'var(--poke-red)',
};

const PokemonDetail = ({ pokemon, onClose, isFavorite, onToggleFavorite }: PokemonDetailProps) => {
  const [species, setSpecies] = useState<PokemonSpecies | null>(null);
  const [showShiny, setShowShiny] = useState(false);
  const [evolutionNames, setEvolutionNames] = useState<string[]>([]);
  const mainType = pokemon.types[0]?.type.name || 'normal';
  const typeColor = TYPE_COLORS[mainType] || TYPE_COLORS.normal;

  useEffect(() => {
    fetchPokemonSpecies(pokemon.id).then(async (sp) => {
      setSpecies(sp);
      try {
        const evo = await fetchEvolutionChain(sp.evolution_chain.url);
        const names: string[] = [];
        let node = evo.chain;
        names.push(node.species.name);
        while (node.evolves_to.length > 0) {
          node = node.evolves_to[0];
          names.push(node.species.name);
        }
        setEvolutionNames(names);
      } catch {}
    });
  }, [pokemon.id]);

  const description = species?.flavor_text_entries
    .find(e => e.language.name === 'en')
    ?.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ') || '';

  const genus = species?.genera.find(g => g.language.name === 'en')?.genus || '';

  const artwork = getArtwork(pokemon);
  const pixelSprite = getPixelSprite(pokemon);
  const shinySprite = pokemon.sprites.front_shiny;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-40 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-background/80 backdrop-blur-xl"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Content */}
        <motion.div
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl glass-strong z-10"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          {/* Gradient top */}
          <div
            className="absolute top-0 left-0 right-0 h-48 rounded-t-3xl"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, hsl(${typeColor} / 0.3), transparent 80%)`,
            }}
          />

          {/* Particle overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  background: `hsl(${typeColor})`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{ opacity: [0, 0.5, 0], scale: [0, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 3 }}
              />
            ))}
          </div>

          {/* Close & Fav */}
          <div className="relative flex justify-between items-center p-4">
            <button onClick={onClose} className="p-2 rounded-full glass hover:bg-muted/50 transition-colors">
              <X className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex gap-2">
              <button onClick={() => setShowShiny(!showShiny)} className="p-2 rounded-full glass hover:bg-muted/50 transition-colors">
                <Sparkles className={`w-5 h-5 ${showShiny ? 'text-poke-yellow' : 'text-muted-foreground'}`} />
              </button>
              <button onClick={onToggleFavorite} className="p-2 rounded-full glass hover:bg-muted/50 transition-colors">
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-poke-red text-poke-red' : 'text-muted-foreground'}`} />
              </button>
            </div>
          </div>

          {/* Sprite */}
          <div className="relative flex justify-center py-4">
            <motion.img
              key={showShiny ? 'shiny' : 'normal'}
              src={showShiny ? (shinySprite || pixelSprite) : (artwork || pixelSprite)}
              alt={pokemon.name}
              className="w-40 h-40 md:w-52 md:h-52 object-contain drop-shadow-2xl"
              style={showShiny ? { imageRendering: 'pixelated' } : {}}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring' }}
            />
          </div>

          {/* Info */}
          <div className="relative px-6 pb-8">
            <div className="text-center mb-6">
              <span className="font-pixel text-[10px] text-muted-foreground">{formatPokemonId(pokemon.id)}</span>
              <h2 className="font-pixel text-xl md:text-2xl text-foreground mt-1 text-glow-red">
                {capitalize(pokemon.name)}
              </h2>
              {genus && <p className="text-sm text-muted-foreground mt-1">{genus}</p>}
              <div className="flex justify-center gap-2 mt-3">
                {pokemon.types.map(t => (
                  <span
                    key={t.type.name}
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: `hsl(${TYPE_COLORS[t.type.name] || TYPE_COLORS.normal} / 0.25)`,
                      color: `hsl(${TYPE_COLORS[t.type.name] || TYPE_COLORS.normal})`,
                      border: `1px solid hsl(${TYPE_COLORS[t.type.name] || TYPE_COLORS.normal} / 0.3)`,
                    }}
                  >
                    {capitalize(t.type.name)}
                  </span>
                ))}
              </div>
            </div>

            {description && (
              <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed max-w-md mx-auto">
                {description}
              </p>
            )}

            {/* Physical */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="glass rounded-xl p-3 text-center">
                <p className="text-[10px] font-pixel text-muted-foreground mb-1">HEIGHT</p>
                <p className="text-foreground font-semibold">{(pokemon.height / 10).toFixed(1)} m</p>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <p className="text-[10px] font-pixel text-muted-foreground mb-1">WEIGHT</p>
                <p className="text-foreground font-semibold">{(pokemon.weight / 10).toFixed(1)} kg</p>
              </div>
            </div>

            {/* Abilities */}
            <div className="mb-6">
              <h3 className="font-pixel text-[10px] text-muted-foreground mb-2">ABILITIES</h3>
              <div className="flex flex-wrap gap-2">
                {pokemon.abilities.map(a => (
                  <span key={a.ability.name} className="px-3 py-1 rounded-lg glass text-xs text-foreground">
                    {capitalize(a.ability.name.replace('-', ' '))}
                    {a.is_hidden && <span className="text-muted-foreground ml-1">(Hidden)</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="mb-6">
              <h3 className="font-pixel text-[10px] text-muted-foreground mb-3">BASE STATS</h3>
              <div className="space-y-2">
                {pokemon.stats.map((stat, i) => (
                  <div key={stat.stat.name} className="flex items-center gap-3">
                    <span className="font-pixel text-[8px] text-muted-foreground w-14 text-right">
                      {STAT_NAMES[stat.stat.name] || stat.stat.name}
                    </span>
                    <span className="text-xs text-foreground w-8 text-right font-semibold">{stat.base_stat}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: `hsl(${typeColor})`,
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((stat.base_stat / 255) * 100, 100)}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evolution */}
            {evolutionNames.length > 1 && (
              <div>
                <h3 className="font-pixel text-[10px] text-muted-foreground mb-3">EVOLUTION</h3>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {evolutionNames.map((name, i) => (
                    <div key={name} className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-lg glass text-xs ${name === pokemon.name ? 'neon-border-red text-foreground' : 'text-muted-foreground'}`}>
                        {capitalize(name)}
                      </span>
                      {i < evolutionNames.length - 1 && (
                        <span className="text-muted-foreground text-xs">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legendary/Mythical badge */}
            {species && (species.is_legendary || species.is_mythical) && (
              <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span className="font-pixel text-[10px] px-4 py-2 rounded-full neon-border-red text-poke-yellow text-glow-yellow">
                  ✦ {species.is_legendary ? 'LEGENDARY' : 'MYTHICAL'} ✦
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PokemonDetail;
