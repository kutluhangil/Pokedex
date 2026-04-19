// Pokemon type effectiveness chart
// Defender row → Attacker columns. Value = damage multiplier when attacker hits defender.
// We represent it as: TYPE_CHART[attackerType][defenderType] = multiplier

export const ALL_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
] as const;

export type PokeType = typeof ALL_TYPES[number];

// Source: Bulbapedia type chart (Gen VI+)
export const TYPE_CHART: Record<PokeType, Partial<Record<PokeType, number>>> = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

/**
 * For a defender with given types, compute the multiplier each attacker type deals.
 * Returns map: attackerType -> multiplier (0, 0.25, 0.5, 1, 2, 4)
 */
export function getDefensiveChart(defenderTypes: string[]): Record<PokeType, number> {
  const result: Record<string, number> = {};
  for (const atk of ALL_TYPES) {
    let mult = 1;
    for (const def of defenderTypes) {
      const v = TYPE_CHART[atk]?.[def as PokeType];
      if (v !== undefined) mult *= v;
    }
    result[atk] = mult;
  }
  return result as Record<PokeType, number>;
}

/**
 * For an attacker with given types, compute its best offensive multiplier vs each defender type.
 * Used by Team Builder: "what types can my team hit super-effectively?"
 */
export function getOffensiveChart(attackerTypes: string[]): Record<PokeType, number> {
  const result: Record<string, number> = {};
  for (const def of ALL_TYPES) {
    let best = 1;
    for (const atk of attackerTypes) {
      const v = TYPE_CHART[atk as PokeType]?.[def] ?? 1;
      if (v > best) best = v;
    }
    result[def] = best;
  }
  return result as Record<PokeType, number>;
}

export function multiplierColor(m: number): string {
  if (m === 0) return 'hsl(0 0% 25%)';
  if (m === 0.25) return 'hsl(142 60% 30%)';
  if (m === 0.5) return 'hsl(142 55% 42%)';
  if (m === 1) return 'hsl(240 5% 22%)';
  if (m === 2) return 'hsl(15 85% 55%)';
  if (m === 4) return 'hsl(1 95% 55%)';
  return 'hsl(240 5% 22%)';
}

export function multiplierLabel(m: number): string {
  if (m === 0) return '0×';
  if (m === 0.25) return '¼×';
  if (m === 0.5) return '½×';
  if (m === 1) return '1×';
  if (m === 2) return '2×';
  if (m === 4) return '4×';
  return `${m}×`;
}
