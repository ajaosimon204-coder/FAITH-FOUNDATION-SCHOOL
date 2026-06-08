import React from 'react';
import { motion } from 'framer-motion';
import FaithBot from './FaithBot';

export default function FloatingActions() {
  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
      {/* Faith Bot */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, x: 50 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <FaithBot />
      </motion.div>
    </div>
  );
}

