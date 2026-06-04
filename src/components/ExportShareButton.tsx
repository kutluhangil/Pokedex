import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, ImageIcon, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ShareCard from '@/components/ShareCard';
import { exportNodeAsImage, ExportFormat } from '@/lib/exportImage';
import { Pokemon } from '@/lib/pokemon';

type Mode =
  | { kind: 'pokemon'; pokemon: Pokemon }
  | { kind: 'compare'; pair: [Pokemon, Pokemon] }
  | { kind: 'team'; team: (Pokemon | null)[] };

interface Props {
  mode: Mode;
  filename: string;
  label?: string;
  className?: string;
}

const ExportShareButton = ({ mode, filename, label = 'EXPORT', className = '' }: Props) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      await exportNodeAsImage(cardRef.current, filename, format);
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass font-pixel text-[8px] text-muted-foreground hover:text-poke-yellow transition-colors"
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Download className="w-3 h-3" />
          )}
          {label}
        </motion.button>
        <AnimatePresence>
          {open && !busy && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              className="absolute right-0 mt-2 z-50 rounded-xl glass-strong overflow-hidden min-w-[140px]"
            >
              <button
                onClick={() => handleExport('png')}
                className="w-full flex items-center gap-2 px-3 py-2 text-left font-pixel text-[8px] text-foreground hover:bg-poke-yellow/20 transition-colors"
              >
                <ImageIcon className="w-3 h-3 text-poke-yellow" /> PNG (HQ)
              </button>
              <button
                onClick={() => handleExport('jpg')}
                className="w-full flex items-center gap-2 px-3 py-2 text-left font-pixel text-[8px] text-foreground hover:bg-poke-blue/20 transition-colors"
              >
                <ImageIcon className="w-3 h-3 text-poke-blue" /> JPG (Smaller)
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden render target — portaled to body to escape any overflow/transform */}
      {createPortal(<ShareCard ref={cardRef} mode={mode} />, document.body)}
    </>
  );
};

export default ExportShareButton;
