import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  Compass, Search, Globe, ChevronDown, Swords, Users, 
  Gamepad2, BookOpen, Volume2, VolumeX, Sparkles, Flame, 
  ArrowRight, Shield, Zap, Heart, Terminal, Play, Info
} from 'lucide-react';
import DailyPokemon from '@/components/DailyPokemon';
import { fetchPokemonBatch } from '@/lib/api';
import { Pokemon, capitalize, formatPokemonId, getArtwork, TYPE_COLORS } from '@/lib/pokemon';

interface HomepageProps {
  onNavigate: (tab: 'explore' | 'pokedes' | 'world' | 'team' | 'battle' | 'game' | 'collection') => void;
  onPokemonClick?: (id: number) => void;
}

/* ─── 3D Glowing Pokéball Core ─── */
const GlossyPokeball = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(200);
  const y = useMotionValue(200);

  const rotateX = useTransform(y, [0, 400], [15, -15]);
  const rotateY = useTransform(x, [0, 400], [-15, 15]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left - width / 2;
    const mouseY = event.clientY - rect.top - height / 2;
    
    // Normalize to [0, 400] scale
    x.set(mouseX + 200);
    y.set(mouseY + 200);
  };

  const handleMouseLeave = () => {
    x.set(200);
    y.set(200);
  };

  return (
    <div 
      className="perspective-[1000px] flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        ref={cardRef}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-36 h-36 md:w-48 md:h-48 rounded-full flex items-center justify-center"
      >
        {/* Glow behind the ball */}
        <div className="absolute inset-0 rounded-full blur-3xl opacity-35 bg-gradient-to-tr from-poke-red via-poke-blue to-poke-yellow animate-pulse" />
        
        {/* Glass outer ring */}
        <div className="absolute inset-[-10px] rounded-full border border-white/10 bg-white/5 backdrop-blur-[2px] pointer-events-none" />

        {/* The Pokéball SVG */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_15px_30px_rgba(239,68,68,0.25)] select-none">
          <defs>
            <radialGradient id="poke-upper" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ff5e62" />
              <stop offset="50%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#991b1b" />
            </radialGradient>
            <radialGradient id="poke-lower" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="85%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </radialGradient>
            <linearGradient id="center-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <radialGradient id="core-light" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
              <stop offset="40%" stopColor="#0ea5e9" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Upper Half (Red) */}
          <path d="M 5 50 A 45 45 0 0 1 95 50" fill="url(#poke-upper)" />

          {/* Lower Half (White) */}
          <path d="M 5 50 A 45 45 0 0 0 95 50" fill="url(#poke-lower)" />

          {/* Horizontal Band */}
          <rect x="4" y="47" width="92" height="6" fill="url(#center-line)" rx="1" />

          {/* Button Outer Ring */}
          <circle cx="50" cy="50" r="14" fill="#0f172a" />
          <circle cx="50" cy="50" r="11" fill="#1e293b" />

          {/* Button Core */}
          <circle cx="50" cy="50" r="8" fill="#ffffff" />
          
          {/* Neon Pulse */}
          <circle cx="50" cy="50" r="5" fill="url(#core-light)" />
        </svg>

        {/* Orbiting particles */}
        <div className="absolute inset-0 pointer-events-none rounded-full border border-dashed border-white/20 animate-[spin_12s_linear_infinite]" />
      </motion.div>
    </div>
  );
};

/* ─── Walking Sprite (Easter Egg) ─── */
const WalkingSprite = ({ onOpen }: { onOpen?: (id: number) => void }) => {
  const [jumping, setJumping] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

  // Pick a random popular Pokémon
  const pokemon = useMemo(() => {
    const list = [
      { id: 25, name: 'pikachu' },
      { id: 133, name: 'eevee' },
      { id: 39, name: 'jigglypuff' },
      { id: 143, name: 'snorlax' },
      { id: 94, name: 'gengar' },
      { id: 151, name: 'mew' },
    ];
    return list[Math.floor(Math.random() * list.length)];
  }, []);

  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
  const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemon.id}.ogg`;

  const handleClick = useCallback(() => {
    if (jumping) return;
    const audio = new Audio(cryUrl);
    audio.volume = 0.3;
    audio.play().catch(() => {});

    // Generate click sparkles
    const colors = ['#facc15', '#ef4444', '#3b82f6', '#10b981', '#ffffff'];
    const newSparkles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 100 - 20,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setSparkles(newSparkles);
    setJumping(true);
    setTimeout(() => setJumping(false), 700);
    setTimeout(() => setSparkles([]), 900);
    if (onOpen) setTimeout(() => onOpen(pokemon.id), 550);
  }, [jumping, pokemon.id, cryUrl, onOpen]);

  return (
    <motion.div
      className="absolute bottom-4 z-20"
      initial={{ x: '-15vw' }}
      animate={{ x: ['-15vw', '115vw'] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      style={{ left: 0 }}
    >
      <div className="relative">
        {sparkles.map((s) => (
          <motion.div
            key={s.id}
            className="absolute top-1/2 left-1/2 pointer-events-none rounded-full"
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{ x: s.x, y: s.y, opacity: 0, scale: [0, 1.2, 0.8] }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              width: 5,
              height: 5,
              background: s.color,
              boxShadow: `0 0 8px ${s.color}`,
            }}
          />
        ))}

        <motion.button
          onClick={handleClick}
          aria-label={`${pokemon.name} click`}
          className="block cursor-pointer bg-transparent border-0 p-1 -m-1"
          animate={jumping ? { y: [0, -24, 0, -10, 0], rotate: [0, -10, 0, 8, 0] } : { y: [0, -2, 0] }}
          transition={jumping
            ? { duration: 0.7, ease: 'easeOut' }
            : { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
        >
          <img
            src={spriteUrl}
            alt={pokemon.name}
            width={64}
            height={64}
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
          />
        </motion.button>
        <motion.div
          animate={jumping
            ? { scaleX: [1, 1.3, 1, 1.15, 1], opacity: [0.3, 0.08, 0.3, 0.15, 0.3] }
            : { scaleX: [1, 0.9, 1], opacity: [0.3, 0.22, 0.3] }}
          transition={jumping
            ? { duration: 0.7, ease: 'easeOut' }
            : { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto mt-0.5 h-1 w-10 rounded-full bg-foreground/20 blur-[2px]"
        />
      </div>
    </motion.div>
  );
};

/* ─── Starfield Background ─── */
const Stars = () => {
  const stars = useMemo(() =>
    Array.from({ length: 80 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() > 0.8 ? 2.5 : Math.random() > 0.4 ? 1.5 : 1,
      delay: Math.random() * 5,
      dur: 4 + Math.random() * 6,
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-slate-400"
          style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%` }}
          animate={{ opacity: [0.05, 0.4, 0.05] }}
          transition={{ duration: s.dur, repeat: Infinity, delay: s.delay }}
        />
      ))}
    </div>
  );
};

/* ─── Main Rebuilt Homepage ─── */
const Homepage = ({ onNavigate, onPokemonClick }: HomepageProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('pokedex-volume');
    return saved !== null ? parseFloat(saved) : 0.3;
  });
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('pokedex-muted') === 'true');
  const [starters, setStarters] = useState<Pokemon[]>([]);
  const [loadingStarters, setLoadingStarters] = useState(true);
  const [selectedStarter, setSelectedStarter] = useState<Pokemon | null>(null);

  // Scroll detection
  useEffect(() => {
    const el = document.getElementById('homepage-scroll-panel');
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 50);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  // Fetch starters on mount
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoadingStarters(true);
        // Gen 1 Starters + Pikachu
        const ids = [1, 4, 7, 25];
        const res = await fetchPokemonBatch(ids);
        if (active) {
          setStarters(res);
          setSelectedStarter(res[0] || null);
        }
      } catch (err) {
        console.error('Failed to load starters', err);
      } finally {
        if (active) setLoadingStarters(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const currentVolume = isMuted ? 0 : volume;

  const playCry = useCallback((id: number) => {
    const audio = new Audio(`https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`);
    audio.volume = currentVolume;
    audio.play().catch(() => {});
  }, [currentVolume]);

  const handleStarterSelect = (p: Pokemon) => {
    setSelectedStarter(p);
    playCry(p.id);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem('pokedex-muted', String(next));
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    setIsMuted(false);
    localStorage.setItem('pokedex-volume', String(v));
    localStorage.setItem('pokedex-muted', 'false');
  };

  const regions = useMemo(() => [
    { name: 'Kanto', count: '151 Pokémon', theme: 'from-red-500/20 to-amber-500/20', border: 'border-red-500/30', color: 'text-red-400', starters: ['Bulbasaur', 'Charmander', 'Squirtle'] },
    { name: 'Johto', count: '100 Pokémon', theme: 'from-amber-400/20 to-yellow-600/20', border: 'border-amber-400/30', color: 'text-amber-400', starters: ['Chikorita', 'Cyndaquil', 'Totodile'] },
    { name: 'Hoenn', count: '135 Pokémon', theme: 'from-emerald-500/20 to-blue-500/20', border: 'border-emerald-500/30', color: 'text-emerald-400', starters: ['Treecko', 'Torchic', 'Mudkip'] },
    { name: 'Sinnoh', count: '107 Pokémon', theme: 'from-cyan-500/20 to-purple-500/20', border: 'border-cyan-500/30', color: 'text-cyan-400', starters: ['Turtwig', 'Chimchar', 'Piplup'] }
  ], []);

  const featurePortals = useMemo(() => [
    { id: 'explore' as const, title: 'EXPLORE', desc: '1000+ Canavarı Keşfet', icon: Compass, glow: 'shadow-[0_0_25px_rgba(239,68,68,0.15)]', border: 'hover:border-red-500/30', badge: 'Yeni Nesil' },
    { id: 'pokedes' as const, title: 'DATABASE', desc: 'Filtrele, Ara ve Öğren', icon: Search, glow: 'shadow-[0_0_25px_rgba(59,130,246,0.15)]', border: 'hover:border-blue-500/30', badge: '1025 Kayıt' },
    { id: 'battle' as const, title: 'BATTLE', desc: 'Mücadele & Tür Analizi', icon: Swords, glow: 'shadow-[0_0_25px_rgba(168,85,247,0.15)]', border: 'hover:border-purple-500/30', badge: 'Simülatör' },
    { id: 'world' as const, title: 'WORLD MAP', desc: 'Habitat & Bölge Haritası', icon: Globe, glow: 'shadow-[0_0_25px_rgba(16,185,129,0.15)]', border: 'hover:border-emerald-500/30', badge: 'Kanto - Sinnoh' },
    { id: 'team' as const, title: 'TEAM BUILDER', desc: 'Kendi Güçlü Takımını Kur', icon: Users, glow: 'shadow-[0_0_25px_rgba(245,158,11,0.15)]', border: 'hover:border-amber-500/30', badge: 'Paylaşılabilir' },
    { id: 'game' as const, title: 'MINI GAMES', desc: 'Ses & Hafıza Oyunları', icon: Gamepad2, glow: 'shadow-[0_0_25px_rgba(236,72,153,0.15)]', border: 'hover:border-pink-500/30', badge: 'Eğlenceli' },
  ], []);

  return (
    <div 
      id="homepage-scroll-panel" 
      className="fixed inset-0 z-40 bg-[#06080f] overflow-y-auto select-none scroll-smooth pb-12"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 10%, #0d1326 0%, #06080f 70%)'
      }}
    >
      {/* Visual background enhancements */}
      <Stars />
      <div className="absolute inset-0 pixel-grid opacity-[0.012] pointer-events-none" />

      {/* ─── NAVBAR HEADER ─── */}
      <header className={`sticky top-0 z-50 transition-all duration-300 w-full ${
        scrolled ? 'glass-strong py-3 shadow-xl border-b border-white/5' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40">
              <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse" />
            </div>
            <div>
              <span className="font-pixel text-[9px] md:text-[11px] tracking-[0.2em] bg-gradient-to-r from-red-500 to-amber-400 bg-clip-text text-transparent block">
                CYBERDEX
              </span>
              <span className="text-[7px] text-slate-500 tracking-[0.1em] font-mono hidden sm:block">SYSTEM v2.5.0</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-[9px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              POKÉAPI CONNECTED
            </div>

            {/* Sound Controls */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <button 
                onClick={toggleMute}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Toggle sound"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 md:w-20 accent-emerald-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-[90vh] md:min-h-[85vh] flex flex-col items-center justify-center px-6 text-center pt-8">
        <div className="absolute top-1/4 left-10 w-72 h-72 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-72 h-72 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

        {/* Poké-ball Core */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="mb-8"
        >
          <GlossyPokeball />
        </motion.div>

        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 mb-4 tracking-wide font-mono">
            <Terminal className="w-3.5 h-3.5 text-red-500" />
            <span>Nostalji ve Modern Arayüz Bir Arada</span>
          </div>

          <h1 className="font-pixel text-4xl md:text-6xl tracking-[0.25em] text-white leading-tight mb-6">
            POKÉDEX
          </h1>

          <p className="text-base md:text-xl text-slate-400 leading-relaxed max-w-xl mx-auto font-light mb-8">
            En sevdiğiniz Pokémon'ları detaylı analiz edin, bölgeleri keşfedin ve güçlü takımlar oluşturup savaş simülatöründe test edin.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => onNavigate('explore')}
              className="group relative px-6 py-3.5 w-full sm:w-auto rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold text-sm shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Hemen Keşfet</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => onNavigate('world')}
              className="px-6 py-3.5 w-full sm:w-auto rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Bölge Haritası</span>
            </button>
          </div>
        </motion.div>

        {/* Floating search helper */}
        <div className="mt-12 hidden md:block">
          <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-slate-400 font-mono">
            /
          </kbd>
          <span className="text-xs text-slate-500 ml-2">tuşuna basarak hızlı aramayı aç</span>
        </div>
      </section>

      {/* ─── PICK YOUR PARTNER (STARTERS INTERACTIVE SHOWCASE) ─── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center md:text-left mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <p className="font-pixel text-[9px] tracking-[0.25em] text-amber-400">PARTNERİNİ SEÇ</p>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold mt-2 text-white">Başlangıç Pokémonları</h2>
          </div>
          <p className="text-xs md:text-sm text-slate-400 max-w-sm">
            Klasik neslin başlangıç Pokémon'larına tıklayarak seslerini duyabilir, istatistiklerini kontrol edebilir ve detaylarına erişebilirsiniz.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Starters selector list */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {loadingStarters ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5 animate-pulse" />
              ))
            ) : (
              starters.map((p) => {
                const isSelected = selectedStarter?.id === p.id;
                const mainType = p.types[0]?.type.name || 'normal';
                const typeColor = TYPE_COLORS[mainType];

                return (
                  <motion.button
                    key={p.id}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStarterSelect(p)}
                    className={`relative p-4 rounded-2xl text-left border overflow-hidden transition-all duration-300 group cursor-pointer ${
                      isSelected 
                        ? 'bg-white/10 border-white/20' 
                        : 'bg-white/5 hover:bg-white/8 border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Background glow based on type */}
                    <div 
                      className={`absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity pointer-events-none`}
                      style={{
                        background: `radial-gradient(circle at 100% 0%, hsl(${typeColor}), transparent 60%)`
                      }}
                    />

                    <div className="relative z-10 flex flex-col justify-between h-full">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-slate-500 font-mono">{formatPokemonId(p.id)}</span>
                        <div className="flex gap-1">
                          {p.types.map(t => (
                            <span 
                              key={t.type.name}
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: `hsl(${TYPE_COLORS[t.type.name]})` }}
                              title={capitalize(t.type.name)}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <span className="font-semibold text-white tracking-wide text-sm">{capitalize(p.name)}</span>
                        <img 
                          src={getArtwork(p)} 
                          alt={p.name} 
                          className="w-12 h-12 object-contain filter drop-shadow-md select-none pointer-events-none"
                        />
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>

          {/* Starter Detailed Dashboard */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {selectedStarter ? (
                <motion.div
                  key={selectedStarter.id}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.3 }}
                  className="relative p-6 md:p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden"
                  style={{
                    boxShadow: `0 0 40px hsl(${TYPE_COLORS[selectedStarter.types[0]?.type.name || 'normal']} / 0.08)`
                  }}
                >
                  {/* Decorative background type light */}
                  <div 
                    className="absolute right-0 top-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, hsl(${TYPE_COLORS[selectedStarter.types[0]?.type.name || 'normal']}), transparent 70%)`
                    }}
                  />

                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Artwork & Sound Button */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center">
                      <motion.div 
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        className="relative w-40 h-40 flex items-center justify-center"
                      >
                        <img 
                          src={getArtwork(selectedStarter)} 
                          alt={selectedStarter.name} 
                          className="w-36 h-36 object-contain filter drop-shadow-2xl z-10"
                        />
                        <div className="absolute w-28 h-2.5 bg-black/40 rounded-full blur-[4px] bottom-0" />
                      </motion.div>

                      <button
                        onClick={() => playCry(selectedStarter.id)}
                        className="mt-6 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs text-white flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                      >
                        <Play className="w-3 h-3 text-red-400 fill-red-400" />
                        <span>Sesi Dinle (Cry)</span>
                      </button>
                    </div>

                    {/* Stats & Description */}
                    <div className="md:col-span-7 space-y-4">
                      <div>
                        <span className="text-xs text-slate-500 font-mono">{formatPokemonId(selectedStarter.id)}</span>
                        <h3 className="text-2xl md:text-3xl font-bold text-white mt-1">{capitalize(selectedStarter.name)}</h3>
                        
                        <div className="flex gap-2 mt-2">
                          {selectedStarter.types.map(t => (
                            <span
                              key={t.type.name}
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-medium"
                              style={{
                                backgroundColor: `hsl(${TYPE_COLORS[t.type.name]} / 0.15)`,
                                color: `hsl(${TYPE_COLORS[t.type.name]})`,
                                border: `1px solid hsl(${TYPE_COLORS[t.type.name]} / 0.25)`
                              }}
                            >
                              {capitalize(t.type.name)}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Stats list */}
                      <div className="space-y-2.5 pt-2">
                        {selectedStarter.stats.map(s => {
                          const base = s.base_stat;
                          const max = 150;
                          const pct = Math.min(100, (base / max) * 100);
                          const statColor = TYPE_COLORS[selectedStarter.types[0]?.type.name || 'normal'];

                          let statIcon = <Zap className="w-3 h-3 text-amber-400" />;
                          if (s.stat.name.includes('hp')) statIcon = <Heart className="w-3 h-3 text-rose-500" />;
                          if (s.stat.name.includes('defense')) statIcon = <Shield className="w-3 h-3 text-blue-400" />;

                          return (
                            <div key={s.stat.name} className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-400 font-mono capitalize flex items-center gap-1.5">
                                  {statIcon}
                                  {s.stat.name.replace('special-', 'Sp. ').replace('-', ' ')}
                                </span>
                                <span className="text-white font-mono font-semibold">{base}</span>
                              </div>
                              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: `hsl(${statColor})` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Inspect Detail CTA */}
                      <div className="pt-3">
                        <button
                          onClick={() => onPokemonClick?.(selectedStarter.id)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-xs font-semibold text-white transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>Tam Detaylarını Göster</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-64 rounded-3xl border border-white/5 bg-white/5 flex items-center justify-center">
                  <span className="text-xs text-slate-500">Yükleniyor...</span>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ─── DAILY POKÉMON highlight ─── */}
      <section className="relative px-6 py-12 max-w-4xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 blur-3xl pointer-events-none" />
        <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 md:p-8">
          <DailyPokemon onClick={onPokemonClick} />
        </div>
      </section>

      {/* ─── MEET THE REGIONS SECTION ─── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="flex items-center gap-1.5 justify-center">
            <Globe className="w-4 h-4 text-emerald-400" />
            <p className="font-pixel text-[8px] tracking-[0.25em] text-emerald-400">BÖLGELER</p>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold mt-2 text-white">Bölgeleri Keşfet</h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto mt-2">
            Pokémon dünyasının ünlü bölgelerinde seyahat edin, yerel habitatları ve Pokémon türlerini inceleyin.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {regions.map((reg, idx) => (
            <motion.button
              key={reg.name}
              onClick={() => onNavigate('world')}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-5 rounded-2xl bg-gradient-to-b ${reg.theme} border ${reg.border} flex flex-col justify-between text-left h-48 transition-all group cursor-pointer`}
            >
              <div>
                <span className={`text-[10px] font-pixel ${reg.color} tracking-wide`}>{reg.name.toUpperCase()}</span>
                <h4 className="text-white font-semibold text-lg mt-1">{reg.name} Bölgesi</h4>
                <p className="text-xs text-slate-400 mt-1">{reg.count}</p>
              </div>

              <div className="mt-8 border-t border-white/5 pt-3">
                <p className="text-[10px] text-slate-500 font-mono mb-1">Popüler Başlangıçlar:</p>
                <div className="flex gap-2">
                  {reg.starters.map(st => (
                    <span key={st} className="text-[9px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                      {st}
                    </span>
                  ))}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ─── FEATURES NAVIGATION GRID ─── */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-white/5">
        <div className="text-center mb-12">
          <div className="flex items-center gap-1.5 justify-center">
            <Compass className="w-4 h-4 text-blue-400" />
            <p className="font-pixel text-[8px] tracking-[0.25em] text-blue-400">ÖZELLİKLER</p>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold mt-2 text-white">Dijital Arşiv Portalı</h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-sm mx-auto mt-2">
            Pokédex uygulamasındaki tüm gelişmiş tablere doğrudan buradan erişebilirsiniz.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featurePortals.map((portal) => {
            const Icon = portal.icon;
            return (
              <motion.button
                key={portal.id}
                onClick={() => onNavigate(portal.id)}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-6 rounded-2xl border border-white/5 hover:border-white/15 bg-white/5 hover:bg-white/10 text-left transition-all duration-300 group cursor-pointer ${portal.glow}`}
              >
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                    {portal.badge}
                  </span>
                </div>

                <div className="mt-8">
                  <h3 className="font-pixel text-[10px] text-white tracking-wider mb-2">
                    {portal.title}
                  </h3>
                  <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                    {portal.desc}
                  </p>
                </div>

                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ─── EASTER EGG RETRO SPRITE ZONE ─── */}
      <section className="relative w-full h-16 bg-slate-950/40 border-t border-b border-white/5 overflow-hidden my-6">
        <WalkingSprite onOpen={onPokemonClick} />
      </section>

      {/* ─── FOOTER STATISTICS SUMMARY ─── */}
      <footer className="max-w-4xl mx-auto px-6 pt-16 pb-20 text-center relative z-10 border-t border-white/5">
        <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mb-10">
          <div className="p-4 rounded-2xl border border-white/5 bg-white/5">
            <p className="text-xl md:text-2xl font-bold text-white font-mono">1025</p>
            <p className="text-[10px] text-slate-500 mt-1">Pokémon Kaydı</p>
          </div>
          <div className="p-4 rounded-2xl border border-white/5 bg-white/5">
            <p className="text-xl md:text-2xl font-bold text-white font-mono">9</p>
            <p className="text-[10px] text-slate-500 mt-1">Bölge Verisi</p>
          </div>
          <div className="p-4 rounded-2xl border border-white/5 bg-white/5">
            <p className="text-xl md:text-2xl font-bold text-white font-mono">∞</p>
            <p className="text-[10px] text-slate-500 mt-1">Nostalji & Eğlence</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-px bg-white/10 mx-auto" />
          <p className="font-pixel text-[6px] tracking-[0.25em] text-slate-600">
            SADECE EĞLENCE VE ÖĞRENME AMAÇLIDIR
          </p>
          <p className="text-xs text-slate-400">
            Kutluhan Gül tarafından • PokéAPI Verileri Kullanılarak Hazırlanmıştır
          </p>
          <p className="text-[10px] text-slate-500">
            © 2026 CyberDex Digital Archive. Tüm Pokémon markaları Nintendo & Game Freak'e aittir.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
