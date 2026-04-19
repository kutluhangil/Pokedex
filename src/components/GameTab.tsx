import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Trophy, Flame, RefreshCw } from 'lucide-react';
import { Pokemon, capitalize, getArtwork } from '@/lib/pokemon';
import { fetchPokemon } from '@/lib/api';

const STREAK_KEY = 'pokedex-game-best-streak';
const POOL_SIZE = 1025;

function randomId(exclude: number[] = []): number {
  let id = 0;
  do {
    id = Math.floor(Math.random() * POOL_SIZE) + 1;
  } while (exclude.includes(id));
  return id;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GameTab = () => {
  const [target, setTarget] = useState<Pokemon | null>(null);
  const [options, setOptions] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(() => {
    return parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);
  });
  const [round, setRound] = useState(0);

  const newRound = useCallback(async () => {
    setLoading(true);
    setRevealed(false);
    setPicked(null);
    try {
      const targetId = randomId();
      const decoyIds: number[] = [];
      while (decoyIds.length < 3) {
        const d = randomId([targetId, ...decoyIds]);
        decoyIds.push(d);
      }
      const [t, ...decoys] = await Promise.all([
        fetchPokemon(targetId),
        ...decoyIds.map(id => fetchPokemon(id)),
      ]);
      setTarget(t);
      setOptions(shuffle([t, ...decoys]));
    } catch (e) {
      console.error('Game round failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    newRound();
  }, [newRound]);

  useEffect(() => {
    localStorage.setItem(STREAK_KEY, String(bestStreak));
  }, [bestStreak]);

  const handlePick = useCallback((id: number) => {
    if (revealed || !target) return;
    setPicked(id);
    setRevealed(true);
    if (id === target.id) {
      setScore(s => s + 1);
      setStreak(s => {
        const next = s + 1;
        setBestStreak(b => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }
    setTimeout(() => {
      setRound(r => r + 1);
      newRound();
    }, 1800);
  }, [revealed, target, newRound]);

  const reset = useCallback(() => {
    setScore(0);
    setStreak(0);
    setRound(0);
    newRound();
  }, [newRound]);

  return (
    <div className="min-h-full pb-32 pt-6 px-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-pixel text-lg md:text-xl text-poke-yellow text-glow-yellow">WHO'S THAT?</h1>
          <p className="text-xs text-muted-foreground mt-1">Guess the Pokémon</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={reset}
          className="p-2 rounded-lg glass text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Reset"
        >
          <RefreshCw className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Score row */}
      <div className="grid grid-cols-3 gap-2 mb-8">
        <div className="glass rounded-xl p-3 text-center">
          <p className="font-pixel text-[7px] text-muted-foreground mb-1">SCORE</p>
          <p className="font-pixel text-sm text-foreground">{score}</p>
        </div>
        <div className="glass rounded-xl p-3 text-center neon-border-red">
          <p className="font-pixel text-[7px] text-muted-foreground mb-1 flex items-center justify-center gap-1">
            <Flame className="w-2.5 h-2.5" /> STREAK
          </p>
          <p className="font-pixel text-sm text-poke-red">{streak}</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <p className="font-pixel text-[7px] text-muted-foreground mb-1 flex items-center justify-center gap-1">
            <Trophy className="w-2.5 h-2.5" /> BEST
          </p>
          <p className="font-pixel text-sm text-poke-yellow">{bestStreak}</p>
        </div>
      </div>

      {/* Sprite area */}
      <div className="relative h-64 flex items-center justify-center mb-8">
        {loading && <Loader2 className="w-8 h-8 animate-spin text-poke-yellow" />}
        <AnimatePresence mode="wait">
          {!loading && target && (
            <motion.div
              key={target.id + '-' + round}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              {/* Backlight */}
              <motion.div
                className="absolute inset-0 rounded-full blur-3xl"
                animate={{
                  background: revealed && picked === target.id
                    ? 'hsl(48 100% 60% / 0.4)'
                    : revealed
                      ? 'hsl(1 100% 60% / 0.3)'
                      : 'hsl(211 100% 50% / 0.15)',
                }}
                transition={{ duration: 0.3 }}
              />
              <img
                src={getArtwork(target)}
                alt={revealed ? target.name : 'mystery'}
                className="relative w-48 h-48 md:w-56 md:h-56 object-contain transition-all duration-500"
                style={{
                  filter: revealed
                    ? 'none'
                    : 'brightness(0) contrast(1.5)',
                  imageRendering: 'auto',
                }}
              />
              {revealed && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-center font-pixel text-[10px] mt-3 ${picked === target.id ? 'text-poke-yellow' : 'text-poke-red'}`}
                >
                  {picked === target.id ? '✦ CORRECT!' : `IT WAS ${capitalize(target.name).toUpperCase()}`}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        {options.map((opt, i) => {
          const isTarget = target && opt.id === target.id;
          const isPicked = picked === opt.id;
          const showCorrect = revealed && isTarget;
          const showWrong = revealed && isPicked && !isTarget;

          return (
            <motion.button
              key={opt.id + '-' + round + '-' + i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={revealed ? {} : { scale: 0.96 }}
              onClick={() => handlePick(opt.id)}
              disabled={revealed}
              className={`p-3 rounded-xl glass font-pixel text-[9px] tracking-wide transition-all ${
                showCorrect
                  ? 'neon-border-red text-poke-yellow border-poke-yellow'
                  : showWrong
                    ? 'border border-poke-red/60 text-poke-red opacity-60'
                    : revealed
                      ? 'opacity-40 text-muted-foreground'
                      : 'text-foreground hover:neon-border-blue hover:text-poke-blue'
              }`}
              style={showCorrect ? { boxShadow: '0 0 18px hsl(48 100% 60% / 0.4)' } : {}}
            >
              {capitalize(opt.name)}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default GameTab;
