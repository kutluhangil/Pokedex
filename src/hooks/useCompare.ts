import { useState, useCallback } from 'react';
import { Pokemon } from '@/lib/pokemon';

const MAX = 2;

export function useCompare() {
  const [items, setItems] = useState<Pokemon[]>([]);

  const isInCompare = useCallback((id: number) => items.some(p => p.id === id), [items]);

  const toggle = useCallback((p: Pokemon) => {
    setItems(prev => {
      if (prev.some(x => x.id === p.id)) return prev.filter(x => x.id !== p.id);
      if (prev.length >= MAX) return [prev[1], p]; // FIFO drop
      return [...prev, p];
    });
  }, []);

  const remove = useCallback((id: number) => {
    setItems(prev => prev.filter(p => p.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, isInCompare, toggle, remove, clear, max: MAX };
}
