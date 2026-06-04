import React from 'react';
import { motion } from 'framer-motion';
import { Phone, MessageCircle, Facebook } from 'lucide-react';
import FaithBot from './FaithBot';

export default function FloatingActions() {
  const whatsappUrl = "https://chat.whatsapp.com/EogzVIYTEzh05Thm6WfcmE";
  const facebookUrl = "https://facebook.com/groups/765019995142164/";

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
      {/* Facebook Link */}
      <motion.a 
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0.5, x: 50 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          x: 0,
          y: [0, -10, 0]
        }}
        transition={{ 
          opacity: { delay: 0.3 },
          scale: { delay: 0.3 },
          x: { delay: 0.3 },
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }}
        className="w-14 h-14 bg-[#1877F2] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group relative border-2 border-white/20"
      >
        <span className="absolute -left-40 bg-white text-slate-800 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">
          Join Facebook Group
        </span>
        <Facebook size={26} className="group-hover:rotate-12 transition-transform" />
      </motion.a>

      {/* WhatsApp Link */}
      <motion.a 
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0.5, x: 50 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          x: 0,
          y: [0, -8, 0]
        }}
        transition={{ 
          opacity: { delay: 0.4 },
          scale: { delay: 0.4 },
          x: { delay: 0.4 },
          y: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
        }}
        className="w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group relative border-2 border-white/20"
      >
        <span className="absolute -left-40 bg-white text-slate-800 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">
          WhatsApp Community
        </span>
        <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
      </motion.a>

      {/* Faith Bot */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, x: 50 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <FaithBot />
      </motion.div>
    </div>
  );
}
