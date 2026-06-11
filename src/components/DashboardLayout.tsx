import React from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Bell, Search, LayoutDashboard } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { useLocation } from 'react-router-dom';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, isSandbox } = useAuth();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Institutional Overview';
    if (path.includes('/students')) return 'Student Registry';
    if (path.includes('/staff')) return 'Staff Management';
    if (path.includes('/finance')) return 'Financial Records';
    if (path.includes('/gallery')) return 'Gallery Administration';
    if (path.includes('/admissions')) return 'Admission Applications';
    if (path.includes('/communications')) return 'Communications & Broadcasts';
    if (path.includes('/cms')) return 'Website CMS';
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar backdrop for mobile overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-all duration-200"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />
      
      <main className="flex-1 lg:ml-64 flex flex-col overflow-hidden h-screen w-full">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center lg:hidden hover:bg-primary/10 transition-colors"
              aria-label="Open sidebar"
            >
               <LayoutDashboard size={20} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 font-display leading-none">{getPageTitle()}</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 hidden sm:block">Faith Foundation Schools Portal</p>
            </div>
          </div>

          <div className="flex gap-6 items-center">
            <div className="hidden md:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl text-[10px] font-bold text-gray-400 border border-gray-100 uppercase tracking-widest">
              Session: 2026/27 &middot; 1st Term
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <div className="w-10 h-10 rounded-full bg-accent border-2 border-white shadow-sm flex items-center justify-center font-bold text-primary text-xs">
                {profile?.full_name?.[0] || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Sandbox Indicator Banner */}
        {isSandbox && (
          <div className="bg-amber-500 text-white py-2 px-8 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between text-xs font-semibold shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold uppercase tracking-wider text-[9px] bg-white text-amber-600 px-2 py-0.5 rounded-md">LOCAL SANDBOX</span>
              <span>Running offline mock mode. Changes persist locally, configure database keys in Settings for live connection.</span>
            </div>
            <button
               onClick={() => {
                 localStorage.removeItem('faith_foundation_sandbox_session');
                 window.location.href = '/login';
               }}
               className="underline text-[10px] font-bold uppercase tracking-wider leading-none shrink-0 hover:text-white/80 active:scale-95 transition-all text-left"
            >
              Exit Sandbox
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#fafafa]">
          {children}
        </div>
      </main>
    </div>
  );
}
