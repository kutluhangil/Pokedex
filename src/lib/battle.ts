import { Pokemon } from './pokemon';
import { TYPE_CHART, PokeType } from './typeChart';

export interface BattlePokemon {
  pokemon: Pokemon;
  hp: number;
  maxHp: number;
}

export interface BattleAttack {
  damage: number;
  multiplier: number;
  message: string;
  crit: boolean;
}

const statValue = (p: Pokemon, name: string): number => {
  return p.stats.find(s => s.stat.name === name)?.base_stat ?? 50;
};

export const computeMaxHp = (p: Pokemon): number => {
  // Approximation of in-game HP at level 50 with 0 IV/EV
  const base = statValue(p, 'hp');
  return Math.floor(((2 * base) * 50) / 100) + 50 + 10;
};

export const initBattlePokemon = (p: Pokemon): BattlePokemon => {
  const maxHp = computeMaxHp(p);
  return { pokemon: p, hp: maxHp, maxHp };
};

const typeMultiplier = (atkType: PokeType, defenderTypes: string[]): number => {
  let m = 1;
  for (const d of defenderTypes) {
    const v = TYPE_CHART[atkType]?.[d as PokeType];
    if (v !== undefined) m *= v;
  }
  return m;
};

/**
 * Compute an attack from attacker against defender.
 * Picks the attacker's most-effective STAB type (super-effective wins).
 */
export const computeAttack = (
  attacker: BattlePokemon,
  defender: BattlePokemon
): BattleAttack => {
  const attackerTypes = attacker.pokemon.types.map(t => t.type.name as PokeType);
  const defenderTypes = defender.pokemon.types.map(t => t.type.name);

  // Pick the most super-effective type
  let bestType: PokeType = attackerTypes[0];
  let bestMult = -1;
  for (const t of attackerTypes) {
    const m = typeMultiplier(t, defenderTypes);
    if (m > bestMult) { bestMult = m; bestType = t; }
  }

  // Damage formula (simplified Pokémon-style at L50, base 60 power)
  const power = 60;
  const level = 50;
  const A = statValue(attacker.pokemon, 'attack');
  const D = statValue(defender.pokemon, 'defense');
  const stab = 1.5; // bestType is always attacker's own type
  const crit = Math.random() < 0.0625;
  const critMult = crit ? 1.5 : 1;
  const random = 0.85 + Math.random() * 0.15;

  const base = ((((2 * level) / 5 + 2) * power * (A / D)) / 50 + 2);
  const damage = Math.max(1, Math.floor(base * stab * bestMult * critMult * random));

  let message: string;
  if (bestMult === 0)        message = "It had no effect…";
  else if (bestMult >= 2)    message = "It's super effective!";
  else if (bestMult >= 4)    message = "It's massively effective!";
  else if (bestMult <= 0.25) message = "It barely scratched…";
  else if (bestMult < 1)     message = "It wasn't very effective…";
  else                       message = `${capitalize(attacker.pokemon.name)} attacks!`;

  return { damage, multiplier: bestMult, message, crit };
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
