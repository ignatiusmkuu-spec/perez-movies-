import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Scene6() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 2000); // Screen shows success
    const t2 = setTimeout(() => setStage(2), 4000); // Notifications
    const t3 = setTimeout(() => setStage(3), 6000); // Speech bubble

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 w-full h-full bg-slate-900 overflow-hidden flex items-center justify-center"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: "blur(10px)" }}
      transition={{ duration: 1.5 }}
    >
      <motion.img 
        src="/assets/scene-6.png"
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: 1.15, filter: "brightness(0.8)" }}
        animate={{ scale: 1, filter: stage >= 1 ? "brightness(1.1) contrast(1.1)" : "brightness(0.8)" }}
        transition={{ duration: 10, ease: "easeOut" }}
      />
      
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Center Screen Banner */}
      <AnimatePresence>
        {stage >= 1 && (
          <motion.div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl text-center z-30"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-[2px] rounded-2xl shadow-[0_0_50px_rgba(0,200,255,0.5)]">
              <div className="bg-slate-900 rounded-2xl p-6">
                <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 text-4xl font-bold mb-2">
                  App Launch Successful
                </h2>
                <p className="text-slate-300 text-xl">Helping Thousands Learn Coding</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Notifications */}
      <AnimatePresence>
        {stage >= 2 && (
          <>
            <motion.div
              className="absolute left-[15%] top-[50%] bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl text-white shadow-xl z-20"
              initial={{ opacity: 0, x: -50, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              ❤️ "This changed my life, thank you!"
            </motion.div>

            <motion.div
              className="absolute right-[15%] top-[40%] bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl text-white shadow-xl z-20"
              initial={{ opacity: 0, x: 50, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              🌟 "Best learning platform ever!"
            </motion.div>

            <motion.div
              className="absolute left-[20%] bottom-[20%] bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl text-white shadow-xl z-20"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.4 }}
            >
              🚀 "Got my first job because of this."
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Speech Bubble */}
      <AnimatePresence>
        {stage >= 3 && (
          <motion.div
            className="absolute right-[25%] bottom-[30%] z-40"
            initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="speech-bubble text-2xl px-6 py-4 border-2 border-blue-400">
              "This is just the beginning."
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
