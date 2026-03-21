import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Scene3() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Stage 1: Transition to country
    const t1 = setTimeout(() => setStage(1), 10000);
    // Stage 2: Speech
    const t2 = setTimeout(() => setStage(2), 14000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 w-full h-full bg-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(20px)" }}
      transition={{ duration: 2 }}
    >
      <AnimatePresence mode="wait">
        {stage === 0 ? (
          <motion.img 
            key="city"
            src="/assets/scene-3-1.png"
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: 1.1, x: 0 }}
            animate={{ scale: 1, x: -50 }}
            exit={{ opacity: 0, x: -100, scale: 1.2 }}
            transition={{ duration: 10, ease: "linear" }}
          />
        ) : (
          <motion.img 
            key="country"
            src="/assets/scene-3-2.png"
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.2, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 10, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* Speed lines effect for city */}
      <AnimatePresence>
        {stage === 0 && (
          <motion.div 
            className="absolute inset-0 pointer-events-none mix-blend-screen opacity-40"
            exit={{ opacity: 0 }}
            style={{
              background: "repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 80px)",
              backgroundSize: "200% 100%"
            }}
            animate={{ backgroundPosition: ["0% 0%", "-100% 0%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        )}
      </AnimatePresence>

      {/* Lens Flare */}
      <motion.div 
        className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-400/40 rounded-full blur-[100px] mix-blend-screen pointer-events-none"
        animate={{ 
          scale: stage === 1 ? [1, 1.5, 1] : 1,
          opacity: stage === 1 ? [0.4, 0.8, 0.4] : 0.4
        }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      {/* Speech Bubble */}
      <AnimatePresence>
        {stage >= 2 && (
          <motion.div
            className="absolute right-[15%] bottom-[25%] z-40"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="speech-bubble text-2xl px-8 py-4 bg-white/90 backdrop-blur text-slate-800 italic shadow-2xl">
              "This is freedom..."
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
