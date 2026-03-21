import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function Scene2() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 3000);
    const t2 = setTimeout(() => setStage(2), 6000);
    const t3 = setTimeout(() => setStage(3), 10000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 1.2 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.img 
        src="/assets/scene-2.png"
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: 1.3, x: -50 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ duration: 15, ease: "easeOut" }}
      />
      
      {/* Light Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

      {/* Animated Blueprint overlay */}
      {stage >= 1 && (
        <motion.div
          className="absolute inset-0 z-10 mix-blend-screen opacity-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 2 }}
        >
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path 
              d="M 10 50 Q 50 10 90 50 T 90 90" 
              fill="transparent" 
              stroke="#0ff" 
              strokeWidth="0.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3 }}
            />
            <motion.circle cx="50" cy="50" r="20" fill="transparent" stroke="#0ff" strokeWidth="0.2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 2, delay: 1 }}
            />
          </svg>
        </motion.div>
      )}

      {/* Speech Bubble */}
      {stage >= 2 && (
        <motion.div
          className="absolute right-[25%] top-[25%] z-40"
          initial={{ opacity: 0, scale: 0.5, rotate: 10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="speech-bubble text-3xl px-8 py-5 shadow-2xl bg-white text-blue-900 border-4 border-blue-200">
            "Yes! It works!<br/>Come on little guy!"
          </div>
        </motion.div>
      )}
      
      {/* Floating Innovation Ideas */}
      {stage >= 3 && (
        <>
          <motion.div className="absolute left-[15%] top-[20%] text-cyan-300 font-bold text-xl drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: -20 }} transition={{ duration: 4 }}>
            AI CORE ACTIVATED
          </motion.div>
          <motion.div className="absolute left-[20%] top-[60%] text-purple-300 font-bold text-xl drop-shadow-[0_0_10px_rgba(255,0,255,0.8)]"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: -20 }} transition={{ duration: 4, delay: 0.5 }}>
            SENSORS NOMINAL
          </motion.div>
        </>
      )}

    </motion.div>
  );
}
