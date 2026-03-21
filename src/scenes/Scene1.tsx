import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function Scene1() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 3000); // Bug appears
    const t2 = setTimeout(() => setStage(2), 7000); // Bug fixed
    const t3 = setTimeout(() => setStage(3), 10000); // Speech bubble
    const t4 = setTimeout(() => setStage(4), 13000); // Build successful

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
    >
      <motion.img 
        src="/assets/scene-1.png"
        className="absolute inset-0 w-full h-full object-cover opacity-80"
        initial={{ scale: 1, filter: "brightness(1) contrast(1)" }}
        animate={{ 
          scale: 1.1,
          filter: stage === 1 ? "brightness(0.7) contrast(1.2) sepia(0.3) hue-rotate(-30deg)" : "brightness(1) contrast(1.1)"
        }}
        transition={{ duration: 18, ease: "linear" }}
      />

      {/* Code Holograms */}
      <motion.div 
        className="absolute inset-0 z-10 opacity-30 pointer-events-none"
        animate={{ 
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{ duration: 20, ease: "linear", repeat: Infinity }}
        style={{
          backgroundImage: "radial-gradient(circle, #0f0 1px, transparent 1px)",
          backgroundSize: "50px 50px"
        }}
      />

      {/* Error State */}
      {stage === 1 && (
        <motion.div
          className="absolute inset-0 border-4 border-red-500 z-20 pointer-events-none mix-blend-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}

      {/* Terminal UI */}
      <motion.div
        className="absolute left-[10%] bottom-[15%] w-[400px] h-[300px] bg-black/80 backdrop-blur-lg border border-white/20 rounded-xl p-4 font-mono text-sm overflow-hidden z-30 shadow-[0_0_30px_rgba(0,255,100,0.2)]"
        initial={{ opacity: 0, y: 50, rotateY: -20 }}
        animate={{ opacity: 1, y: 0, rotateY: 0 }}
        transition={{ duration: 1, type: "spring" }}
        style={{ perspective: 1000 }}
      >
        <div className="flex gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        
        <motion.div className="flex flex-col gap-2">
          <div className="text-gray-400">&gt; Compiling core modules...</div>
          <div className="text-gray-400">&gt; Building UI components...</div>
          
          {stage >= 1 && stage < 2 && (
            <motion.div 
              className="text-red-400 font-bold"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              ERR! Module build failed
              <br/>
              ERR! SyntaxError: Unexpected token
            </motion.div>
          )}

          {stage >= 2 && (
            <motion.div 
              className="text-green-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              &gt; Applying patch...
              <br/>
              &gt; Recompiling...
            </motion.div>
          )}

          {stage >= 4 && (
            <motion.div 
              className="text-white font-bold mt-4 text-xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring" }}
            >
              ✨ BUILD SUCCESSFUL
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Speech Bubble */}
      {stage >= 3 && (
        <motion.div
          className="absolute right-[20%] top-[30%] z-40"
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.5 }}
        >
          <div className="speech-bubble text-2xl px-6 py-4 shadow-2xl border-2 border-green-400/30">
            "Got it! That's the fix!"
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}
