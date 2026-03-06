import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HomepageProps {
  onNavigate: (tab: 'explore' | 'pokedes' | 'world') => void;
}

/* ── Animated scene silhouettes ── */
const SceneSilhouettes = ({ mouse }: { mouse: { x: number; y: number } }) => {
  const scenes = useMemo(() => [
    { d: 'M20 80 L25 50 L22 40 L28 35 L30 30 L35 25 L32 20 L38 15 L40 18 L42 10 L45 25 L50 30 L48 40 L52 45 L50 55 L55 60 L50 70 L45 80', x: 10, y: 0, scale: 1.2 },
    { d: 'M60 75 L55 65 L50 60 L52 50 L58 45 L65 42 L70 40 L75 42 L80 50 L82 55 L85 60 L88 65 L90 75 L85 78 L80 75 L75 78 L70 75 L65 78', x: 65, y: 5, scale: 1 },
    { d: 'M0 85 Q5 70 8 85 Q12 65 15 85 Q18 72 22 85 Q25 68 28 85 Q32 70 35 85 Q38 65 42 85 Q45 72 48 85 Q52 68 55 85', x: 20, y: 10, scale: 1.3 },
    { d: 'M45 30 L40 25 L35 28 L30 22 L35 18 L40 20 L45 15 L50 20 L55 18 L60 22 L55 28 L50 25 L45 30 M42 26 L48 26', x: 55, y: -5, scale: 0.8 },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {scenes.map((scene, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 100 100"
          className="absolute pointer-events-none"
          style={{
            width: `${25 + i * 5}%`,
            left: `${scene.x}%`,
            bottom: `${5 + i * 3}%`,
            opacity: 0,
            transform: `translate(${mouse.x * (0.2 + i * 0.08)}px, ${mouse.y * (0.2 + i * 0.08)}px) scale(${scene.scale})`,
          }}
          animate={{ opacity: [0, 0.04, 0.06, 0.04, 0] }}
          transition={{ duration: 12 + i * 3, repeat: Infinity, delay: i * 4, ease: 'easeInOut' }}
        >
          <path d={scene.d} fill="none" stroke="hsl(var(--foreground) / 0.08)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      ))}

      {[0, 1, 2].map(i => (
        <motion.div
          key={`cloud-${i}`}
          className="absolute pointer-events-none"
          style={{ top: `${12 + i * 8}%`, left: '-20%', transform: `translateY(${mouse.y * 0.1}px)` }}
          animate={{ x: ['0%', '140%'] }}
          transition={{ duration: 40 + i * 15, repeat: Infinity, delay: i * 8, ease: 'linear' }}
        >
          <svg width="80" height="30" viewBox="0 0 80 30" className="opacity-[0.03]">
            <rect x="20" y="10" width="40" height="8" rx="1" fill="hsl(var(--foreground))" />
            <rect x="10" y="14" width="16" height="6" rx="1" fill="hsl(var(--foreground))" />
            <rect x="52" y="12" width="18" height="6" rx="1" fill="hsl(var(--foreground))" />
            <rect x="28" y="6" width="24" height="6" rx="1" fill="hsl(var(--foreground))" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
};

/* ── Particle field ── */
const ParticleField = () => {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 10,
      size: Math.random() > 0.7 ? 2 : 1,
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-foreground/10 pointer-events-none"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, bottom: '-2%' }}
          animate={{ y: [0, -window.innerHeight * 1.1], opacity: [0, 0.25, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'linear' }}
        />
      ))}
    </div>
  );
};

/* ── Enhanced Pokéball ── */
const HoloPokeball = ({ phase }: { phase: string }) => (
  <motion.div
    className="relative w-24 h-24 md:w-28 md:h-28 pointer-events-none"
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: phase === 'assembling' ? [0, 0.8, 1] : 1, opacity: 1 }}
    transition={{ duration: 1.8, ease: 'easeOut' }}
  >
    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-3 rounded-full blur-md" style={{ background: 'hsl(var(--poke-red) / 0.15)' }} />
    <motion.div
      className="absolute inset-0 rounded-full"
      animate={{
        boxShadow: phase === 'ready'
          ? ['0 0 20px hsl(var(--poke-red) / 0.1)', '0 0 40px hsl(var(--poke-red) / 0.2)', '0 0 20px hsl(var(--poke-red) / 0.1)']
          : '0 0 15px hsl(var(--poke-red) / 0.08)',
      }}
      transition={{ duration: 3, repeat: Infinity }}
    />
    <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <motion.circle cx="50" cy="50" r="46" fill="none" stroke="hsl(0 0% 35% / 0.4)" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: 'easeInOut' }} />
        <motion.path d="M 4 50 A 46 46 0 0 1 96 50" fill="hsl(var(--poke-red) / 0.85)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }} />
        <motion.path d="M 4 50 A 46 46 0 0 0 96 50" fill="hsl(0 0% 88% / 0.9)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }} />
        <motion.rect x="4" y="47" width="92" height="6" fill="hsl(0 0% 12%)" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 0.6 }} />
        <motion.circle cx="50" cy="50" r="12" fill="hsl(0 0% 12%)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2, type: 'spring' }} />
        <motion.circle cx="50" cy="50" r="8" fill="hsl(0 0% 92%)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.4, type: 'spring' }} />
        <motion.circle cx="50" cy="50" r="4" fill="hsl(0 0% 75%)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.5, type: 'spring' }} />
        <motion.ellipse cx="38" cy="32" rx="8" ry="4" fill="hsl(0 0% 100% / 0.12)" transform="rotate(-30 38 32)" animate={{ opacity: [0.08, 0.18, 0.08] }} transition={{ duration: 3, repeat: Infinity }} />
      </svg>
    </motion.div>
    {phase === 'ready' && (
      <>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full pointer-events-none"
            style={{ left: '50%', top: '50%', background: 'hsl(var(--poke-red) / 0.5)' }}
            initial={{ scale: 0, x: 0, y: 0 }}
            animate={{ scale: [0, 1, 0], x: Math.cos((i * Math.PI * 2) / 6) * 40, y: Math.sin((i * Math.PI * 2) / 6) * 40, opacity: [0, 0.6, 0] }}
            transition={{ duration: 1.2, delay: 0.3 + i * 0.05 }}
          />
        ))}
      </>
    )}
  </motion.div>
);

/* ── Main Homepage ── */
const Homepage = ({ onNavigate }: HomepageProps) => {
  const [phase, setPhase] = useState<'assembling' | 'open' | 'ready'>('assembling');
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('open'), 2000);
    const t2 = setTimeout(() => setPhase('ready'), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 15,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 15,
    });
  }, []);

  const handleNavigate = useCallback((id: 'explore' | 'pokedes' | 'world') => {
    onNavigate(id);
  }, [onNavigate]);

  const buttons = useMemo(() => [
    { id: 'explore' as const, label: 'EXPLORE', cssVar: 'var(--poke-red)' },
    { id: 'pokedes' as const, label: 'POKEDES', cssVar: 'var(--poke-blue)' },
    { id: 'world' as const, label: 'WORLD', cssVar: 'var(--poke-green)' },
  ], []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden"
    >
      <div className="absolute inset-0 pixel-grid opacity-[0.03] pointer-events-none" />
      <SceneSilhouettes mouse={mouse} />
      <ParticleField />

      {/* Pokéball */}
      <div className="relative mb-10 pointer-events-none" style={{ transform: `translate(${mouse.x * 0.3}px, ${mouse.y * 0.3}px)` }}>
        <HoloPokeball phase={phase} />
      </div>

      {/* Title */}
      <AnimatePresence>
        {phase !== 'assembling' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-6"
          >
            <h1
              className="font-pixel text-2xl md:text-4xl tracking-[0.3em] text-foreground"
              style={{ textShadow: '0 0 15px hsl(var(--poke-red) / 0.25), 0 0 40px hsl(var(--poke-red) / 0.08)' }}
            >
              POKEDEX
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Description & buttons — always rendered when ready */}
      {phase === 'ready' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center max-w-lg px-8 flex flex-col items-center relative z-20"
        >
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-10">
            POKEDEX is a futuristic digital archive containing every Pokémon ever discovered.
            Explore official artwork, animated pixel sprites, detailed stats, evolution chains, abilities, and authentic Pokémon cries.
            Experience nostalgia reimagined through 8-bit aesthetics fused with cinematic modern design.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap mb-12">
            {buttons.map((btn, i) => (
              <motion.button
                key={btn.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                whileHover={{ scale: 1.04, borderColor: `hsl(${btn.cssVar} / 0.35)` }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleNavigate(btn.id)}
                className="relative z-30 px-7 py-3 rounded-xl font-pixel text-[9px] md:text-[10px] tracking-[0.2em] text-foreground border border-foreground/10 hover:border-foreground/30 transition-all duration-300 cursor-pointer select-none"
                style={{ boxShadow: `0 0 12px hsl(${btn.cssVar} / 0.08)` }}
              >
                {btn.label}
              </motion.button>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1 }}
            className="text-[9px] text-muted-foreground/50"
          >
            This application was created by Kutluhan Gül as a hobby project.
          </motion.p>
        </motion.div>
      )}
    </div>
  );
};

export default Homepage;
