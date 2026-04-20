import { useState, useEffect } from 'react';
import { Pokemon } from '@/lib/pokemon';
import { fetchPokemon } from '@/lib/api';

const STREAK_KEY = 'pokedex-daily-streak-v1';

interface StreakData {
  lastDate: string;       // YYYY-MM-DD of last visit
  streak: number;         // current consecutive-day streak
  longest: number;        // longest streak ever
  totalDays: number;      // total unique days visited
  badges: string[];       // earned badge IDs
}

const todayStr = () => new Date().toISOString().slice(0, 10);

const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

// Deterministic daily ID: based on YYYYMMDD, mapped into 1..1025
const dailyId = (): number => {
  const t = todayStr().replace(/-/g, '');
  const n = parseInt(t, 10);
  // Simple mulberry-style hash for variety
  let x = n ^ 0x9e3779b9;
  x = (x ^ (x >>> 15)) * 0x85ebca6b;
  x = (x ^ (x >>> 13)) * 0xc2b2ae35;
  x = x ^ (x >>> 16);
  const id = (Math.abs(x) % 1025) + 1;
  return id;
};

const BADGE_MILESTONES: { id: string; days: number; label: string; icon: string }[] = [
  { id: 'rookie', days: 1,  label: 'Rookie Trainer', icon: '🥚' },
  { id: 'novice', days: 3,  label: '3-Day Streak', icon: '⭐' },
  { id: 'reg',    days: 7,  label: 'Week Warrior', icon: '🔥' },
  { id: 'devo',   days: 14, label: '2-Week Devotee', icon: '💎' },
  { id: 'master', days: 30, label: 'Master Trainer', icon: '👑' },
  { id: 'legend', days: 100, label: 'Legendary', icon: '✨' },
];

const loadStreak = (): StreakData => {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { lastDate: '', streak: 0, longest: 0, totalDays: 0, badges: [] };
};

const computeNextStreak = (data: StreakData): StreakData => {
  const today = todayStr();
  if (data.lastDate === today) return data; // already counted today

  let streak: number;
  if (data.lastDate === yesterdayStr()) streak = data.streak + 1;
  else if (data.lastDate === '')         streak = 1;
  else                                    streak = 1; // missed a day, reset

  const totalDays = data.totalDays + 1;
  const longest = Math.max(data.longest, streak);

  // Award badges for milestones reached by streak OR totalDays
  const badges = new Set(data.badges);
  for (const b of BADGE_MILESTONES) {
    if (streak >= b.days || totalDays >= b.days) badges.add(b.id);
  }

  return { lastDate: today, streak, longest, totalDays, badges: Array.from(badges) };
};

export function useDailyPokemon() {
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [streak, setStreakData] = useState<StreakData>(() => loadStreak());
  const [loading, setLoading] = useState(true);

  // On mount: update streak + load today's Pokémon
  useEffect(() => {
    const next = computeNextStreak(streak);
    if (next !== streak) {
      setStreakData(next);
      try { localStorage.setItem(STREAK_KEY, JSON.stringify(next)); } catch {}
    }
    fetchPokemon(dailyId())
      .then(setPokemon)
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const earnedBadges = BADGE_MILESTONES.filter(b => streak.badges.includes(b.id));
  const nextBadge = BADGE_MILESTONES.find(b => !streak.badges.includes(b.id));

  return { pokemon, loading, streak, earnedBadges, nextBadge };
}

export { BADGE_MILESTONES };
