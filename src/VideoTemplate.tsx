import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import Scene0 from './scenes/Scene0';
import Scene1 from './scenes/Scene1';
import Scene2 from './scenes/Scene2';
import Scene3 from './scenes/Scene3';
import Scene4 from './scenes/Scene4';
import Scene5 from './scenes/Scene5';
import Scene6 from './scenes/Scene6';
import Scene7 from './scenes/Scene7';

const SCENE_DURATIONS = [
  12000, // Scene 0: Opening Sunrise (12s)
  18000, // Scene 1: Coding Passion (18s)
  15000, // Scene 2: Tech Creativity (15s)
  20000, // Scene 3: Motorcycle Freedom (20s)
  20000, // Scene 4: Kindness (20s)
  20000, // Scene 5: Teaching Kids (20s)
  10000, // Scene 6: App Launch (10s)
  5000,  // Scene 7: Ending Sunset (5s)
];

export default function VideoTemplate() {
  const [currentScene, setCurrentScene] = useState(0);

  useEffect(() => {
    let timeoutId;
    
    const advanceScene = () => {
      setCurrentScene((prev) => (prev + 1) % SCENE_DURATIONS.length);
    };

    timeoutId = setTimeout(advanceScene, SCENE_DURATIONS[currentScene]);

    return () => clearTimeout(timeoutId);
  }, [currentScene]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black text-white selection:bg-primary selection:text-primary-foreground">
      {/* Persistent Background Layer */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none"
        animate={{
          background: currentScene < 3 
            ? 'radial-gradient(circle at 50% 50%, rgba(20, 20, 30, 1) 0%, rgba(5, 5, 10, 1) 100%)' 
            : currentScene === 7 
            ? 'radial-gradient(circle at 50% 50%, rgba(60, 20, 10, 1) 0%, rgba(10, 5, 5, 1) 100%)'
            : 'radial-gradient(circle at 50% 50%, rgba(15, 25, 35, 1) 0%, rgba(5, 5, 10, 1) 100%)',
        }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      />
      
      {/* Scene Content */}
      <div className="relative z-10 w-full h-full">
        <AnimatePresence mode="wait">
          {currentScene === 0 && <Scene0 key="scene0" />}
          {currentScene === 1 && <Scene1 key="scene1" />}
          {currentScene === 2 && <Scene2 key="scene2" />}
          {currentScene === 3 && <Scene3 key="scene3" />}
          {currentScene === 4 && <Scene4 key="scene4" />}
          {currentScene === 5 && <Scene5 key="scene5" />}
          {currentScene === 6 && <Scene6 key="scene6" />}
          {currentScene === 7 && <Scene7 key="scene7" />}
        </AnimatePresence>
      </div>
      
      {/* Persistent Vignette Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
}
