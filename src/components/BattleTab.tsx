import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Shield, Play, RotateCcw, Plus, Users, Repeat } from 'lucide-react';
import { Pokemon, capitalize, getPixelSprite, TYPE_COLORS, formatPokemonId } from '@/lib/pokemon';
import { useTeam } from '@/hooks/useTeam';
import { fetchPokemonBatch } from '@/lib/api';
import { BattlePokemon, computeAttack, initBattlePokemon, Move } from '@/lib/battle';
import PokemonPicker from '@/components/PokemonPicker';
import InteractiveTypeWheel from '@/components/InteractiveTypeWheel';

type Phase = 'setup' | 'battle' | 'switch_player' | 'over';

const POPULAR_OPPONENT_IDS = [149, 248, 130, 9, 6, 3, 65, 142, 145, 144, 146, 384, 487, 491, 150, 249, 250, 448, 68, 94];

const PokeballIndicator = ({ alive }: { alive: boolean }) => (
  <div className={`w-3 h-3 rounded-full border border-black/50 overflow-hidden relative shadow-sm ${alive ? 'opacity-100' : 'opacity-40 grayscale'}`}>
    <div className="absolute top-0 w-full h-1/2 bg-[#FF3B30]" />
    <div className="absolute bottom-0 w-full h-1/2 bg-white" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-1.5 h-1.5 bg-white rounded-full border border-black/50" />
    </div>
  </div>
);

const HpBar = ({ current, max, side }: { current: number; max: number; side: 'left' | 'right' }) => {
  const pct = Math.max(0, (current / max) * 100);
  let color = 'hsl(142 60% 45%)';
  if (pct < 50) color = 'hsl(48 90% 55%)';
  if (pct < 20) color = 'hsl(0 85% 55%)';

  return (
    <div className={`w-full h-2.5 rounded-full bg-muted/40 overflow-hidden`}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
};

const Combatant = ({
  bp, side, attacking, hit, fainted, team
}: { bp: BattlePokemon; side: 'left' | 'right'; attacking: boolean; hit: boolean; fainted: boolean; team: BattlePokemon[] }) => {
  const mainType = bp.pokemon.types[0]?.type.name || 'normal';
  const color = TYPE_COLORS[mainType];
  const x = attacking ? (side === 'left' ? 24 : -24) : 0;

  return (
    <div className={`flex flex-col items-center w-full ${side === 'right' ? 'self-start' : 'self-end'}`}>
      <div className="w-full max-w-[176px] mb-2 px-2 sm:px-3 py-2 rounded-xl glass-strong border border-white/5 shadow-lg">
        <div className="flex items-center justify-between mb-1.5 gap-1">
          <span className="font-pixel text-[7px] sm:text-[8px] text-foreground truncate">
            {capitalize(bp.pokemon.name)}
          </span>
          <span className="font-pixel text-[7px] text-muted-foreground">
            {bp.hp}/{bp.maxHp}
          </span>
        </div>
        <HpBar current={bp.hp} max={bp.maxHp} side={side} />
        
        {/* Team Indicators */}
        <div className={`flex gap-1 mt-2 justify-center`}>
          {team.map((t, i) => (
            <PokeballIndicator key={i} alive={t.hp > 0} />
          ))}
        </div>
      </div>
      <motion.div
        animate={{
          x,
          y: hit ? [0, -4, 4, -2, 0] : 0,
          opacity: fainted ? 0.15 : (hit ? [1, 0.3, 1] : 1),
          rotate: fainted ? (side === 'left' ? -90 : 90) : 0,
        }}
        transition={{ duration: 0.45 }}
        style={{ filter: fainted ? 'grayscale(1)' : `drop-shadow(0 0 12px hsl(${color} / 0.4))` }}
      >
        <img
          src={getPixelSprite(bp.pokemon)}
          alt={bp.pokemon.name}
          className={side === 'left' ? '' : 'scale-x-[-1]'}
          style={{ width: 96, height: 96, imageRendering: 'pixelated', objectFit: 'contain' }}
        />
      </motion.div>
    </div>
  );
};

const BattleTab = () => {
  const { team: appTeam } = useTeam();
  const filledTeam = appTeam.filter((p): p is Pokemon => !!p);

  const [playerTeam, setPlayerTeam] = useState<BattlePokemon[]>([]);
  const [opponentTeam, setOpponentTeam] = useState<BattlePokemon[]>([]);
  const [playerIdx, setPlayerIdx] = useState(0);
  const [opponentIdx, setOpponentIdx] = useState(0);

  const [phase, setPhase] = useState<Phase>('setup');
  const [logs, setLogs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [activeAttacker, setActiveAttacker] = useState<'player' | 'opponent' | null>(null);
  const [hitTarget, setHitTarget] = useState<'player' | 'opponent' | null>(null);
  
  const [pickingPlayer, setPickingPlayer] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const player = playerTeam[playerIdx] || null;
  const opponent = opponentTeam[opponentIdx] || null;

  // Sync player team from app state
  useEffect(() => {
    if (phase === 'setup' && filledTeam.length > 0 && playerTeam.length === 0) {
      setPlayerTeam(filledTeam.map(initBattlePokemon));
    }
  }, [filledTeam, playerTeam.length, phase]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: 1e6, behavior: 'smooth' });
  }, [logs]);

  const generateRival = useCallback(async () => {
    setBusy(true);
    try {
      const ids: number[] = [];
      while(ids.length < 6) {
        ids.push(POPULAR_OPPONENT_IDS[Math.floor(Math.random() * POPULAR_OPPONENT_IDS.length)]);
      }
      const pokes = await fetchPokemonBatch(ids);
      setOpponentTeam(pokes.map(initBattlePokemon));
      setOpponentIdx(0);
    } finally {
      setBusy(false);
    }
  }, []);

  const startBattle = useCallback(() => {
    if (playerTeam.length === 0 || opponentTeam.length === 0) return;
    setLogs([`Rival challenges you to a battle!`, `Rival sent out ${capitalize(opponentTeam[0].pokemon.name)}!`, `Go, ${capitalize(playerTeam[0].pokemon.name)}!`]);
    setPhase('battle');
  }, [playerTeam, opponentTeam]);

  const reset = useCallback(() => {
    setPhase('setup');
    setLogs([]);
    setPlayerIdx(0);
    setOpponentIdx(0);
    setPlayerTeam(t => t.map(bp => initBattlePokemon(bp.pokemon)));
    setOpponentTeam(t => t.map(bp => initBattlePokemon(bp.pokemon)));
  }, []);

  const handleSwitch = useCallback((idx: number) => {
    if (phase !== 'battle' && phase !== 'switch_player') return;
    const oldName = capitalize(player.pokemon.name);
    const nextPoke = playerTeam[idx];
    setPlayerIdx(idx);
    setLogs(l => [...l, `You withdrew ${oldName}!`, `Go, ${capitalize(nextPoke.pokemon.name)}!`]);
    
    if (phase === 'switch_player') {
      setPhase('battle');
    } else {
      // Manually switched during battle, now opponent gets to attack
      (async () => {
        setBusy(true);
        const opponentMove = opponent.moves[Math.floor(Math.random() * opponent.moves.length)];
        setActiveAttacker('opponent');
        await new Promise(r => setTimeout(r, 250));
        
        const result = computeAttack(opponent, nextPoke, opponentMove);
        setHitTarget('player');
        
        const newDef = { ...nextPoke, hp: Math.max(0, nextPoke.hp - result.damage) };
        setPlayerTeam(prev => {
          const arr = [...prev];
          arr[idx] = newDef;
          return arr;
        });

        setLogs(l => [
          ...l,
          `${capitalize(opponent.pokemon.name)} used ${opponentMove.name.toUpperCase()}!`,
          `It dealt ${result.damage} damage${result.crit ? ' (CRIT!)' : ''}.`,
          result.message,
        ]);

        await new Promise(r => setTimeout(r, 600));
        setActiveAttacker(null);
        setHitTarget(null);

        if (newDef.hp === 0) {
          const hasAlive = playerTeam.some((p, i) => i !== idx && p.hp > 0);
          if (hasAlive) {
            setPhase('switch_player');
          } else {
            setLogs(l => [...l, `You have no more Pokémon! RIVAL wins!`]);
            setPhase('over');
          }
        }
        setBusy(false);
      })();
    }
  }, [player, playerTeam, opponent, phase]);

  const playTurn = useCallback(async (playerMove: Move) => {
    if (!player || !opponent || busy || phase !== 'battle') return;
    setBusy(true);

    const opponentMove = opponent.moves[Math.floor(Math.random() * opponent.moves.length)];
    const playerSpeed = player.pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat ?? 50;
    const oppSpeed = opponent.pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat ?? 50;
    const playerFirst = playerSpeed >= oppSpeed;

    const doAttack = async (
      attackerKey: 'player' | 'opponent',
      atk: BattlePokemon,
      def: BattlePokemon,
      defIdx: number,
      move: Move
    ): Promise<BattlePokemon> => {
      const targetKey = attackerKey === 'player' ? 'opponent' : 'player';
      setActiveAttacker(attackerKey);
      await new Promise(r => setTimeout(r, 250));
      const result = computeAttack(atk, def, move);
      setHitTarget(targetKey);
      const newDef: BattlePokemon = { ...def, hp: Math.max(0, def.hp - result.damage) };
      
      if (targetKey === 'player') {
        setPlayerTeam(prev => { const n = [...prev]; n[defIdx] = newDef; return n; });
      } else {
        setOpponentTeam(prev => { const n = [...prev]; n[defIdx] = newDef; return n; });
      }

      setLogs(l => [
        ...l,
        `${capitalize(atk.pokemon.name)} used ${move.name.toUpperCase()}!`,
        `It dealt ${result.damage} damage${result.crit ? ' (CRIT!)' : ''}.`,
        result.message,
      ]);
      await new Promise(r => setTimeout(r, 600));
      setActiveAttacker(null);
      setHitTarget(null);
      return newDef;
    };

    let p = player;
    let o = opponent;

    if (playerFirst) {
      o = await doAttack('player', p, o, opponentIdx, playerMove);
      if (o.hp > 0) p = await doAttack('opponent', o, p, playerIdx, opponentMove);
    } else {
      p = await doAttack('opponent', o, p, playerIdx, opponentMove);
      if (p.hp > 0) o = await doAttack('player', p, o, opponentIdx, playerMove);
    }

    if (p.hp === 0) {
      const hasAlive = playerTeam.some(poke => poke.hp > 0);
      if (hasAlive) {
        setPhase('switch_player');
      } else {
        setLogs(l => [...l, `You have no more Pokémon! RIVAL wins!`]);
        setPhase('over');
      }
    } else if (o.hp === 0) {
      const nextOppIdx = opponentTeam.findIndex((poke, i) => i !== opponentIdx && poke.hp > 0);
      if (nextOppIdx !== -1) {
        setOpponentIdx(nextOppIdx);
        setLogs(l => [...l, `RIVAL sent out ${capitalize(opponentTeam[nextOppIdx].pokemon.name)}!`]);
      } else {
        setLogs(l => [...l, `RIVAL has no more Pokémon! YOU win!`]);
        setPhase('over');
      }
    }

    setBusy(false);
  }, [player, opponent, busy, phase, playerIdx, opponentIdx, playerTeam, opponentTeam]);

  return (
    <div className="min-h-full pb-32">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="font-pixel text-lg md:text-xl text-poke-red text-glow-red">BATTLE</h1>
        <p className="text-xs text-muted-foreground mt-1">Full 6v6 Team Simulator</p>
      </div>

      {/* Setup */}
      {phase === 'setup' && (
        <div className="px-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Player slot */}
            <div className="rounded-2xl glass p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-3.5 h-3.5 text-poke-blue" />
                <span className="font-pixel text-[8px] text-poke-blue tracking-widest">YOUR TEAM ({playerTeam.length}/6)</span>
              </div>
              {playerTeam.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {playerTeam.map((p, i) => (
                    <div key={i} className="flex flex-col items-center bg-black/20 rounded-xl p-2 border border-white/5">
                      <img src={getPixelSprite(p.pokemon)} alt={p.pokemon.name} className="w-10 h-10 pixelated" />
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => setPickingPlayer(true)}
                  className="w-full py-6 rounded-xl border-2 border-dashed border-border/40 hover:border-poke-blue/60 text-muted-foreground hover:text-poke-blue font-pixel text-[8px] flex flex-col items-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  BUILD TEAM
                </button>
              )}
            </div>

            {/* Opponent slot */}
            <div className="rounded-2xl glass p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sword className="w-3.5 h-3.5 text-poke-red" />
                <span className="font-pixel text-[8px] text-poke-red tracking-widest">OPPONENT TEAM</span>
              </div>
              {opponentTeam.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {opponentTeam.map((p, i) => (
                    <div key={i} className="flex flex-col items-center bg-black/20 rounded-xl p-2 border border-white/5">
                      <img src={getPixelSprite(p.pokemon)} alt={p.pokemon.name} className="w-10 h-10 pixelated grayscale opacity-50 contrast-200" />
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={generateRival}
                  disabled={busy}
                  className="w-full py-6 rounded-xl border-2 border-dashed border-border/40 hover:border-poke-red/60 text-muted-foreground hover:text-poke-red font-pixel text-[8px] flex flex-col items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Users className="w-5 h-5" />
                  GENERATE RIVAL
                </button>
              )}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            disabled={playerTeam.length === 0 || opponentTeam.length === 0}
            onClick={startBattle}
            className="w-full py-4 rounded-2xl neon-border-red font-pixel text-[10px] text-foreground hover:bg-poke-red/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            START BATTLE
          </motion.button>
          
          <div className="pt-4">
            <InteractiveTypeWheel />
          </div>
        </div>
      )}

      {/* Battle arena */}
      {(phase === 'battle' || phase === 'over' || phase === 'switch_player') && player && opponent && (
        <div className="px-6 space-y-4">
          <div className="relative rounded-2xl glass-strong overflow-hidden p-6 min-h-[280px]">
            <div className="absolute inset-0 pixel-grid opacity-10 pointer-events-none" />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center bottom, hsl(var(--poke-red) / 0.08), transparent 70%)' }} />

            <div className="relative grid grid-cols-2 gap-4">
              <Combatant
                bp={player}
                side="left"
                attacking={activeAttacker === 'player'}
                hit={hitTarget === 'player'}
                fainted={player.hp === 0}
                team={playerTeam}
              />
              <Combatant
                bp={opponent}
                side="right"
                attacking={activeAttacker === 'opponent'}
                hit={hitTarget === 'opponent'}
                fainted={opponent.hp === 0}
                team={opponentTeam}
              />
            </div>
          </div>

          {/* Log */}
          <div ref={logRef} className="rounded-2xl glass p-4 h-32 overflow-y-auto space-y-1">
            <AnimatePresence initial={false}>
              {logs.map((line, i) => (
                <motion.p
                  key={`${i}-${line}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-pixel text-[8px] text-foreground leading-relaxed"
                >
                  ▸ {line}
                </motion.p>
              ))}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3">
            {phase === 'switch_player' && (
              <div className="glass rounded-2xl p-4">
                <p className="font-pixel text-[9px] text-poke-yellow mb-3 text-center">CHOOSE NEXT POKÉMON</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {playerTeam.map((p, i) => (
                    <button
                      key={i}
                      disabled={p.hp === 0 || i === playerIdx}
                      onClick={() => handleSwitch(i)}
                      className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                        p.hp === 0 
                          ? 'opacity-30 grayscale cursor-not-allowed border-transparent' 
                          : i === playerIdx 
                            ? 'border-poke-blue bg-poke-blue/20' 
                            : 'border-white/10 glass hover:bg-muted/30 hover:border-poke-blue/50'
                      }`}
                    >
                      <img src={getPixelSprite(p.pokemon)} alt={p.pokemon.name} className="w-10 h-10 pixelated mb-1" />
                      <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-green-500" style={{ width: `${Math.max(0, (p.hp / p.maxHp) * 100)}%` }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {phase === 'battle' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {player.moves.map((move) => {
                  const moveColor = TYPE_COLORS[move.type] || TYPE_COLORS.normal;
                  return (
                    <motion.button
                      key={move.name}
                      whileTap={{ scale: 0.97 }}
                      disabled={busy}
                      onClick={() => playTurn(move)}
                      className="py-3 px-2 rounded-xl border font-pixel text-[8px] flex flex-col items-center justify-center gap-1 transition-all"
                      style={{
                        borderColor: `hsl(${moveColor} / 0.35)`,
                        background: `hsl(${moveColor} / 0.08)`,
                        boxShadow: `inset 0 0 8px hsl(${moveColor} / 0.05)`,
                      }}
                    >
                      <span className="text-foreground font-semibold">{move.name.toUpperCase()}</span>
                      <span className="text-[6px] px-1.5 py-0.5 rounded-full" style={{ background: `hsl(${moveColor} / 0.15)`, color: `hsl(${moveColor})` }}>
                        {move.type.toUpperCase()} · PWR {move.power}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}
            
            <div className="flex gap-2">
              {phase === 'battle' && (
                 <motion.button
                   whileTap={{ scale: 0.97 }}
                   disabled={busy}
                   onClick={() => setPhase('switch_player')}
                   className="flex-1 py-3 rounded-xl glass font-pixel text-[9px] text-poke-yellow hover:bg-poke-yellow/10 transition-colors flex items-center justify-center gap-1.5 border border-poke-yellow/30"
                 >
                   <Repeat className="w-3 h-3" />
                   SWITCH
                 </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={reset}
                className="flex-1 py-3 rounded-xl glass font-pixel text-[9px] text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                {phase === 'over' ? 'REMATCH' : 'SURRENDER'}
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Pickers */}
      <AnimatePresence>
        {pickingPlayer && (
          <PokemonPicker
            onPick={async (p) => {
              setPlayerTeam([initBattlePokemon(p)]);
              setPickingPlayer(false);
            }}
            onClose={() => setPickingPlayer(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BattleTab;
