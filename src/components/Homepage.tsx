import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Search, Globe, Zap, BookOpen, Volume2 } from 'lucide-react';

interface HomepageProps {
  onNavigate: (tab: 'explore' | 'pokedes' | 'world') => void;
}

/* ── Pixel Pokéball ── */
const PixelPokeball = () => (
  <motion.div
    className="relative w-20 h-20 md:w-24 md:h-24"
    animate={{ y: [0, -6, 0] }}
    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--foreground) / 0.15)" strokeWidth="1.5" />
      <path d="M 4 50 A 46 46 0 0 1 96 50" fill="hsl(var(--poke-red) / 0.8)" />
      <path d="M 4 50 A 46 46 0 0 0 96 50" fill="hsl(var(--foreground) / 0.9)" />
      <rect x="4" y="47" width="92" height="6" fill="hsl(var(--background))" />
      <circle cx="50" cy="50" r="12" fill="hsl(var(--background))" />
      <circle cx="50" cy="50" r="8" fill="hsl(var(--foreground) / 0.9)" />
      <motion.circle
        cx="50" cy="50" r="4"
        fill="hsl(var(--foreground) / 0.5)"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <ellipse cx="36" cy="32" rx="8" ry="4" fill="hsl(var(--foreground) / 0.08)" transform="rotate(-30 36 32)" />
    </svg>
    {/* Glow */}
    <div className="absolute inset-0 rounded-full blur-xl opacity-10" style={{ background: 'hsl(var(--poke-red))' }} />
  </motion.div>
);

/* ── Feature Card ── */
const FeatureCard = ({ icon: Icon, title, desc, delay }: { icon: any; title: string; desc: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm"
  >
    <div className="p-2 rounded-lg bg-muted/50 shrink-0">
      <Icon className="w-4 h-4 text-poke-red" />
    </div>
    <div>
      <h3 className="font-pixel text-[8px] md:text-[9px] text-foreground mb-1">{title}</h3>
      <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

/* ── Nav Button ── */
const NavButton = ({ label, icon: Icon, color, onClick, delay }: {
  label: string; icon: any; color: string; onClick: () => void; delay: number;
}) => (
  <motion.button
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    className="relative z-30 flex items-center gap-2 px-6 py-3 rounded-xl font-pixel text-[8px] md:text-[9px] tracking-[0.15em] text-foreground border border-border/60 hover:border-foreground/20 transition-all duration-300 cursor-pointer select-none bg-card/20 backdrop-blur-sm"
    style={{ boxShadow: `0 0 16px hsl(${color} / 0.08)` }}
  >
    <Icon className="w-3.5 h-3.5 opacity-60" />
    {label}
  </motion.button>
);

/* ── Starfield ── */
const Stars = () => {
  const stars = useMemo(() =>
    Array.from({ length: 40 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() > 0.8 ? 2 : 1,
      delay: Math.random() * 4,
      dur: 3 + Math.random() * 4,
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-foreground"
          style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%` }}
          animate={{ opacity: [0.05, 0.3, 0.05] }}
          transition={{ duration: s.dur, repeat: Infinity, delay: s.delay }}
        />
      ))}
    </div>
  );
};

/* ── Homepage ── */
const Homepage = ({ onNavigate }: HomepageProps) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  const handleNavigate = useCallback((id: 'explore' | 'pokedes' | 'world') => {
    onNavigate(id);
  }, [onNavigate]);

  const features = useMemo(() => [
    { icon: Compass, title: 'EXPLORE', desc: 'Browse all 1000+ Pokémon with official artwork, animated sprites, and detailed stats.' },
    { icon: Search, title: 'POKÉDEX', desc: 'Search by name, type, or generation. Find any Pokémon instantly.' },
    { icon: Globe, title: 'WORLD', desc: 'Explore an interactive 8-bit planet. Discover Pokémon by their native regions.' },
    { icon: Volume2, title: 'CRIES', desc: 'Listen to authentic Pokémon cries from every generation.' },
    { icon: Zap, title: 'STATS', desc: 'Detailed base stats, abilities, evolution chains, and type matchups.' },
    { icon: BookOpen, title: 'LORE', desc: 'Read Pokédex entries, origin stories, and regional history.' },
  ], []);

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <Stars />
      <div className="absolute inset-0 pixel-grid opacity-[0.02] pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col items-center px-6 py-16 md:py-24">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-8"
        >
          <PixelPokeball />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="font-pixel text-2xl md:text-4xl tracking-[0.3em] text-foreground mb-4"
          style={{ textShadow: '0 0 20px hsl(var(--poke-red) / 0.2)' }}
        >
          POKEDEX
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="font-pixel text-[7px] md:text-[8px] tracking-[0.25em] text-muted-foreground mb-8"
        >
          DIGITAL POKÉMON ARCHIVE
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-sm md:text-base text-muted-foreground leading-relaxed text-center max-w-md mb-12"
        >
          A futuristic Pokédex experience blending 8-bit nostalgia with modern design.
          Explore every Pokémon, discover their world, and relive the adventure.
        </motion.p>

        {/* Navigation Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <NavButton label="EXPLORE" icon={Compass} color="var(--poke-red)" onClick={() => handleNavigate('explore')} delay={0.9} />
          <NavButton label="POKÉDEX" icon={Search} color="var(--poke-blue)" onClick={() => handleNavigate('pokedes')} delay={1.0} />
          <NavButton label="WORLD" icon={Globe} color="var(--poke-green)" onClick={() => handleNavigate('world')} delay={1.1} />
        </div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="w-16 h-px bg-border mb-16"
        />

        {/* Features */}
        <AnimatePresence>
          {ready && (
            <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-3 mb-16">
              {features.map((f, i) => (
                <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} delay={1.3 + i * 0.1} />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 2, duration: 0.6 }}
          className="w-16 h-px bg-border mb-8"
        />

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.8 }}
          className="text-center space-y-2"
        >
          <p className="font-pixel text-[6px] md:text-[7px] tracking-[0.2em] text-muted-foreground/40">
            MADE FOR FUN — NOT FOR PROFIT
          </p>
          <p className="text-[10px] text-muted-foreground/30">
            A hobby project by Kutluhan Gül • Powered by PokéAPI
          </p>
          <p className="text-[9px] text-muted-foreground/20">
            This app is built purely for enjoyment and nostalgia.
          </p>
        </motion.div>

        <div className="h-8" />
      </div>
    </div>
  );
};

export default Homepage;
