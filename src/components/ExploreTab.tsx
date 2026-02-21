import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Shuffle } from 'lucide-react';
import PokemonCard from '@/components/PokemonCard';
import PokemonDetail from '@/components/PokemonDetail';
import { usePokemonList } from '@/hooks/usePokemonList';
import { useFavorites } from '@/hooks/useFavorites';
import { Pokemon } from '@/lib/pokemon';
import { fetchPokemon } from '@/lib/api';

const ExploreTab = () => {
  const { pokemon, loading, loadMore, hasMore } = usePokemonList(24);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selected, setSelected] = useState<Pokemon | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleRandomPokemon = useCallback(async () => {
    const randomId = Math.floor(Math.random() * 1025) + 1;
    try {
      const p = await fetchPokemon(randomId);
      setSelected(p);
    } catch {}
  }, []);

  return (
    <div className="min-h-full pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-lg md:text-xl text-poke-red text-glow-red">EXPLORE</h1>
          <p className="text-xs text-muted-foreground mt-1">Discover Pokémon</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRandomPokemon}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-xs font-pixel text-poke-yellow hover:text-poke-red transition-colors"
        >
          <Shuffle className="w-4 h-4" />
          RANDOM
        </motion.button>
      </div>

      {/* Featured horizontal scroll */}
      <div className="px-6 mb-6">
        <h2 className="font-pixel text-[10px] text-muted-foreground mb-3">FEATURED</h2>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}
        >
          {pokemon.slice(0, 10).map((p, i) => (
            <div key={p.id} className="flex-shrink-0">
              <PokemonCard
                pokemon={p}
                onClick={() => setSelected(p)}
                isFavorite={isFavorite(p.id)}
                onToggleFavorite={() => toggleFavorite(p.id)}
                index={i}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-6">
        <h2 className="font-pixel text-[10px] text-muted-foreground mb-3">ALL POKÉMON</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {pokemon.map((p, i) => (
            <PokemonCard
              key={p.id}
              pokemon={p}
              onClick={() => setSelected(p)}
              isFavorite={isFavorite(p.id)}
              onToggleFavorite={() => toggleFavorite(p.id)}
              index={i}
            />
          ))}
        </div>

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadMore}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl glass font-pixel text-[10px] text-poke-blue hover:text-poke-yellow transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'LOADING...' : 'LOAD MORE'}
            </motion.button>
          </div>
        )}
      </div>

      {/* Detail */}
      {selected && (
        <PokemonDetail
          pokemon={selected}
          onClose={() => setSelected(null)}
          isFavorite={isFavorite(selected.id)}
          onToggleFavorite={() => toggleFavorite(selected.id)}
        />
      )}
    </div>
  );
};

export default ExploreTab;
