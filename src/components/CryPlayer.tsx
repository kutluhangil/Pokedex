import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';

interface CryPlayerProps {
  pokemonId: number;
  isLegendary?: boolean;
}

const getCryUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;

const CryPlayer = ({ pokemonId, isLegendary = false }: CryPlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    if (playing) return;
    const audio = new Audio(getCryUrl(pokemonId));
    audio.volume = 0.4;
    audioRef.current = audio;
    setPlaying(true);
    audio.play().catch(() => setPlaying(false));
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
  }, [pokemonId, playing]);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={play}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg glass text-xs transition-colors ${
        playing ? 'text-poke-yellow' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <Volume2 className="w-4 h-4" />
      {/* Sound wave bars */}
      <div className="flex items-center gap-0.5 h-4">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className={`w-0.5 rounded-full ${playing ? 'bg-poke-yellow' : 'bg-muted-foreground/40'}`}
            animate={playing ? {
              height: [4, 12 + i * 2, 4],
            } : { height: 4 }}
            transition={playing ? {
              duration: 0.4,
              repeat: Infinity,
              delay: i * 0.1,
            } : {}}
            style={{ height: 4 }}
          />
        ))}
      </div>
      <span className="font-pixel text-[8px]">CRY</span>
      {/* Legendary glow pulse */}
      {playing && isLegendary && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={{
            boxShadow: ['0 0 10px hsl(48 100% 52% / 0.2)', '0 0 25px hsl(48 100% 52% / 0.4)', '0 0 10px hsl(48 100% 52% / 0.2)'],
          }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
};

export default CryPlayer;
