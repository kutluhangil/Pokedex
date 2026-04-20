import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Shield, Play, RotateCcw, Plus } from 'lucide-react';
import { Pokemon, capitalize, getPixelSprite, TYPE_COLORS, formatPokemonId } from '@/lib/pokemon';
import { useTeam } from '@/hooks/useTeam';
import { fetchPokemon } from '@/lib/api';
import { BattlePokemon, computeAttack, initBattlePokemon } from '@/lib/battle';
import PokemonPicker from '@/components/PokemonPicker';

type Phase = 'setup' | 'battle' | 'over';

const POPULAR_OPPONENT_IDS = [149, 248, 130, 9, 6, 3, 65, 142, 145, 144, 146, 384, 487, 491];

const HpBar = ({ current, max, side }: { current: number; max: number; side: 'left' | 'right' }) => {
  const pct = Math.max(0, (current / max) * 100);
  let color = 'hsl(142 60% 45%)';
  if (pct < 50) color = 'hsl(48 90% 55%)';
  if (pct < 20) color = 'hsl(0 85% 55%)';

  return (
    <div className={`w-full h-2.5 rounded-full bg-muted/40 overflow-hidden ${side === 'left' ? '' : ''}`}>
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
  bp, side, attacking, hit, fainted,
}: { bp: BattlePokemon; side: 'left' | 'right'; attacking: boolean; hit: boolean; fainted: boolean }) => {
  const mainType = bp.pokemon.types[0]?.type.name || 'normal';
  const color = TYPE_COLORS[mainType];
  const x = attacking ? (side === 'left' ? 24 : -24) : 0;

  return (
    <div className={`flex flex-col items-center ${side === 'right' ? 'self-start' : 'self-end'}`}>
      <div className="w-44 mb-2 px-3 py-2 rounded-xl glass">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-pixel text-[8px] text-foreground truncate">
            {capitalize(bp.pokemon.name)}
          </span>
          <span className="font-pixel text-[7px] text-muted-foreground">
            {bp.hp}/{bp.maxHp}
          </span>
        </div>
        <HpBar current={bp.hp} max={bp.maxHp} side={side} />
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
  const { team } = useTeam();
  const filledTeam = team.filter((p): p is Pokemon => !!p);

  const [player, setPlayer] = useState<BattlePokemon | null>(null);
  const [opponent, setOpponent] = useState<BattlePokemon | null>(null);
  const [phase, setPhase] = useState<Phase>('setup');
  const [pickingPlayer, setPickingPlayer] = useState(false);
  const [pickingOpponent, setPickingOpponent] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [activeAttacker, setActiveAttacker] = useState<'player' | 'opponent' | null>(null);
  const [hitTarget, setHitTarget] = useState<'player' | 'opponent' | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-pick first team member as default player
  useEffect(() => {
    if (!player && filledTeam[0]) setPlayer(initBattlePokemon(filledTeam[0]));
  }, [filledTeam, player]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: 1e6, behavior: 'smooth' });
  }, [logs]);

  const pickRandomOpponent = useCallback(async () => {
    setBusy(true);
    try {
      const id = POPULAR_OPPONENT_IDS[Math.floor(Math.random() * POPULAR_OPPONENT_IDS.length)];
      const p = await fetchPokemon(id);
      setOpponent(initBattlePokemon(p));
    } finally {
      setBusy(false);
    }
  }, []);

  const startBattle = useCallback(() => {
    if (!player || !opponent) return;
    setLogs([`A wild ${capitalize(opponent.pokemon.name)} appeared!`, `Go, ${capitalize(player.pokemon.name)}!`]);
    setPhase('battle');
  }, [player, opponent]);

  const reset = useCallback(() => {
    setPhase('setup');
    setLogs([]);
    if (player) setPlayer(initBattlePokemon(player.pokemon));
    if (opponent) setOpponent(initBattlePokemon(opponent.pokemon));
  }, [player, opponent]);

  const playTurn = useCallback(async () => {
    if (!player || !opponent || busy || phase !== 'battle') return;
    setBusy(true);

    // Determine turn order by speed
    const playerSpeed = player.pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat ?? 50;
    const oppSpeed = opponent.pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat ?? 50;
    const playerFirst = playerSpeed >= oppSpeed;

    const doAttack = async (
      attackerKey: 'player' | 'opponent',
      atk: BattlePokemon,
      def: BattlePokemon,
    ): Promise<BattlePokemon> => {
      const targetKey = attackerKey === 'player' ? 'opponent' : 'player';
      setActiveAttacker(attackerKey);
      await new Promise(r => setTimeout(r, 250));
      const result = computeAttack(atk, def);
      setHitTarget(targetKey);
      const newDef: BattlePokemon = { ...def, hp: Math.max(0, def.hp - result.damage) };
      // Apply damage to corresponding state
      if (targetKey === 'player') setPlayer(newDef);
      else setOpponent(newDef);
      setLogs(l => [
        ...l,
        `${capitalize(atk.pokemon.name)} attacks for ${result.damage}${result.crit ? ' (CRIT!)' : ''}`,
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
      o = await doAttack('player', p, o);
      if (o.hp > 0) p = await doAttack('opponent', o, p);
    } else {
      p = await doAttack('opponent', o, p);
      if (p.hp > 0) o = await doAttack('player', p, o);
    }

    if (p.hp === 0 || o.hp === 0) {
      const winner = p.hp === 0 ? capitalize(o.pokemon.name) : capitalize(p.pokemon.name);
      setLogs(l => [...l, `${winner} wins the battle!`]);
      setPhase('over');
    }

    setBusy(false);
  }, [player, opponent, busy, phase]);

  return (
    <div className="min-h-full pb-32">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="font-pixel text-lg md:text-xl text-poke-red text-glow-red">BATTLE</h1>
        <p className="text-xs text-muted-foreground mt-1">Turn-based 1v1 simulator</p>
      </div>

      {/* Setup */}
      {phase === 'setup' && (
        <div className="px-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Player slot */}
            <div className="rounded-2xl glass p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-3.5 h-3.5 text-poke-blue" />
                <span className="font-pixel text-[8px] text-poke-blue tracking-widest">YOUR FIGHTER</span>
              </div>
              {player ? (
                <button
                  onClick={() => setPickingPlayer(true)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl glass hover:bg-muted/30 transition-colors text-left"
                >
                  <img src={getPixelSprite(player.pokemon)} alt={player.pokemon.name} className="w-12 h-12" style={{ imageRendering: 'pixelated' }} />
                  <div>
                    <p className="font-pixel text-[9px] text-foreground">{capitalize(player.pokemon.name)}</p>
                    <p className="font-pixel text-[7px] text-muted-foreground">{formatPokemonId(player.pokemon.id)}</p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => setPickingPlayer(true)}
                  className="w-full py-6 rounded-xl border-2 border-dashed border-border/40 hover:border-poke-blue/60 text-muted-foreground hover:text-poke-blue font-pixel text-[8px] flex flex-col items-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  PICK FIGHTER
                </button>
              )}
              {filledTeam.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/30">
                  {filledTeam.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPlayer(initBattlePokemon(p))}
                      title={`From team: ${p.name}`}
                      className={`p-1 rounded-lg transition-all ${
                        player?.pokemon.id === p.id ? 'ring-1 ring-poke-blue bg-poke-blue/10' : 'hover:bg-muted/30'
                      }`}
                    >
                      <img src={getPixelSprite(p)} alt={p.name} className="w-7 h-7" style={{ imageRendering: 'pixelated' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Opponent slot */}
            <div className="rounded-2xl glass p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sword className="w-3.5 h-3.5 text-poke-red" />
                <span className="font-pixel text-[8px] text-poke-red tracking-widest">OPPONENT</span>
              </div>
              {opponent ? (
                <button
                  onClick={() => setPickingOpponent(true)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl glass hover:bg-muted/30 transition-colors text-left"
                >
                  <img src={getPixelSprite(opponent.pokemon)} alt={opponent.pokemon.name} className="w-12 h-12" style={{ imageRendering: 'pixelated' }} />
                  <div>
                    <p className="font-pixel text-[9px] text-foreground">{capitalize(opponent.pokemon.name)}</p>
                    <p className="font-pixel text-[7px] text-muted-foreground">{formatPokemonId(opponent.pokemon.id)}</p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => setPickingOpponent(true)}
                  className="w-full py-6 rounded-xl border-2 border-dashed border-border/40 hover:border-poke-red/60 text-muted-foreground hover:text-poke-red font-pixel text-[8px] flex flex-col items-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  PICK OPPONENT
                </button>
              )}
              <button
                onClick={pickRandomOpponent}
                disabled={busy}
                className="w-full mt-3 py-2 rounded-xl glass font-pixel text-[8px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                🎲 RANDOM LEGENDARY
              </button>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            disabled={!player || !opponent}
            onClick={startBattle}
            className="w-full py-4 rounded-2xl neon-border-red font-pixel text-[10px] text-foreground hover:bg-poke-red/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            START BATTLE
          </motion.button>
        </div>
      )}

      {/* Battle arena */}
      {(phase === 'battle' || phase === 'over') && player && opponent && (
        <div className="px-6 space-y-4">
          {/* Arena */}
          <div className="relative rounded-2xl glass-strong overflow-hidden p-6 min-h-[280px]">
            <div className="absolute inset-0 pixel-grid opacity-10 pointer-events-none" />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center bottom, hsl(var(--poke-red) / 0.08), transparent 70%)',
              }}
            />

            <div className="relative grid grid-cols-2 gap-4">
              <Combatant
                bp={player}
                side="left"
                attacking={activeAttacker === 'player'}
                hit={hitTarget === 'player'}
                fainted={player.hp === 0}
              />
              <Combatant
                bp={opponent}
                side="right"
                attacking={activeAttacker === 'opponent'}
                hit={hitTarget === 'opponent'}
                fainted={opponent.hp === 0}
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
          <div className="flex gap-2">
            {phase === 'battle' && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={busy}
                onClick={playTurn}
                className="flex-1 py-3 rounded-xl neon-border-red font-pixel text-[9px] text-foreground hover:bg-poke-red/10 transition-colors disabled:opacity-50"
              >
                {busy ? 'FIGHTING…' : '⚔ ATTACK'}
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={reset}
              className="px-4 py-3 rounded-xl glass font-pixel text-[9px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              {phase === 'over' ? 'REMATCH' : 'RESET'}
            </motion.button>
          </div>
        </div>
      )}

      {/* Pickers */}
      <AnimatePresence>
        {pickingPlayer && (
          <PokemonPicker
            onPick={(p) => setPlayer(initBattlePokemon(p))}
            onClose={() => setPickingPlayer(false)}
          />
        )}
        {pickingOpponent && (
          <PokemonPicker
            onPick={(p) => setOpponent(initBattlePokemon(p))}
            onClose={() => setPickingOpponent(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BattleTab;
