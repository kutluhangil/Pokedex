import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Loader2 } from 'lucide-react';
import { fetchEvolutionChain, fetchPokemonSpecies, fetchPokemon } from '@/lib/api';
import { EvolutionNode, capitalize } from '@/lib/pokemon';

interface Props {
  speciesUrl: string;
  currentName: string;
  onSelect?: (id: number) => void;
}

interface Stage {
  id: number;
  name: string;
  trigger?: string;
}

const spriteUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

const idFromSpecies = (url: string): number => {
  const m = url.match(/\/pokemon-species\/(\d+)\//);
  return m ? parseInt(m[1], 10) : 0;
};

const formatTrigger = (details: any[]): string | undefined => {
  if (!details || details.length === 0) return undefined;
  const d = details[0];
  if (d.min_level) return `Lv ${d.min_level}`;
  if (d.item) return capitalize(d.item.name.replace(/-/g, ' '));
  if (d.trigger?.name === 'trade') return 'Trade';
  if (d.min_happiness) return 'Happiness';
  if (d.time_of_day) return `${capitalize(d.time_of_day)}`;
  if (d.known_move) return `Move: ${capitalize(d.known_move.name.replace(/-/g, ' '))}`;
  if (d.location) return `At ${capitalize(d.location.name)}`;
  if (d.trigger?.name) return capitalize(d.trigger.name.replace(/-/g, ' '));
  return undefined;
};

/**
 * Walk the chain into rows where each row holds sibling evolutions.
 * E.g. Eevee → [Vaporeon, Jolteon, Flareon, ...]
 */
const buildRows = (root: EvolutionNode): Stage[][] => {
  const rows: Stage[][] = [];
  let current: EvolutionNode[] = [root];
  while (current.length > 0) {
    rows.push(
      current.map(n => ({
        id: idFromSpecies(n.species.url),
        name: n.species.name,
        // @ts-expect-error PokeAPI shape
        trigger: formatTrigger(n.evolution_details),
      }))
    );
    const next: EvolutionNode[] = [];
    for (const n of current) for (const e of n.evolves_to) next.push(e);
    current = next;
  }
  return rows;
};

const EvolutionTree = ({ speciesUrl, currentName, onSelect }: Props) => {
  const [rows, setRows] = useState<Stage[][] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const sp = await fetchPokemonSpecies(idFromSpecies(speciesUrl));
        const evo = await fetchEvolutionChain(sp.evolution_chain.url);
        if (!cancelled) setRows(buildRows(evo.chain));
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [speciesUrl]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-poke-blue" />
      </div>
    );
  }

  if (!rows || rows.length <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
      {rows.map((stage, stageIndex) => (
        <div key={stageIndex} className="flex items-center gap-2 md:gap-3">
          <div className="flex flex-col gap-2">
            {stage.map((s, i) => {
              const isCurrent = s.name === currentName;
              return (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: stageIndex * 0.15 + i * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelect?.(s.id)}
                  className={`relative flex flex-col items-center p-2 rounded-xl glass transition-colors ${
                    isCurrent ? 'neon-border-red' : 'hover:bg-muted/30'
                  }`}
                  style={{ width: 78 }}
                >
                  <img
                    src={spriteUrl(s.id)}
                    alt={s.name}
                    className="w-14 h-14 object-contain"
                    loading="lazy"
                  />
                  <span className="font-pixel text-[7px] text-foreground text-center truncate max-w-full">
                    {capitalize(s.name)}
                  </span>
                  {s.trigger && stageIndex > 0 && (
                    <span className="font-pixel text-[6px] text-poke-yellow/80 mt-0.5 text-center leading-tight">
                      {s.trigger}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
          {stageIndex < rows.length - 1 && (
            <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
};

export default EvolutionTree;
