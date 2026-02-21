import { useState, useEffect, useCallback } from 'react';
import { Pokemon } from '@/lib/pokemon';
import { fetchPokemon, fetchPokemonList } from '@/lib/api';

export function usePokemonList(limit = 20) {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (!hasMore) return;
    setLoading(true);
    try {
      const list = await fetchPokemonList(offset, limit);
      if (list.length < limit) setHasMore(false);
      const details = await Promise.all(
        list.map(p => fetchPokemon(p.name))
      );
      setPokemon(prev => [...prev, ...details]);
      setOffset(prev => prev + limit);
    } catch (e) {
      console.error('Failed to load pokemon:', e);
    } finally {
      setLoading(false);
    }
  }, [offset, limit, hasMore]);

  useEffect(() => {
    if (pokemon.length === 0) loadMore();
  }, []);

  return { pokemon, loading, loadMore, hasMore };
}
