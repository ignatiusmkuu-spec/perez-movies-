import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function Scene0() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 2000);
    const t2 = setTimeout(() => setStage(2), 5000);
    const t3 = setTimeout(() => setStage(3), 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 1.5 }}
    >
      <motion.img 
        src="/assets/scene-0.png"
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: 1.2, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 12, ease: "easeOut" }}
      />
      
      {/* Light ray overlay */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-tr from-transparent via-orange-500/20 to-yellow-300/40 mix-blend-overlay"
        animate={{ opacity: [0, 0.5, 0.8] }}
        transition={{ duration: 10 }}
      />

      {/* Floating UI Elements / Code */}
      {stage >= 1 && (
        <motion.div
          className="absolute left-1/4 top-1/4 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 text-green-400 font-mono text-sm"
          initial={{ opacity: 0, y: 20, rotateX: 45 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, type: "spring" }}
        >
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            transition={{ duration: 5 }}
            className="overflow-hidden whitespace-pre"
          >
            {`function wakeUp() {
  const mind = new State('clear');
  const body = new State('ready');
  return { mind, body };
}
wakeUp();`}
          </motion.div>
        </motion.div>
      )}

      {/* Sticky Note */}
      {stage >= 2 && (
        <motion.div
          className="absolute right-1/4 bottom-1/4 bg-yellow-200/90 p-6 rounded-lg shadow-2xl rotate-3 max-w-[250px]"
          initial={{ opacity: 0, scale: 0, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 3 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <p className="font-sans text-xl font-bold text-slate-800 leading-snug">
            "Build something that helps people."
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
