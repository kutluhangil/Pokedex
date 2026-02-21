import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen = ({ onComplete }: IntroScreenProps) => {
  const [phase, setPhase] = useState<'black' | 'text' | 'pokeball' | 'message' | 'fade'>('black');
  const title = 'POKEDEX';

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('text'), 800),
      setTimeout(() => setPhase('pokeball'), 2400),
      setTimeout(() => setPhase('message'), 3800),
      setTimeout(() => setPhase('fade'), 6000),
      setTimeout(() => onComplete(), 6800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'fade' ? (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Pixel grid background */}
          <div className="absolute inset-0 pixel-grid opacity-30" />
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-poke-red"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0, 0.6, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Title - letter by letter */}
          {(phase === 'text' || phase === 'pokeball' || phase === 'message') && (
            <div className="flex gap-2 md:gap-4 mb-12">
              {title.split('').map((char, i) => (
                <motion.span
                  key={i}
                  className="font-pixel text-3xl md:text-5xl text-poke-red text-glow-red"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.3 }}
                >
                  {char}
                </motion.span>
              ))}
            </div>
          )}

          {/* Pokéball */}
          {(phase === 'pokeball' || phase === 'message') && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 1 }}
              className="mb-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 md:w-20 md:h-20 relative"
              >
                {/* Pokéball SVG */}
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_hsl(1,100%,60%,0.5)]">
                  <circle cx="50" cy="50" r="48" fill="none" stroke="hsl(0,0%,60%)" strokeWidth="3" />
                  <path d="M 2 50 A 48 48 0 0 1 98 50" fill="hsl(1,100%,60%)" />
                  <path d="M 2 50 A 48 48 0 0 0 98 50" fill="hsl(0,0%,95%)" />
                  <rect x="2" y="47" width="96" height="6" fill="hsl(0,0%,20%)" />
                  <circle cx="50" cy="50" r="14" fill="hsl(0,0%,20%)" />
                  <circle cx="50" cy="50" r="10" fill="hsl(0,0%,95%)" />
                  <circle cx="50" cy="50" r="5" fill="hsl(0,0%,80%)" />
                </svg>
              </motion.div>
            </motion.div>
          )}

          {/* Welcome message */}
          {phase === 'message' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-pixel text-[10px] md:text-xs text-muted-foreground text-center max-w-md px-4 leading-relaxed"
            >
              Welcome to the Pokedex.
              <br />
              Explore every Pokémon ever discovered.
            </motion.p>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default IntroScreen;
