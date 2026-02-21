import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Search, BookOpen } from 'lucide-react';
import IntroScreen from '@/components/IntroScreen';
import ExploreTab from '@/components/ExploreTab';
import SearchTab from '@/components/SearchTab';
import CollectionTab from '@/components/CollectionTab';
import Particles from '@/components/Particles';

const INTRO_KEY = 'pokedex-intro-seen';

const tabs = [
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'pokedes', label: 'Pokédes', icon: Search },
  { id: 'collection', label: 'Collection', icon: BookOpen },
] as const;

type TabId = typeof tabs[number]['id'];

const Index = () => {
  const [showIntro, setShowIntro] = useState(() => {
    return !localStorage.getItem(INTRO_KEY);
  });
  const [activeTab, setActiveTab] = useState<TabId>('explore');

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    localStorage.setItem(INTRO_KEY, 'true');
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatePresence>
        {showIntro && <IntroScreen onComplete={handleIntroComplete} />}
      </AnimatePresence>

      {!showIntro && (
        <>
          <Particles />

          {/* Main content */}
          <main className="relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'explore' && <ExploreTab />}
                {activeTab === 'pokedes' && <SearchTab />}
                {activeTab === 'collection' && <CollectionTab />}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Tab bar */}
          <nav className="fixed bottom-0 left-0 right-0 z-30 glass-strong">
            <div className="flex items-center justify-around max-w-lg mx-auto py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
                      isActive ? 'text-poke-red' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className={`font-pixel text-[7px] ${isActive ? 'text-glow-red' : ''}`}>
                      {tab.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute -bottom-0 w-8 h-0.5 rounded-full bg-poke-red"
                        style={{ boxShadow: '0 0 8px hsl(1 100% 60% / 0.6)' }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </nav>
        </>
      )}
    </div>
  );
};

export default Index;
