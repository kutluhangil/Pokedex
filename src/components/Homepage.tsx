import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Compass, Search, Globe, ChevronDown } from 'lucide-react';

interface HomepageProps {
  onNavigate: (tab: 'explore' | 'pokedes' | 'world') => void;
  onPokemonClick?: (id: number) => void;
}

/* ── Pixel Pokéball ── */
const PixelPokeball = () => (
  <motion.div
    className="relative w-28 h-28 md:w-36 md:h-36"
    animate={{ y: [0, -8, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
  >
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
      <defs>
        <radialGradient id="ball-shine" cx="35%" cy="35%" r="60%">
          <stop offset="0%" stopColor="hsl(0 0% 100% / 0.15)" />
          <stop offset="100%" stopColor="hsl(0 0% 100% / 0)" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="none" stroke="hsl(var(--foreground) / 0.1)" strokeWidth="1" />
      <path d="M 2 50 A 48 48 0 0 1 98 50" fill="hsl(var(--poke-red) / 0.85)" />
      <path d="M 2 50 A 48 48 0 0 0 98 50" fill="hsl(var(--foreground) / 0.85)" />
      <rect x="2" y="47" width="96" height="6" fill="hsl(var(--background))" />
      <line x1="2" y1="50" x2="98" y2="50" stroke="hsl(var(--foreground) / 0.2)" strokeWidth="2" />
      <circle cx="50" cy="50" r="14" fill="hsl(var(--background))" stroke="hsl(var(--foreground) / 0.2)" strokeWidth="2" />
      <circle cx="50" cy="50" r="8" fill="hsl(var(--foreground) / 0.9)" />
      <motion.circle
        cx="50" cy="50" r="4"
        fill="hsl(var(--foreground) / 0.4)"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />
      <circle cx="50" cy="50" r="48" fill="url(#ball-shine)" />
    </svg>
    <div className="absolute inset-0 rounded-full blur-2xl opacity-15" style={{ background: 'hsl(var(--poke-red))' }} />
  </motion.div>
);

/* ── Popular Pokémon Pool (most iconic 10) ── */
const POPULAR_POKEMON = [
  { id: 25, name: 'pikachu' },
  { id: 1, name: 'bulbasaur' },
  { id: 4, name: 'charmander' },
  { id: 7, name: 'squirtle' },
  { id: 133, name: 'eevee' },
  { id: 39, name: 'jigglypuff' },
  { id: 143, name: 'snorlax' },
  { id: 150, name: 'mewtwo' },
  { id: 94, name: 'gengar' },
  { id: 131, name: 'lapras' },
];

const spriteUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const cryUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;

interface Sparkle {
  id: number;
  x: number;
  y: number;
  color: string;
}

/* ── Walking Real Pokémon Sprite ── */
const WalkingSprite = ({ onOpen }: { onOpen?: (id: number) => void }) => {
  const [jumping, setJumping] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  // Pick a random popular Pokémon on each page load
  const pokemon = useMemo(
    () => POPULAR_POKEMON[Math.floor(Math.random() * POPULAR_POKEMON.length)],
    []
  );

  const handleClick = useCallback(() => {
    if (jumping) return;
    const audio = new Audio(cryUrl(pokemon.id));
    audio.volume = 0.35;
    audio.play().catch(() => {});

    const colors = [
      'hsl(48 100% 65%)',
      'hsl(var(--poke-red))',
      'hsl(var(--poke-blue))',
      'hsl(0 0% 100%)',
    ];
    const newSparkles: Sparkle[] = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 120,
      y: (Math.random() - 0.5) * 120 - 20,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setSparkles(newSparkles);
    setJumping(true);
    setTimeout(() => setJumping(false), 700);
    setTimeout(() => setSparkles([]), 900);
    // Open detail modal after the jump animation
    if (onOpen) setTimeout(() => onOpen(pokemon.id), 550);
  }, [jumping, pokemon.id, onOpen]);

  return (
    <motion.div
      className="absolute bottom-6 z-20"
      initial={{ x: '-15vw' }}
      animate={{ x: ['-15vw', '115vw'] }}
      transition={{ duration: 16, repeat: Infinity, ease: 'linear', delay: 1.5 }}
      style={{ left: 0 }}
    >
      <div className="relative">
        {sparkles.map((s) => (
          <motion.div
            key={s.id}
            className="absolute top-1/2 left-1/2 pointer-events-none rounded-sm"
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{ x: s.x, y: s.y, opacity: 0, scale: [0, 1.2, 0.8] }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              width: 4,
              height: 4,
              background: s.color,
              boxShadow: `0 0 6px ${s.color}`,
            }}
          />
        ))}

        <motion.button
          onClick={handleClick}
          aria-label={`${pokemon.name} cry`}
          className="block cursor-pointer bg-transparent border-0 p-1 -m-1"
          animate={jumping ? { y: [0, -28, 0, -14, 0], rotate: [0, -8, 0, 6, 0] } : { y: [0, -3, 0] }}
          transition={jumping
            ? { duration: 0.7, ease: 'easeOut' }
            : { duration: 0.4, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          <img
            src={spriteUrl(pokemon.id)}
            alt={pokemon.name}
            width={56}
            height={56}
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
          />
        </motion.button>
        <motion.div
          animate={jumping
            ? { scaleX: [1, 1.4, 1, 1.2, 1], opacity: [0.25, 0.08, 0.25, 0.12, 0.25] }
            : { scaleX: [1, 0.85, 1], opacity: [0.25, 0.18, 0.25] }}
          transition={jumping
            ? { duration: 0.7, ease: 'easeOut' }
            : { duration: 0.4, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto mt-0.5 h-1 w-10 rounded-full bg-foreground/30 blur-[2px]"
        />
      </div>
    </motion.div>
  );
};

/* ── Starfield ── */
const Stars = () => {
  const stars = useMemo(() =>
    Array.from({ length: 60 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() > 0.85 ? 2 : 1,
      delay: Math.random() * 5,
      dur: 3 + Math.random() * 5,
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-foreground"
          style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%` }}
          animate={{ opacity: [0.03, 0.25, 0.03] }}
          transition={{ duration: s.dur, repeat: Infinity, delay: s.delay }}
        />
      ))}
    </div>
  );
};

/* ── Homepage ── */
const Homepage = ({ onNavigate, onPokemonClick }: HomepageProps) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = document.getElementById('homepage-scroll');
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 60);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const handleNavigate = useCallback((id: 'explore' | 'pokedes' | 'world') => {
    onNavigate(id);
  }, [onNavigate]);

  const navItems = useMemo(() => [
    { id: 'explore' as const, label: 'EXPLORE', desc: '1000+ Pokémon keşfet', icon: Compass, color: 'var(--poke-red)' },
    { id: 'pokedes' as const, label: 'POKÉDEX', desc: 'Ara, bul, öğren', icon: Search, color: 'var(--poke-blue)' },
    { id: 'world' as const, label: 'WORLD', desc: 'Dünyayı keşfet', icon: Globe, color: 'var(--poke-green)' },
  ], []);

  return (
    <div id="homepage-scroll" className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <Stars />
      <div className="absolute inset-0 pixel-grid opacity-[0.015] pointer-events-none" />

      {/* ─── HERO SECTION ─── */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <PixelPokeball />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="font-pixel text-3xl md:text-5xl tracking-[0.35em] text-foreground mt-10 mb-4"
          style={{ textShadow: '0 0 30px hsl(var(--poke-red) / 0.15)' }}
        >
          POKÉDEX
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.7 }}
          className="font-pixel text-[6px] md:text-[7px] tracking-[0.3em] text-muted-foreground mb-6"
        >
          DIGITAL POKÉMON ARCHIVE
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          className="text-sm md:text-base text-muted-foreground/70 text-center max-w-sm leading-relaxed"
        >
          8-bit nostalji ile modern tasarımı birleştiren
          <br />
          bir Pokémon keşif deneyimi.
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: scrolled ? 0 : 0.4 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-10"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </motion.div>

        {/* Walking sprite across the bottom of hero */}
        <WalkingSprite onOpen={onPokemonClick} />
      </section>

      {/* ─── NAVIGATION SECTION ─── */}
      <section className="relative z-10 px-6 pb-20 -mt-10">
        <div className="max-w-md mx-auto space-y-4">
          {navItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleNavigate(item.id)}
                className="relative z-30 w-full flex items-center gap-5 p-5 rounded-2xl border border-border/40 bg-card/20 backdrop-blur-sm hover:border-foreground/10 transition-all duration-300 cursor-pointer select-none group text-left"
              >
                <div
                  className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border border-border/30"
                  style={{ boxShadow: `0 0 20px hsl(${item.color} / 0.08)` }}
                >
                  <Icon className="w-5 h-5 text-foreground/60 group-hover:text-foreground/90 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-pixel text-[9px] md:text-[10px] tracking-[0.2em] text-foreground block mb-1">
                    {item.label}
                  </span>
                  <span className="text-xs text-muted-foreground/60">
                    {item.desc}
                  </span>
                </div>
                <div className="text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="relative z-10 flex justify-center pb-16">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-12 h-px bg-border"
        />
      </div>

      {/* ─── INFO SECTION ─── */}
      <section className="relative z-10 px-6 pb-10">
        <div className="max-w-sm mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-3"
          >
            <p className="font-pixel text-[7px] md:text-[8px] tracking-[0.2em] text-muted-foreground/50">
              NELER VAR?
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '1000+', sub: 'Pokémon' },
                { label: '9', sub: 'Bölge' },
                { label: '∞', sub: 'Nostalji' },
              ].map((stat) => (
                <div key={stat.sub} className="p-3 rounded-xl border border-border/30 bg-card/10">
                  <p className="font-pixel text-[11px] md:text-[13px] text-foreground mb-1">{stat.label}</p>
                  <p className="text-[10px] text-muted-foreground/50">{stat.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 px-6 pt-10 pb-16">
        <div className="max-w-sm mx-auto text-center space-y-3">
          <div className="w-8 h-px bg-border/50 mx-auto mb-6" />
          <p className="font-pixel text-[5px] md:text-[6px] tracking-[0.25em] text-muted-foreground/30">
            SADECE KEYİF AMAÇLI YAPILDI
          </p>
          <p className="text-[10px] text-muted-foreground/25">
            Kutluhan Gül tarafından • PokéAPI ile güçlendirildi
          </p>
          <p className="text-[9px] text-muted-foreground/15">
            Kâr amacı gütmeden, tamamen eğlence ve nostalji için.
          </p>
        </div>
      </footer>

      <div className="h-6" />
    </div>
  );
};

export default Homepage;
