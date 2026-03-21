import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Scene5() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 3000); // Holograms appear
    const t2 = setTimeout(() => setStage(2), 7000); // Ignatius speaks
    const t3 = setTimeout(() => setStage(3), 13000); // Kids speak

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 w-full h-full bg-slate-900 overflow-hidden flex items-center justify-center"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.img 
        src="/assets/scene-5.png"
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: 1.1, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 20, ease: "easeOut" }}
      />
      
      {/* Light ray overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {/* Animated Holographic Code */}
      <AnimatePresence>
        {stage >= 1 && (
          <motion.div
            className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg pointer-events-none"
            initial={{ opacity: 0, scale: 0.5, rotateX: 45 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ duration: 1.5, type: "spring" }}
            style={{ perspective: 1000 }}
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-[0_0_50px_rgba(0,255,255,0.3)]">
               <motion.div 
                 className="text-cyan-300 font-mono text-lg"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
               >
                 <span className="text-pink-400">function</span> <span className="text-yellow-300">createFuture</span>() {'{\n'}
                 {'  '}console.<span className="text-blue-300">log</span>("Hello World!");{'\n'}
                 {'  '}<span className="text-pink-400">return</span> <span className="text-green-300">true</span>;{'\n'}
                 {'}'}
               </motion.div>
            </div>
            
            {/* Floating digital icons */}
            <motion.div className="absolute -top-10 -left-10 text-4xl" animate={{ y: [0, -20, 0] }} transition={{ duration: 3, repeat: Infinity }}>🚀</motion.div>
            <motion.div className="absolute -top-5 -right-5 text-4xl" animate={{ y: [0, -15, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}>⭐</motion.div>
            <motion.div className="absolute bottom-10 -left-16 text-4xl" animate={{ y: [0, -25, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }}>💡</motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech Bubbles */}
      <AnimatePresence>
        {stage >= 2 && (
          <motion.div
            className="absolute left-[15%] top-[15%] z-40"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="speech-bubble text-2xl px-6 py-4 border-2 border-cyan-300 max-w-sm">
              "Coding is like talking to the future — let me show you."
            </div>
          </motion.div>
        )}

        {stage >= 3 && (
          <motion.div
            className="absolute right-[15%] bottom-[30%] z-40"
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
             <div className="speech-bubble text-2xl px-6 py-4 border-2 border-yellow-400 bg-yellow-100 text-yellow-900 font-bold rotate-2">
              "It works! It works!"
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
