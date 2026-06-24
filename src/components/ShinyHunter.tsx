import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { Pokemon, getPixelSprite, capitalize } from '@/lib/pokemon';
import { fetchPokemon } from '@/lib/api';
import useWindowSize from 'react-use/lib/useWindowSize';
import Confetti from 'react-confetti';

const SHINY_ODDS = 50; // 1 in 50 chance for mini-game
const GRID_SIZE = 16; // 4x4 grid

export default function ShinyHunter() {
  const [loading, setLoading] = useState(false);
  const [encounter, setEncounter] = useState<{ pokemon: Pokemon; isShiny: boolean } | null>(null);
  const [rustlingIndex, setRustlingIndex] = useState<number | null>(null);
  const [caughtShinies, setCaughtShinies] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('pokedex-shinies') || '[]');
    } catch {
      return [];
    }
  });
  
  const { width, height } = useWindowSize();

  const handleGrassClick = useCallback(async (index: number) => {
    if (loading || encounter) return;
    setRustlingIndex(index);
    setLoading(true);

    // 40% chance of encounter
    const hasEncounter = Math.random() < 0.4;
    
    await new Promise(r => setTimeout(r, 600)); // Rustle animation time

    if (!hasEncounter) {
      setRustlingIndex(null);
      setLoading(false);
      return;
    }

    try {
      const targetId = Math.floor(Math.random() * 1025) + 1;
      const pokemon = await fetchPokemon(targetId);
      const isShiny = Math.floor(Math.random() * SHINY_ODDS) === 0;
      
      setEncounter({ pokemon, isShiny });
      
      if (isShiny) {
        setCaughtShinies(prev => {
          if (prev.includes(pokemon.id)) return prev;
          const next = [...prev, pokemon.id];
          localStorage.setItem('pokedex-shinies', JSON.stringify(next));
          return next;
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRustlingIndex(null);
      setLoading(false);
    }
  }, [loading, encounter]);

  const closeEncounter = () => setEncounter(null);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-6">
        <div>
          <h2 className="font-pixel text-lg md:text-xl text-poke-yellow text-glow-yellow flex items-center gap-2">
            SHINY SAFARI <Sparkles className="w-5 h-5" />
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Tap the tall grass! Shiny odds: 1/{SHINY_ODDS}</p>
        </div>
        <div className="glass rounded-xl px-3 py-1.5 flex items-center gap-2 border-poke-yellow/30">
          <span className="font-pixel text-[8px] text-muted-foreground">SHINIES</span>
          <span className="font-pixel text-sm text-poke-yellow">{caughtShinies.length}</span>
        </div>
      </div>

      <div className="relative w-full max-w-sm aspect-square bg-green-900/20 rounded-2xl p-4 border-2 border-dashed border-green-500/20">
        <div className="absolute inset-0 pixel-grid opacity-10 pointer-events-none" />
        
        <div className="grid grid-cols-4 gap-3 w-full h-full relative z-10">
          {Array.from({ length: GRID_SIZE }).map((_, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading || !!encounter}
              onClick={() => handleGrassClick(i)}
              animate={rustlingIndex === i ? {
                x: [-2, 2, -2, 2, 0],
                rotate: [-5, 5, -5, 5, 0]
              } : {}}
              transition={{ duration: 0.4 }}
              className="glass rounded-lg flex items-center justify-center border-green-500/30 hover:bg-green-500/20 relative overflow-hidden group"
            >
              {/* Tall grass blades */}
              <div className="w-8 h-12 flex items-end gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="w-2 h-8 bg-green-500/60 rounded-t-full transform -skew-x-12" />
                <div className="w-2.5 h-10 bg-green-400/80 rounded-t-full z-10" />
                <div className="w-2 h-7 bg-green-500/60 rounded-t-full transform skew-x-12" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Encounter Modal */}
      <AnimatePresence>
        {encounter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={closeEncounter} />
            
            {encounter.isShiny && (
              <Confetti width={width} height={height} recycle={false} numberOfPieces={300} colors={['#FFD700', '#FFA500', '#FFF']} />
            )}

            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className={`relative max-w-sm w-full p-6 rounded-3xl glass-strong flex flex-col items-center ${
                encounter.isShiny ? 'border-2 border-poke-yellow shadow-[0_0_50px_rgba(250,204,21,0.4)]' : ''
              }`}
            >
              <button onClick={closeEncounter} className="absolute top-4 right-4 p-2 rounded-lg glass hover:bg-muted/30">
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-pixel text-[10px] text-muted-foreground mb-6">A WILD POKÉMON APPEARED!</h3>
              
              <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                {encounter.isShiny && (
                  <>
                    <div className="absolute inset-0 bg-poke-yellow/20 rounded-full blur-xl animate-pulse" />
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 border-2 border-dashed border-poke-yellow/50 rounded-full"
                    />
                  </>
                )}
                <img
                  src={encounter.isShiny ? (encounter.pokemon.sprites.front_shiny || getPixelSprite(encounter.pokemon)) : getPixelSprite(encounter.pokemon)}
                  alt={encounter.pokemon.name}
                  className="w-32 h-32 object-contain relative z-10 pixelated drop-shadow-xl"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              <div className="text-center">
                <h2 className="font-pixel text-xl mb-2 flex items-center justify-center gap-2">
                  {capitalize(encounter.pokemon.name)}
                  {encounter.isShiny && <Sparkles className="w-5 h-5 text-poke-yellow fill-poke-yellow" />}
                </h2>
                {encounter.isShiny ? (
                  <p className="text-sm text-poke-yellow font-bold">Incredible! It's a Shiny!</p>
                ) : (
                  <p className="text-sm text-muted-foreground">It got away safely...</p>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={closeEncounter}
                className={`mt-8 w-full py-3 rounded-xl font-pixel text-[10px] ${
                  encounter.isShiny 
                    ? 'bg-poke-yellow text-black hover:bg-poke-yellow/90' 
                    : 'glass hover:bg-muted/30 text-foreground'
                }`}
              >
                {encounter.isShiny ? 'COLLECT SHINY' : 'CONTINUE HUNTING'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
