import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Pokemon, capitalize, TYPE_COLORS, getPixelSprite, formatPokemonId, GENERATION_RANGES } from '@/lib/pokemon';
import { fetchPokemonBatch, fetchPokemonSpecies } from '@/lib/api';
import CryPlayer from '@/components/CryPlayer';
import PokemonDetail from '@/components/PokemonDetail';
import { useFavorites } from '@/hooks/useFavorites';

/* ── Region data ── */
interface Region {
  name: string;
  gen: string;
  color: string;
  cx: number; // percent x on globe
  cy: number; // percent y on globe
  angle: number; // rotation angle on globe
  description: string;
}

const REGIONS: Region[] = [
  { name: 'Kanto', gen: 'Generation I', color: '1 100% 60%', cx: 72, cy: 38, angle: 0, description: 'The original region where the Pokémon journey began. Home to the first 151 Pokémon.' },
  { name: 'Johto', gen: 'Generation II', color: '211 100% 50%', cx: 68, cy: 32, angle: 30, description: 'A traditional region west of Kanto, known for its cultural heritage and legendary beasts.' },
  { name: 'Hoenn', gen: 'Generation III', color: '142 64% 50%', cx: 60, cy: 55, angle: 60, description: 'A tropical region with vast oceans, home to ancient legendary Pokémon Groudon and Kyogre.' },
  { name: 'Sinnoh', gen: 'Generation IV', color: '265 40% 55%', cx: 75, cy: 25, angle: 90, description: 'A cold northern region where the creation trio Dialga, Palkia, and Giratina reside.' },
  { name: 'Unova', gen: 'Generation V', color: '48 100% 52%', cx: 30, cy: 35, angle: 120, description: 'Inspired by New York, a modern urban region with entirely new Pokémon species.' },
  { name: 'Kalos', gen: 'Generation VI', color: '330 80% 60%', cx: 40, cy: 30, angle: 150, description: 'An elegant region inspired by France, where Mega Evolution was first discovered.' },
  { name: 'Alola', gen: 'Generation VII', color: '15 90% 55%', cx: 20, cy: 50, angle: 200, description: 'A tropical island chain with unique regional variants and Z-Moves.' },
  { name: 'Galar', gen: 'Generation VIII', color: '280 60% 50%', cx: 42, cy: 22, angle: 240, description: 'A UK-inspired region known for Dynamax phenomenon and the Wild Area.' },
  { name: 'Paldea', gen: 'Generation IX', color: '35 50% 55%', cx: 38, cy: 42, angle: 280, description: 'An open-world region inspired by the Iberian Peninsula with Terastallization.' },
];

/* ── Pixel Globe ── */
const PixelGlobe = ({
  rotation,
  activeRegion,
  onRegionClick,
}: {
  rotation: number;
  activeRegion: string | null;
  onRegionClick: (region: Region) => void;
}) => {
  const globeSize = 280;

  return (
    <div className="relative" style={{ width: globeSize, height: globeSize }}>
      {/* Space glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--poke-blue) / 0.06) 0%, transparent 70%)',
          transform: 'scale(1.4)',
        }}
      />

      {/* Globe body */}
      <motion.div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 35% 35%, hsl(211 60% 25% / 0.3) 0%, transparent 50%),
            radial-gradient(circle at 65% 65%, hsl(142 40% 20% / 0.2) 0%, transparent 50%),
            radial-gradient(circle, hsl(211 30% 15%) 0%, hsl(240 10% 8%) 100%)
          `,
          boxShadow: '0 0 40px hsl(var(--poke-blue) / 0.08), inset -20px -20px 40px hsl(0 0% 0% / 0.4)',
          border: '1px solid hsl(var(--poke-blue) / 0.1)',
        }}
      >
        {/* Grid lines */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-[0.08]">
          {/* Latitude lines */}
          {[25, 50, 75].map(y => (
            <motion.ellipse
              key={`lat-${y}`}
              cx="50" cy={y}
              rx={46 * Math.sin((y / 100) * Math.PI)}
              ry="3"
              fill="none"
              stroke="hsl(var(--poke-blue))"
              strokeWidth="0.3"
              strokeDasharray="2 3"
            />
          ))}
          {/* Longitude lines */}
          {[0, 1, 2, 3].map(i => (
            <motion.ellipse
              key={`lng-${i}`}
              cx="50" cy="50"
              rx={10 + i * 3}
              ry="46"
              fill="none"
              stroke="hsl(var(--poke-blue))"
              strokeWidth="0.3"
              strokeDasharray="2 3"
              transform={`rotate(${(rotation + i * 45) % 180} 50 50)`}
            />
          ))}
        </svg>

        {/* Pixel continents */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          <motion.g style={{ transform: `rotate(${rotation * 0.05}deg)`, transformOrigin: '50% 50%' }}>
            <rect x="25" y="20" width="15" height="12" rx="2" fill="hsl(142 40% 30% / 0.3)" />
            <rect x="45" y="30" width="20" height="15" rx="2" fill="hsl(142 40% 30% / 0.25)" />
            <rect x="60" y="25" width="18" height="18" rx="2" fill="hsl(142 40% 30% / 0.35)" />
            <rect x="15" y="45" width="12" height="15" rx="2" fill="hsl(142 40% 30% / 0.2)" />
            <rect x="55" y="50" width="14" height="10" rx="2" fill="hsl(142 40% 30% / 0.3)" />
            <rect x="35" y="55" width="10" height="8" rx="2" fill="hsl(142 40% 30% / 0.2)" />
          </motion.g>
        </svg>
      </motion.div>

      {/* Atmosphere ring */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow: '0 0 0 1px hsl(var(--poke-blue) / 0.06), 0 0 30px hsl(var(--poke-blue) / 0.04)',
        }}
      />

      {/* Region markers */}
      {REGIONS.map(region => {
        const isActive = activeRegion === region.name;
        const visibleAngle = ((region.angle + rotation) % 360);
        const isFrontFace = visibleAngle < 180;
        if (!isFrontFace) return null;

        const angleRad = ((visibleAngle) * Math.PI) / 180;
        const radius = 0.38;
        const x = 50 + Math.sin(angleRad) * radius * 100;
        const y = region.cy;

        return (
          <motion.button
            key={region.name}
            className="absolute flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              left: `${x}%`,
              top: `${y}%`,
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onRegionClick(region)}
            animate={{
              opacity: isFrontFace ? 1 : 0,
            }}
          >
            <motion.div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: `hsl(${region.color})`,
                boxShadow: isActive
                  ? `0 0 12px hsl(${region.color} / 0.5)`
                  : `0 0 6px hsl(${region.color} / 0.3)`,
              }}
              animate={isActive ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span
              className="font-pixel text-[6px] whitespace-nowrap"
              style={{ color: `hsl(${region.color})` }}
            >
              {region.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

/* ── Star field ── */
const StarField = () => {
  const stars = useMemo(() =>
    Array.from({ length: 40 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() > 0.8 ? 2 : 1,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 4,
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-foreground/20"
          style={{
            width: star.size,
            height: star.size,
            left: `${star.x}%`,
            top: `${star.y}%`,
          }}
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
          }}
        />
      ))}
    </div>
  );
};

/* ── Region Side Panel ── */
const RegionPanel = ({
  region,
  pokemon,
  loading,
  onClose,
  onSelectPokemon,
}: {
  region: Region;
  pokemon: Pokemon[];
  loading: boolean;
  onClose: () => void;
  onSelectPokemon: (p: Pokemon) => void;
}) => (
  <motion.div
    initial={{ x: '100%', opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: '100%', opacity: 0 }}
    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
    className="fixed right-0 top-0 bottom-0 w-full sm:w-96 z-30 glass-strong overflow-y-auto"
  >
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="font-pixel text-sm"
            style={{ color: `hsl(${region.color})` }}
          >
            {region.name.toUpperCase()}
          </h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">{region.gen}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg glass hover:bg-muted/30 transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-6">
        {region.description}
      </p>

      {/* Pokémon list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {pokemon.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => onSelectPokemon(p)}
              className="flex flex-col items-center p-2 rounded-xl glass hover:bg-muted/30 transition-colors"
            >
              <img
                src={getPixelSprite(p)}
                alt={p.name}
                className="w-10 h-10 object-contain"
                style={{ imageRendering: 'pixelated' }}
                loading="lazy"
              />
              <span className="font-pixel text-[6px] text-muted-foreground mt-1 truncate w-full text-center">
                {capitalize(p.name)}
              </span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  </motion.div>
);

/* ── Main World Tab ── */
const WorldTab = () => {
  const [activeRegion, setActiveRegion] = useState<Region | null>(null);
  const [regionPokemon, setRegionPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const animRef = useRef<number>();

  // Slow globe rotation
  useEffect(() => {
    let lastTime = 0;
    const animate = (time: number) => {
      if (lastTime) {
        const delta = time - lastTime;
        setRotation(r => (r + delta * 0.008) % 360);
      }
      lastTime = time;
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleRegionClick = useCallback(async (region: Region) => {
    if (activeRegion?.name === region.name) {
      setActiveRegion(null);
      return;
    }
    setActiveRegion(region);
    setLoading(true);
    const range = GENERATION_RANGES[region.gen];
    if (range) {
      const [start, end] = range;
      const ids = Array.from({ length: Math.min(30, end - start + 1) }, (_, i) => start + i);
      try {
        const data = await fetchPokemonBatch(ids);
        setRegionPokemon(data);
      } catch {
        setRegionPokemon([]);
      }
    }
    setLoading(false);
  }, [activeRegion]);

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <h1 className="font-pixel text-lg md:text-xl text-poke-green text-glow-yellow">WORLD</h1>
        <p className="text-xs text-muted-foreground mt-1">Explore Pokémon Regions</p>
      </div>

      {/* Star field background */}
      <StarField />

      {/* Globe container */}
      <div className="flex flex-col items-center justify-center pt-8 md:pt-16 relative z-10">
        <PixelGlobe
          rotation={rotation}
          activeRegion={activeRegion?.name || null}
          onRegionClick={handleRegionClick}
        />

        {/* Instruction text */}
        <motion.p
          className="font-pixel text-[8px] text-muted-foreground/50 mt-8"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          TAP A REGION TO EXPLORE
        </motion.p>

        {/* Region list for mobile */}
        <div className="grid grid-cols-3 gap-2 mt-8 px-6 w-full max-w-lg">
          {REGIONS.map(region => (
            <motion.button
              key={region.name}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleRegionClick(region)}
              className={`px-3 py-2 rounded-xl font-pixel text-[7px] transition-all duration-200 ${
                activeRegion?.name === region.name
                  ? 'text-foreground'
                  : 'glass text-muted-foreground hover:text-foreground'
              }`}
              style={
                activeRegion?.name === region.name
                  ? {
                      border: `1px solid hsl(${region.color} / 0.3)`,
                      boxShadow: `0 0 8px hsl(${region.color} / 0.15)`,
                    }
                  : {}
              }
            >
              {region.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Region panel */}
      <AnimatePresence>
        {activeRegion && (
          <RegionPanel
            region={activeRegion}
            pokemon={regionPokemon}
            loading={loading}
            onClose={() => setActiveRegion(null)}
            onSelectPokemon={setSelectedPokemon}
          />
        )}
      </AnimatePresence>

      {/* Pokemon detail */}
      {selectedPokemon && (
        <PokemonDetail
          pokemon={selectedPokemon}
          onClose={() => setSelectedPokemon(null)}
          isFavorite={isFavorite(selectedPokemon.id)}
          onToggleFavorite={() => toggleFavorite(selectedPokemon.id)}
        />
      )}
    </div>
  );
};

export default WorldTab;
