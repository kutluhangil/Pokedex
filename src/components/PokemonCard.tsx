import { motion } from 'framer-motion';
import { Pokemon, TYPE_COLORS, getPixelSprite, formatPokemonId, capitalize } from '@/lib/pokemon';
import { Heart } from 'lucide-react';

interface PokemonCardProps {
  pokemon: Pokemon;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  index?: number;
}

const PokemonCard = ({ pokemon, onClick, isFavorite, onToggleFavorite, index = 0 }: PokemonCardProps) => {
  const mainType = pokemon.types[0]?.type.name || 'normal';
  const typeColor = TYPE_COLORS[mainType] || TYPE_COLORS.normal;
  const sprite = getPixelSprite(pokemon);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ scale: 1.05, y: -8 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative cursor-pointer group"
    >
      <div
        className="relative w-48 h-64 md:w-56 md:h-72 rounded-2xl overflow-hidden glass"
        style={{
          boxShadow: `0 0 20px hsl(${typeColor} / 0.2), 0 8px 32px hsl(0 0% 0% / 0.4)`,
        }}
      >
        {/* Type gradient background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, hsl(${typeColor} / 0.6), transparent 70%)`,
          }}
        />

        {/* Favorite button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full glass"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-poke-red text-poke-red' : 'text-muted-foreground'}`}
          />
        </button>

        {/* Pokemon ID */}
        <span className="absolute top-3 left-3 font-pixel text-[8px] text-muted-foreground">
          {formatPokemonId(pokemon.id)}
        </span>

        {/* Sprite */}
        <div className="flex items-center justify-center pt-8 pb-2 h-40 md:h-48">
          <motion.img
            src={sprite}
            alt={pokemon.name}
            className="w-24 h-24 md:w-28 md:h-28 object-contain image-rendering-pixelated drop-shadow-lg"
            style={{ imageRendering: 'pixelated' }}
            whileHover={{ scale: 1.1 }}
            loading="lazy"
          />
        </div>

        {/* Info */}
        <div className="px-4 pb-4">
          <h3 className="font-pixel text-[10px] md:text-xs text-foreground mb-2 truncate">
            {capitalize(pokemon.name)}
          </h3>
          <div className="flex gap-1.5">
            {pokemon.types.map(t => (
              <span
                key={t.type.name}
                className="px-2 py-0.5 rounded-full text-[9px] font-medium"
                style={{
                  background: `hsl(${TYPE_COLORS[t.type.name] || TYPE_COLORS.normal} / 0.25)`,
                  color: `hsl(${TYPE_COLORS[t.type.name] || TYPE_COLORS.normal})`,
                  border: `1px solid hsl(${TYPE_COLORS[t.type.name] || TYPE_COLORS.normal} / 0.3)`,
                }}
              >
                {capitalize(t.type.name)}
              </span>
            ))}
          </div>
        </div>

        {/* Hover glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            boxShadow: `inset 0 0 30px hsl(${typeColor} / 0.15), 0 0 30px hsl(${typeColor} / 0.15)`,
          }}
        />
      </div>
    </motion.div>
  );
};

export default PokemonCard;
