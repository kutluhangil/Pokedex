import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen = ({ onComplete }: IntroScreenProps) => {
  const [phase, setPhase] = useState<'black' | 'text' | 'pokeball' | 'fade'>('black');
  const title = 'POKEDEX';

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('text'), 600),
      setTimeout(() => setPhase('pokeball'), 2200),
      setTimeout(() => setPhase('fade'), 4200),
      setTimeout(() => onComplete(), 5000),
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
          <div className="absolute inset-0 pixel-grid opacity-[0.04]" />

          {/* Title - letter by letter */}
          {(phase === 'text' || phase === 'pokeball') && (
            <div className="flex gap-2 md:gap-3 mb-10">
              {title.split('').map((char, i) => (
                <motion.span
                  key={i}
                  className="font-pixel text-2xl md:text-4xl tracking-wider text-foreground"
                  style={{
                    textShadow: '0 0 15px hsl(1 100% 60% / 0.25)',
                  }}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.3 }}
                >
                  {char}
                </motion.span>
              ))}
            </div>
          )}

          {/* Pokéball */}
          {phase === 'pokeball' && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.8 }}
              className="mb-6"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="w-14 h-14 md:w-16 md:h-16"
              >
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(0 0% 35%)" strokeWidth="1.5" />
                  <path d="M 4 50 A 46 46 0 0 1 96 50" fill="hsl(1 100% 60% / 0.7)" />
                  <path d="M 4 50 A 46 46 0 0 0 96 50" fill="hsl(0 0% 88%)" />
                  <rect x="4" y="47" width="92" height="6" fill="hsl(0 0% 15%)" />
                  <circle cx="50" cy="50" r="12" fill="hsl(0 0% 15%)" />
                  <circle cx="50" cy="50" r="8" fill="hsl(0 0% 90%)" />
                  <circle cx="50" cy="50" r="4" fill="hsl(0 0% 70%)" />
                </svg>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default IntroScreen;
