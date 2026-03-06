import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X, Loader2, ChevronLeft } from 'lucide-react';
import { Pokemon, capitalize, getPixelSprite, formatPokemonId, GENERATION_RANGES } from '@/lib/pokemon';
import { fetchPokemonBatch } from '@/lib/api';
import CryPlayer from '@/components/CryPlayer';
import PokemonDetail from '@/components/PokemonDetail';
import { useFavorites } from '@/hooks/useFavorites';

/* ── Region data ── */
interface Region {
  name: string;
  gen: string;
  color: string;
  lat: number;
  lng: number;
  description: string;
}

const REGIONS: Region[] = [
  { name: 'Kanto', gen: 'Generation I', color: '1 100% 60%', lat: 35, lng: 140, description: 'The original region where the Pokémon journey began. Home to the first 151 Pokémon.' },
  { name: 'Johto', gen: 'Generation II', color: '211 100% 50%', lat: 38, lng: 130, description: 'A traditional region west of Kanto, known for its cultural heritage and legendary beasts.' },
  { name: 'Hoenn', gen: 'Generation III', color: '142 64% 50%', lat: 20, lng: 150, description: 'A tropical region with vast oceans, home to ancient legendary Pokémon Groudon and Kyogre.' },
  { name: 'Sinnoh', gen: 'Generation IV', color: '265 40% 55%', lat: 50, lng: 120, description: 'A cold northern region where the creation trio Dialga, Palkia, and Giratina reside.' },
  { name: 'Unova', gen: 'Generation V', color: '48 100% 52%', lat: 40, lng: -74, description: 'Inspired by New York, a modern urban region with entirely new Pokémon species.' },
  { name: 'Kalos', gen: 'Generation VI', color: '330 80% 60%', lat: 48, lng: 2, description: 'An elegant region inspired by France, where Mega Evolution was first discovered.' },
  { name: 'Alola', gen: 'Generation VII', color: '15 90% 55%', lat: 20, lng: -155, description: 'A tropical island chain with unique regional variants and Z-Moves.' },
  { name: 'Galar', gen: 'Generation VIII', color: '280 60% 50%', lat: 52, lng: -1, description: 'A UK-inspired region known for Dynamax phenomenon and the Wild Area.' },
  { name: 'Paldea', gen: 'Generation IX', color: '35 50% 55%', lat: 40, lng: -4, description: 'An open-world region inspired by the Iberian Peninsula with Terastallization.' },
];

/* ── Helper: project lat/lng to sphere surface ── */
function latLngToPosition(lat: number, lng: number, rotY: number, rotX: number, radius: number) {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = ((lng + rotY) * Math.PI) / 180;
  
  const x = radius * Math.cos(latRad) * Math.sin(lngRad);
  const y = -radius * Math.sin(latRad + (rotX * Math.PI) / 180 * 0.3);
  const z = radius * Math.cos(latRad) * Math.cos(lngRad);
  
  // Simple perspective
  const perspective = 600;
  const scale = perspective / (perspective + z);
  
  return {
    x: x * scale,
    y: y * scale,
    scale,
    z,
    visible: z > -radius * 0.3,
  };
}

/* ── Star field ── */
const StarField = () => {
  const stars = useMemo(() =>
    Array.from({ length: 60 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() > 0.85 ? 2 : 1,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 4,
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-foreground/20"
          style={{ width: star.size, height: star.size, left: `${star.x}%`, top: `${star.y}%` }}
          animate={{ opacity: [0.05, 0.35, 0.05] }}
          transition={{ duration: star.duration, repeat: Infinity, delay: star.delay }}
        />
      ))}
    </div>
  );
};

/* ── Interactive 3D Globe ── */
const InteractiveGlobe = ({
  activeRegion,
  onRegionClick,
}: {
  activeRegion: string | null;
  onRegionClick: (region: Region) => void;
}) => {
  const globeSize = 320;
  const radius = globeSize * 0.42;
  const [rotY, setRotY] = useState(0);
  const [rotX, setRotX] = useState(15);
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const autoRotRef = useRef<number>();
  const velocityRef = useRef(0.015);

  // Auto rotation
  useEffect(() => {
    let last = 0;
    const tick = (t: number) => {
      if (last && !isDragging) {
        const dt = t - last;
        setRotY(r => r + dt * velocityRef.current);
      }
      last = t;
      autoRotRef.current = requestAnimationFrame(tick);
    };
    autoRotRef.current = requestAnimationFrame(tick);
    return () => { if (autoRotRef.current) cancelAnimationFrame(autoRotRef.current); };
  }, [isDragging]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setRotY(r => r + dx * 0.4);
    setRotX(r => Math.max(-40, Math.min(40, r - dy * 0.3)));
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Generate grid lines
  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    // Latitude circles
    for (let lat = -60; lat <= 60; lat += 30) {
      const points: string[] = [];
      for (let lng = 0; lng <= 360; lng += 5) {
        const pos = latLngToPosition(lat, lng, rotY, rotX, radius);
        if (pos.visible) {
          points.push(`${pos.x + globeSize / 2},${pos.y + globeSize / 2}`);
        }
      }
      if (points.length > 2) {
        lines.push(
          <polyline
            key={`lat-${lat}`}
            points={points.join(' ')}
            fill="none"
            stroke="hsl(var(--poke-blue) / 0.08)"
            strokeWidth="0.5"
          />
        );
      }
    }
    // Longitude lines
    for (let lng = 0; lng < 360; lng += 30) {
      const points: string[] = [];
      for (let lat = -80; lat <= 80; lat += 5) {
        const pos = latLngToPosition(lat, lng, rotY, rotX, radius);
        if (pos.visible) {
          points.push(`${pos.x + globeSize / 2},${pos.y + globeSize / 2}`);
        }
      }
      if (points.length > 2) {
        lines.push(
          <polyline
            key={`lng-${lng}`}
            points={points.join(' ')}
            fill="none"
            stroke="hsl(var(--poke-blue) / 0.06)"
            strokeWidth="0.5"
          />
        );
      }
    }
    return lines;
  }, [rotY, rotX, radius]);

  // Continent shapes (simplified pixel blocks)
  const continents = useMemo(() => {
    const landmasses = [
      // Asia/Japan-inspired
      { lats: [25, 30, 35, 40, 45, 50], lngs: [120, 125, 130, 135, 140, 145] },
      // Europe
      { lats: [40, 45, 50, 55], lngs: [-10, -5, 0, 5, 10, 15, 20] },
      // Americas
      { lats: [25, 30, 35, 40, 45], lngs: [-80, -75, -70, -65] },
      // Tropics
      { lats: [10, 15, 20], lngs: [-160, -155, -150] },
      // Southern
      { lats: [-10, -5, 0, 5, 10], lngs: [100, 105, 110, 115] },
    ];

    return landmasses.flatMap((mass, mi) =>
      mass.lats.flatMap(lat =>
        mass.lngs.map(lng => {
          const pos = latLngToPosition(lat, lng, rotY, rotX, radius);
          if (!pos.visible || pos.scale < 0.5) return null;
          const size = 6 * pos.scale;
          return (
            <rect
              key={`land-${mi}-${lat}-${lng}`}
              x={pos.x + globeSize / 2 - size / 2}
              y={pos.y + globeSize / 2 - size / 2}
              width={size}
              height={size}
              rx={1}
              fill={`hsl(142 40% 30% / ${0.15 + pos.scale * 0.15})`}
            />
          );
        })
      ).filter(Boolean)
    );
  }, [rotY, rotX, radius]);

  // Region markers
  const regionMarkers = useMemo(() => {
    return REGIONS.map(region => {
      const pos = latLngToPosition(region.lat, region.lng, rotY, rotX, radius);
      if (!pos.visible || pos.scale < 0.5) return null;

      const isActive = activeRegion === region.name;
      const markerSize = (isActive ? 10 : 7) * pos.scale;

      return (
        <g
          key={region.name}
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); onRegionClick(region); }}
        >
          {/* Glow */}
          <circle
            cx={pos.x + globeSize / 2}
            cy={pos.y + globeSize / 2}
            r={markerSize * 2}
            fill={`hsl(${region.color} / ${isActive ? 0.15 : 0.05})`}
          />
          {/* Marker */}
          <circle
            cx={pos.x + globeSize / 2}
            cy={pos.y + globeSize / 2}
            r={markerSize}
            fill={`hsl(${region.color} / ${0.7 + pos.scale * 0.3})`}
            stroke={`hsl(${region.color})`}
            strokeWidth={isActive ? 1.5 : 0.5}
          >
            {isActive && (
              <animate attributeName="r" values={`${markerSize};${markerSize * 1.3};${markerSize}`} dur="1.5s" repeatCount="indefinite" />
            )}
          </circle>
          {/* Label */}
          <text
            x={pos.x + globeSize / 2}
            y={pos.y + globeSize / 2 + markerSize + 10 * pos.scale}
            textAnchor="middle"
            fill={`hsl(${region.color})`}
            fontSize={Math.max(7, 9 * pos.scale)}
            fontFamily="'Press Start 2P', monospace"
            opacity={pos.scale}
          >
            {region.name}
          </text>
        </g>
      );
    }).filter(Boolean);
  }, [rotY, rotX, radius, activeRegion, onRegionClick]);

  return (
    <div
      className="relative select-none touch-none"
      style={{ width: globeSize, height: globeSize }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Atmosphere glow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(var(--poke-blue) / 0.04) 0%, transparent 70%)',
          transform: 'scale(1.5)',
        }}
      />

      {/* Globe sphere */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 38% 35%, hsl(211 40% 22% / 0.5) 0%, transparent 50%),
            radial-gradient(circle at 65% 70%, hsl(211 20% 10% / 0.5) 0%, transparent 50%),
            radial-gradient(circle, hsl(211 25% 14%) 0%, hsl(240 15% 6%) 100%)
          `,
          boxShadow: `
            inset -30px -30px 60px hsl(0 0% 0% / 0.5),
            inset 15px 15px 30px hsl(211 40% 30% / 0.1),
            0 0 60px hsl(var(--poke-blue) / 0.06),
            0 0 120px hsl(var(--poke-blue) / 0.03)
          `,
        }}
      >
        {/* Grid & continents SVG */}
        <svg
          viewBox={`0 0 ${globeSize} ${globeSize}`}
          className="absolute inset-0 w-full h-full"
        >
          {gridLines}
          {continents}
          {regionMarkers}
        </svg>
      </div>

      {/* Specular highlight */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '35%',
          height: '25%',
          top: '12%',
          left: '18%',
          background: 'radial-gradient(ellipse, hsl(0 0% 100% / 0.06) 0%, transparent 70%)',
          transform: 'rotate(-20deg)',
        }}
      />

      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          border: '1px solid hsl(var(--poke-blue) / 0.08)',
          boxShadow: '0 0 0 1px hsl(var(--poke-blue) / 0.03)',
        }}
      />
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 rounded-lg glass hover:bg-muted/30 transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div>
            <h2 className="font-pixel text-sm" style={{ color: `hsl(${region.color})` }}>
              {region.name.toUpperCase()}
            </h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">{region.gen}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg glass hover:bg-muted/30 transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-6">{region.description}</p>

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
              transition={{ delay: i * 0.015 }}
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
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

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
      const ids = Array.from({ length: Math.min(36, end - start + 1) }, (_, i) => start + i);
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
        <p className="text-xs text-muted-foreground mt-1">Drag to rotate · Tap a region to explore</p>
      </div>

      <StarField />

      {/* Globe */}
      <div className="flex flex-col items-center justify-center pt-4 md:pt-10 relative z-10">
        <InteractiveGlobe
          activeRegion={activeRegion?.name || null}
          onRegionClick={handleRegionClick}
        />

        {/* Region quick buttons */}
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
                  ? { border: `1px solid hsl(${region.color} / 0.3)`, boxShadow: `0 0 8px hsl(${region.color} / 0.15)` }
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
