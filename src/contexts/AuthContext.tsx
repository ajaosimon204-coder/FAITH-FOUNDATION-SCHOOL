import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isSandbox: boolean;
  loginAsDemo: (email: string, role: 'admin' | 'staff' | 'student', fullName: string) => void;
  loginAsStudent: (student: any) => void;
  logoutDemo: () => void;
  activeRole: 'admin' | 'staff' | 'student';
  switchRole: (role: 'admin' | 'staff' | 'student') => void;
  runProfileDiagnostic: (userId: string, userEmail?: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isSandbox: false,
  loginAsDemo: () => {},
  loginAsStudent: () => {},
  logoutDemo: () => {},
  activeRole: 'student',
  switchRole: () => {},
  runProfileDiagnostic: async () => ({})
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
    localStorage.setItem('ff_admin_active_role', role);
    setActiveRoleOverride(role);

    const demoId = `demo-${role}-id-9999`;
    const mockUser = {
      id: demoId,
      email: email,
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: { full_name: fullName, role: role },
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

  const loginAsStudent = (student: any) => {
    localStorage.setItem('ff_admin_active_role', 'student');
    setActiveRoleOverride('student');

    const realStudentId = student.id;
    const parentEmail = student.parentEmail || `${student.id}@faithfoundation.edu.ng`;
    const mockUser = {
      id: realStudentId,
      email: parentEmail,
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: { full_name: student.name, role: 'student' },
      aud: 'authenticated',
      role: 'authenticated'
    } as any as User;

    const studentProfile = {
      id: realStudentId,
      studentId: realStudentId,
      email: parentEmail,
      full_name: student.name,
      role: 'student',
      studentClass: student.class,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...student
    };

    const session = { user: mockUser, profile: studentProfile };
    localStorage.setItem('faith_foundation_sandbox_session', JSON.stringify(session));
    setUser(mockUser);
    setProfile(studentProfile);
    setIsSandbox(false);
    setLoading(false);

    // Also sync ff_student_report_card to let dashboards read results correctly
    const studentReportCardsMapStr = localStorage.getItem('ff_student_report_cards_map');
    let hasCard = false;
    if (studentReportCardsMapStr) {
      try {
        const map = JSON.parse(studentReportCardsMapStr);
        const studentCard = map[student.id];
        if (studentCard) {
          localStorage.setItem('ff_student_report_card', JSON.stringify(studentCard));
          hasCard = true;
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (!hasCard) {
      localStorage.removeItem('ff_student_report_card');
    }
  };

  const logoutDemo = () => {
    localStorage.removeItem('faith_foundation_sandbox_session');
    localStorage.removeItem('ff_admin_active_role');
    setUser(null);
    setProfile(null);
    setIsSandbox(false);
    setActiveRoleOverride(null);
  };

  useEffect(() => {
    // Monkeypatch Supabase signout to clear sandbox
    const originalSignOut = supabase.auth.signOut.bind(supabase.auth);
    supabase.auth.signOut = async (...args) => {
      localStorage.removeItem('faith_foundation_sandbox_session');
      localStorage.removeItem('ff_admin_active_role');
      setUser(null);
      setProfile(null);
      setIsSandbox(false);
      setActiveRoleOverride(null);
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
          setIsSandbox(parsed.profile?.role !== 'student');
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
      supabase.auth.getSession().then((res) => {
        // Don't override sandbox session
        if (localStorage.getItem('faith_foundation_sandbox_session')) return;

        const errVal = res?.error;
        const errMsg = errVal?.message || '';
        const isRefreshTokenError = 
          errMsg.toLowerCase().includes('refresh token') || 
          errMsg.toLowerCase().includes('invalid_grant');

        if (isRefreshTokenError) {
          console.warn('Handling invalid refresh token by clearing local storage supabase auth keys:', errMsg);
          Object.keys(localStorage).forEach(k => {
            if (k.startsWith('sb-') && k.includes('-auth-token')) {
              localStorage.removeItem(k);
            }
          });
          supabase.auth.signOut().catch(() => {});
          setUser(null);
          setLoading(false);
          clearTimeout(timeout);
          return;
        }

        const session = res?.data?.session ?? null;
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

        if (errStr.includes('refresh token') || errStr.includes('invalid_grant')) {
          console.warn('Caught refresh token error in catch block, purging invalid token data...');
          Object.keys(localStorage).forEach(k => {
            if (k.startsWith('sb-') && k.includes('-auth-token')) {
              localStorage.removeItem(k);
            }
          });
          supabase.auth.signOut().catch(() => {});
        }

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

  const runProfileDiagnostic = async (userId: string, userEmail?: string): Promise<any> => {
    console.info(`%c [Diagnostic Tracker] Initiating profile propagation analysis for user ID: ${userId}`, 'background: #0d1117; color: #58a6ff; font-weight: bold; padding: 4px;');
    const report: any = {
      timestamp: new Date().toISOString(),
      userId,
      userEmail,
      authUser: null,
      usersTableRecord: null,
      profilesTableRecord: null,
      teachersTableRecord: null,
      success: false,
      actionsTaken: []
    };

    try {
      // 1. Fetch current auth user state
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('[Diagnostic Tracker] Error retrieving authenticated user info:', authError);
        report.authError = authError.message;
      } else {
        report.authUser = authUser;
        console.log('[Diagnostic Tracker] Current authenticated user metadata:', authUser?.user_metadata);
      }

      // 2. Query public.users table (main profiles table in this app)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId);

      if (usersError) {
        console.error('[Diagnostic Tracker] Error querying public.users table:', usersError);
        report.usersError = usersError.message;
      } else {
        report.usersTableRecord = usersData?.[0] || null;
        console.log('[Diagnostic Tracker] public.users table query result:', usersData);
      }

      // 3. Query public.profiles table (fallback check in case of legacy system references)
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId);
        if (!profilesError && profilesData) {
          report.profilesTableRecord = profilesData[0] || null;
          console.log('[Diagnostic Tracker] Optional public.profiles table check query result:', profilesData);
        }
      } catch (e) {
        console.log('[Diagnostic Tracker] Bypassing optional profiles table check (table structure may be mapped to public.users).');
      }

      // 4. Query public.teachers table
      try {
        const { data: teachersData } = await supabase
          .from('teachers')
          .select('*')
          .eq('user_id', userId);
        report.teachersTableRecord = teachersData?.[0] || null;
        console.log('[Diagnostic Tracker] public.teachers table query result:', teachersData);
      } catch (e) {
        console.error('[Diagnostic Tracker] Error querying public.teachers table:', e);
      }

      // 5. Build parameters for fallback generation
      const email = authUser?.email || userEmail || '';
      const signupRole = authUser?.user_metadata?.role || 'student';
      const fullName = authUser?.user_metadata?.full_name || email.split('@')[0] || 'Academic Instructor';

      // 6. Actively create the profile record in public.users if missing
      if (!report.usersTableRecord) {
        console.warn(`%c [Diagnostic Tracker] GAP DETECTED: Missing profile in 'public.users' for ${email}. Auto-generating...`, 'background: #3a1d1d; color: #ff7b72; padding: 2px;');
        
        const newProfile = {
          id: userId,
          email: email,
          role: signupRole,
          full_name: fullName,
          updated_at: new Date().toISOString()
        };

        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .upsert(newProfile)
          .select();

        if (insertError) {
          console.error('[Diagnostic Tracker] Critical error writing to public.users:', insertError);
          report.actionsTaken.push(`Failed to insert into public.users: ${insertError.message}`);
        } else {
          console.info('[Diagnostic Tracker] Corrected missing public.users (profile) record successfully.', insertedUser);
          report.usersTableRecord = insertedUser?.[0] || newProfile;
          report.actionsTaken.push('Auto-created missing profile record in public.users');
        }
      }

      // 7. Actively create in public.profiles table if the table exists (for full assurance)
      try {
        const profileRecord = {
          id: userId,
          email: email,
          role: signupRole,
          full_name: fullName,
          updated_at: new Date().toISOString()
        };
        const { error: pError } = await supabase
          .from('profiles')
          .upsert(profileRecord);
        if (!pError) {
          console.info('[Diagnostic Tracker] Successfully populated optional public.profiles record.');
          report.actionsTaken.push('Populated public.profiles records table');
        }
      } catch (_) {
        // Safe to ignore if table does not exist
      }

      // 8. If the user is staff, ensure the public.teachers dossier exists and is fully populated
      if (signupRole === 'staff') {
        const { data: teacherRow } = await supabase
          .from('teachers')
          .select('*')
          .eq('email', email);

        if (!teacherRow || teacherRow.length === 0) {
          console.warn('[Diagnostic Tracker] GAP DETECTED: Missing teacher roster dossier. Auto-healing now...');
          
          const metaPhone = authUser?.user_metadata?.phone || '08123456789';
          const metaQual = authUser?.user_metadata?.qualification || 'B.Ed';
          const metaExp = authUser?.user_metadata?.experience || '3-5 Years';
          const metaBio = authUser?.user_metadata?.bio || 'Dedicated educational instructor.';
          const metaRole = authUser?.user_metadata?.role_field || 'Academic Instructor';
          const metaSalary = authUser?.user_metadata?.salary || '₦250,000 / month';

          const teacherId = `STF-${Math.floor(1000 + Math.random() * 9000)}`;
          const bioReviewText = `${metaQual} • ${metaExp} Experience • ${metaBio}`;

          const { error: teacherInsErr } = await supabase.from('teachers').insert({
            id: teacherId,
            user_id: userId,
            name: fullName,
            role: metaRole,
            email: email,
            phone: metaPhone,
            photo_url: '',
            date_of_appointment: new Date().toISOString().split('T')[0],
            salary: metaSalary,
            award: 'Associate Instructor Badge',
            punctuality_attendance: '100%',
            regularity_attendance: '100%',
            rating: '5.0',
            review: bioReviewText
          });

          if (teacherInsErr) {
            console.error('[Diagnostic Tracker] Error inserting staff roster:', teacherInsErr);
            report.actionsTaken.push(`Failed to insert teacher roster: ${teacherInsErr.message}`);
          } else {
            console.log('[Diagnostic Tracker] Restored missing staff teachers roster record!');
            report.actionsTaken.push('Auto-created missing staff roster in public.teachers');
          }
        }
      }

      report.success = true;
    } catch (err: any) {
      console.error('[Diagnostic Tracker] Failed to run profile propagation diagnostic scan:', err);
      report.fatalError = err?.message || String(err);
    }

    console.info('%c [Diagnostic Tracker] Diagnostics scan finished. Report details below:', 'background: #0d1117; color: #58a6ff; font-weight: bold; padding: 4px;', report);
    return report;
  };

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

        // Auto-heal missing teacher dossiers in database for authenticated staff
        if (currentProfile?.role === 'staff') {
          try {
            const { data: teacherRow } = await supabase
              .from('teachers')
              .select('*')
              .eq('email', currentProfile.email);

            if (!teacherRow || teacherRow.length === 0) {
              console.log('No teacher roster found for validated staff, auto-healing...');
              
              // Safely grab user-metadata or defaults
              let metaPhone = '';
              let metaQual = 'B.Ed';
              let metaExp = '3-5 Years';
              let metaBio = 'Dedicated educational instructor.';
              let metaRole = 'Academic Instructor';
              let metaSalary = '₦250,000 / month';

              try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser && authUser.user_metadata) {
                  const uMeta = authUser.user_metadata;
                  metaPhone = uMeta.phone || '';
                  metaQual = uMeta.qualification || 'B.Ed';
                  metaExp = uMeta.experience || '3-5 Years';
                  metaBio = uMeta.bio || 'Dedicated educational instructor.';
                  metaRole = uMeta.role_field || 'Academic Instructor';
                  metaSalary = uMeta.salary || '₦250,000 / month';
                }
              } catch (_) {
                // Ignore failure to fetch auth-user
              }

              const teacherId = `STF-${Math.floor(1000 + Math.random() * 9000)}`;
              const bioReviewText = `${metaQual} • ${metaExp} Experience • ${metaBio}`;

              await supabase.from('teachers').insert({
                id: teacherId,
                user_id: userId,
                name: currentProfile.full_name || 'Academic Instructor',
                role: metaRole,
                email: currentProfile.email,
                phone: metaPhone || '08123456789',
                photo_url: '',
                date_of_appointment: new Date().toISOString().split('T')[0],
                salary: metaSalary,
                award: 'Associate Instructor Badge',
                punctuality_attendance: '100%',
                regularity_attendance: '100%',
                rating: '5.0',
                review: bioReviewText
              });
              console.log('Successfully self-healed missing teacher roster record!');
            }
          } catch (autoErr) {
            console.error('Error auto-healing teacher profile on load:', autoErr);
          }
        }
      } else {
        // Handle case where auth user exists but record in users table doesn't yet - run diagnostic and heal
        console.warn(`[AuthContext] No profile found in 'users' table on load for user ${userId}. Running diagnostics...`);
        const diagReport = await runProfileDiagnostic(userId, userEmail);
        if (diagReport && diagReport.success && diagReport.usersTableRecord) {
          console.info('[AuthContext] Diagnostic auto-created missing user profile record.');
          setProfile(diagReport.usersTableRecord);
        } else {
          setProfile(null);
        }
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
    <AuthContext.Provider value={{ user, profile, loading, isSandbox, loginAsDemo, loginAsStudent, logoutDemo, activeRole, switchRole, runProfileDiagnostic }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
