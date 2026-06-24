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
  const [showShinies, setShowShinies] = useState(false);
  const [favPokemon, setFavPokemon] = useState<Pokemon[]>([]);
  const [shinyPokemon, setShinyPokemon] = useState<Pokemon[]>([]);

  const loadGeneration = useCallback(async (gen: string) => {
    if (activeGen === gen) { setActiveGen(null); return; }
    setActiveGen(gen);
    setShowFavs(false);
    setShowShinies(false);
    setLoading(true);
    const [start, end] = GENERATION_RANGES[gen];
    // Load first 24 of each gen
    const ids = Array.from({ length: Math.min(24, end - start + 1) }, (_, i) => start + i);
    try {
      const data = await fetchPokemonBatch(ids);
      setPokemon(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [activeGen]);

  const loadFavorites = useCallback(async () => {
    setShowFavs(true);
    setShowShinies(false);
    setActiveGen(null);
    if (favorites.size === 0) { setFavPokemon([]); return; }
    setLoading(true);
    try {
      const data = await fetchPokemonBatch([...favorites].slice(0, 30));
      setFavPokemon(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [favorites]);

  const loadShinies = useCallback(async () => {
    setShowShinies(true);
    setShowFavs(false);
    setActiveGen(null);
    const stored = localStorage.getItem('pokedex-shinies');
    const ids: number[] = stored ? JSON.parse(stored) : [];
    if (ids.length === 0) { setShinyPokemon([]); return; }
    
    setLoading(true);
    try {
      const data = await fetchPokemonBatch(ids.slice(0, 30));
      setShinyPokemon(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  const displayPokemon = showFavs ? favPokemon : showShinies ? shinyPokemon : pokemon;

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
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={loadShinies}
          className={`px-3 py-2 rounded-xl font-pixel text-[8px] transition-colors flex items-center gap-1 ${
            showShinies ? 'neon-border-yellow text-poke-yellow shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'glass text-muted-foreground hover:text-foreground'
          }`}
        >
          ✨ SHINIES
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
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
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
                forceShiny={showShinies}
              />
            ))}
          </motion.div>
        )}

        {!loading && !activeGen && !showFavs && !showShinies && (
          <div className="text-center py-16">
            <p className="font-pixel text-[10px] text-muted-foreground">Select a generation to explore</p>
          </div>
        )}

        {!loading && showFavs && favPokemon.length === 0 && (
          <div className="text-center py-16">
            <p className="font-pixel text-[10px] text-muted-foreground">No favorites yet</p>
          </div>
        )}

        {!loading && showShinies && shinyPokemon.length === 0 && (
          <div className="text-center py-16 flex flex-col items-center gap-4">
            <p className="font-pixel text-[10px] text-muted-foreground">No Shinies found yet.</p>
            <p className="text-xs text-muted-foreground">Head over to the GAMES tab to start hunting!</p>
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
