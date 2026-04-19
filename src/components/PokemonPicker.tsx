import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2 } from 'lucide-react';
import { Pokemon, capitalize, getPixelSprite, formatPokemonId, TYPE_COLORS } from '@/lib/pokemon';
import { fetchPokemon, fetchPokemonList } from '@/lib/api';

interface Props {
  onPick: (p: Pokemon) => void;
  onClose: () => void;
}

const PokemonPicker = ({ onPick, onClose }: Props) => {
  const [query, setQuery] = useState('');
  const [allNames, setAllNames] = useState<{ name: string }[]>([]);
  const [results, setResults] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPokemonList(0, 1025).then(setAllNames).catch(() => {});
  }, []);

  const search = useCallback(async (q: string) => {
    setQuery(q);
    if (!q) { setResults([]); return; }
    const lower = q.toLowerCase();
    const filtered = allNames.filter(p => p.name.includes(lower)).slice(0, 12);

    if (filtered.length === 0) {
      const num = parseInt(q);
      if (!isNaN(num) && num >= 1 && num <= 1025) {
        setLoading(true);
        try {
          const p = await fetchPokemon(num);
          setResults([p]);
        } catch { setResults([]); }
        setLoading(false);
      } else setResults([]);
      return;
    }

    setLoading(true);
    try {
      const data = await Promise.all(filtered.map(p => fetchPokemon(p.name)));
      setResults(data);
    } catch { setResults([]); }
    setLoading(false);
  }, [allNames]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-end md:items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-background/85 backdrop-blur-2xl"
          onClick={onClose}
        />
        <motion.div
          className="relative w-full max-w-md max-h-[80vh] flex flex-col rounded-2xl glass-strong pixel-corners z-10"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        >
          <div className="flex items-center justify-between p-4 border-b border-border/30">
            <h3 className="font-pixel text-[10px] text-poke-blue tracking-widest">PICK POKÉMON</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg glass">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => search(e.target.value)}
                placeholder="Search by name or ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass font-pixel text-[10px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-poke-blue/50"
              />
              {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-poke-blue" />}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {results.length === 0 && !loading && query && (
              <p className="text-center font-pixel text-[9px] text-muted-foreground py-12">No matches</p>
            )}
            {results.length === 0 && !query && (
              <p className="text-center font-pixel text-[9px] text-muted-foreground py-12">Type to search</p>
            )}
            <div className="space-y-2">
              {results.map(p => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { onPick(p); onClose(); }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl glass hover:bg-surface-elevated/40 transition-colors text-left"
                >
                  <img
                    src={getPixelSprite(p)}
                    alt={p.name}
                    className="w-10 h-10 object-contain shrink-0"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-pixel text-[8px] text-muted-foreground">{formatPokemonId(p.id)}</span>
                      <span className="font-pixel text-[9px] text-foreground truncate">{capitalize(p.name)}</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {p.types.map(t => (
                        <span
                          key={t.type.name}
                          className="px-1.5 py-0.5 rounded text-[8px]"
                          style={{
                            background: `hsl(${TYPE_COLORS[t.type.name]} / 0.18)`,
                            color: `hsl(${TYPE_COLORS[t.type.name]})`,
                          }}
                        >
                          {capitalize(t.type.name)}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PokemonPicker;
