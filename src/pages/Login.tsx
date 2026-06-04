import React, { useState } from 'react';
import { supabase, isSupabaseConfigured, getSupabaseConfigError } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { School, ArrowRight, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { loginAsDemo, switchRole } = useAuth();
  const [loginPortal, setLoginPortal] = useState<'student' | 'staff' | 'admin'>('student');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRlsSolver, setShowRlsSolver] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Account role repair system
  const [showRoleRepair, setShowRoleRepair] = useState(false);
  const [repairRole, setRepairRole] = useState<'student' | 'staff'>('staff');
  
  const navigate = useNavigate();

  const handleRoleRepair = async () => {
    if (!email || !password) {
      setError('Please fill in your email.AndPassword credentials below first to authenticate this change.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data: { user }, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInErr) throw signInErr;
      if (user) {
        // Correct the metadata in Auth
        await supabase.auth.updateUser({
          data: { role: repairRole }
        });
        
        // Correct the database profile table role
        const { error: profileErr } = await supabase
          .from('users')
          .update({ role: repairRole })
          .eq('id', user.id);
          
        if (profileErr) throw profileErr;
        
        setError(`Success! Changed your account role to "${repairRole === 'staff' ? 'Staff/Teacher' : 'Student'}". Accessing your dashboard...`);
        setShowRoleRepair(false);
        setTimeout(() => {
          switchRole(repairRole);
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      setError(`Adjustment Failed: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if the email belongs to an Admin
    const isAdminEmail = ['faithfoundation480@gmail.com', 'ajaosimon3@gmail.com'].includes(email.toLowerCase());
    
    // Block incorrect portal usage
    if (loginPortal === 'admin' && !isAdminEmail) {
      setError('Access Restricted: This login terminal is reserved exclusively for System Administrators.');
      return;
    }

    const configError = getSupabaseConfigError();
    if (configError) {
      setError(`System Offline: ${configError}`);
      return;
    }

    setLoading(true);
    setError('');
    setShowRlsSolver(false);
    setShowRoleRepair(false);

    try {
      if (isSignUp) {
        const signUpRole = isAdminEmail ? 'admin' : loginPortal;
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: signUpRole,
            },
          },
        });

        if (signUpError) throw signUpError;
        
        if (user) {
          // Always create/upsert the profile during sign-up to pre-populate with selected role
          await supabase.from('users').upsert({
            id: user.id,
            email: email,
            role: signUpRole,
            full_name: fullName || (signUpRole === 'admin' ? 'Super Admin' : signUpRole === 'staff' ? 'Academic Lead' : 'Pupil Portal'),
            updated_at: new Date().toISOString()
          });
          setError('Success! Please check your email for a confirmation link (if enabled) or try logging in.');
          setIsSignUp(false);
        }
      } else {
        const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        if (user) {
          let profile = null;
          try {
            // Check for profile
            const { data: fetchedProfile, error: fetchErr } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();

            if (fetchErr) {
              console.warn('Error reading profile, checking if we can heal:', fetchErr);
              throw fetchErr;
            }
            profile = fetchedProfile;
          } catch (fetchErr: any) {
            const fetchErrMsg = fetchErr?.message || '';
            if (fetchErr?.code === '42P17' || fetchErrMsg.toLowerCase().includes('infinite recursion') || fetchErr?.code === '42501') {
              console.warn('RLS Policy or Recursion error during login profile check. Activating auto-healing!');
              setShowRlsSolver(true);
            } else {
              throw fetchErr;
            }
          }

          if (profile) {
            // Automatic self-healing: If signup metadata states the role was supposed to be different from DB, trust metadata
            const metadataRole = user.user_metadata?.role;
            if (metadataRole && ['staff', 'student', 'admin'].includes(metadataRole) && profile.role !== metadataRole) {
              try {
                const { data: updated, error: updError } = await supabase
                  .from('users')
                  .update({ role: metadataRole })
                  .eq('id', user.id)
                  .select()
                  .maybeSingle();
                if (!updError && updated) {
                  profile = updated;
                }
              } catch (_) {
                // Ignore update errors here and proceed
              }
            }

            // Check role compatibility
            if (loginPortal === 'staff' && profile.role !== 'staff' && profile.role !== 'admin') {
              setError('Portal Error: Your account is registered as a Student. If you are a teacher/staff member, please use the role alignment action below to switch.');
              setRepairRole('staff');
              setShowRoleRepair(true);
              setLoading(false);
              await supabase.auth.signOut();
              return;
            }
            if (loginPortal === 'student' && profile.role !== 'student' && profile.role !== 'admin') {
              setError('Portal Error: Your account is registered as a Staff member. If you are a student, please use the role alignment action below to switch.');
              setRepairRole('student');
              setShowRoleRepair(true);
              setLoading(false);
              await supabase.auth.signOut();
              return;
            }
          }

          // Fallback: If profile missing, create it
          if (!profile) {
            const signupRoleFromMeta = user.user_metadata?.role || loginPortal;
            const finalRole = (user.email === 'faithfoundation480@gmail.com' || user.email === 'ajaosimon3@gmail.com') ? 'admin' : signupRoleFromMeta;
            
            try {
              const { data: newProfile, error: createError } = await supabase.from('users').upsert({
                id: user.id,
                email: email,
                role: finalRole,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                updated_at: new Date().toISOString()
              }, { onConflict: 'id' }).select().single();
              
              if (createError) {
                console.warn('Profile creation error during login:', createError);
                if (createError.code === '42P17' || createError.message?.toLowerCase().includes('infinite recursion') || createError.code === '42501') {
                  console.warn('Using fallback profile due to RLS issues on creation.');
                  profile = {
                    id: user.id,
                    email: user.email!,
                    role: finalRole,
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    created_at: user.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  };
                  setShowRlsSolver(true);
                } else {
                  throw createError;
                }
              } else {
                profile = newProfile;
              }
            } catch (createErr: any) {
              const createErrMsg = createErr?.message || '';
              if (createErr?.code === '42P17' || createErrMsg.toLowerCase().includes('infinite recursion') || createErr?.code === '42501') {
                console.warn('Using catch fallback profile due to RLS issues on creation.');
                profile = {
                  id: user.id,
                  email: user.email!,
                  role: finalRole,
                  full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                  created_at: user.created_at || new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                setShowRlsSolver(true);
              } else {
                throw createErr;
              }
            }
          } else {
            // Self-healing: If profile exists, but user email matches admin emails and role in DB is not admin, correct it
            const isAdminEmail = user.email && ['faithfoundation480@gmail.com', 'ajaosimon3@gmail.com'].includes(user.email.toLowerCase());
            if (isAdminEmail && profile.role !== 'admin') {
              try {
                const { data: updatedProfile, error: updateError } = await supabase
                  .from('users')
                  .update({ role: 'admin' })
                  .eq('id', user.id)
                  .select()
                  .maybeSingle();
                if (!updateError && updatedProfile) {
                  profile = updatedProfile;
                }
              } catch (_) {
                // Ignore correction error
              }
            }
          }

          // Final Check: Navigate if profile exists (either fetched or healed fallback)
          if (profile) {
            switchRole(loginPortal);
            navigate('/dashboard');
          } else if (!error) {
            await supabase.auth.signOut();
          }
        }
      }
    } catch (err: any) {
      const msg = err?.message || JSON.stringify(err) || String(err) || '';
      const errStr = (String(err) + ' ' + msg + ' ' + (typeof err === 'object' ? JSON.stringify(err) : '')).toLowerCase();
      const isNetworkError = 
        errStr.includes('fetch') ||
        errStr.includes('network') ||
        errStr.includes('connection') ||
        errStr.includes('dns') ||
        errStr.includes('load failed') ||
        errStr.includes('offline');

      if (isNetworkError) {
        console.warn('Network Error during login (connection failure):', msg);
      } else {
        console.warn('Auth error detail:', err);
      }
      
      if (err?.code === '42P17' || errStr.includes('infinite recursion') || msg.toLowerCase().includes('infinite recursion')) {
        setError('Profile Sync Failed: infinite recursion detected in policy for relation "users" (Code: 42P17)');
        setShowRlsSolver(true);
      } else if (msg.toLowerCase().includes('api key')) {
        setError('CRITICAL: Your Supabase ANON KEY is invalid. Ensure you copied the "anon" "public" key from Supabase.');
      } else if (msg.includes('Invalid login credentials')) {
        setError('Invalid email or password. If you haven\'t created an account yet, click "Create one now" below.');
      } else if (isNetworkError) {
        setError('Connection Failed: Could not contact your Supabase URL. This can happen if your internet is offline, your Supabase project was paused or deleted, or if the VITE_SUPABASE_URL setting in your hosting configuration is incorrect. You can still test and experience the portal fully using the "Local Sandbox Mode" options below!');
      } else {
        setError(`${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
              <School className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-display font-bold text-primary block leading-none">FAITH FOUNDATION</span>
              <span className="text-xs text-secondary font-bold tracking-[0.2em] uppercase">Enterprise Portal</span>
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-1 font-display">
            {loginPortal === 'admin' ? 'Administrative LogIn' : (isSignUp ? 'Create Account' : 'Welcome Back')}
          </h2>
          <p className="text-sm text-gray-500">
            {loginPortal === 'admin' 
              ? 'Institutional Admin Portal Terminal' 
              : loginPortal === 'staff'
                ? (isSignUp ? 'Apply for staff access' : 'Access your staff portal')
                : (isSignUp ? 'Apply for student access' : 'Access your student portal')}
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-8 lg:p-10 rounded-[32px] shadow-xl transition-all duration-500 border ${
            loginPortal === 'admin' 
              ? 'bg-slate-950 text-white border-amber-500/30 shadow-amber-500/5' 
              : 'bg-white text-gray-900 border-gray-100 shadow-gray-200/50'
          }`}
        >
          {/* Segmented Control Selector Tabs - 3 Portals */}
          <div className={`grid grid-cols-3 p-1.5 rounded-2xl mb-8 ${loginPortal === 'admin' ? 'bg-slate-900' : 'bg-gray-100'}`}>
            <button
              type="button"
              onClick={() => {
                setLoginPortal('student');
                setError('');
                setIsSignUp(false);
              }}
              className={`py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all text-center ${
                loginPortal === 'student'
                  ? 'bg-white text-primary shadow-sm'
                  : loginPortal === 'admin'
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-805'
              }`}
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginPortal('staff');
                setError('');
                setIsSignUp(false);
              }}
              className={`py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all text-center ${
                loginPortal === 'staff'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : loginPortal === 'admin'
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-805'
              }`}
            >
              🌿 Staff
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginPortal('admin');
                setError('');
                setIsSignUp(false);
              }}
              className={`py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all text-center ${
                loginPortal === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-805'
              }`}
            >
              💼 Admin
            </button>
          </div>

          {error && (
            <div className={`mb-6 p-4 rounded-2xl flex flex-col gap-3 text-sm animate-shake ${
              error.includes('Success') 
                ? 'bg-green-50 border border-green-100 text-green-600' 
                : (loginPortal === 'admin' ? 'bg-rose-950/50 border border-rose-900 text-rose-300' : 'bg-red-50 border border-red-100 text-red-600')
            }`}>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
              {showRoleRepair && (
                <button
                  type="button"
                  onClick={handleRoleRepair}
                  className="mt-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  🛠️ Convert My Account to {repairRole === 'staff' ? 'Staff' : 'Student'} & Log In
                </button>
              )}
            </div>
          )}

          {showRlsSolver && (
            <div className={`mb-6 p-4 rounded-2xl text-xs text-left font-mono ${loginPortal === 'admin' ? 'bg-slate-900 text-slate-300 border border-slate-800' : 'bg-slate-900 text-slate-200 border border-slate-800'}`}>
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                <span className="text-primary font-sans font-bold text-sm">💡 Fix Infinite RLS Recursion</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`-- Run this fully recursion-proof RLS fix in your Supabase SQL Editor
-- 1. DROP ALL existing policies on public.users to clear any hidden ones causing recursion
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

-- 2. CREATE clean, recursion-proof policies using JWT metadata
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
  );`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000);
                  }}
                  className="px-2.5 py-1 bg-primary text-white font-sans font-bold rounded-lg text-xs hover:bg-opacity-90 active:scale-95 transition-all outline-none"
                >
                  {copied ? 'Copied ✅' : 'Copy Fix SQL'}
                </button>
              </div>
              <p className="mb-2 font-sans text-slate-400">
                This recursion happens because one of your policies on the "users" table does a SELECT query on "users" itself. Run this script in the <strong>Supabase SQL Editor</strong> to securely fix it instantly:
              </p>
              <pre className="p-2 bg-slate-950 rounded border border-slate-800 text-[10px] overflow-x-auto whitespace-pre leading-relaxed font-mono select-all text-emerald-400 max-h-48">
{`-- 1. DROP ALL existing policies on public.users to clear any hidden ones causing recursion
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

-- 2. CREATE clean, recursion-proof policies using JWT metadata
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
  );`}
              </pre>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            {isSignUp && loginPortal !== 'admin' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className={`block text-sm font-bold mb-2 ml-1 ${loginPortal === 'admin' ? 'text-amber-400 font-display' : 'text-gray-750'}`}>
                {loginPortal === 'admin' ? 'Administrator Email' : 'Institutional Email'}
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${loginPortal === 'admin' ? 'text-slate-500 group-focus-within:text-amber-400' : 'text-gray-400 group-focus-within:text-primary'}`}>
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-11 pr-4 py-4 rounded-2xl outline-none transition-all ${
                    loginPortal === 'admin'
                      ? 'bg-slate-900 border border-slate-800 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500'
                      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white'
                  }`}
                  placeholder={loginPortal === 'admin' ? 'faithfoundation480@gmail.com' : 'name@email.com'}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className={`block text-sm font-bold ${loginPortal === 'admin' ? 'text-slate-300' : 'text-gray-700'}`}>Security Password</label>
                {!isSignUp && (
                  <Link 
                    to="#" 
                    className={`text-xs font-bold transition-colors ${loginPortal === 'admin' ? 'text-amber-400 hover:text-amber-300' : 'text-primary hover:underline'}`}
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${loginPortal === 'admin' ? 'text-slate-500 group-focus-within:text-amber-400' : 'text-gray-400 group-focus-within:text-primary'}`}>
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-11 pr-4 py-4 rounded-2xl outline-none transition-all ${
                    loginPortal === 'admin'
                      ? 'bg-slate-900 border border-slate-800 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500'
                      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white'
                  }`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-lg active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-xl mt-8 ${
                loginPortal === 'admin'
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/10'
                  : loginPortal === 'staff'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/10'
                    : 'bg-primary text-white hover:bg-opacity-90 shadow-primary/20'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? "Create Account" : "Access Portal")}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          {loginPortal !== 'admin' && (
            <div className="mt-8 text-center border-b border-dashed border-gray-100 pb-6">
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm font-medium text-gray-500 hover:text-primary transition-colors"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Create one now"}
              </button>
            </div>
          )}

          {/* Sandbox Bypass options */}
          <div className="mt-6 text-center">
            <p className={`text-[10px] font-black uppercase tracking-[0.16em] mb-3 ${loginPortal === 'admin' ? 'text-amber-500/50' : 'text-slate-400'}`}>
              Or Use Local Sandbox bypass
            </p>
            <div className="flex flex-col gap-2">
              {loginPortal === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    loginAsDemo('faithfoundation480@gmail.com', 'admin', 'Portal Administrator');
                    navigate('/dashboard');
                  }}
                  className="w-full py-3 px-4 border border-amber-500/30 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 font-black text-xs rounded-xl transition-all text-center uppercase tracking-wider"
                >
                  ⚡ Enter Admin Portal (Sandbox)
                </button>
              )}
              {loginPortal === 'staff' && (
                <button
                  type="button"
                  onClick={() => {
                    loginAsDemo('staff@faithfoundation.com', 'staff', 'Principal Instructor');
                    navigate('/dashboard');
                  }}
                  className="w-full py-3 px-4 border border-emerald-250 text-emerald-600 bg-emerald-50/20 hover:bg-emerald-50/40 font-bold text-xs rounded-xl transition-all text-center uppercase tracking-wider"
                >
                  🌿 Enter Staff Portal (Sandbox)
                </button>
              )}
              {loginPortal === 'student' && (
                <button
                  type="button"
                  onClick={() => {
                    loginAsDemo('student@faithfoundation.com', 'student', 'Demo Pupil');
                    navigate('/dashboard');
                  }}
                  className="w-full py-3 px-4 border border-rose-220 text-rose-600 bg-rose-50/20 hover:bg-rose-50/40 font-bold text-xs rounded-xl transition-all text-center uppercase tracking-wider"
                >
                  🎓 Enter Student Portal (Sandbox)
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <div className="mt-10 text-center space-y-4">
          <p className="text-sm text-gray-500 font-medium">
            New student? <Link to="/admissions" className="text-primary font-bold hover:underline">Apply here</Link>
          </p>
          <div className="flex items-center justify-center gap-6">
            <Link to="/about" className="text-xs text-gray-400 hover:text-gray-600 font-medium tracking-wide flex items-center gap-1 uppercase">
              Support
            </Link>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 font-medium tracking-wide flex items-center gap-1 uppercase">
              School Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
