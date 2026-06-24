import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_TYPES, PokeType, getDefensiveChart, multiplierColor, multiplierLabel } from '@/lib/typeChart';
import { TYPE_COLORS, capitalize } from '@/lib/pokemon';

export default function InteractiveTypeWheel() {
  const [selectedTypes, setSelectedTypes] = useState<PokeType[]>(['normal']);
  const [hoveredType, setHoveredType] = useState<PokeType | null>(null);

  const toggleType = (t: PokeType) => {
    setSelectedTypes(prev => {
      if (prev.includes(t)) {
        if (prev.length === 1) return prev; // Must have at least 1
        return prev.filter(x => x !== t);
      }
      if (prev.length >= 2) return [prev[1], t];
      return [...prev, t];
    });
  };

  const chart = useMemo(() => getDefensiveChart(selectedTypes), [selectedTypes]);

  // Radius for the radar
  const RADIUS = 140;

  return (
    <div className="flex flex-col items-center p-6 glass-strong rounded-3xl border border-white/5 relative overflow-hidden w-full max-w-xl mx-auto mt-8">
      <div className="absolute inset-0 bg-gradient-to-b from-poke-blue/5 to-transparent pointer-events-none" />
      <div className="absolute inset-0 pixel-grid opacity-[0.03] pointer-events-none" />

      <h2 className="font-pixel text-sm text-center mb-2 neon-text-blue">TYPE MATCHUP RADAR</h2>
      <p className="text-[10px] text-muted-foreground text-center mb-8 uppercase tracking-widest">Select 1 or 2 types to view defensive weaknesses</p>

      {/* Selected Types Center */}
      <div className="flex gap-3 mb-4 relative z-20 h-10">
        <AnimatePresence mode="popLayout">
          {selectedTypes.map(t => (
            <motion.div 
              key={t}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => toggleType(t)}
              className="px-4 py-1.5 rounded-full font-pixel text-[10px] cursor-pointer flex items-center justify-center transition-transform hover:scale-110"
              style={{ 
                color: `hsl(${TYPE_COLORS[t]})`, 
                backgroundColor: `hsl(${TYPE_COLORS[t]} / 0.15)`,
                border: `1px solid hsl(${TYPE_COLORS[t]})`,
                boxShadow: `0 0 15px hsl(${TYPE_COLORS[t]} / 0.3)`
              }}
            >
              {t.toUpperCase()}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="relative w-[340px] h-[340px] flex items-center justify-center mb-4">
        {/* Radar Rings */}
        {[0.3, 0.6, 1].map(scale => (
          <div 
            key={scale}
            className="absolute rounded-full border border-white/5 pointer-events-none"
            style={{
              width: RADIUS * 2 * scale,
              height: RADIUS * 2 * scale,
            }}
          />
        ))}

        {/* Radar Sweep Animation */}
        <motion.div 
          className="absolute rounded-full pointer-events-none"
          style={{
            width: RADIUS * 2,
            height: RADIUS * 2,
            background: 'conic-gradient(from 0deg, transparent 70%, rgba(59, 130, 246, 0.1) 100%)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />

        {/* Connecting SVG Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="-170 -170 340 340">
          {ALL_TYPES.map((t, i) => {
            const angle = (i / ALL_TYPES.length) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * (RADIUS - 20);
            const y = Math.sin(angle) * (RADIUS - 20);
            const mult = chart[t];
            
            if (mult === 1) return null; // Only draw lines for non-neutral
            
            const mColor = multiplierColor(mult);
            const isWeak = mult > 1;
            
            return (
              <motion.line
                key={`${selectedTypes.join('-')}-${t}`}
                x1={0} y1={0} x2={x} y2={y}
                stroke={mColor}
                strokeWidth={isWeak ? 2 : 1}
                strokeDasharray={mult < 1 ? '4 4' : 'none'}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: isWeak ? 0.8 : 0.3 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {ALL_TYPES.map((t, i) => {
          const angle = (i / ALL_TYPES.length) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * RADIUS;
          const y = Math.sin(angle) * RADIUS;
          
          const mult = chart[t];
          const isNeutral = mult === 1;
          const mColor = multiplierColor(mult);
          const typeColor = TYPE_COLORS[t];
          const isSelected = selectedTypes.includes(t);
          const isHovered = hoveredType === t;

          return (
            <motion.div
              key={t}
              className="absolute flex flex-col items-center justify-center cursor-pointer z-10 group"
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{ x, y, opacity: 1 }}
              transition={{ delay: i * 0.03, type: 'spring', damping: 15 }}
              onMouseEnter={() => setHoveredType(t)}
              onMouseLeave={() => setHoveredType(null)}
              onClick={() => toggleType(t)}
              style={{
                width: 44,
                height: 44,
                marginLeft: -22,
                marginTop: -22,
              }}
            >
              <div 
                className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-300 ${isSelected ? 'scale-110' : 'hover:scale-110'}`}
                style={{
                  background: isSelected ? `hsl(${typeColor})` : `hsl(${typeColor} / 0.1)`,
                  border: `2px solid hsl(${typeColor})`,
                  boxShadow: isSelected || !isNeutral ? `0 0 10px hsl(${typeColor} / 0.5)` : 'none',
                }}
              >
                {/* Multiplier Badge */}
                <AnimatePresence>
                  {!isNeutral && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-2 -right-2 rounded-full w-5 h-5 flex items-center justify-center z-20 shadow-lg"
                      style={{ background: mColor }}
                    >
                      <span className="font-pixel text-[6px] text-white" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.5)' }}>
                        {multiplierLabel(mult)}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <span className={`font-pixel text-[7px] tracking-wider ${isSelected ? 'text-white' : 'text-foreground'}`} style={{ textShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.8)' : 'none' }}>
                  {t.slice(0, 3).toUpperCase()}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
