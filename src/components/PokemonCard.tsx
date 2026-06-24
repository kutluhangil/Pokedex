import { motion } from 'framer-motion';
import { Pokemon, TYPE_COLORS, getPixelSprite, formatPokemonId, capitalize } from '@/lib/pokemon';
import { Heart, Plus, Check } from 'lucide-react';

interface PokemonCardProps {
  pokemon: Pokemon;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  index?: number;
  isInCompare?: boolean;
  onToggleCompare?: () => void;
  forceShiny?: boolean;
}

const PokemonCard = ({
  pokemon,
  onClick,
  isFavorite,
  onToggleFavorite,
  index = 0,
  isInCompare = false,
  onToggleCompare,
  forceShiny = false,
}: PokemonCardProps) => {
  const mainType = pokemon.types[0]?.type.name || 'normal';
  const typeColor = TYPE_COLORS[mainType] || TYPE_COLORS.normal;
  const sprite = forceShiny ? (pokemon.sprites.front_shiny || getPixelSprite(pokemon)) : getPixelSprite(pokemon);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative cursor-pointer group"
    >
      <div
        className={`relative w-full h-full flex flex-col rounded-2xl overflow-hidden glass ${forceShiny ? 'border-2 border-poke-yellow shadow-[0_0_20px_rgba(250,204,21,0.2)]' : ''}`}
        style={{
          boxShadow: forceShiny ? undefined : `0 0 12px hsl(${typeColor} / 0.1), 0 4px 20px hsl(0 0% 0% / 0.3)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, hsl(${typeColor} / 0.5), transparent 70%)`,
          }}
        />

        {/* Top action buttons */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="p-1.5 rounded-lg glass"
            aria-label="Favorite"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${isFavorite ? 'fill-poke-red text-poke-red' : 'text-muted-foreground'}`}
            />
          </button>
          {onToggleCompare && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCompare(); }}
              className={`p-1.5 rounded-lg glass transition-colors ${
                isInCompare ? 'border border-poke-blue/60 text-poke-blue' : 'text-muted-foreground hover:text-poke-blue'
              }`}
              aria-label="Compare"
              title="Add to compare"
            >
              {isInCompare ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        <span className="absolute top-3 left-3 font-pixel text-[7px] text-muted-foreground">
          {formatPokemonId(pokemon.id)}
        </span>

        <div className="flex-1 flex items-center justify-center pt-8 pb-2 min-h-[120px] md:min-h-[140px]">
          <motion.img
            src={sprite}
            alt={pokemon.name}
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain"
            style={{ 
              imageRendering: 'pixelated',
              filter: `drop-shadow(0 4px 12px hsl(${typeColor} / 0.5))`
            }}
            whileHover={{ scale: 1.08 }}
            loading="lazy"
          />
        </div>

        <div className="px-3 md:px-4 pb-3 md:pb-4 mt-auto">
          <h3 className="font-pixel text-[9px] md:text-[10px] text-foreground mb-2 truncate">
            {capitalize(pokemon.name)}
          </h3>
          <div className="flex gap-1.5">
            {pokemon.types.map(t => (
              <span
                key={t.type.name}
                className="px-1.5 sm:px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-medium truncate"
                style={{
                  background: `hsl(${TYPE_COLORS[t.type.name] || TYPE_COLORS.normal} / 0.15)`,
                  color: `hsl(${TYPE_COLORS[t.type.name] || TYPE_COLORS.normal})`,
                  border: `1px solid hsl(${TYPE_COLORS[t.type.name] || TYPE_COLORS.normal} / 0.2)`,
                }}
              >
                {capitalize(t.type.name)}
              </span>
            ))}
          </div>
        </div>

        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            border: `1px solid hsl(${typeColor} / 0.35)`,
            boxShadow: `inset 0 0 16px hsl(${typeColor} / 0.15), 0 0 24px hsl(${typeColor} / 0.25)`,
          }}
        />
      </div>
    </motion.div>
  );
};

export default PokemonCard;
