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
}

const PokemonCard = ({
  pokemon,
  onClick,
  isFavorite,
  onToggleFavorite,
  index = 0,
  isInCompare = false,
  onToggleCompare,
}: PokemonCardProps) => {
  const mainType = pokemon.types[0]?.type.name || 'normal';
  const typeColor = TYPE_COLORS[mainType] || TYPE_COLORS.normal;
  const sprite = getPixelSprite(pokemon);

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
        className="relative w-44 h-60 md:w-52 md:h-68 rounded-2xl overflow-hidden glass"
        style={{
          boxShadow: `0 0 12px hsl(${typeColor} / 0.1), 0 4px 20px hsl(0 0% 0% / 0.3)`,
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

        <div className="flex items-center justify-center pt-8 pb-2 h-40 md:h-44">
          <motion.img
            src={sprite}
            alt={pokemon.name}
            className="w-20 h-20 md:w-24 md:h-24 object-contain drop-shadow-md"
            style={{ imageRendering: 'pixelated' }}
            whileHover={{ scale: 1.08 }}
            loading="lazy"
          />
        </div>

        <div className="px-4 pb-4">
          <h3 className="font-pixel text-[9px] md:text-[10px] text-foreground mb-2 truncate">
            {capitalize(pokemon.name)}
          </h3>
          <div className="flex gap-1.5">
            {pokemon.types.map(t => (
              <span
                key={t.type.name}
                className="px-2 py-0.5 rounded-full text-[8px] font-medium"
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
            boxShadow: `inset 0 0 20px hsl(${typeColor} / 0.08), 0 0 20px hsl(${typeColor} / 0.08)`,
          }}
        />
      </div>
    </motion.div>
  );
};

export default PokemonCard;
