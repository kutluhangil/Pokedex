export interface Pokemon {
  id: number;
  name: string;
  types: PokemonType[];
  stats: PokemonStat[];
  height: number;
  weight: number;
  abilities: PokemonAbility[];
  sprites: PokemonSprites;
  species_url: string;
}

export interface PokemonType {
  slot: number;
  type: { name: string; url: string };
}

export interface PokemonStat {
  base_stat: number;
  stat: { name: string };
}

export interface PokemonAbility {
  ability: { name: string };
  is_hidden: boolean;
}

export interface PokemonSprites {
  front_default: string | null;
  front_shiny: string | null;
  other?: {
    'official-artwork'?: { front_default: string | null; front_shiny: string | null };
    showdown?: { front_default: string | null; front_shiny: string | null };
  };
  versions?: Record<string, Record<string, { front_default?: string | null; animated?: { front_default?: string | null } }>>;
}

export interface PokemonSpecies {
  flavor_text_entries: { flavor_text: string; language: { name: string } }[];
  genera: { genus: string; language: { name: string } }[];
  generation: { name: string };
  is_legendary: boolean;
  is_mythical: boolean;
  evolution_chain: { url: string };
}

export interface EvolutionChain {
  chain: EvolutionNode;
}

export interface EvolutionNode {
  species: { name: string; url: string };
  evolves_to: EvolutionNode[];
}

export const TYPE_COLORS: Record<string, string> = {
  normal: '40 10% 60%',
  fire: '15 90% 55%',
  water: '211 100% 50%',
  electric: '48 100% 52%',
  grass: '142 64% 45%',
  ice: '195 80% 65%',
  fighting: '1 70% 45%',
  poison: '280 60% 50%',
  ground: '35 50% 45%',
  flying: '240 60% 70%',
  psychic: '330 80% 60%',
  bug: '75 60% 45%',
  rock: '40 40% 40%',
  ghost: '265 40% 45%',
  dragon: '260 80% 55%',
  dark: '240 10% 25%',
  steel: '220 15% 60%',
  fairy: '330 60% 70%',
};

export const GENERATION_RANGES: Record<string, [number, number]> = {
  'Generation I': [1, 151],
  'Generation II': [152, 251],
  'Generation III': [252, 386],
  'Generation IV': [387, 493],
  'Generation V': [494, 649],
  'Generation VI': [650, 721],
  'Generation VII': [722, 809],
  'Generation VIII': [810, 905],
  'Generation IX': [906, 1025],
};

export function getPixelSprite(pokemon: Pokemon): string {
  // Try animated sprite first
  const animated = pokemon.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default;
  if (animated) return animated;
  // Fallback to showdown
  const showdown = pokemon.sprites?.other?.showdown?.front_default;
  if (showdown) return showdown;
  return pokemon.sprites.front_default || '';
}

export function getArtwork(pokemon: Pokemon): string {
  return pokemon.sprites?.other?.['official-artwork']?.front_default || pokemon.sprites.front_default || '';
}

export function formatPokemonId(id: number): string {
  return `#${String(id).padStart(4, '0')}`;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
