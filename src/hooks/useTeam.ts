import { useState, useEffect, useCallback } from 'react';
import { Pokemon } from '@/lib/pokemon';
import { fetchPokemon } from '@/lib/api';

const TEAM_KEY = 'pokedex-team-v1';
export const TEAM_SIZE = 6;

export function useTeam() {
  const [team, setTeam] = useState<(Pokemon | null)[]>(() => Array(TEAM_SIZE).fill(null));
  const [loaded, setLoaded] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem(TEAM_KEY);
        if (raw) {
          const ids: (number | null)[] = JSON.parse(raw);
          const fetched = await Promise.all(
            ids.map(id => (id == null ? Promise.resolve(null) : fetchPokemon(id).catch(() => null)))
          );
          setTeam(fetched.slice(0, TEAM_SIZE).concat(Array(TEAM_SIZE).fill(null)).slice(0, TEAM_SIZE));
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  // Persist
  useEffect(() => {
    if (!loaded) return;
    const ids = team.map(p => (p ? p.id : null));
    localStorage.setItem(TEAM_KEY, JSON.stringify(ids));
  }, [team, loaded]);

  const setSlot = useCallback((index: number, p: Pokemon | null) => {
    setTeam(prev => {
      const next = [...prev];
      next[index] = p;
      return next;
    });
  }, []);

  const removeSlot = useCallback((index: number) => setSlot(index, null), [setSlot]);

  const clear = useCallback(() => setTeam(Array(TEAM_SIZE).fill(null)), []);

  return { team, setSlot, removeSlot, clear, loaded };
}
