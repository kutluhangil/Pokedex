import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Share2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Pokemon } from '@/lib/pokemon';

interface Props {
  team: (Pokemon | null)[];
  open: boolean;
  onClose: () => void;
}

const TeamShare = ({ team, open, onClose }: Props) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    const ids = team.filter((p): p is Pokemon => !!p).map(p => p.id);
    if (ids.length === 0) return '';
    const url = new URL(window.location.href);
    url.searchParams.set('team', ids.join(','));
    // Strip other params for a clean link
    return url.toString();
  }, [team]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const handleNativeShare = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Pokémon Team', url: shareUrl });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[85] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-background/85 backdrop-blur-2xl"
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-sm rounded-2xl glass-strong pixel-corners z-10 p-6"
            initial={{ scale: 0.92, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-poke-blue" />
                <h3 className="font-pixel text-[10px] text-poke-blue tracking-widest">
                  SHARE TEAM
                </h3>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg glass hover:bg-muted/30 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {!shareUrl ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Add a Pokémon to your team first.
              </p>
            ) : (
              <>
                {/* QR */}
                <div className="flex justify-center mb-5">
                  <div className="p-3 rounded-xl bg-foreground">
                    <QRCodeSVG
                      value={shareUrl}
                      size={160}
                      level="M"
                      bgColor="transparent"
                      fgColor="hsl(240, 10%, 4%)"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1.5 mb-4 text-muted-foreground">
                  <QrCode className="w-3 h-3" />
                  <span className="font-pixel text-[7px]">SCAN OR COPY LINK</span>
                </div>

                {/* URL display */}
                <div className="rounded-xl glass p-2.5 mb-3 break-all text-[10px] text-muted-foreground font-mono max-h-20 overflow-y-auto">
                  {shareUrl}
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl neon-border-blue font-pixel text-[9px] text-foreground hover:bg-poke-blue/10 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-poke-green" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'COPIED!' : 'COPY LINK'}
                  </motion.button>
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleNativeShare}
                      className="px-4 py-2.5 rounded-xl glass font-pixel text-[9px] text-foreground hover:bg-muted/30 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TeamShare;
