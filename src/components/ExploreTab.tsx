import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Shuffle, SlidersHorizontal, X } from 'lucide-react';
import PokemonCard from '@/components/PokemonCard';
import PokemonDetail from '@/components/PokemonDetail';
import CompareBar from '@/components/CompareBar';
import CompareModal from '@/components/CompareModal';
import { usePokemonList } from '@/hooks/usePokemonList';
import { useFavorites } from '@/hooks/useFavorites';
import { useCompare } from '@/hooks/useCompare';
import { Pokemon, TYPE_COLORS, capitalize } from '@/lib/pokemon';
import { fetchPokemon } from '@/lib/api';
import { ALL_TYPES } from '@/lib/typeChart';

type SortKey = 'id' | 'name' | 'total' | 'hp' | 'attack' | 'speed';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'A-Z' },
  { key: 'total', label: 'TOTAL' },
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'ATK' },
  { key: 'speed', label: 'SPD' },
];

function getStat(p: Pokemon, name: string): number {
  return p.stats.find(s => s.stat.name === name)?.base_stat ?? 0;
}

function totalStats(p: Pokemon): number {
  return p.stats.reduce((s, x) => s + x.base_stat, 0);
}

const ExploreTab = () => {
  const { pokemon, loading, loadMore, hasMore } = usePokemonList(24);
  const { isFavorite, toggleFavorite } = useFavorites();
  const compare = useCompare();
  const [selected, setSelected] = useState<Pokemon | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize from URL
  const [activeTypes, setActiveTypes] = useState<Set<string>>(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('types');
    return new Set(t ? t.split(',').filter(Boolean) : []);
  });
  const [sortBy, setSortBy] = useState<SortKey>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('sort') as SortKey) || 'id';
  });
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('dir') as 'asc' | 'desc') || 'asc';
  });

  // Persist to URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activeTypes.size > 0) params.set('types', [...activeTypes].join(','));
    else params.delete('types');
    if (sortBy !== 'id') params.set('sort', sortBy);
    else params.delete('sort');
    if (sortDir !== 'asc') params.set('dir', sortDir);
    else params.delete('dir');
    const qs = params.toString();
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [activeTypes, sortBy, sortDir]);

  const filtered = useMemo(() => {
    let list = [...pokemon];
    if (activeTypes.size > 0) {
      list = list.filter(p => p.types.some(t => activeTypes.has(t.type.name)));
    }
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'id': cmp = a.id - b.id; break;
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'total': cmp = totalStats(a) - totalStats(b); break;
        case 'hp': cmp = getStat(a, 'hp') - getStat(b, 'hp'); break;
        case 'attack': cmp = getStat(a, 'attack') - getStat(b, 'attack'); break;
        case 'speed': cmp = getStat(a, 'speed') - getStat(b, 'speed'); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [pokemon, activeTypes, sortBy, sortDir]);

  const handleRandomPokemon = useCallback(async () => {
    const randomId = Math.floor(Math.random() * 1025) + 1;
    try {
      const p = await fetchPokemon(randomId);
      setSelected(p);
    } catch {}
  }, []);

  const toggleType = useCallback((t: string) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setActiveTypes(new Set());
    setSortBy('id');
    setSortDir('asc');
  }, []);

  const filterCount = activeTypes.size + (sortBy !== 'id' ? 1 : 0) + (sortDir !== 'asc' ? 1 : 0);

  return (
    <div className="min-h-full pb-32">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-lg md:text-xl text-poke-red text-glow-red">EXPLORE</h1>
          <p className="text-xs text-muted-foreground mt-1">Discover Pokémon</p>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(s => !s)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl glass text-xs font-pixel transition-colors ${
              showFilters || filterCount > 0 ? 'text-poke-blue neon-border-blue' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            FILTER
            {filterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-poke-red text-[8px] font-pixel flex items-center justify-center text-foreground">
                {filterCount}
              </span>
            )}
          </motion.button>
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
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 mb-6 space-y-4">
              {/* Type chips */}
              <div>
                <h3 className="font-pixel text-[8px] text-muted-foreground mb-2 tracking-wider">TYPES</h3>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_TYPES.map(t => {
                    const active = activeTypes.has(t);
                    const c = TYPE_COLORS[t];
                    return (
                      <button
                        key={t}
                        onClick={() => toggleType(t)}
                        className="px-2.5 py-1 rounded-full text-[9px] font-medium transition-all"
                        style={{
                          background: active ? `hsl(${c} / 0.3)` : `hsl(${c} / 0.08)`,
                          color: `hsl(${c})`,
                          border: `1px solid hsl(${c} / ${active ? 0.6 : 0.2})`,
                          boxShadow: active ? `0 0 10px hsl(${c} / 0.3)` : 'none',
                        }}
                      >
                        {capitalize(t)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort */}
              <div>
                <h3 className="font-pixel text-[8px] text-muted-foreground mb-2 tracking-wider">SORT BY</h3>
                <div className="flex flex-wrap gap-1.5">
                  {SORT_OPTIONS.map(opt => {
                    const active = sortBy === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => {
                          if (active) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                          else { setSortBy(opt.key); setSortDir('asc'); }
                        }}
                        className={`px-2.5 py-1 rounded-lg font-pixel text-[8px] transition-colors ${
                          active ? 'neon-border-blue text-poke-blue' : 'glass text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                        {active && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {filterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 font-pixel text-[8px] text-muted-foreground hover:text-poke-red transition-colors"
                >
                  <X className="w-3 h-3" /> CLEAR ALL
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Featured horizontal scroll (only when no filters) */}
      {filterCount === 0 && (
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
                  isInCompare={compare.isInCompare(p.id)}
                  onToggleCompare={() => compare.toggle(p)}
                  index={i}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="px-6">
        <h2 className="font-pixel text-[10px] text-muted-foreground mb-3">
          {filterCount > 0 ? `${filtered.length} RESULTS` : 'ALL POKÉMON'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((p, i) => (
            <PokemonCard
              key={p.id}
              pokemon={p}
              onClick={() => setSelected(p)}
              isFavorite={isFavorite(p.id)}
              onToggleFavorite={() => toggleFavorite(p.id)}
              isInCompare={compare.isInCompare(p.id)}
              onToggleCompare={() => compare.toggle(p)}
              index={i}
            />
          ))}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="font-pixel text-[10px] text-muted-foreground">No Pokémon match your filters</p>
          </div>
        )}

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
          onNavigate={(next) => setSelected(next)}
        />
      )}

      {/* Compare bar & modal */}
      <CompareBar
        items={compare.items}
        onRemove={compare.remove}
        onClear={compare.clear}
        onCompare={() => setShowCompareModal(true)}
      />
      {showCompareModal && compare.items.length === 2 && (
        <CompareModal
          pokemon={compare.items as [Pokemon, Pokemon]}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  );
};

export default ExploreTab;
