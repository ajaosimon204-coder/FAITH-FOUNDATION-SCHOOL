import React from 'react';
import {HashRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {LayoutDashboard, Users} from 'lucide-react';
import {AuthProvider, useAuth} from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import Admissions from './pages/Admissions';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import News from './pages/News';
import Login from './pages/Login';
import ScrollToTop from './components/ScrollToTop';

// Portal Wrapper
import DashboardLayout from './components/DashboardLayout';
import FloatingActions from './components/FloatingActions';

// Portals
import AdminDashboard from './pages/dashboard/AdminDashboard';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import StaffDashboard from './pages/dashboard/StaffDashboard';
import { getSupabaseConfigError } from './lib/supabase';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const DashboardRedirect = () => {
  const { profile, loading, user, activeRole } = useAuth();
  const configError = getSupabaseConfigError();

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-bold text-primary animate-pulse">Loading Site Content...</p>
      </div>
    </div>
  );

  if (configError) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-8">
        <div className="max-w-xl w-full bg-white p-10 rounded-[32px] shadow-xl border border-amber-100 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-6">
             <LayoutDashboard size={32} />
          </div>
          <h2 className="text-2xl font-black text-amber-900 uppercase tracking-tight mb-2">Build Configuration Missing</h2>
          <p className="text-sm text-slate-500 mb-6 font-medium">Your portal is currently in "Offline Mode" because the production environment variables are not set in your hosting provider (Netlify).</p>
          <div className="bg-slate-50 p-6 rounded-2xl text-left border border-slate-100 mb-8 space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Diagnostic Info:</p>
            <p className="text-xs font-mono text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">{configError}</p>
            <p className="text-[10px] text-slate-400 leading-relaxed italic">Tip: In Netlify, ensure the variables are checked for "Production" branch, not just "Branch-specific".</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest text-xs"
          >
            I've updated my settings, Reload
          </button>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (!profile) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-white rounded-[40px] border border-slate-100 p-12 text-center shadow-sm">
        <div className="max-w-sm">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-8 shadow-sm">
            <Users size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Access Denied</h2>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            Your login was successful, but we couldn't find your profile in the database. 
            Please ensure you have run the <span className="font-bold text-primary">Database Setup</span> script in your Supabase SQL Editor.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => {
                import('./lib/supabase').then(({ supabase }) => {
                  supabase.auth.signOut().then(() => window.location.href = '/');
                });
              }}
              className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-100 transition-colors"
            >
              Sign Out & Restart
            </button>
          </div>
        </div>
      </div>
    );
  }

  switch (activeRole) {
    case 'admin': return <AdminDashboard />;
    case 'staff': return <StaffDashboard />;
    case 'student': return <StudentDashboard />;
    default: return <Navigate to="/" />;
  }
};

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/admissions" element={<Admissions />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/news" element={<News />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />

            {/* Portal Routes */}
            <Route path="/dashboard/*" element={
              <PrivateRoute>
                <DashboardLayout>
                  <DashboardRedirect />
                </DashboardLayout>
              </PrivateRoute>
            } />
            
            {/* Detailed Routes (Add as needed) */}
            {/* 404 Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <FloatingActions />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}
