import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Search, BookOpen, Home, Globe, Gamepad2, Users, Swords } from 'lucide-react';
import IntroScreen from '@/components/IntroScreen';
import Homepage from '@/components/Homepage';
import ExploreTab from '@/components/ExploreTab';
import SearchTab from '@/components/SearchTab';
import CollectionTab from '@/components/CollectionTab';
import WorldTab from '@/components/WorldTab';
import GameTab from '@/components/GameTab';
import TeamTab from '@/components/TeamTab';
import BattleTab from '@/components/BattleTab';
import Particles from '@/components/Particles';
import PokemonDetail from '@/components/PokemonDetail';
import ShortcutsHelp from '@/components/ShortcutsHelp';
import { fetchPokemon } from '@/lib/api';
import { Pokemon } from '@/lib/pokemon';
import { useFavorites } from '@/hooks/useFavorites';
import { useTeam } from '@/hooks/useTeam';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const INTRO_KEY = 'pokedex-intro-seen';

const tabs = [
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'pokedes', label: 'Dex', icon: Search },
  { id: 'world', label: 'World', icon: Globe },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'battle', label: 'Battle', icon: Swords },
  { id: 'game', label: 'Game', icon: Gamepad2 },
  { id: 'collection', label: 'Coll.', icon: BookOpen },
] as const;

type TabId = typeof tabs[number]['id'];

const Index = () => {
  const [showIntro, setShowIntro] = useState(() => !localStorage.getItem(INTRO_KEY));
  const [showHomepage, setShowHomepage] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('explore');
  const [homepagePokemon, setHomepagePokemon] = useState<Pokemon | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { setTeamFromIds } = useTeam();

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    localStorage.setItem(INTRO_KEY, 'true');
  }, []);

  const handleHomepageNavigate = useCallback((tab: 'explore' | 'pokedes' | 'world') => {
    setActiveTab(tab as TabId);
    setShowHomepage(false);
  }, []);

  const handleHomepagePokemonClick = useCallback(async (id: number) => {
    try {
      const p = await fetchPokemon(id);
      setHomepagePokemon(p);
    } catch (e) {
      console.error('Failed to load homepage pokemon', e);
    }
  }, []);

  // Import a shared team from ?team=1,2,3 in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const teamParam = params.get('team');
    if (teamParam) {
      const ids = teamParam.split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n));
      if (ids.length > 0) {
        setTeamFromIds(ids).then(() => {
          setShowHomepage(false);
          setActiveTab('team');
        });
        // Clean the URL so a refresh doesn't re-import
        params.delete('team');
        const newSearch = params.toString();
        window.history.replaceState({}, '', `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`);
      }
    }
  }, [setTeamFromIds]);

  // Global keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: '/',
      handler: (e) => {
        e.preventDefault();
        setShowHomepage(false);
        setActiveTab('pokedes');
      },
    },
    {
      key: '?',
      handler: () => setShowShortcuts(s => !s),
    },
    {
      key: 'Escape',
      handler: () => setShowShortcuts(false),
    },
  ]);

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatePresence>
        {showIntro && <IntroScreen onComplete={handleIntroComplete} />}
      </AnimatePresence>

      {!showIntro && showHomepage && (
        <>
          <Homepage onNavigate={handleHomepageNavigate} onPokemonClick={handleHomepagePokemonClick} />
          {homepagePokemon && (
            <div className="fixed inset-0 z-[60]">
              <PokemonDetail
                pokemon={homepagePokemon}
                onClose={() => setHomepagePokemon(null)}
                isFavorite={isFavorite(homepagePokemon.id)}
                onToggleFavorite={() => toggleFavorite(homepagePokemon.id)}
                onNavigate={(next) => setHomepagePokemon(next)}
              />
            </div>
          )}
        </>
      )}

      {!showIntro && !showHomepage && (
        <>
          <Particles />

          {/* Main content */}
          <main className="relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'explore' && <ExploreTab />}
                {activeTab === 'pokedes' && <SearchTab />}
                {activeTab === 'world' && <WorldTab />}
                {activeTab === 'team' && <TeamTab />}
                {activeTab === 'battle' && <BattleTab />}
                {activeTab === 'game' && <GameTab />}
                {activeTab === 'collection' && <CollectionTab />}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Tab bar */}
          <nav className="fixed bottom-0 left-0 right-0 z-30 glass-strong">
            <div className="flex items-center justify-around max-w-2xl mx-auto py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-1">
              {/* Home button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowHomepage(true)}
                className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
              >
                <Home className="w-4 h-4" />
                <span className="font-pixel text-[6px]">Home</span>
              </motion.button>

              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-xl transition-colors ${
                      isActive ? 'text-poke-red' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-pixel text-[6px]">
                      {tab.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute -bottom-0 w-6 h-0.5 rounded-full bg-poke-red"
                        style={{ boxShadow: '0 0 6px hsl(var(--poke-red) / 0.3)' }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </nav>
        </>
      )}

      {/* Global shortcuts panel */}
      <ShortcutsHelp open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
};

export default Index;
