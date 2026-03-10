import React from 'react';
import { motion } from 'motion/react';

export default function LoadingIndicator() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-void/80 backdrop-blur-sm">
      <motion.div
        className="w-16 h-16 border-4 border-neon-pink bg-neon-green"
        animate={{
          rotate: 360,
          borderRadius: ["0%", "25%", "50%", "25%", "0%"],
        }}
        transition={{
          duration: 1.5,
          ease: "linear",
          repeat: Infinity,
        }}
      />
      <div className="absolute mt-24 font-black text-neon-pink uppercase tracking-widest animate-pulse">
        Loading...
      </div>
    </div>
  );
}
