import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['/'], label: 'Search Pokémon' },
  { keys: ['S'], label: 'Toggle shiny (in detail)' },
  { keys: ['F'], label: 'Toggle favorite (in detail)' },
  { keys: ['←', '→'], label: 'Previous / Next Pokémon' },
  { keys: ['Esc'], label: 'Close modal' },
  { keys: ['?'], label: 'Show this help' },
];

const Key = ({ children }: { children: React.ReactNode }) => (
  <kbd
    className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md glass font-pixel text-[8px] text-foreground border border-border/50"
    style={{ boxShadow: '0 2px 0 hsl(var(--border) / 0.5)' }}
  >
    {children}
  </kbd>
);

const ShortcutsHelp = ({ open, onClose }: Props) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-[90] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-background/85 backdrop-blur-2xl"
          onClick={onClose}
        />
        <motion.div
          className="relative w-full max-w-md rounded-2xl glass-strong pixel-corners z-10 p-6"
          initial={{ scale: 0.92, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 30, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-poke-blue" />
              <h3 className="font-pixel text-[10px] text-poke-blue tracking-widest">
                SHORTCUTS
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg glass hover:bg-muted/30 transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-3">
            {SHORTCUTS.map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <div className="flex items-center gap-1.5">
                  {s.keys.map((k, i) => (
                    <span key={k} className="flex items-center gap-1.5">
                      {i > 0 && <span className="text-muted-foreground/40 text-[10px]">/</span>}
                      <Key>{k}</Key>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground/60 mt-6 text-center">
            Press <Key>?</Key> anytime to open this panel
          </p>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default ShortcutsHelp;
