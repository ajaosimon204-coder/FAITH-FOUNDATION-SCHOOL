import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle2, AlertTriangle, ShieldCheck, Copy, Check, ExternalLink, HelpCircle, X, LifeBuoy, ToggleLeft, RefreshCw, Terminal, Eye, BookOpen } from 'lucide-react';
import { useContent } from '../lib/content';
import { useAuth } from '../contexts/AuthContext';

export default function SystemDoctor() {
  const { isConfigMissing, isDbSetupMissing, dbError } = useContent();
  const { isSandbox, loginAsDemo, logoutDemo } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('ff_doctor_dismissed') === 'true';
  });

  // Calculate actual statuses
  const rawUrl = import.meta.env.VITE_SUPABASE_URL;
  const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const isUrlSet = !!rawUrl && rawUrl !== 'https://placeholder.supabase.co' && rawUrl.length > 15;
  const isKeySet = !!rawKey && rawKey.length > 50;

  const envStatus = isUrlSet && isKeySet ? 'healthy' : 'missing';
  const dbStatus = isDbSetupMissing ? 'missing' : (envStatus === 'healthy' ? 'healthy' : 'unknown');

  const needsAttention = envStatus === 'missing' || dbStatus === 'missing';

  useEffect(() => {
    if (dismissed) return;
    // Auto open once if there are errors to help guide them
    if (needsAttention) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [needsAttention, dismissed]);

  const handleDismissForever = () => {
    localStorage.setItem('ff_doctor_dismissed', 'true');
    setDismissed(true);
    setIsOpen(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // SQL code from supabase_setup.sql but smaller snippet or copy commands
  const sqlHelperCode = `-- Go to your Supabase SQL Editor and paste/run this fully recursion-proof database setup:
-- (The entire script is also physically in the file: "supabase_setup.sql" at your app's root folder!)
-- Press the Copy SQL Script button to grab the complete set of tables!`;

  if (dismissed && !isOpen) {
    // Show a inconspicuous small helper float in the corner instead
    return (
      <button
        onClick={() => {
          setDismissed(false);
          setIsOpen(true);
          localStorage.removeItem('ff_doctor_dismissed');
        }}
        className="fixed bottom-6 left-6 z-[99] bg-white text-primary border border-gray-100 hover:border-primary/20 hover:text-secondary p-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold transition-all active:scale-95"
        title="Check portal status & setup guide"
        id="btn-show-doctor"
      >
        <LifeBuoy className="w-4 h-4 shrink-0 text-primary animate-spin-slow" />
        <span>Setup Doctor</span>
      </button>
    );
  }

  return (
    <>
      {/* Floating Indicator Pulse */}
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-6 left-6 z-[99]"
        >
          <button
            onClick={() => setIsOpen(true)}
            id="doctor-indicator-btn"
            className={`relative p-4 rounded-2xl shadow-2xl flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
              needsAttention
                ? 'bg-amber-500 border-amber-400 text-slate-950 animate-bounce'
                : isSandbox 
                  ? 'bg-emerald-600 border-emerald-500 text-white' 
                  : 'bg-primary border-primary/20 text-white'
            }`}
          >
            {needsAttention && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
              </span>
            )}
            <LifeBuoy className={`w-6 h-6 ${needsAttention ? 'animate-spin-slow' : ''}`} />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold text-xs ml-0">
              Check Status
            </span>
          </button>
        </motion.div>
      )}

      {/* Main Drawer Overlaid */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-[1000]"
            />

            {/* Diagnostic Drawer */}
            <motion.div
              initial={{ opacity: 0, x: -100, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, y: 100, scale: 0.9 }}
              className="fixed bottom-6 left-6 z-[1001] max-w-lg w-[calc(100vw-3rem)] max-h-[85vh] bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden flex flex-col"
              id="doctor-drawer-container"
            >
              {/* Header */}
              <div className={`p-6 text-white flex items-center justify-between ${
                needsAttention ? 'bg-gradient-to-r from-amber-600 to-amber-500' : 'bg-gradient-to-r from-primary to-primary-dark'
              }`}>
                <div className="flex items-center gap-3">
                  <LifeBuoy className="w-8 h-8 animate-spin-slow" />
                  <div>
                    <h3 className="font-display font-black text-lg uppercase tracking-tight leading-none text-white">Portal Deployment Doctor</h3>
                    <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider mt-1">Live Diagnostics &amp; Setup Assistant</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center transition-all"
                  id="btn-close-doctor"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* STATUS DASHBOARD */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Live Integration Statuses</h4>
                  <div className="grid grid-cols-2 gap-3">
                    
                    {/* Status item 1: Env Config */}
                    <div className={`p-4 rounded-2xl border ${
                      envStatus === 'healthy' 
                        ? 'bg-green-50/50 border-green-100 text-green-700' 
                        : 'bg-amber-50/50 border-amber-100 text-amber-700'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {envStatus === 'healthy' 
                          ? <ShieldCheck size={18} className="text-green-600 shrink-0" /> 
                          : <ShieldAlert size={18} className="text-amber-600 shrink-0" />
                        }
                        <span className="text-xs font-black uppercase tracking-wider">Vite Environment</span>
                      </div>
                      <p className="text-lg font-bold leading-tight">
                        {envStatus === 'healthy' ? '✓ Connected' : '✗ Unconfigured'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {envStatus === 'healthy' ? 'Production variables injected successfully' : 'Using dummy local keys'}
                      </p>
                    </div>

                    {/* Status item 2: DB Schema */}
                    <div className={`p-4 rounded-2xl border ${
                      dbStatus === 'healthy' 
                        ? 'bg-green-50/50 border-green-100 text-green-700' 
                        : dbStatus === 'missing'
                          ? 'bg-red-50/50 border-red-100 text-red-700'
                          : 'bg-slate-50 border-slate-100 text-slate-600'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {dbStatus === 'healthy' 
                          ? <CheckCircle2 size={18} className="text-green-600 shrink-0" /> 
                          : <AlertTriangle size={18} className="text-red-500 shrink-0" />
                        }
                        <span className="text-xs font-black uppercase tracking-wider">Database Setup</span>
                      </div>
                      <p className="text-lg font-bold leading-tight">
                        {dbStatus === 'healthy' ? '✓ Schemas OK' : dbStatus === 'missing' ? '✗ Schema Missing' : 'Unknown'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {dbStatus === 'healthy' ? 'Tables are setup' : dbStatus === 'missing' ? 'Tables not found' : 'Set variables first'}
                      </p>
                    </div>

                  </div>
                </div>

                {/* SANDBOX CONTROLS */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-start gap-3">
                    <LifeBuoy className="text-emerald-600 w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">Quick Sandbox Bypass</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        If you are presenting this project and need portals to work instantly without database setups, enable the Local Demo Sandbox with a single click.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {isSandbox ? (
                          <button
                            onClick={logoutDemo}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all"
                          >
                            ⚠️ Exit Sandbox (Return to Live DB)
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                loginAsDemo('student@faithfoundation.com', 'student', 'Demo Pupil');
                                setIsOpen(false);
                              }}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all"
                            >
                              🎓 Student Sandbox
                            </button>
                            <button
                              onClick={() => {
                                loginAsDemo('staff@faithfoundation.com', 'staff', 'Principal Instructor');
                                setIsOpen(false);
                              }}
                              className="px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all"
                            >
                              🌿 Staff Sandbox
                            </button>
                            <button
                              onClick={() => {
                                loginAsDemo('faithfoundation480@gmail.com', 'admin', 'Portal Administrator');
                                setIsOpen(false);
                              }}
                              className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all"
                            >
                              ⚡ Admin Sandbox
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SYSTEM DETECTED ISSUES & WALKTHROUGH CHECKLIST */}
                {needsAttention && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">How to complete your Netlify or Vercel setup</h4>
                    
                    {/* Checklist Step 1: Environment Variables */}
                    <div className="p-4 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          envStatus === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          1
                        </span>
                        <div>
                          <h6 className="text-xs font-black text-slate-800 uppercase tracking-wider">Set Netlify/Vercel Environment Variables</h6>
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                            Because Vite compiles assets statically, you must set these keys in your Netlify or Vercel Dashboard (under Environment Variables) and trigger a new deployment to inject them:
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 pl-7">
                        <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono">
                          <span className="text-slate-500 text-[10px]">VITE_SUPABASE_URL</span>
                          <button
                            onClick={() => copyToClipboard('VITE_SUPABASE_URL', 'url')}
                            className="text-[10px] font-bold text-primary flex items-center gap-1 hover:text-secondary"
                          >
                            {copiedKey === 'url' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                            {copiedKey === 'url' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono">
                          <span className="text-slate-500 text-[10px]">VITE_SUPABASE_ANON_KEY</span>
                          <button
                            onClick={() => copyToClipboard('VITE_SUPABASE_ANON_KEY', 'key')}
                            className="text-[10px] font-bold text-primary flex items-center gap-1 hover:text-secondary"
                          >
                            {copiedKey === 'key' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                            {copiedKey === 'key' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <p className="text-[9px] text-amber-600 italic leading-snug">
                          *Caution: Adding keys without the "VITE_" prefix will cause them to be filtered out by Vite. Make sure they are exact!
                        </p>
                      </div>
                    </div>

                    {/* Checklist Step 2: Supabase Migrations */}
                    <div className="p-4 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          dbStatus === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          2
                        </span>
                        <div>
                          <h6 className="text-xs font-black text-slate-800 uppercase tracking-wider">Run Supabase Database Setup</h6>
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                            Your Supabase database requires configuration. Go to your <strong>Supabase SQL Editor</strong> and execute the SQL file at the root of our codebase:
                          </p>
                        </div>
                      </div>

                      <div className="pl-7 space-y-2">
                        <div className="flex gap-2">
                          <a
                            href="https://supabase.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 transition-all text-center"
                          >
                            <ExternalLink size={12} /> Supabase Console
                          </a>
                          
                          <button
                            onClick={() => {
                              setShowSqlGuide(true);
                            }}
                            className="px-3.5 py-2 bg-primary/5 border border-primary/20 hover:bg-primary/10 text-primary rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                          >
                            <Terminal size={12} /> Get Script Instructions
                          </button>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-xl font-mono text-[9px] text-amber-500 overflow-x-auto relative">
                          <p className="pr-12 text-slate-400 uppercase tracking-widest text-[8px] font-bold border-b border-slate-800 pb-1 mb-1.5 flex justify-between items-center">
                            <span>SQL CLI SETUP HELPER</span>
                            <span className="text-[8px] text-amber-400 lowercase">(run in editor)</span>
                          </p>
                          <pre className="text-slate-300 leading-normal">{sqlHelperCode}</pre>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Trigger Rebuild */}
                    <div className="p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-slate-100 text-slate-700 shrink-0">
                          3
                        </span>
                        <div>
                          <h6 className="text-xs font-black text-slate-800 uppercase tracking-wider">Trigger New Deploy / Rebuild</h6>
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                            After adding your environment variables, go to your <strong>Deploys / Deployment</strong> panel in Netlify or Vercel, and trigger a new deploy (rebuild) to apply the live database credentials to the production files.
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <button
                  onClick={handleDismissForever}
                  className="px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-xl font-black uppercase tracking-wider transition-all"
                  id="btn-dismiss-forever"
                >
                  Dismiss Helper
                </button>
                <div className="text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span>Connection:</span>
                  <span className={needsAttention ? 'text-amber-500' : 'text-green-600'}>
                    {needsAttention ? '● Offline Mode' : '● Live Database'}
                  </span>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SQL Setup Guide Modal */}
      <AnimatePresence>
        {showSqlGuide && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSqlGuide(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[2000]"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[10%] bottom-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden flex flex-col z-[2001]"
            >
              {/* Header */}
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Terminal className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h3 className="font-display font-black text-sm uppercase tracking-tight text-white">Supabase Schema Script</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Execute in SQL Editor</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSqlGuide(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Instructions Panel */}
              <div className="p-6 bg-emerald-50 border-b border-emerald-100 text-emerald-800 text-xs leading-relaxed space-y-1">
                <p className="font-extrabold text-[10px] uppercase tracking-wider text-emerald-700">📋 Database Creation Steps</p>
                <ol className="list-decimal pl-4 space-y-1 mt-1 font-bold">
                  <li>Log in to your <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline text-emerald-900 hover:text-emerald-950 font-black">Supabase Dashboard</a> and open your project.</li>
                  <li>Click on the <strong>SQL Editor</strong> button in the left sidebar menu (looks like a prompt icon).</li>
                  <li>Click <strong>"New query"</strong> to open a blank editor panel.</li>
                  <li>Copy the script below completely, paste it in, and press the <strong>"Run"</strong> button on the bottom right.</li>
                </ol>
              </div>

              {/* Code Editor Preview/Copy Area */}
              <div className="flex-1 p-6 overflow-hidden flex flex-col relative bg-slate-950">
                <div className="absolute right-9 top-9 z-10 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(FULL_SQL_SCRIPT);
                      setCopiedKey('full_script');
                      setTimeout(() => setCopiedKey(null), 3000);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    {copiedKey === 'full_script' ? <Check size={14} className="text-white" /> : <Copy size={14} />}
                    {copiedKey === 'full_script' ? 'Copied Script! ✅' : 'Copy SQL Script'}
                  </button>
                </div>

                <div className="text-[9px] font-bold tracking-widest text-slate-500 mb-3 uppercase">
                  schema code preview
                </div>

                <div className="flex-1 overflow-auto bg-slate-900 rounded-2xl border border-slate-800 p-4 font-mono text-xs text-emerald-400 leading-relaxed max-h-[100%] select-all scrollbar-thin">
                  <pre>{FULL_SQL_SCRIPT}</pre>
                </div>
              </div>

              {/* Custom bottom advice */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500 font-extrabold uppercase tracking-widest leading-none">
                This schema setup includes profiles, site contents, admissions, and messaging RLS triggers.
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

const FULL_SQL_SCRIPT = `-- FAITH FOUNDATION ENTERPRISE PORTAL - DATABASE SETUP
-- INSTRUCTIONS: 
-- 1. Go to your Supabase Dashboard (https://supabase.com)
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Click "New Query" Or open your existing Query editor
-- 4. Paste ALL the code below and click "Run"
-- 5. This script is fully idempotent (can be run multiple times safely)

-- ==========================================
-- 1. TABLES CREATION
-- ==========================================

-- A. Profile Table (public.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'staff', 'student')),
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- B. Site Content Table (public.site)
CREATE TABLE IF NOT EXISTS public.site (
  id TEXT PRIMARY KEY,
  content JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- C. Admissions Table (public.admissions)
CREATE TABLE IF NOT EXISTS public.admissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  target_class TEXT NOT NULL,
  address TEXT NOT NULL,
  previous_school TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- D. Notifications Table (public.notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- E. Messages Table (public.messages)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT NOT NULL,
  is_broadcast BOOLEAN DEFAULT false,
  target_role TEXT, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. ROW LEVEL SECURITY (RLS) ENABLING
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. CLEAN & SETUP RLS POLICIES (RECURSION-PROOF)
-- ==========================================

-- Dynamically drop ALL existing policies on public.users to clear any hidden recursive ones leftover from old setups
DO $$ 
DECLARE
  pol RECORD;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'users' AND schemaname = 'public'
  LOOP 
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.users';
  END LOOP; 
END $$;

-- Users
CREATE POLICY "Users can view own profile" ON public.users 
  FOR SELECT USING (
    auth.uid() = id 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
    OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
  );

CREATE POLICY "Users can update own profile" ON public.users 
  FOR UPDATE USING (
    auth.uid() = id 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
  );

CREATE POLICY "Admins can manage all profiles" ON public.users 
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
  );

-- Site
DROP POLICY IF EXISTS "Public read site content" ON public.site;
DROP POLICY IF EXISTS "Admins can manage site content" ON public.site;

CREATE POLICY "Public read site content" ON public.site 
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage site content" ON public.site 
  FOR ALL USING (\n    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
  );

-- Admissions
DROP POLICY IF EXISTS "Public can submit applications" ON public.admissions;
DROP POLICY IF EXISTS "Admins can manage applications" ON public.admissions;
DROP POLICY IF EXISTS "Admins can view applications" ON public.admissions;

CREATE POLICY "Public can submit applications" ON public.admissions 
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Admins can manage applications" ON public.admissions 
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
    OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
  );

-- Notifications
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update read status" ON public.notifications;
DROP POLICY IF EXISTS "Admins/Staff can send notifications" ON public.notifications;

CREATE POLICY "Users manage own notifications" ON public.notifications 
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users update read status" ON public.notifications 
  FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "Admins/Staff can send notifications" ON public.notifications 
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
    OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
  );

-- Messages
DROP POLICY IF EXISTS "Users can view relevant messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;

CREATE POLICY "Users can view relevant messages" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id 
    OR auth.uid() = receiver_id 
    OR (is_broadcast = true AND target_role IN ('all', (auth.jwt() -> 'user_metadata' ->> 'role')))
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
  );

CREATE POLICY "Users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );


-- ==========================================
-- 4. AUTH TRIGGER (Automatically syncs profiles safely)
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'), 
    CASE 
      WHEN LOWER(new.email) IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com') THEN 'admin'
      ELSE COALESCE(new.raw_user_meta_data->>'role', 'student')
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE 
      WHEN LOWER(EXCLUDED.email) IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com') THEN 'admin'
      ELSE COALESCE(EXCLUDED.role, users.role)
    END,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync user role to auth.users metadata whenever role is changed or created
CREATE OR REPLACE FUNCTION public.sync_user_role_to_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_role_change ON public.users;
CREATE TRIGGER on_user_role_change
  AFTER INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_to_metadata();

-- ==========================================
-- 5. INITIAL HOMEPAGE DATA SEEDING
-- ==========================================
INSERT INTO public.site (id, content)
VALUES ('homepage', '{\n  "hero": {\n    "title": "FAITH FOUNDATION",\n    "description": "Nurturing the next generation of global leaders through academic excellence and unwavering faith.",\n    "cta_primary": "Join Our Community",\n    "cta_secondary": "Explore Campus"\n  },\n  "philosophy": {\n    "title": "EDUCATION WITHOUT BOUNDARIES.",\n    "subtitle": "Built on Values, Driven by Purpose",\n    "items": [\n      { "title": "Academic Rigor", "desc": "Balanced curriculum following both Nigerian and international standards from Creche to SS3." },\n      { "title": "Faith-Filled", "desc": "Spiritual growth is at our core. We nurture a deep relationship with God in every student." }\n    ]\n  },\n  "stats": [\n    { "label": "Graduates", "value": "1.2k+" },\n    { "label": "Expert Staff", "value": "50+" },\n    { "label": "Total Classes", "value": "30+" },\n    { "label": "State Awards", "value": "15" }\n  ],\n  "gallery": [\n    "https://images.unsplash.com/photo-1543269865-cbf427effbad",\n    "https://images.unsplash.com/photo-1509062522246-3755977927d7",\n    "https://images.unsplash.com/photo-1571260899304-425eee4c7efc",\n    "https://images.unsplash.com/photo-1516321497487-e288fb19713f",\n    "https://images.unsplash.com/photo-1524178232363-1fb28f74b671",\n    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846"\n  ],\n  "cta": {\n    "badge": "Admission Cycle 26/27",\n    "title": "THE FUTURE",\n    "highlight": "STARTS HERE."\n  },\n  "contact": {\n    "email": "admissions@faithfoundation.edu.ng",\n    "phone": "+2347034817051",\n    "address": "Oniyefun ZoneA, Thywill, Amuloko, Ibadan",\n    "working_hours": "Mon - Fri: 8:00 AM - 4:00 PM",\n    "facebook_url": "https://facebook.com/groups/765019995142164/",\n    "whatsapp_url": "https://wa.me/2347034817051"\n  }\n}')\nON CONFLICT (id) DO NOTHING;
`;
