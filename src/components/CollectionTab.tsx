import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import PokemonCard from '@/components/PokemonCard';
import PokemonDetail from '@/components/PokemonDetail';
import { useFavorites } from '@/hooks/useFavorites';
import { Pokemon, GENERATION_RANGES } from '@/lib/pokemon';
import { fetchPokemonBatch } from '@/lib/api';

const CATEGORIES = Object.keys(GENERATION_RANGES);

const CollectionTab = () => {
  const [activeGen, setActiveGen] = useState<string | null>(null);
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Pokemon | null>(null);
  const { isFavorite, toggleFavorite, favorites } = useFavorites();
  const [showFavs, setShowFavs] = useState(false);
  const [favPokemon, setFavPokemon] = useState<Pokemon[]>([]);

  const loadGeneration = useCallback(async (gen: string) => {
    if (activeGen === gen) { setActiveGen(null); return; }
    setActiveGen(gen);
    setShowFavs(false);
    setLoading(true);
    const [start, end] = GENERATION_RANGES[gen];
    // Load first 24 of each gen
    const ids = Array.from({ length: Math.min(24, end - start + 1) }, (_, i) => start + i);
    try {
      const data = await fetchPokemonBatch(ids);
      setPokemon(data);
    } catch {}
    setLoading(false);
  }, [activeGen]);

  const loadFavorites = useCallback(async () => {
    setShowFavs(true);
    setActiveGen(null);
    if (favorites.size === 0) { setFavPokemon([]); return; }
    setLoading(true);
    try {
      const data = await fetchPokemonBatch([...favorites].slice(0, 30));
      setFavPokemon(data);
    } catch {}
    setLoading(false);
  }, [favorites]);

  const displayPokemon = showFavs ? favPokemon : pokemon;

  return (
    <div className="min-h-full pb-24">
      <div className="px-6 pt-6 pb-4">
        <h1 className="font-pixel text-lg md:text-xl text-poke-green text-glow-yellow">COLLECTION</h1>
        <p className="text-xs text-muted-foreground mt-1">Browse by generation</p>
      </div>

      {/* Category buttons */}
      <div className="px-6 flex flex-wrap gap-2 mb-6">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={loadFavorites}
          className={`px-3 py-2 rounded-xl font-pixel text-[8px] transition-colors ${
            showFavs ? 'neon-border-red text-poke-red' : 'glass text-muted-foreground hover:text-foreground'
          }`}
        >
          ♥ FAVORITES ({favorites.size})
        </motion.button>
        {CATEGORIES.map(gen => (
          <motion.button
            key={gen}
            whileTap={{ scale: 0.95 }}
            onClick={() => loadGeneration(gen)}
            className={`px-3 py-2 rounded-xl font-pixel text-[8px] transition-colors ${
              activeGen === gen ? 'neon-border-blue text-poke-blue' : 'glass text-muted-foreground hover:text-foreground'
            }`}
          >
            {gen.replace('Generation ', 'GEN ')}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <div className="px-6">
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-poke-blue" />
          </div>
        )}

        {!loading && displayPokemon.length > 0 && (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.05 } },
            }}
          >
            {displayPokemon.map((p, i) => (
              <PokemonCard
                key={p.id}
                pokemon={p}
                onClick={() => setSelected(p)}
                isFavorite={isFavorite(p.id)}
                onToggleFavorite={() => toggleFavorite(p.id)}
                index={i}
              />
            ))}
          </motion.div>
        )}

        {!loading && !activeGen && !showFavs && (
          <div className="text-center py-16">
            <p className="font-pixel text-[10px] text-muted-foreground">Select a generation to explore</p>
          </div>
        )}

        {!loading && showFavs && favPokemon.length === 0 && (
          <div className="text-center py-16">
            <p className="font-pixel text-[10px] text-muted-foreground">No favorites yet</p>
          </div>
        )}
      </div>

      {selected && (
        <PokemonDetail
          pokemon={selected}
          onClose={() => setSelected(null)}
          isFavorite={isFavorite(selected.id)}
          onToggleFavorite={() => toggleFavorite(selected.id)}
          onNavigate={(next) => setSelected(next)}
        />
      )}
    </div>
  );
};

export default CollectionTab;
