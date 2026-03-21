import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function Scene7() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1000); // Text appears

    return () => {
      clearTimeout(t1);
    };
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 w-full h-full bg-black overflow-hidden flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2 }}
    >
      <motion.img 
        src="/assets/scene-7.png"
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: 1.2, y: 0 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 5, ease: "easeOut" }}
      />
      
      {/* Cinematic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Final Text */}
      {stage >= 1 && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-center z-40"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-widest uppercase drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
            initial={{ letterSpacing: "0.1em" }}
            animate={{ letterSpacing: "0.2em" }}
            transition={{ duration: 4, ease: "easeOut" }}
          >
            Dream. Build.
          </motion.h1>
          <motion.h1 
            className="text-5xl md:text-7xl font-bold text-orange-400 tracking-widest uppercase drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
            initial={{ letterSpacing: "0.1em" }}
            animate={{ letterSpacing: "0.2em" }}
            transition={{ duration: 4, ease: "easeOut" }}
          >
            Help Others.
          </motion.h1>
          <motion.div 
            className="mt-8 w-24 h-1 bg-white/50 rounded-full"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.5, delay: 1 }}
          />
          <motion.p 
            className="mt-6 text-2xl text-white/80 font-serif italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 2 }}
          >
            – Ignatius
          </motion.p>
        </motion.div>
      )}

    </motion.div>
  );
}
