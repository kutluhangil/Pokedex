import { Pokemon } from './pokemon';
import { TYPE_CHART, PokeType } from './typeChart';

export interface Move {
  name: string;
  type: PokeType;
  power: number;
  accuracy: number;
  category: 'physical' | 'special';
}

export interface BattlePokemon {
  pokemon: Pokemon;
  hp: number;
  maxHp: number;
  moves: Move[];
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
  const base = statValue(p, 'hp');
  return Math.floor(((2 * base) * 50) / 100) + 50 + 10;
};

export const initBattlePokemon = (p: Pokemon): BattlePokemon => {
  const maxHp = computeMaxHp(p);
  return { pokemon: p, hp: maxHp, maxHp, moves: getPokemonMoves(p) };
};

const typeMultiplier = (atkType: PokeType, defenderTypes: string[]): number => {
  let m = 1;
  for (const d of defenderTypes) {
    const v = TYPE_CHART[atkType]?.[d as PokeType];
    if (v !== undefined) m *= v;
  }
  return m;
};

export const computeAttack = (
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: Move
): BattleAttack => {
  const defenderTypes = defender.pokemon.types.map(t => t.type.name);
  const mult = typeMultiplier(move.type, defenderTypes);

  const level = 50;
  let A = 50;
  let D = 50;

  if (move.category === 'physical') {
    A = statValue(attacker.pokemon, 'attack');
    D = statValue(defender.pokemon, 'defense');
  } else {
    A = statValue(attacker.pokemon, 'special-attack');
    D = statValue(defender.pokemon, 'special-defense');
  }

  // STAB: Same Type Attack Bonus (1.5x if move type matches attacker's type)
  const attackerTypes = attacker.pokemon.types.map(t => t.type.name);
  const stab = attackerTypes.includes(move.type) ? 1.5 : 1.0;

  const crit = Math.random() < 0.0625;
  const critMult = crit ? 1.5 : 1;
  const random = 0.85 + Math.random() * 0.15;

  const base = ((((2 * level) / 5 + 2) * move.power * (A / D)) / 50 + 2);
  const damage = Math.max(1, Math.floor(base * stab * mult * critMult * random));

  let message: string;
  if (mult === 0)        message = "It had no effect…";
  else if (mult >= 2)    message = "It's super effective!";
  else if (mult >= 4)    message = "It's massively effective!";
  else if (mult <= 0.25) message = "It barely scratched…";
  else if (mult < 1)     message = "It wasn't very effective…";
  else                       message = `${capitalize(attacker.pokemon.name)} used ${move.name}!`;

  return { damage, multiplier: mult, message, crit };
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Let's create a database of moves by type
export const MOVES_BY_TYPE: Record<PokeType, Move[]> = {
  normal: [
    { name: 'Tackle', type: 'normal', power: 40, accuracy: 100, category: 'physical' },
    { name: 'Slash', type: 'normal', power: 70, accuracy: 100, category: 'physical' },
    { name: 'Body Slam', type: 'normal', power: 85, accuracy: 100, category: 'physical' },
    { name: 'Hyper Beam', type: 'normal', power: 150, accuracy: 90, category: 'special' }
  ],
  fire: [
    { name: 'Ember', type: 'fire', power: 40, accuracy: 100, category: 'special' },
    { name: 'Flame Wheel', type: 'fire', power: 60, accuracy: 100, category: 'physical' },
    { name: 'Flamethrower', type: 'fire', power: 90, accuracy: 100, category: 'special' },
    { name: 'Fire Blast', type: 'fire', power: 110, accuracy: 85, category: 'special' }
  ],
  water: [
    { name: 'Water Gun', type: 'water', power: 40, accuracy: 100, category: 'special' },
    { name: 'Aqua Jet', type: 'water', power: 40, accuracy: 100, category: 'physical' },
    { name: 'Surf', type: 'water', power: 90, accuracy: 100, category: 'special' },
    { name: 'Hydro Pump', type: 'water', power: 110, accuracy: 80, category: 'special' }
  ],
  grass: [
    { name: 'Vine Whip', type: 'grass', power: 45, accuracy: 100, category: 'physical' },
    { name: 'Mega Drain', type: 'grass', power: 40, accuracy: 100, category: 'special' },
    { name: 'Seed Bomb', type: 'grass', power: 80, accuracy: 100, category: 'physical' },
    { name: 'Solar Beam', type: 'grass', power: 120, accuracy: 100, category: 'special' }
  ],
  electric: [
    { name: 'Thunder Shock', type: 'electric', power: 40, accuracy: 100, category: 'special' },
    { name: 'Spark', type: 'electric', power: 65, accuracy: 100, category: 'physical' },
    { name: 'Thunderbolt', type: 'electric', power: 90, accuracy: 100, category: 'special' },
    { name: 'Thunder', type: 'electric', power: 110, accuracy: 70, category: 'special' }
  ],
  ice: [
    { name: 'Powder Snow', type: 'ice', power: 40, accuracy: 100, category: 'special' },
    { name: 'Ice Shard', type: 'ice', power: 40, accuracy: 100, category: 'physical' },
    { name: 'Ice Beam', type: 'ice', power: 90, accuracy: 100, category: 'special' },
    { name: 'Blizzard', type: 'ice', power: 110, accuracy: 70, category: 'special' }
  ],
  fighting: [
    { name: 'Karate Chop', type: 'fighting', power: 50, accuracy: 100, category: 'physical' },
    { name: 'Mach Punch', type: 'fighting', power: 40, accuracy: 100, category: 'physical' },
    { name: 'Brick Break', type: 'fighting', power: 75, accuracy: 100, category: 'physical' },
    { name: 'Close Combat', type: 'fighting', power: 120, accuracy: 100, category: 'physical' }
  ],
  poison: [
    { name: 'Poison Sting', type: 'poison', power: 15, accuracy: 100, category: 'physical' },
    { name: 'Acid', type: 'poison', power: 40, accuracy: 100, category: 'special' },
    { name: 'Sludge Bomb', type: 'poison', power: 90, accuracy: 100, category: 'special' },
    { name: 'Gunk Shot', type: 'poison', power: 120, accuracy: 80, category: 'physical' }
  ],
  ground: [
    { name: 'Mud-Slap', type: 'ground', power: 20, accuracy: 100, category: 'special' },
    { name: 'Bulldoze', type: 'ground', power: 60, accuracy: 100, category: 'physical' },
    { name: 'Dig', type: 'ground', power: 80, accuracy: 100, category: 'physical' },
    { name: 'Earthquake', type: 'ground', power: 100, accuracy: 100, category: 'physical' }
  ],
  flying: [
    { name: 'Gust', type: 'flying', power: 40, accuracy: 100, category: 'special' },
    { name: 'Wing Attack', type: 'flying', power: 60, accuracy: 100, category: 'physical' },
    { name: 'Air Slash', type: 'flying', power: 75, accuracy: 95, category: 'special' },
    { name: 'Hurricane', type: 'flying', power: 110, accuracy: 70, category: 'special' }
  ],
  psychic: [
    { name: 'Confusion', type: 'psychic', power: 50, accuracy: 100, category: 'special' },
    { name: 'Psybeam', type: 'psychic', power: 65, accuracy: 100, category: 'special' },
    { name: 'Psychic', type: 'psychic', power: 90, accuracy: 100, category: 'special' },
    { name: 'Psycho Boost', type: 'psychic', power: 140, accuracy: 90, category: 'special' }
  ],
  bug: [
    { name: 'Struggle Bug', type: 'bug', power: 50, accuracy: 100, category: 'special' },
    { name: 'Bug Bite', type: 'bug', power: 60, accuracy: 100, category: 'physical' },
    { name: 'X-Scissor', type: 'bug', power: 80, accuracy: 100, category: 'physical' },
    { name: 'Megahorn', type: 'bug', power: 120, accuracy: 85, category: 'physical' }
  ],
  rock: [
    { name: 'Rock Throw', type: 'rock', power: 50, accuracy: 90, category: 'physical' },
    { name: 'Rock Tomb', type: 'rock', power: 60, accuracy: 95, category: 'physical' },
    { name: 'Rock Slide', type: 'rock', power: 75, accuracy: 90, category: 'physical' },
    { name: 'Stone Edge', type: 'rock', power: 100, accuracy: 80, category: 'physical' }
  ],
  ghost: [
    { name: 'Lick', type: 'ghost', power: 30, accuracy: 100, category: 'physical' },
    { name: 'Shadow Sneak', type: 'ghost', power: 40, accuracy: 100, category: 'physical' },
    { name: 'Shadow Punch', type: 'ghost', power: 60, accuracy: 100, category: 'physical' },
    { name: 'Shadow Ball', type: 'ghost', power: 80, accuracy: 100, category: 'special' }
  ],
  dragon: [
    { name: 'Twister', type: 'dragon', power: 40, accuracy: 100, category: 'special' },
    { name: 'Dragon Claw', type: 'dragon', power: 80, accuracy: 100, category: 'physical' },
    { name: 'Dragon Pulse', type: 'dragon', power: 85, accuracy: 100, category: 'special' },
    { name: 'Outrage', type: 'dragon', power: 120, accuracy: 100, category: 'physical' }
  ],
  dark: [
    { name: 'Bite', type: 'dark', power: 60, accuracy: 100, category: 'physical' },
    { name: 'Faint Attack', type: 'dark', power: 60, accuracy: 100, category: 'physical' },
    { name: 'Dark Pulse', type: 'dark', power: 80, accuracy: 100, category: 'special' },
    { name: 'Crunch', type: 'dark', power: 80, accuracy: 100, category: 'physical' }
  ],
  steel: [
    { name: 'Metal Claw', type: 'steel', power: 50, accuracy: 95, category: 'physical' },
    { name: 'Bullet Punch', type: 'steel', power: 40, accuracy: 100, category: 'physical' },
    { name: 'Iron Head', type: 'steel', power: 80, accuracy: 100, category: 'physical' },
    { name: 'Meteor Mash', type: 'steel', power: 90, accuracy: 90, category: 'physical' }
  ],
  fairy: [
    { name: 'Fairy Wind', type: 'fairy', power: 40, accuracy: 100, category: 'special' },
    { name: 'Draining Kiss', type: 'fairy', power: 50, accuracy: 100, category: 'special' },
    { name: 'Dazzling Gleam', type: 'fairy', power: 80, accuracy: 100, category: 'special' },
    { name: 'Moonblast', type: 'fairy', power: 95, accuracy: 100, category: 'special' }
  ]
};

// Generates 4 moves for a Pokemon
export function getPokemonMoves(pokemon: Pokemon): Move[] {
  const types = pokemon.types.map(t => t.type.name as PokeType);
  const primary = types[0] || 'normal';
  const secondary = types[1];

  const moves: Move[] = [];

  // 1. Normal type move
  const normals = MOVES_BY_TYPE.normal;
  moves.push(normals[1] || normals[0]); // Slash or Tackle

  // 2. Primary type damage move (medium-high power)
  const primaryMoves = MOVES_BY_TYPE[primary] || MOVES_BY_TYPE.normal;
  moves.push(primaryMoves[2] || primaryMoves[0]); // e.g. Flamethrower/Surf/Thunderbolt

  // 3. Secondary type move (or signature/coverage move)
  if (secondary && MOVES_BY_TYPE[secondary]) {
    const secMoves = MOVES_BY_TYPE[secondary];
    moves.push(secMoves[2] || secMoves[0]); // e.g. Sludge Bomb / Hurricane
  } else {
    // Monotype: Give a low-power priority move or coverage move
    const primMoves = MOVES_BY_TYPE[primary] || MOVES_BY_TYPE.normal;
    moves.push(primMoves[0]); // e.g. Ember / Water Gun / Thundershock
  }

  // 4. High power signature/ultimate move
  const primaryUlt = MOVES_BY_TYPE[primary] || MOVES_BY_TYPE.normal;
  moves.push(primaryUlt[3] || primaryUlt[0]); // e.g. Fire Blast / Hydro Pump / Thunder

  // Ensure unique move names (just in case)
  const uniqueMoves: Move[] = [];
  const seenNames = new Set<string>();
  for (const m of moves) {
    if (!seenNames.has(m.name)) {
      seenNames.add(m.name);
      uniqueMoves.push(m);
    }
  }

  // If we don't have 4 moves, pad with normals
  while (uniqueMoves.length < 4) {
    const nextNormal = normals.find(n => !seenNames.has(n.name));
    if (nextNormal) {
      seenNames.add(nextNormal.name);
      uniqueMoves.push(nextNormal);
    } else {
      break;
    }
  }

  return uniqueMoves.slice(0, 4);
}
