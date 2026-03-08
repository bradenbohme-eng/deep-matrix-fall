// Tier 2: Ambient glow pulse — subtle living breathing effect
// Canon §21A: "The environment should feel alive"

import React from 'react';
import { motion } from 'framer-motion';

interface GlowPulseProps {
  color?: string;
  position?: 'top-left' | 'bottom-right' | 'center';
}

const positions = {
  'top-left': 'top-0 left-0',
  'bottom-right': 'bottom-0 right-0',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
};

const GlowPulse: React.FC<GlowPulseProps> = ({
  color = 'hsl(120 100% 44% / 0.03)',
  position = 'center',
}) => {
  return (
    <motion.div
      className={`fixed ${positions[position]} pointer-events-none z-[1]`}
      style={{
        width: '60vw',
        height: '60vh',
        background: `radial-gradient(ellipse, ${color}, transparent 70%)`,
        filter: 'blur(80px)',
      }}
      animate={{
        opacity: [0.3, 0.6, 0.3],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

export default GlowPulse;
