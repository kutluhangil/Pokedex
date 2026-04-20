import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import { Pokemon, capitalize, TYPE_COLORS, getPixelSprite, formatPokemonId } from '@/lib/pokemon';
import { fetchPokemon, fetchPokemonList } from '@/lib/api';
import PokemonDetail from '@/components/PokemonDetail';
import { useFavorites } from '@/hooks/useFavorites';

const SearchTab = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(false);
  const [allNames, setAllNames] = useState<{ name: string }[]>([]);
  const [selected, setSelected] = useState<Pokemon | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    fetchPokemonList(0, 1025).then(list => setAllNames(list));
  }, []);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length === 0) { setResults([]); return; }
    
    const filtered = allNames
      .filter(p => p.name.includes(q.toLowerCase()))
      .slice(0, 20);

    if (filtered.length === 0) {
      // Try exact ID search
      const num = parseInt(q);
      if (!isNaN(num) && num >= 1 && num <= 1025) {
        setLoading(true);
        try {
          const p = await fetchPokemon(num);
          setResults([p]);
        } catch { setResults([]); }
        setLoading(false);
        return;
      }
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const pokemons = await Promise.all(
        filtered.slice(0, 12).map(p => fetchPokemon(p.name))
      );
      setResults(pokemons);
    } catch { setResults([]); }
    setLoading(false);
  }, [allNames]);

  return (
    <div className="min-h-full pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <h1 className="font-pixel text-lg md:text-xl text-poke-blue text-glow-blue">POKEDES</h1>
        <p className="text-xs text-muted-foreground mt-1">Search Database</p>
      </div>

      {/* Scanline overlay */}
      <div className="fixed inset-0 scanline pointer-events-none z-10" />
      <div className="fixed inset-0 pixel-grid opacity-10 pointer-events-none" />

      {/* Search bar */}
      <div className="px-6 py-4 sticky top-0 z-20">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search your Pokémon..."
            className="w-full pl-11 pr-4 py-3 rounded-xl glass font-pixel text-[10px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-poke-blue/50 neon-border-blue"
          />
          {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-poke-blue" />}
        </div>
      </div>

      {/* Results */}
      <div className="px-6">
        <AnimatePresence mode="popLayout">
          {results.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelected(p)}
              className="flex items-center gap-4 p-3 mb-2 rounded-xl glass cursor-pointer hover:bg-surface-elevated/50 transition-colors group"
            >
              <img
                src={getPixelSprite(p)}
                alt={p.name}
                className="w-12 h-12 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-[9px] text-muted-foreground">{formatPokemonId(p.id)}</span>
                  <span className="font-pixel text-[10px] text-foreground truncate">{capitalize(p.name)}</span>
                </div>
                <div className="flex gap-1 mt-1">
                  {p.types.map(t => (
                    <span
                      key={t.type.name}
                      className="px-1.5 py-0.5 rounded text-[8px]"
                      style={{
                        background: `hsl(${TYPE_COLORS[t.type.name] || TYPE_COLORS.normal} / 0.2)`,
                        color: `hsl(${TYPE_COLORS[t.type.name] || TYPE_COLORS.normal})`,
                      }}
                    >
                      {capitalize(t.type.name)}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-muted-foreground text-xs group-hover:text-foreground transition-colors">→</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {query && !loading && results.length === 0 && (
          <div className="text-center py-16">
            <p className="font-pixel text-[10px] text-muted-foreground">No Pokémon found</p>
          </div>
        )}

        {!query && (
          <div className="text-center py-16">
            <p className="font-pixel text-[10px] text-muted-foreground">Type to search...</p>
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

export default SearchTab;
