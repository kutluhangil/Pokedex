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

interface EvolutionDetail {
  min_level?: number;
  item?: { name: string };
  trigger?: { name: string };
  min_happiness?: number;
  time_of_day?: string;
  known_move?: { name: string };
  location?: { name: string };
}

const formatTrigger = (details: EvolutionDetail[]): string | undefined => {
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
    <div className="flex items-center justify-center gap-0 flex-wrap relative p-4 rounded-3xl glass-strong border border-white/5 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-poke-blue/5 to-poke-red/5 pointer-events-none" />
      <div className="absolute inset-0 pixel-grid opacity-[0.03] pointer-events-none" />

      {rows.map((stage, stageIndex) => (
        <div key={stageIndex} className="flex items-center relative z-10">
          <div className="flex flex-col gap-3 py-2">
            {stage.map((s, i) => {
              const isCurrent = s.name === currentName;
              return (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: stageIndex * 0.15 + i * 0.05, type: 'spring', damping: 20 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelect?.(s.id)}
                  className={`relative flex flex-col items-center p-2.5 rounded-xl border transition-all overflow-hidden group cursor-pointer ${
                    isCurrent 
                      ? 'border-poke-red/60 bg-poke-red/10 shadow-[0_0_20px_rgba(239,68,68,0.25)]' 
                      : 'border-white/10 bg-white/5 hover:border-poke-blue/50 hover:bg-poke-blue/10 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                  }`}
                  style={{ width: 90 }}
                >
                  {/* Cyber background patterns */}
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)] bg-[length:4px_4px] pointer-events-none" />
                  
                  {/* Glowing corners */}
                  <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 transition-colors ${isCurrent ? 'border-poke-red' : 'border-white/20 group-hover:border-poke-blue'}`} />
                  <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 transition-colors ${isCurrent ? 'border-poke-red' : 'border-white/20 group-hover:border-poke-blue'}`} />

                  <img
                    src={spriteUrl(s.id)}
                    alt={s.name}
                    className="w-14 h-14 object-contain relative z-10 filter drop-shadow-lg transition-transform group-hover:scale-110"
                    loading="lazy"
                  />
                  
                  <div className="relative z-10 w-full mt-2 pt-2 border-t border-white/10">
                    <span className={`block font-pixel text-[7px] text-center truncate ${isCurrent ? 'text-poke-red' : 'text-foreground group-hover:text-poke-blue'}`}>
                      {capitalize(s.name)}
                    </span>
                    {s.trigger && stageIndex > 0 && (
                      <span className="block font-pixel text-[5px] text-poke-yellow mt-1.5 text-center leading-[1.2] bg-poke-yellow/10 rounded px-1 py-0.5 border border-poke-yellow/20">
                        {s.trigger.toUpperCase()}
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
          {stageIndex < rows.length - 1 && (
            <div className="flex items-center justify-center relative w-8 md:w-12 h-full">
              {/* Circuit Path */}
              <div className="w-full h-[2px] bg-white/10 relative overflow-hidden">
                 <motion.div
                   className="absolute top-0 left-0 h-full w-1/2 bg-poke-blue"
                   style={{ boxShadow: '0 0 8px var(--poke-blue)' }}
                   animate={{ x: ['-100%', '200%'] }}
                   transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: stageIndex * 0.3 }}
                 />
              </div>
              {/* Circuit Node */}
              <div className="absolute w-1.5 h-1.5 rounded-full bg-poke-blue border border-poke-blue shadow-[0_0_8px_var(--poke-blue)]" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EvolutionTree;
