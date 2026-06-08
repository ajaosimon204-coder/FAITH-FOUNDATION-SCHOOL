import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, getSupabaseConfigError } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { School, ArrowRight, Lock, Mail, AlertCircle, Loader2, Phone, KeyRound, CheckCircle, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

// Simple, fast client-side SHA-255 / SHA-256 implementation using native Web Crypto
async function sha256(message: string): Promise<string> {
  try {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // Basic fallback for environments with restricted crypto subtle access
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return 'fallback_hash_' + Math.abs(hash).toString(16);
  }
}

export default function Login() {
  const { loginAsDemo, loginAsStudent, switchRole } = useAuth();
  const [loginPortal, setLoginPortal] = useState<'student' | 'staff' | 'admin'>('student');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Standard (staff / admin) fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Student specific fields
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // First Login Wizard Security states
  const [firstLoginStudent, setFirstLoginStudent] = useState<any | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('What was the name of your first primary school?');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [verifyParentPhoneInput, setVerifyParentPhoneInput] = useState('');

  // Password Recovery States
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<1 | 2 | 3 | 4>(1); // 1: Adm no, 2: Contacts, 3: OTP, 4: Reset
  const [recoveryStudent, setRecoveryStudent] = useState<any | null>(null);
  const [recoverySelectMethod, setRecoverySelectMethod] = useState<'phone' | 'email'>('phone');
  const [recoveryContactValInput, setRecoveryContactValInput] = useState('');
  const [recoveryOtpCode, setRecoveryOtpCode] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [otpVerifyError, setOtpVerifyError] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');

  const navigate = useNavigate();

  // Load students for portal checking
  const [students, setStudents] = useState<any[]>([]);
  useEffect(() => {
    import('../lib/sync').then(({ syncFetchStudents }) => {
      syncFetchStudents().then(list => {
        setStudents(list);
      });
    });
  }, [loading]);

  const handleStudentPortalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!admissionNumber.trim() || !studentPassword) {
      setError('Please provide both your Unique Admission Number and Password.');
      setLoading(false);
      return;
    }

    // Find student
    const normAdm = admissionNumber.trim().toUpperCase();
    const student = students.find(s => s.id?.toUpperCase() === normAdm);

    if (!student) {
      setError(`Admission ID "${admissionNumber}" is not registered on this server. Verify your card format (e.g. FFP/2026/001) or contact admissions.`);
      setLoading(false);
      return;
    }

    if (student.accountDisabled) {
      setError('Your Student Portal access has been administratively disabled. Please consult the school cashier or principal.');
      setLoading(false);
      return;
    }

    // Determine if first login
    const isFirstLogin = !student.portalPasswordHash;

    if (isFirstLogin) {
      // Compare password directly with parentPhone
      const normInputPass = studentPassword.trim();
      const normParentPhone = student.parentPhone ? student.parentPhone.trim() : '';

      if (normInputPass === normParentPhone && normParentPhone !== '') {
        // Authenticated! Trigger configuration wizard
        setFirstLoginStudent(student);
        setWizardStep(1);
        setNewPassword('');
        setConfirmPassword('');
        setSecurityQuestion('What was the name of your first primary school?');
        setSecurityAnswer('');
        setVerifyParentPhoneInput('');
        setLoading(false);
      } else {
        setError('Incorrect Default Credentials. For first-time setups, your password is the registered parent/guardian phone number.');
        setLoading(false);
      }
    } else {
      // Regular login
      const hashedPass = await sha256(studentPassword + student.portalSalt);
      if (hashedPass === student.portalPasswordHash) {
        // Password matches! Log activity
        const browser = navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop';
        const dummyIp = `197.210.64.${Math.floor(2 + Math.random() * 250)}`;
        const freshHistory = [
          {
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            device: `${browser} Browser via Faith Portal Client`,
            ip: dummyIp
          },
          ...(student.loginHistory || [])
        ];

        const updatedStudent = {
          ...student,
          loginHistory: freshHistory
        };

        // Save updated list
        const updatedList = students.map(s => s.id === student.id ? updatedStudent : s);
        localStorage.setItem('ff_students', JSON.stringify(updatedList));

        // Let useAuth wrap it
        loginAsStudent(updatedStudent);
        setLoading(false);
        navigate('/dashboard');
      } else {
        setError('Invalid Admission Number or Portal Password. Please try again or use the self-service recovery below.');
        setLoading(false);
      }
    }
  };

  const handleFirstLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (wizardStep === 1) {
      if (newPassword.length < 6) {
        setError('Security standard requires passwords to be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match. Please verify character entry.');
        return;
      }
      setWizardStep(2);
    } else if (wizardStep === 2) {
      if (!securityAnswer.trim()) {
        setError('Please provide a secure answer for your verification question.');
        return;
      }
      setWizardStep(3);
    } else if (wizardStep === 3) {
      const strippedInput = verifyParentPhoneInput.replace(/\s+/g, '');
      const strippedPhone = firstLoginStudent.parentPhone.replace(/\s+/g, '');

      if (strippedInput !== strippedPhone && verifyParentPhoneInput !== firstLoginStudent.parentPhone) {
        setError('Parent/Guardian phone number mismatch. Please enter the exact phone number registered during your school enrollment.');
        return;
      }

      // Complete profile registration
      setLoading(true);
      const salt = Math.random().toString(36).substring(2, 10);
      const passHash = await sha256(newPassword + salt);
      const ansHash = await sha256(securityAnswer.trim().toLowerCase());

      const browser = navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop';
      const dummyIp = `197.210.64.${Math.floor(2 + Math.random() * 250)}`;

      const updatedStudent = {
        ...firstLoginStudent,
        portalPasswordHash: passHash,
        portalSalt: salt,
        securityQuestion,
        securityAnswerHash: ansHash,
        firstLoginDone: true,
        loginHistory: [
          {
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            device: `${browser} Browser (Initial Security Configuration Setup)`,
            ip: dummyIp
          }
        ]
      };

      const updatedList = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
      localStorage.setItem('ff_students', JSON.stringify(updatedList));

      loginAsStudent(updatedStudent);
      setLoading(false);
      setFirstLoginStudent(null);
      navigate('/dashboard');
    }
  };

  // Recovery Sub-Service
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (recoveryStep === 1) {
      const normAdm = admissionNumber.trim().toUpperCase();
      const student = students.find(s => s.id?.toUpperCase() === normAdm);

      if (!student) {
        setError('Admission number not matched. Please check your spelling or contact support.');
        return;
      }
      if (student.accountDisabled) {
        setError('Your Student Portal access has been administratively disabled.');
        return;
      }
      setRecoveryStudent(student);
      setRecoveryStep(2);
      setRecoveryContactValInput('');
    } else if (recoveryStep === 2) {
      if (recoverySelectMethod === 'phone') {
        const stripInput = recoveryContactValInput.replace(/\s+/g, '');
        const stripTarget = recoveryStudent.parentPhone.replace(/\s+/g, '');
        if (stripInput !== stripTarget && recoveryContactValInput !== recoveryStudent.parentPhone) {
          setError('Authentication mismatch: Registered parent phone number is incorrect.');
          return;
        }
      } else {
        if (recoveryContactValInput.trim().toLowerCase() !== recoveryStudent.parentEmail?.trim().toLowerCase()) {
          setError('Authentication mismatch: Registered parent email is incorrect.');
          return;
        }
      }

      // Generate randomized OTP code and step to OTP validation
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedOtp(generatedOtp);
      setRecoveryOtpCode('');
      setRecoveryStep(3);
    } else if (recoveryStep === 3) {
      if (recoveryOtpCode !== simulatedOtp) {
        setOtpVerifyError('Incorrect OTP Code. Re-enter the 6-digit code shown in the simulator badge.');
        return;
      }
      setRecoveryStep(4);
      setRecoveryNewPassword('');
      setRecoveryConfirmPassword('');
    } else if (recoveryStep === 4) {
      if (recoveryNewPassword.length < 6) {
        setError('Passwords must be at least 6 characters.');
        return;
      }
      if (recoveryNewPassword !== recoveryConfirmPassword) {
        setError('Passwords entry mismatch.');
        return;
      }

      setLoading(true);
      const salt = Math.random().toString(36).substring(2, 10);
      const passHash = await sha256(recoveryNewPassword + salt);

      const browser = navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop';
      const dummyIp = `197.210.64.${Math.floor(2 + Math.random() * 250)}`;

      const updatedStudent = {
        ...recoveryStudent,
        portalPasswordHash: passHash,
        portalSalt: salt,
        firstLoginDone: true, // Bypass first config on standard recovery reset
        loginHistory: [
          {
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            device: `${browser} Browser (Password recovered and configured successfully)`,
            ip: dummyIp
          },
          ...(recoveryStudent.loginHistory || [])
        ]
      };

      const updatedList = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
      localStorage.setItem('ff_students', JSON.stringify(updatedList));

      loginAsStudent(updatedStudent);
      setLoading(false);
      setRecoveryOpen(false);
      setRecoveryStep(1);
      navigate('/dashboard');
    }
  };

  // Standard backend / database authentication for staff/admins
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isAdminEmail = ['faithfoundation480@gmail.com', 'ajaosimon3@gmail.com'].includes(email.toLowerCase());
    
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
          const { data: fetchedProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          profile = fetchedProfile;

          if (profile) {
            switchRole(loginPortal);
            navigate('/dashboard');
          } else {
            // self-heal
            const profileRole = isAdminEmail ? 'admin' : loginPortal;
            const { data: healed } = await supabase.from('users').upsert({
              id: user.id,
              email: email,
              role: profileRole,
              full_name: user.user_metadata?.full_name || 'Academic Leader',
              updated_at: new Date().toISOString()
            }).select().single();
            
            if (healed) {
              switchRole(loginPortal);
              navigate('/dashboard');
            } else {
              setError('Failed to setup local administrative workspace.');
            }
          }
        }
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('Invalid login credentials')) {
        setError('Invalid email or password credentials. Create a sandbox account below if you are evaluating!');
      } else {
        setError(msg);
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
            {firstLoginStudent ? 'First Login Setup' : (recoveryOpen ? 'Password Recovery' : 'Portal Login')}
          </h2>
          <p className="text-sm text-gray-500">
            {firstLoginStudent 
              ? `Strengthen portal credentials for ${firstLoginStudent.name}` 
              : recoveryOpen 
                ? 'Academic credentials self-service recovery' 
                : 'Access student records, learning resources & CBT exams'}
          </p>
        </div>

        {/* Outer Login Wrapper */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-8 lg:p-10 rounded-[32px] shadow-xl transition-all duration-500 border ${
            loginPortal === 'admin' 
              ? 'bg-slate-950 text-white border-amber-500/30' 
              : 'bg-white text-gray-900 border-gray-100 shadow-gray-200/50'
          }`}
        >
          {error && (
            <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 text-sm animate-shake border ${
              error.includes('Success') 
                ? 'bg-green-50 border-green-100 text-green-700' 
                : 'bg-red-50 border-red-100 text-red-700'
            }`}>
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <p>{error}</p>
            </div>
          )}

          {/* First Login Wizard UI */}
          {firstLoginStudent && (
            <form onSubmit={handleFirstLoginSubmit} className="space-y-6">
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                  🛡️ <strong>First-Time Security Configuration:</strong> To safe-guard your academic and behavioral files, please configure your private portal password and security verification questions.
                </p>
              </div>

              {/* Progress Tracker */}
              <div className="flex justify-between items-center px-4 my-2">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center gap-1.5">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black uppercase ${
                      wizardStep === step 
                        ? 'bg-primary text-white font-black' 
                        : wizardStep > step 
                          ? 'bg-emerald-500 text-white font-black' 
                          : 'bg-gray-100 text-gray-400'
                    }`}>
                      {step}
                    </span>
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                      {step === 1 ? 'Unlock' : step === 2 ? 'Question' : 'Verify'}
                    </span>
                  </div>
                ))}
              </div>

              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">Step 1: Set New Password</h4>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Private Password</label>
                    <input 
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold focus:bg-white focus:border-primary outline-none text-sm"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Re-type Confirm Password</label>
                    <input 
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold focus:bg-white focus:border-primary outline-none text-sm"
                      placeholder="matching keys"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">Step 2: Choose Verification Quiz</h4>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Security Question Template</label>
                    <select
                      value={securityQuestion}
                      onChange={(e) => setSecurityQuestion(e.target.value)}
                      className="block w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-black text-slate-700 outline-none text-xs"
                    >
                      <option>What was the name of your first primary school?</option>
                      <option>What is your mother's maiden name?</option>
                      <option>What city was your father born in?</option>
                      <option>What was the name of your childhood pet?</option>
                      <option>What was your favorite subject in junior school?</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Security Answer</label>
                    <input 
                      type="text"
                      required
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      className="block w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold focus:bg-white focus:border-primary outline-none text-sm"
                      placeholder="your recovery answer"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">Step 3: Phone Ownership Audit</h4>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Parent/Guardian Mobile Number</label>
                    <p className="text-[11px] text-slate-400 mb-2">Please supply the registered Parent/Guardian phone number to confirm your pupil directory entry.</p>
                    <input 
                      type="text"
                      required
                      value={verifyParentPhoneInput}
                      onChange={(e) => setVerifyParentPhoneInput(e.target.value)}
                      className="block w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-mono focus:bg-white focus:border-primary outline-none text-sm"
                      placeholder="e.g. 08122334455"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-primary text-white rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-xl shadow-primary/20"
              >
                <span>{wizardStep === 3 ? 'Finalize & Access Portal' : 'Save & Proceed'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* Password Recovery UI */}
          {recoveryOpen && !firstLoginStudent && (
            <form onSubmit={handleRecoverySubmit} className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-150 pb-4 mb-4">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Self Recovery Wizard</span>
                <button 
                  type="button" 
                  onClick={() => { setRecoveryOpen(false); setRecoveryStep(1); }} 
                  className="text-xs bg-gray-100 px-3 py-1.5 hover:bg-gray-200 text-gray-500 font-bold rounded-lg uppercase"
                >
                  Cancel
                </button>
              </div>

              {recoveryStep === 1 && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">Provide your Student Unique Admission Identifier.</p>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Admission ID Number</label>
                    <input 
                      type="text"
                      required
                      value={admissionNumber}
                      onChange={(e) => setAdmissionNumber(e.target.value)}
                      className="block w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold focus:bg-white focus:border-primary outline-none text-sm uppercase"
                      placeholder="e.g. FFP/2026/001"
                    />
                  </div>
                </div>
              )}

              {recoveryStep === 2 && recoveryStudent && (
                <div className="space-y-4 animate-in fade-in">
                  <p className="text-xs text-slate-500">Verify your parental guardianship keys to authenticate reset request.</p>
                  
                  <div className="flex gap-4 p-1.5 bg-gray-100 rounded-xl text-center">
                    <button
                      type="button"
                      onClick={() => setRecoverySelectMethod('phone')}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${recoverySelectMethod === 'phone' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                    >
                      Parent Mobile
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecoverySelectMethod('email')}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${recoverySelectMethod === 'email' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                    >
                      Parent Email
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">
                      {recoverySelectMethod === 'phone' ? 'Registered Parent Mobile' : 'Registered Parent Email'}
                    </label>
                    <input 
                      type="text"
                      required
                      value={recoveryContactValInput}
                      onChange={(e) => setRecoveryContactValInput(e.target.value)}
                      className="block w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-semibold focus:bg-white focus:border-primary outline-none text-sm"
                      placeholder={recoverySelectMethod === 'phone' ? 'e.g. 08122334455' : 'e.g. parent@email.com'}
                    />
                  </div>
                </div>
              )}

              {recoveryStep === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-800 font-medium">
                    ⚡ <strong>OTP Generation Bridge:</strong> An OTP credentials verification voucher was processed inside the sandbox environment channel.
                  </div>

                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-center shadow-inner">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">Generated SMS Code</span>
                    <span className="text-2xl font-mono font-black text-indigo-700 tracking-[0.2em]">{simulatedOtp}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Enter OTP Verification Code</label>
                    <input 
                      type="text"
                      maxLength={6}
                      required
                      value={recoveryOtpCode}
                      onChange={(e) => {
                        setRecoveryOtpCode(e.target.value);
                        setOtpVerifyError('');
                      }}
                      className="block w-full px-4 py-4 bg-gray-50 border border-gray-250 font-mono tracking-widest text-center text-xl font-bold rounded-2xl outline-none"
                      placeholder="******"
                    />
                    {otpVerifyError && <p className="text-xs text-red-500 font-medium mt-1">{otpVerifyError}</p>}
                  </div>
                </div>
              )}

              {recoveryStep === 4 && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">Set Secure Password</h4>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">New Password Input</label>
                    <input 
                      type="password"
                      required
                      value={recoveryNewPassword}
                      onChange={(e) => setRecoveryNewPassword(e.target.value)}
                      className="block w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-primary text-sm font-bold"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Verify Password</label>
                    <input 
                      type="password"
                      required
                      value={recoveryConfirmPassword}
                      onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                      className="block w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-primary text-sm font-bold"
                      placeholder="re-type matching keys"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-primary text-white rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-md"
              >
                <span>{recoveryStep === 4 ? 'Apply Password & Enter' : 'Submit Verification'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* Standard Form Layer (Student Normal check, Staff, Admin) */}
          {!firstLoginStudent && !recoveryOpen && (
            <div>
              {/* Segmented Control Selector Tabs */}
              <div className={`grid grid-cols-3 p-1.5 rounded-2xl mb-8 ${loginPortal === 'admin' ? 'bg-slate-900' : 'bg-gray-100'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setLoginPortal('student');
                    setError('');
                  }}
                  className={`py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all text-center ${
                    loginPortal === 'student'
                      ? 'bg-white text-primary shadow-sm'
                      : loginPortal === 'admin'
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-500 hover:text-slate-805'
                  }`}
                >
                  🎓 STUDENT PORTAL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginPortal('staff');
                    setError('');
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

              {loginPortal === 'student' ? (
                /* Dynamic Student Portal Form */
                <form onSubmit={handleStudentPortalLogin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-750 mb-2 ml-1">
                      Unique Admission Number
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                        <KeyRound size={18} />
                      </div>
                      <input
                        type="text"
                        required
                        value={admissionNumber}
                        onChange={(e) => setAdmissionNumber(e.target.value)}
                        className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all font-bold uppercase"
                        placeholder="FFP/2026/001 or FFS/2026/00125"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                      <label className="block text-sm font-bold text-gray-700">Password / Default Parent Phone</label>
                      <button 
                        type="button" 
                        onClick={() => { setRecoveryOpen(true); setRecoveryStep(1); }} 
                        className="text-xs font-bold text-primary hover:underline transition-all"
                      >
                        Help? Recover Access
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                        <Lock size={18} />
                      </div>
                      <input
                        type="password"
                        required
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-primary text-white hover:bg-opacity-90 rounded-2xl font-bold text-lg active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-primary/20 mt-8"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "Access Student Portal"}
                    {!loading && <ArrowRight size={20} />}
                  </button>
                </form>
              ) : (
                /* Standard Database Forms for Instructors / Managers */
                <form onSubmit={handleAuth} className="space-y-6">
                  {isSignUp && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Full Identity Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="block w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl"
                        placeholder="John Doe"
                      />
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
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Security Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                        <Lock size={18} />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:bg-white focus:border-primary outline-none"
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
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/10'
                    }`}
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "Access Staff Portal"}
                    {!loading && <ArrowRight size={20} />}
                  </button>
                </form>
              )}

              {/* Login Footers */}
              {loginPortal !== 'admin' && loginPortal !== 'student' && (
                <div className="mt-8 text-center border-b border-dashed border-gray-150 pb-6">
                  <button 
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm font-semibold text-gray-500 hover:text-primary transition-colors"
                  >
                    {isSignUp ? "Already have an account? Sign in" : "Apply for staff access? Create Account"}
                  </button>
                </div>
              )}

              {loginPortal === 'student' && (
                <div className="mt-8 text-center border-b border-dashed border-gray-150 pb-6">
                  <p className="text-xs text-slate-400 font-medium">
                    Admission Number and Parent Phone credentials are automatically randomized upon official enrollment. Consult the Registrar or Admissions Desk.
                  </p>
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
                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={() => {
                          loginAsDemo('student@faithfoundation.com', 'student', 'Demo Pupil');
                          navigate('/dashboard');
                        }}
                        className="w-full py-3 px-4 border border-red-220 text-red-600 bg-red-50/20 hover:bg-red-50/40 font-bold text-xs rounded-xl transition-all text-center uppercase tracking-wider mb-2"
                      >
                        🎓 Quick Student Bypass (Sandbox)
                      </button>
                      
                      {/* Active Credentials Help Tooltip */}
                      <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex flex-col items-start gap-1 text-[11px] text-slate-505 font-medium text-left">
                        <span className="flex items-center gap-1 font-bold text-primary text-xs uppercase mb-1">
                          <HelpCircle size={14} /> Active Credentials Reference
                        </span>
                        <div className="flex justify-between w-full font-mono border-b border-slate-200/60 pb-1.5 mb-1.5">
                          <span className="text-slate-400">Student 1:</span>
                          <span className="text-slate-800 font-bold">FFP/2026/001</span>
                        </div>
                        <div className="flex justify-between w-full font-mono border-b border-slate-200/60 pb-1.5 mb-1.5">
                          <span className="text-slate-400">Pass (Parent Phone):</span>
                          <span className="text-slate-800 font-bold">08122334455</span>
                        </div>
                        <div className="flex justify-between w-full font-mono border-b border-slate-200/60 pb-1.5 mb-1.5">
                          <span className="text-slate-400">Student 2:</span>
                          <span className="text-slate-800 font-bold">FFP/2026/002</span>
                        </div>
                        <div className="flex justify-between w-full font-mono">
                          <span className="text-slate-400">Pass (Parent Phone):</span>
                          <span className="text-slate-800 font-bold">07033445566</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <div className="mt-10 text-center space-y-4">
          <p className="text-sm text-gray-500 font-medium">
            New student? <Link to="/admissions" className="text-primary font-bold hover:underline">Apply here</Link>
          </p>
          <div className="flex items-center justify-center gap-6">
            <Link to="/contact" className="text-xs text-gray-400 hover:text-gray-600 font-medium tracking-wide flex items-center gap-1 uppercase">
              Support & Hotline contact
            </Link>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 font-medium tracking-wide flex items-center gap-1 uppercase">
              School Website Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
