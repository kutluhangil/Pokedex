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
    // Realistic Earth continents as lat/lng pixel blocks (5° grid, 8-bit style)
    const land: [number, number, string][] = [
      // ── North America ──
      // Alaska
      ...[60,65,70].flatMap(lat => ([-170,-165,-160,-155,-150,-145] as number[]).map(lng => [lat, lng, '142 50% 35%'] as [number,number,string])),
      // Canada
      ...[55,60,65].flatMap(lat => ([-140,-135,-130,-125,-120,-115,-110,-105,-100,-95,-90,-85,-80,-75,-70,-65] as number[]).map(lng => [lat, lng, '142 45% 32%'] as [number,number,string])),
      ...[50].flatMap(lat => ([-130,-125,-120,-115,-110,-105,-100,-95,-90,-85,-80,-75,-70,-65] as number[]).map(lng => [lat, lng, '142 40% 34%'] as [number,number,string])),
      // USA
      ...[45].flatMap(lat => ([-125,-120,-115,-110,-105,-100,-95,-90,-85,-80,-75,-70] as number[]).map(lng => [lat, lng, '100 40% 38%'] as [number,number,string])),
      ...[40].flatMap(lat => ([-125,-120,-115,-110,-105,-100,-95,-90,-85,-80,-75] as number[]).map(lng => [lat, lng, '90 35% 40%'] as [number,number,string])),
      ...[35].flatMap(lat => ([-120,-115,-110,-105,-100,-95,-90,-85,-80] as number[]).map(lng => [lat, lng, '80 40% 42%'] as [number,number,string])),
      ...[30].flatMap(lat => ([-105,-100,-95,-90,-85,-80] as number[]).map(lng => [lat, lng, '60 45% 40%'] as [number,number,string])),
      // Florida
      [25, -80, '50 50% 42%'], [25, -85, '50 50% 42%'],
      // Mexico & Central America
      ...[25,20].flatMap(lat => ([-115,-110,-105,-100,-95] as number[]).map(lng => [lat, lng, '45 40% 38%'] as [number,number,string])),
      ...[15].flatMap(lat => ([-100,-95,-90,-85] as number[]).map(lng => [lat, lng, '80 45% 40%'] as [number,number,string])),
      [10, -85, '100 50% 42%'], [10, -80, '100 50% 42%'], [10, -75, '100 50% 42%'],

      // ── South America ──
      ...[5,0].flatMap(lat => ([-80,-75,-70,-65,-60,-55,-50] as number[]).map(lng => [lat, lng, '130 55% 38%'] as [number,number,string])),
      ...[-5].flatMap(lat => ([-80,-75,-70,-65,-60,-55,-50,-45,-40,-35] as number[]).map(lng => [lat, lng, '120 50% 35%'] as [number,number,string])),
      ...[-10].flatMap(lat => ([-78,-75,-70,-65,-60,-55,-50,-45,-40,-35] as number[]).map(lng => [lat, lng, '130 55% 38%'] as [number,number,string])),
      ...[-15].flatMap(lat => ([-75,-70,-65,-60,-55,-50,-45,-40] as number[]).map(lng => [lat, lng, '110 45% 36%'] as [number,number,string])),
      ...[-20].flatMap(lat => ([-70,-65,-60,-55,-50,-45,-40] as number[]).map(lng => [lat, lng, '90 40% 38%'] as [number,number,string])),
      ...[-25].flatMap(lat => ([-70,-65,-60,-55,-50,-45] as number[]).map(lng => [lat, lng, '80 40% 36%'] as [number,number,string])),
      ...[-30].flatMap(lat => ([-70,-65,-60,-55,-50] as number[]).map(lng => [lat, lng, '100 40% 34%'] as [number,number,string])),
      ...[-35,-40].flatMap(lat => ([-72,-70,-65,-60] as number[]).map(lng => [lat, lng, '80 35% 36%'] as [number,number,string])),
      [-45, -70, '100 30% 34%'], [-45, -65, '100 30% 34%'],
      [-50, -70, '120 25% 32%'], [-55, -68, '120 25% 30%'],

      // ── Europe ──
      ...[70,65].flatMap(lat => ([10,15,20,25,30] as number[]).map(lng => [lat, lng, '200 20% 40%'] as [number,number,string])),
      ...[60].flatMap(lat => ([5,10,15,20,25,30,35,40] as number[]).map(lng => [lat, lng, '180 25% 38%'] as [number,number,string])),
      ...[55].flatMap(lat => ([-10,-5,0,5,10,15,20,25,30,35,40] as number[]).map(lng => [lat, lng, '160 30% 40%'] as [number,number,string])),
      ...[50].flatMap(lat => ([-10,-5,0,5,10,15,20,25,30,35,40,45] as number[]).map(lng => [lat, lng, '140 30% 42%'] as [number,number,string])),
      ...[45].flatMap(lat => ([-10,-5,0,5,10,15,20,25,30,35,40] as number[]).map(lng => [lat, lng, '100 35% 44%'] as [number,number,string])),
      ...[40].flatMap(lat => ([-10,-5,0,5,10,15,20,25,30] as number[]).map(lng => [lat, lng, '50 40% 45%'] as [number,number,string])),
      // UK / Ireland
      [55, -5, '160 35% 38%'], [50, -5, '140 35% 40%'],
      // Scandinavia
      ...[65,60].flatMap(lat => ([10,15,20] as number[]).map(lng => [lat, lng, '200 25% 36%'] as [number,number,string])),
      // Iceland
      [65, -20, '200 20% 35%'],

      // ── Africa ──
      ...[35,30].flatMap(lat => ([-5,0,5,10] as number[]).map(lng => [lat, lng, '40 55% 50%'] as [number,number,string])),
      ...[25,20].flatMap(lat => ([-15,-10,-5,0,5,10,15,20,25,30,35] as number[]).map(lng => [lat, lng, '45 60% 55%'] as [number,number,string])),
      ...[15].flatMap(lat => ([-15,-10,-5,0,5,10,15,20,25,30,35,40] as number[]).map(lng => [lat, lng, '35 55% 48%'] as [number,number,string])),
      ...[10].flatMap(lat => ([-15,-10,-5,0,5,10,15,20,25,30,35,40,45] as number[]).map(lng => [lat, lng, '100 50% 40%'] as [number,number,string])),
      ...[5].flatMap(lat => ([-10,-5,0,5,10,15,20,25,30,35,40,45] as number[]).map(lng => [lat, lng, '120 55% 38%'] as [number,number,string])),
      ...[0].flatMap(lat => ([10,15,20,25,30,35,40] as number[]).map(lng => [lat, lng, '130 55% 36%'] as [number,number,string])),
      ...[-5].flatMap(lat => ([15,20,25,30,35,40] as number[]).map(lng => [lat, lng, '120 50% 38%'] as [number,number,string])),
      ...[-10].flatMap(lat => ([20,25,30,35,40] as number[]).map(lng => [lat, lng, '90 45% 40%'] as [number,number,string])),
      ...[-15].flatMap(lat => ([20,25,30,35,40] as number[]).map(lng => [lat, lng, '80 40% 38%'] as [number,number,string])),
      ...[-20].flatMap(lat => ([25,30,35] as number[]).map(lng => [lat, lng, '60 45% 42%'] as [number,number,string])),
      ...[-25].flatMap(lat => ([25,30,35] as number[]).map(lng => [lat, lng, '50 40% 40%'] as [number,number,string])),
      ...[-30].flatMap(lat => ([25,30] as number[]).map(lng => [lat, lng, '80 35% 38%'] as [number,number,string])),
      [-35, 25, '100 30% 36%'],
      // Madagascar
      ...[-15,-20,-25].map(lat => [lat, 48, '110 50% 40%'] as [number,number,string]),

      // ── Asia ──
      // Russia / Siberia
      ...[65,60].flatMap(lat => ([50,60,70,80,90,100,110,120,130,140,150,160,170] as number[]).map(lng => [lat, lng, '170 20% 35%'] as [number,number,string])),
      ...[55].flatMap(lat => ([45,50,55,60,65,70,75,80,85,90,95,100,105,110,115,120,125,130,135,140] as number[]).map(lng => [lat, lng, '160 25% 38%'] as [number,number,string])),
      // Middle East
      ...[35,30].flatMap(lat => ([35,40,45,50,55] as number[]).map(lng => [lat, lng, '40 50% 48%'] as [number,number,string])),
      [25, 45, '45 55% 52%'], [25, 50, '45 55% 52%'], [25, 55, '45 55% 52%'],
      // India
      ...[30,25].flatMap(lat => ([70,75,80,85,90] as number[]).map(lng => [lat, lng, '80 45% 42%'] as [number,number,string])),
      ...[20].flatMap(lat => ([72,75,78,80,82,85,88] as number[]).map(lng => [lat, lng, '100 50% 40%'] as [number,number,string])),
      ...[15].flatMap(lat => ([75,78,80,82] as number[]).map(lng => [lat, lng, '120 50% 38%'] as [number,number,string])),
      [10, 78, '130 55% 38%'], [10, 80, '130 55% 38%'],
      // Sri Lanka
      [8, 80, '130 50% 40%'],
      // China
      ...[45,40].flatMap(lat => ([80,85,90,95,100,105,110,115,120] as number[]).map(lng => [lat, lng, '80 35% 40%'] as [number,number,string])),
      ...[35].flatMap(lat => ([75,80,85,90,95,100,105,110,115,120] as number[]).map(lng => [lat, lng, '90 40% 42%'] as [number,number,string])),
      ...[30].flatMap(lat => ([90,95,100,105,110,115,120] as number[]).map(lng => [lat, lng, '100 42% 40%'] as [number,number,string])),
      ...[25].flatMap(lat => ([98,100,105,110,115] as number[]).map(lng => [lat, lng, '110 45% 38%'] as [number,number,string])),
      // Southeast Asia
      ...[20,15,10].flatMap(lat => ([100,105,110] as number[]).map(lng => [lat, lng, '130 55% 40%'] as [number,number,string])),
      [5, 105, '130 55% 38%'], [0, 105, '130 50% 36%'], [0, 110, '130 50% 36%'],
      // Japan
      [45, 140, '142 40% 38%'], [45, 145, '142 40% 38%'],
      [40, 140, '142 45% 40%'], [40, 145, '142 45% 40%'],
      [35, 135, '100 40% 42%'], [35, 140, '100 40% 42%'],
      [30, 130, '100 45% 40%'],
      // Korea
      [35, 128, '120 40% 40%'], [40, 127, '120 40% 40%'],
      // Philippines
      ...[15,10].flatMap(lat => ([120,125] as number[]).map(lng => [lat, lng, '130 50% 40%'] as [number,number,string])),
      // Indonesia
      ...[-5,0].flatMap(lat => ([100,105,110,115,120,125,130,135,140] as number[]).map(lng => [lat, lng, '120 50% 36%'] as [number,number,string])),

      // ── Australia ──
      ...[-15].flatMap(lat => ([125,130,135,140,145] as number[]).map(lng => [lat, lng, '30 50% 48%'] as [number,number,string])),
      ...[-20].flatMap(lat => ([115,120,125,130,135,140,145,150] as number[]).map(lng => [lat, lng, '25 55% 50%'] as [number,number,string])),
      ...[-25].flatMap(lat => ([115,120,125,130,135,140,145,150,153] as number[]).map(lng => [lat, lng, '35 50% 48%'] as [number,number,string])),
      ...[-30].flatMap(lat => ([115,120,125,130,135,140,145,150,153] as number[]).map(lng => [lat, lng, '30 45% 46%'] as [number,number,string])),
      ...[-35].flatMap(lat => ([117,120,135,140,145,150] as number[]).map(lng => [lat, lng, '60 40% 42%'] as [number,number,string])),
      [-38, 145, '80 35% 40%'], [-38, 148, '80 35% 40%'],
      // New Zealand
      [-38, 175, '130 45% 38%'], [-42, 172, '130 45% 38%'], [-45, 170, '130 45% 38%'],

      // ── Greenland ──
      ...[70,75].flatMap(lat => ([-50,-45,-40,-35,-30] as number[]).map(lng => [lat, lng, '200 15% 45%'] as [number,number,string])),
      ...[65].flatMap(lat => ([-52,-48,-45,-42,-38] as number[]).map(lng => [lat, lng, '200 15% 42%'] as [number,number,string])),
      [60, -45, '200 15% 40%'],

      // ── Antarctica (subtle) ──
      ...[-70,-75].flatMap(lat => ([-60,-30,0,30,60,90,120,150] as number[]).map(lng => [lat, lng, '210 10% 55%'] as [number,number,string])),
    ];

    // Ocean dots for depth (sparse)
    const oceanDots: [number, number][] = [];
    for (let lat = -60; lat <= 60; lat += 15) {
      for (let lng = -180; lng <= 180; lng += 20) {
        if (!land.some(([la, ln]) => Math.abs(la - lat) < 6 && Math.abs(ln - lng) < 6)) {
          oceanDots.push([lat, lng]);
        }
      }
    }

    const elements: JSX.Element[] = [];

    // Render ocean texture
    oceanDots.forEach(([lat, lng], i) => {
      const pos = latLngToPosition(lat, lng, rotY, rotX, radius);
      if (!pos.visible || pos.scale < 0.4) return;
      const size = 3 * pos.scale;
      elements.push(
        <rect
          key={`ocean-${i}`}
          x={pos.x + globeSize / 2 - size / 2}
          y={pos.y + globeSize / 2 - size / 2}
          width={size}
          height={size}
          fill={`hsl(211 60% 25% / ${0.06 + pos.scale * 0.04})`}
        />
      );
    });

    // Render land
    land.forEach(([lat, lng, color], i) => {
      const pos = latLngToPosition(lat, lng, rotY, rotX, radius);
      if (!pos.visible || pos.scale < 0.4) return;
      const size = 5 * pos.scale;
      elements.push(
        <rect
          key={`land-${i}`}
          x={pos.x + globeSize / 2 - size / 2}
          y={pos.y + globeSize / 2 - size / 2}
          width={size}
          height={size}
          fill={`hsl(${color} / ${0.25 + pos.scale * 0.35})`}
        />
      );
    });

    return elements;
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
            radial-gradient(circle at 38% 35%, hsl(211 50% 28% / 0.6) 0%, transparent 50%),
            radial-gradient(circle at 65% 70%, hsl(211 30% 12% / 0.5) 0%, transparent 50%),
            radial-gradient(circle, hsl(211 40% 18%) 0%, hsl(220 30% 8%) 100%)
          `,
          boxShadow: `
            inset -30px -30px 60px hsl(0 0% 0% / 0.5),
            inset 15px 15px 30px hsl(211 50% 35% / 0.12),
            0 0 60px hsl(211 60% 40% / 0.08),
            0 0 120px hsl(211 50% 30% / 0.04)
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
