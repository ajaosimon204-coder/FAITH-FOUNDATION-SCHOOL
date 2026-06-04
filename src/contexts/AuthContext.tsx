import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isSandbox: boolean;
  loginAsDemo: (email: string, role: 'admin' | 'staff' | 'student', fullName: string) => void;
  logoutDemo: () => void;
  activeRole: 'admin' | 'staff' | 'student';
  switchRole: (role: 'admin' | 'staff' | 'student') => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isSandbox: false,
  loginAsDemo: () => {},
  logoutDemo: () => {},
  activeRole: 'student',
  switchRole: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSandbox, setIsSandbox] = useState(false);
  const [activeRoleOverride, setActiveRoleOverride] = useState<'admin' | 'staff' | 'student' | null>(() => {
    return localStorage.getItem('ff_admin_active_role') as 'admin' | 'staff' | 'student' | null;
  });

  const activeRole: 'admin' | 'staff' | 'student' = profile?.role === 'admin' 
    ? (activeRoleOverride || 'admin') 
    : (profile?.role || 'student');

  const switchRole = (role: 'admin' | 'staff' | 'student') => {
    localStorage.setItem('ff_admin_active_role', role);
    setActiveRoleOverride(role);
  };

  const loginAsDemo = (email: string, role: 'admin' | 'staff' | 'student', fullName: string) => {
    const demoId = `demo-${role}-id-9999`;
    const mockUser = {
      id: demoId,
      email: email,
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: { full_name: fullName },
      aud: 'authenticated',
      role: 'authenticated'
    } as any as User;

    const mockProfile = {
      id: demoId,
      email: email,
      full_name: fullName,
      role: role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const session = { user: mockUser, profile: mockProfile };
    localStorage.setItem('faith_foundation_sandbox_session', JSON.stringify(session));
    setUser(mockUser);
    setProfile(mockProfile);
    setIsSandbox(true);
    setLoading(false);
  };

  const logoutDemo = () => {
    localStorage.removeItem('faith_foundation_sandbox_session');
    setUser(null);
    setProfile(null);
    setIsSandbox(false);
  };

  useEffect(() => {
    // Monkeypatch Supabase signout to clear sandbox
    const originalSignOut = supabase.auth.signOut.bind(supabase.auth);
    supabase.auth.signOut = async (...args) => {
      localStorage.removeItem('faith_foundation_sandbox_session');
      setUser(null);
      setProfile(null);
      setIsSandbox(false);
      try {
        return await originalSignOut(...args);
      } catch (e) {
        return { error: null } as any;
      }
    };

    // Check initial sandbox session first
    const savedSandbox = localStorage.getItem('faith_foundation_sandbox_session');
    if (savedSandbox) {
      try {
        const parsed = JSON.parse(savedSandbox);
        if (parsed && parsed.user && parsed.profile) {
          setUser(parsed.user);
          setProfile(parsed.profile);
          setIsSandbox(true);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Failed to parse sandboxed session:', e);
      }
    }

    // Safety timeout for loading state
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth initialization timed out. Likely invalid Supabase configuration.');
        setLoading(false);
      }
    }, 5000);

    // Check initial session
    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        // Don't override sandbox session
        if (localStorage.getItem('faith_foundation_sandbox_session')) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          fetchProfile(currentUser.id, currentUser.email);
        } else {
          setLoading(false);
        }
        clearTimeout(timeout);
      }).catch(err => {
        const msg = err?.message || String(err) || '';
        const errStr = (String(err) + ' ' + msg + ' ' + (typeof err === 'object' ? JSON.stringify(err) : '')).toLowerCase();
        const isNetworkError = 
          errStr.includes('fetch') ||
          errStr.includes('network') ||
          errStr.includes('connection') ||
          errStr.includes('dns') ||
          errStr.includes('load failed') ||
          errStr.includes('offline');

        if (isNetworkError) {
          console.warn('Auth boot warning (network error):', msg);
        } else {
          console.warn('Auth boot error:', err);
        }
        // Double check sandbox before turning off loading
        if (!localStorage.getItem('faith_foundation_sandbox_session')) {
          setLoading(false);
        }
        clearTimeout(timeout);
      });
    } catch (e: any) {
      const msg = e?.message || String(e) || '';
      const errStr = (String(e) + ' ' + msg + ' ' + (typeof e === 'object' ? JSON.stringify(e) : '')).toLowerCase();
      const isNetworkError = 
        errStr.includes('fetch') ||
        errStr.includes('network') ||
        errStr.includes('connection') ||
        errStr.includes('dns') ||
        errStr.includes('load failed') ||
        errStr.includes('offline');

      if (isNetworkError) {
        console.warn('Immediate session loader network warning:', msg);
      } else {
        console.warn('Immediate error getting session:', e);
      }
      if (!localStorage.getItem('faith_foundation_sandbox_session')) {
        setLoading(false);
      }
      clearTimeout(timeout);
    }

    // Listen for auth changes
    let authListener: any = null;
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (localStorage.getItem('faith_foundation_sandbox_session')) {
          if (event === 'SIGNED_OUT') {
            logoutDemo();
          }
          return;
        }

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          fetchProfile(currentUser.id, currentUser.email);
        } else {
          setProfile(null);
          setLoading(false);
        }
      });
      authListener = subscription;
    } catch (e) {
      console.error('Failed to subscribe to auth state changes:', e);
    }

    return () => {
      if (authListener) {
        try {
          authListener.unsubscribe();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        let currentProfile = data[0];
        const emailToCheck = userEmail || currentProfile.email;
        if (emailToCheck && ['faithfoundation480@gmail.com', 'ajaosimon3@gmail.com'].includes(emailToCheck.toLowerCase()) && currentProfile.role !== 'admin') {
          const { data: updated, error: upErr } = await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', userId)
            .select();
          if (!upErr && updated && updated.length > 0) {
            currentProfile = updated[0];
          }
        }
        setProfile(currentProfile);
      } else {
        // Handle case where auth user exists but record in users table doesn't yet
        setProfile(null);
      }
    } catch (err: any) {
      const msg = err?.message || String(err) || '';
      const errStr = (String(err) + ' ' + msg + ' ' + (typeof err === 'object' ? JSON.stringify(err) : '')).toLowerCase();
      
      // Build a fallback auto-healing profile for RLS policy bugs or recursion
      const isRecursionOrRls = 
        err?.code === '42P17' || 
        errStr.includes('infinite recursion') || 
        err?.code === '42501' || 
        errStr.includes('policy') || 
        errStr.includes('permission');

      // Attempt to retrieve user safely if state is not fully bound
      let u = user;
      if (!u) {
        try {
          const { data: authData } = await supabase.auth.getUser();
          u = authData?.user || null;
        } catch (_) {
          // Ignore
        }
      }

      if (isRecursionOrRls && u) {
        console.warn('RLS Recursion/Policy issue detected in fetchProfile. Activating auto-healing local fallback profile!');
        const signupRoleFromMeta = u.user_metadata?.role || 'student';
        const finalRole = (u.email && ['faithfoundation480@gmail.com', 'ajaosimon3@gmail.com'].includes(u.email.toLowerCase())) ? 'admin' : signupRoleFromMeta;
        
        const fallbackProfile = {
          id: userId,
          email: u.email || userEmail || '',
          role: finalRole,
          full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
          created_at: u.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setProfile(fallbackProfile);
      } else {
        const isNetworkError = 
          errStr.includes('fetch') ||
          errStr.includes('network') ||
          errStr.includes('connection') ||
          errStr.includes('dns') ||
          errStr.includes('load failed') ||
          errStr.includes('offline');

        if (isNetworkError) {
          console.warn('Profile fetch warning (network error):', msg);
        } else {
          console.warn('Error fetching profile:', err);
        }
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || isSandbox) return;

    let profileChannel: any = null;
    try {
      profileChannel = supabase
        .channel(`profile-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            setProfile(payload.new);
          }
        )
        .subscribe();
    } catch (e) {
      console.error('Error establishing profile database subscription channel:', e);
    }

    return () => {
      if (profileChannel) {
        try {
          supabase.removeChannel(profileChannel);
        } catch (e) {
          // ignore
        }
      }
    };
  }, [user, isSandbox]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isSandbox, loginAsDemo, logoutDemo, activeRole, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
