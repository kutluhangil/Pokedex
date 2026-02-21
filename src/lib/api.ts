import { Pokemon, PokemonSpecies, EvolutionChain } from './pokemon';

const API_BASE = 'https://pokeapi.co/api/v2';
const cache = new Map<string, any>();

async function fetchCached<T>(url: string): Promise<T> {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  cache.set(url, data);
  return data;
}

export async function fetchPokemon(idOrName: number | string): Promise<Pokemon> {
  return fetchCached<Pokemon>(`${API_BASE}/pokemon/${idOrName}`);
}

export async function fetchPokemonList(offset = 0, limit = 20): Promise<{ name: string; url: string }[]> {
  const data = await fetchCached<{ results: { name: string; url: string }[] }>(
    `${API_BASE}/pokemon?offset=${offset}&limit=${limit}`
  );
  return data.results;
}

export async function fetchPokemonSpecies(idOrName: number | string): Promise<PokemonSpecies> {
  return fetchCached<PokemonSpecies>(`${API_BASE}/pokemon-species/${idOrName}`);
}

export async function fetchEvolutionChain(url: string): Promise<EvolutionChain> {
  return fetchCached<EvolutionChain>(url);
}

export async function fetchPokemonBatch(ids: number[]): Promise<Pokemon[]> {
  return Promise.all(ids.map(id => fetchPokemon(id)));
}

export async function searchPokemon(query: string): Promise<Pokemon | null> {
  try {
    return await fetchPokemon(query.toLowerCase().trim());
  } catch {
    return null;
  }
}
