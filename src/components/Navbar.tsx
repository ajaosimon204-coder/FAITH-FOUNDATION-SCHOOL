import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useContent } from '../lib/content';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, LogOut, Menu, X, BookOpen, GraduationCap, Users, Calendar, CreditCard, Image as ImageIcon, School } from 'lucide-react';

export const PublicNavbar = () => {
  const { user, profile } = useAuth();
  const { content } = useContent();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm group-hover:rotate-6 transition-transform flex items-center justify-center p-1 border border-slate-100">
              <img src={content.branding?.logo_url || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=100&h=100&fit=crop"} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-lg font-black font-display text-primary block leading-none uppercase">{content.branding?.school_name || "FAITH FOUNDATION"}</span>
              <span className="text-[10px] text-secondary font-bold tracking-widest uppercase mt-0.5 block">{content.branding?.school_motto || "Building Excellence"}</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary font-medium transition-colors">Home</Link>
            <Link to="/about" className="text-gray-700 hover:text-primary font-medium transition-colors">About</Link>
            <Link to="/admissions" className="text-gray-700 hover:text-primary font-medium transition-colors">Admissions</Link>
            <Link to="/gallery" className="text-gray-700 hover:text-primary font-medium transition-colors">Gallery</Link>
            <Link to="/news" className="text-gray-700 hover:text-primary font-medium transition-colors">News</Link>
            <Link to="/contact" className="text-gray-700 hover:text-primary font-medium transition-colors">Contact</Link>
            
            {user ? (
              <Link 
                to="/dashboard" 
                className="bg-primary text-white px-6 py-2 rounded-full font-semibold flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-lg shadow-primary/25"
              >
                <LayoutDashboard size={18} />
                Portal
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="bg-primary text-white px-6 py-2 rounded-full font-semibold hover:bg-opacity-90 transition-all shadow-lg shadow-primary/25"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-gray-700">
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              <Link to="/" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">Home</Link>
              <Link to="/about" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">About</Link>
              <Link to="/admissions" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">Admissions</Link>
              <Link to="/gallery" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">Gallery</Link>
              <Link to="/news" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">News</Link>
              <Link to="/contact" className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">Contact</Link>
              <Link to={user ? "/dashboard" : "/login"} className="block px-4 py-3 bg-primary text-white text-center rounded-lg font-bold mt-4">
                {user ? "Go to Dashboard" : "Student/Staff Login"}
              </Link>
               {user && (
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-bold"
                >
                  <LogOut size={18} /> Sign Out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
