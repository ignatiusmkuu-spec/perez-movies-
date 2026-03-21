import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Scene4() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Using scene-4-3.png since the others failed, we'll represent the 3 kindness acts as a montage
    // over the same image with different text, or just focus on the student.
    const t1 = setTimeout(() => setStage(1), 4000); // Elderly
    const t2 = setTimeout(() => setStage(2), 9000); // Laptop
    const t3 = setTimeout(() => setStage(3), 14000); // Student

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 w-full h-full bg-slate-900 overflow-hidden"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, rotateY: 90 }}
      transition={{ duration: 1.5 }}
      style={{ perspective: 1000 }}
    >
      <motion.img 
        src="/assets/scene-4-3.png"
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: 1.2, x: 20, y: 20 }}
        animate={{ scale: 1, x: 0, y: 0 }}
        transition={{ duration: 20, ease: "easeOut" }}
      />
      
      {/* Warm Sunlight Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 via-transparent to-yellow-300/30 mix-blend-overlay" />
      <div className="absolute inset-0 bg-black/30" /> {/* Slight darken for text readability */}

      {/* Kindness Acts Text Overlays */}
      <AnimatePresence mode="wait">
        {stage === 1 && (
          <motion.div
            key="elderly"
            className="absolute left-[10%] bottom-[30%] z-40 max-w-md"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-white/10 backdrop-blur-md border-l-4 border-orange-400 p-6 rounded-r-xl">
              <p className="text-orange-200 text-lg font-semibold uppercase tracking-widest mb-2">Act of Kindness</p>
              <p className="text-3xl font-serif text-white italic">"Let me help you with those."</p>
            </div>
          </motion.div>
        )}

        {stage === 2 && (
          <motion.div
            key="laptop"
            className="absolute right-[10%] top-[30%] z-40 max-w-md"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-white/10 backdrop-blur-md border-r-4 border-blue-400 p-6 rounded-l-xl text-right">
              <p className="text-blue-200 text-lg font-semibold uppercase tracking-widest mb-2">Sharing Skills</p>
              <p className="text-3xl font-serif text-white italic">"There you go, good as new!"</p>
            </div>
          </motion.div>
        )}

        {stage === 3 && (
          <motion.div
            key="student"
            className="absolute left-[50%] top-[50%] z-40 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1, type: "spring" }}
          >
            <div className="speech-bubble text-3xl px-10 py-8 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-teal-100 mx-auto">
              <p className="font-bold text-slate-800">
                "You can do it — start small, stay consistent."
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
