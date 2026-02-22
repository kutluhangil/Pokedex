import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HomepageProps {
  onNavigate: (tab: 'explore' | 'pokedes') => void;
}

const Homepage = ({ onNavigate }: HomepageProps) => {
  const [phase, setPhase] = useState<'assembling' | 'open' | 'ready'>('assembling');
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('open'), 2000),
      setTimeout(() => setPhase('ready'), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 20,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden"
    >
      {/* Subtle pixel grid */}
      <div className="absolute inset-0 pixel-grid opacity-[0.04]" />

      {/* Floating silhouettes - very subtle */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-16 h-16 rounded-full opacity-[0.03]"
            style={{
              left: `${15 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
              background: `radial-gradient(circle, hsl(var(--poke-red) / 0.3), transparent 70%)`,
              transform: `translate(${mouse.x * (0.3 + i * 0.1)}px, ${mouse.y * (0.3 + i * 0.1)}px)`,
            }}
            animate={{
              y: [0, -15, 0],
            }}
            transition={{
              duration: 6 + i * 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Subtle particle drift */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={`p-${i}`}
          className="absolute w-px h-px rounded-full bg-foreground/10"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: '-2%',
          }}
          animate={{
            y: [0, -window.innerHeight * 1.1],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 8,
            repeat: Infinity,
            delay: Math.random() * 6,
            ease: 'linear',
          }}
        />
      ))}

      {/* Holographic Pokéball */}
      <motion.div
        className="relative mb-12"
        style={{
          transform: `translate(${mouse.x * 0.3}px, ${mouse.y * 0.3}px)`,
        }}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: phase === 'assembling' ? [0, 0.8, 1] : 1,
            opacity: 1,
          }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
          className="relative w-20 h-20 md:w-24 md:h-24"
        >
          {/* Glow behind ball */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: phase === 'ready'
                ? ['0 0 30px hsl(1 100% 60% / 0.15)', '0 0 50px hsl(1 100% 60% / 0.25)', '0 0 30px hsl(1 100% 60% / 0.15)']
                : '0 0 20px hsl(1 100% 60% / 0.1)',
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Pokéball SVG */}
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Fragment lines assembling effect */}
            <motion.circle
              cx="50" cy="50" r="46"
              fill="none"
              stroke="hsl(0 0% 40% / 0.3)"
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
            <motion.path
              d="M 4 50 A 46 46 0 0 1 96 50"
              fill="hsl(1 100% 60% / 0.8)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            />
            <motion.path
              d="M 4 50 A 46 46 0 0 0 96 50"
              fill="hsl(0 0% 90% / 0.9)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            />
            <motion.rect
              x="4" y="47" width="92" height="6"
              fill="hsl(0 0% 15%)"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
            />
            <motion.circle
              cx="50" cy="50" r="12"
              fill="hsl(0 0% 15%)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2, type: 'spring' }}
            />
            <motion.circle
              cx="50" cy="50" r="8"
              fill="hsl(0 0% 92%)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.4, type: 'spring' }}
            />
            <motion.circle
              cx="50" cy="50" r="4"
              fill="hsl(0 0% 75%)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5, type: 'spring' }}
            />
          </svg>
        </motion.div>
      </motion.div>

      {/* Title */}
      <AnimatePresence>
        {phase !== 'assembling' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <h1
              className="font-pixel text-2xl md:text-4xl tracking-[0.3em] text-foreground"
              style={{
                textShadow: '0 0 20px hsl(1 100% 60% / 0.3), 0 0 60px hsl(1 100% 60% / 0.1)',
              }}
            >
              POKEDEX
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Description & buttons */}
      <AnimatePresence>
        {phase === 'ready' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center max-w-lg px-8"
          >
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-10">
              POKEDEX is a futuristic digital archive containing every Pokémon ever discovered.
              Explore official artwork, animated pixel sprites, detailed stats, evolution chains, abilities, and authentic Pokémon cries.
              Experience nostalgia reimagined through 8-bit aesthetics fused with cinematic modern design.
            </p>

            <div className="flex items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate('explore')}
                className="px-8 py-3 rounded-xl font-pixel text-[10px] md:text-xs tracking-widest text-foreground border border-foreground/15 hover:border-poke-red/40 transition-all duration-300"
                style={{
                  boxShadow: '0 0 15px hsl(1 100% 60% / 0.08)',
                }}
              >
                EXPLORE
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate('pokedes')}
                className="px-8 py-3 rounded-xl font-pixel text-[10px] md:text-xs tracking-widest text-foreground border border-foreground/15 hover:border-poke-blue/40 transition-all duration-300"
                style={{
                  boxShadow: '0 0 15px hsl(211 100% 50% / 0.08)',
                }}
              >
                POKEDES
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Homepage;
