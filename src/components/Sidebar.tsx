import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  CreditCard, 
  Settings, 
  LogOut, 
  Users, 
  ClipboardCheck, 
  Image as ImageIcon,
  FileText,
  MessageSquare,
  Trophy,
  Tv
} from 'lucide-react';

export const Sidebar = () => {
  const { profile, activeRole, switchRole } = useAuth();
  const role = activeRole;

  const adminLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/dashboard/students', icon: Users, label: 'Students' },
    { to: '/dashboard/staff', icon: GraduationCap, label: 'Staff' },
    { to: '/dashboard/finance', icon: CreditCard, label: 'Finance' },
    { to: '/dashboard/gallery', icon: ImageIcon, label: 'Gallery Admin' },
    { to: '/dashboard/admissions', icon: ClipboardCheck, label: 'Admissions' },
    { to: '/dashboard/communications', icon: MessageSquare, label: 'Communications' },
    { to: '/dashboard/cms', icon: Settings, label: 'Website Editor' },
  ];

  const studentLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/dashboard/results', icon: FileText, label: 'Report Card' },
    { to: '/dashboard/lms', icon: BookOpen, label: 'Learning' },
    { to: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
    { to: '/dashboard/attendance', icon: Calendar, label: 'Attendance' },
    { to: '/dashboard/awards', icon: Trophy, label: 'Awards' },
    { to: '/dashboard/cbt', icon: Tv, label: 'CBT Exam' },
    { to: '/dashboard/communications', icon: MessageSquare, label: 'Communications' },
  ];

  const staffLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/dashboard/grading', icon: ClipboardCheck, label: 'Grading' },
    { to: '/dashboard/materials', icon: BookOpen, label: 'Materials' },
    { to: '/dashboard/attendance-teacher', icon: Calendar, label: 'Tracking' },
    { to: '/dashboard/communications', icon: MessageSquare, label: 'Communications' },
  ];

  const links = role === 'admin' ? adminLinks : role === 'staff' ? staffLinks : studentLinks;

  return (
    <aside className="w-64 bg-primary flex flex-col p-6 text-white shrink-0 h-screen fixed left-0 top-0 overflow-y-auto hidden lg:flex">
      <div className="mb-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-primary text-xl border-2 border-accent">FF</div>
        <div>
          <h1 className="text-sm font-bold leading-tight uppercase tracking-tight font-display">Faith Foundation</h1>
          <p className="text-[10px] text-blue-200">Schools · ERP v1.0</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard'}
            className={({ isActive }) => `
              flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all group
              ${isActive 
                ? 'bg-white/10 border-l-4 border-accent text-white' 
                : 'hover:bg-white/5 text-blue-200 hover:text-white'}
            `}
          >
            <link.icon size={18} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {profile?.role === 'admin' && (
        <div className="mt-auto mb-4 bg-white/5 border border-white/10 rounded-xl p-3 shrink-0">
          <p className="text-[9px] uppercase font-bold text-accent tracking-widest mb-2">System Admin Control</p>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => {
                switchRole('admin');
                window.location.hash = '#/dashboard';
              }}
              className={`py-1.5 px-1 rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center ${
                activeRole === 'admin' 
                  ? 'bg-accent text-primary shadow-sm' 
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
              title="Switch to Admin Dashboard"
            >
              Admin
            </button>
            <button
              onClick={() => {
                switchRole('staff');
                window.location.hash = '#/dashboard';
              }}
              className={`py-1.5 px-1 rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center ${
                activeRole === 'staff' 
                  ? 'bg-accent text-primary shadow-sm' 
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
              title="Switch to Teacher Dashboard"
            >
              Teacher
            </button>
            <button
              onClick={() => {
                switchRole('student');
                window.location.hash = '#/dashboard';
              }}
              className={`py-1.5 px-1 rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center ${
                activeRole === 'student' 
                  ? 'bg-accent text-primary shadow-sm' 
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
              title="Switch to Pupil Dashboard"
            >
              Pupil
            </button>
          </div>
        </div>
      )}

      <div className="pt-6 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center font-bold text-xs text-primary">{profile?.full_name?.[0] || 'U'}</div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold truncate">{profile?.full_name || 'User Account'}</p>
            <div 
              onClick={() => supabase.auth.signOut()}
              className="text-[10px] text-blue-200 opacity-70 truncate uppercase tracking-widest cursor-pointer hover:text-white flex items-center gap-1"
            >
              <LogOut size={10} /> Sign Out
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
