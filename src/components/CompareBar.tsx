import { motion, AnimatePresence } from 'framer-motion';
import { X, GitCompare } from 'lucide-react';
import { Pokemon, getPixelSprite, capitalize } from '@/lib/pokemon';

interface Props {
  items: Pokemon[];
  onRemove: (id: number) => void;
  onClear: () => void;
  onCompare: () => void;
}

const CompareBar = ({ items, onRemove, onClear, onCompare }: Props) => {
  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-16 left-0 right-0 z-40 px-4"
        >
          <div className="max-w-md mx-auto glass-strong rounded-2xl p-3 flex items-center gap-3 shadow-2xl">
            <div className="flex gap-2 flex-1">
              {[0, 1].map(i => {
                const p = items[i];
                if (!p) {
                  return (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-lg border border-dashed border-border/40 flex items-center justify-center"
                    >
                      <span className="font-pixel text-[7px] text-muted-foreground/50">
                        {i + 1}
                      </span>
                    </div>
                  );
                }
                return (
                  <motion.div
                    key={p.id}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative w-12 h-12 rounded-lg glass border border-poke-blue/40 flex items-center justify-center"
                  >
                    <img
                      src={getPixelSprite(p)}
                      alt={p.name}
                      className="w-10 h-10 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <button
                      onClick={() => onRemove(p.id)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-poke-red flex items-center justify-center"
                      aria-label={`Remove ${p.name}`}
                    >
                      <X className="w-2.5 h-2.5 text-foreground" />
                    </button>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex flex-col gap-1.5">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onCompare}
                disabled={items.length < 2}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-pixel text-[8px] bg-poke-blue/15 text-poke-blue border border-poke-blue/40 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-poke-blue/25 transition-colors"
              >
                <GitCompare className="w-3 h-3" />
                COMPARE
              </motion.button>
              <button
                onClick={onClear}
                className="font-pixel text-[7px] text-muted-foreground hover:text-foreground transition-colors"
              >
                clear
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CompareBar;
