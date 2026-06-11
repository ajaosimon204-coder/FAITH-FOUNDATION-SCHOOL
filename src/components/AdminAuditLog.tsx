import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  Search, 
  CheckCircle, 
  AlertCircle,
  Wrench,
  Terminal,
  Database,
  ArrowRight,
  Activity,
  User,
  Check
} from 'lucide-react';

interface ActivityLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  details: string;
  created_at: string;
}

export default function AdminAuditLog() {
  const { isSandbox, runProfileDiagnostic } = useAuth();
  
  // State variables
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'errors' | 'sync'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive Diagnostic state
  const [diagUserId, setDiagUserId] = useState('');
  const [diagUserEmail, setDiagUserEmail] = useState('');
  const [diagResult, setDiagResult] = useState<any | null>(null);
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagnosticMessage, setDiagnosticMessage] = useState<string | null>(null);

  // Bulk synchronization states
  const [bulkSyncRunning, setBulkSyncRunning] = useState(false);
  const [bulkSyncResult, setBulkSyncResult] = useState<{
    success: boolean;
    synced_count: number;
    synced_emails: string[];
    error?: string;
  } | null>(null);

  const triggerBulkProfileSync = async () => {
    setBulkSyncRunning(true);
    setBulkSyncResult(null);

    const logAction = 'BULK_SYNC_TRIGGER';
    const logDetails = 'Admin triggered a bulk profile synchronization RPC scan across auth list to force-rebuild missing user profiles.';

    try {
      if (isSandbox) {
        // Mock profile sync simulation
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        const mockSynced = ['simon.staff@faithfoundation.com', 'test.student@school.edu'];
        
        const syncLogs = mockSynced.map(email => ({
          id: `sl-${Math.random()}`,
          action: 'PROFILE_HEAL_SYNC',
          details: `RPC Sync: Analyzed auth.users directory, reconciled missing public profiles and synchronised dossier for ${email}.`,
          user_email: email,
          created_at: new Date().toISOString()
        }));

        const systemLog = {
          id: `sys-${Math.random()}`,
          action: logAction,
          details: `${logDetails} Identified and resolved ${mockSynced.length} missing user profile entries in total reference synonym schemas.`,
          user_email: 'admin.audit@faithfoundation.com',
          created_at: new Date().toISOString()
        };

        const savedLogs = localStorage.getItem('ff_activity_logs');
        const list = savedLogs ? JSON.parse(savedLogs) : [];
        const updated = [systemLog, ...syncLogs, ...list];
        localStorage.setItem('ff_activity_logs', JSON.stringify(updated));
        
        setLogs(updated);
        setBulkSyncResult({
          success: true,
          synced_count: mockSynced.length,
          synced_emails: mockSynced
        });

        // Dispatch custom events to simulate real-time PostgreSQL INSERT triggers for newly synced staff accounts
        mockSynced.forEach(email => {
          if (email.includes('staff')) {
            const customEvent = new CustomEvent('supabase:profiles:insert', {
              detail: {
                email: email,
                full_name: 'Simon Staff Member',
                role: 'staff'
              }
            });
            window.dispatchEvent(customEvent);
          }
        });
      } else {
        // Record the initiation in action logs
        try {
          await supabase.from('activity_logs').insert({
            user_email: 'admin',
            action: logAction,
            details: logDetails
          });
        } catch (dbErr) {
          console.error(dbErr);
        }

        // Invoke the Supabase PL/pgSQL function we defined in supabase_setup.sql
        const { data, error } = await supabase.rpc('sync_missing_profiles');

        if (error) {
          throw error;
        }

        const res = data as any;
        setBulkSyncResult({
          success: res?.success ?? true,
          synced_count: res?.synced_count ?? 0,
          synced_emails: res?.synced_emails ?? []
        });

        // Trigger updating audit logs checklist viewport
        fetchLogs();
      }
    } catch (err: any) {
      console.error('[Bulk Sync Error]:', err);
      setBulkSyncResult({
        success: false,
        synced_count: 0,
        synced_emails: [],
        error: err?.message || String(err)
      });
    } finally {
      setBulkSyncRunning(false);
    }
  };

  // Fetch audit logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      if (isSandbox) {
        // Retrieve local logs & combine with helpful troubleshooting diagnostic alerts
        const savedLogs = localStorage.getItem('ff_activity_logs');
        let parsedLogs: ActivityLog[] = savedLogs ? JSON.parse(savedLogs) : [];
        
        // Add robust fallback mock logs illustrating failures, warnings, and triggers if local storage is empty
        if (parsedLogs.length === 0) {
          const mockDate = (offsetMin: number) => new Date(Date.now() - offsetMin * 60000).toISOString();
          parsedLogs = [
            {
              id: '1',
              action: 'SIGNUP_ERROR_PROFILES',
              details: 'AUTH-SYNC FAILURE: Failed to propagate user simon.staff@faithfoundation.com to public.profiles. Error: row-level security policy violation (insufficient privileges for new staff users on insertion).',
              user_email: 'simon.staff@faithfoundation.com',
              created_at: mockDate(5)
            },
            {
              id: '2',
              action: 'PROFILE_HEAL_TRIGGERED',
              details: 'DIAGNOSTIC AUTO-HEALING: Missing public.users and public.profiles records successfully reconstructed for user ajaosimon3@gmail.com.',
              user_email: 'ajaosimon3@gmail.com',
              created_at: mockDate(12)
            },
            {
              id: '3',
              action: 'AUTH_SYNCRONIZE',
              details: 'SUCCESS: Successfully synchronized user metadata role update for admin faithfoundation480@gmail.com.',
              user_email: 'faithfoundation480@gmail.com',
              created_at: mockDate(45)
            },
            {
              id: '4',
              action: 'TEACHERS_ROSTER_GAP',
              details: 'WARNING: Found sign-up roster omission for user simon.staff@faithfoundation.com. Automatically compiled and written teacher academic dossier STF-9021.',
              user_email: 'simon.staff@faithfoundation.com',
              created_at: mockDate(120)
            },
            {
              id: '5',
              action: 'MATERIAL_UPLOAD',
              details: 'Teacher posted new resource node "Analytical Calculus IV Worksheet".',
              user_email: 'teacher@faith foundation.com',
              created_at: mockDate(180)
            }
          ];
          localStorage.setItem('ff_activity_logs', JSON.stringify(parsedLogs));
        }
        setLogs(parsedLogs);
      } else {
        // Query Supabase real activity_logs table
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[AdminAuditLog] Error fetching from activity_logs:', error);
        } else if (data) {
          setLogs(data);
        }
      }
    } catch (e) {
      console.error('[AdminAuditLog] Error loading logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [isSandbox]);

  // Execute interactive diagnostics
  const handleRunDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagUserId.trim() && !diagUserEmail.trim()) {
      setDiagnosticMessage('Please fill either a User UUID or User Email to analyze propagation.');
      return;
    }

    setDiagRunning(true);
    setDiagResult(null);
    setDiagnosticMessage(null);

    try {
      let targetId = diagUserId.trim();
      let targetEmail = diagUserEmail.trim();

      // If they passed email but no ID, we can do a query to find the user ID to help them out
      if (!targetId && targetEmail) {
        if (!isSandbox) {
          // Attempt to find user ID via users or profiles
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('email', targetEmail)
            .maybeSingle();
          if (userData?.id) {
            targetId = userData.id;
          } else {
            // Also check optional profiles checklist path
            const { data: profData } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', targetEmail)
              .maybeSingle();
            if (profData?.id) {
              targetId = profData.id;
            }
          }
        }
        
        // Setup a mock ID if offline or user record omitted
        if (!targetId) {
          targetId = `usr_${Math.floor(100000 + Math.random() * 900000)}`;
        }
      }

      // Record diagnostic activity in current logs list so user sees it in audit
      const checkAction = 'DIAGNOSTIC_RUN';
      const checkDetails = `Admin initiated manual database integrity audit scan for ${targetEmail || 'unknown-email'} (ID: ${targetId}).`;
      
      const newLogItem: ActivityLog = {
        id: Math.random().toString(),
        action: checkAction,
        details: checkDetails,
        user_email: targetEmail || 'admin.audit@faithfoundation.com',
        created_at: new Date().toISOString()
      };

      if (isSandbox) {
        const savedLogs = localStorage.getItem('ff_activity_logs');
        const list = savedLogs ? JSON.parse(savedLogs) : [];
        const updated = [newLogItem, ...list];
        localStorage.setItem('ff_activity_logs', JSON.stringify(updated));
        setLogs(updated);
      } else {
        try {
          await supabase.from('activity_logs').insert({
            user_id: targetId,
            user_email: targetEmail || 'admin',
            action: checkAction,
            details: checkDetails
          });
        } catch (dbErr) {
          console.error(dbErr);
        }
      }

      // Execute propagation diagnostic check to verify and heal automatically
      const report = await runProfileDiagnostic(targetId, targetEmail);
      setDiagResult(report);

      if (report && report.success) {
        setDiagnosticMessage(`Analysis complete. Automated checker has scan-healed any missing sync references.`);
        
        // If simulated healer processed a staff account, dispatch local event for toast
        if (isSandbox && targetEmail && targetEmail.includes('staff')) {
          const customEvent = new CustomEvent('supabase:profiles:insert', {
            detail: {
              email: targetEmail,
              full_name: 'Simon Staff Member',
              role: 'staff'
            }
          });
          window.dispatchEvent(customEvent);
        }

        // Refresh logs in background to capture healed triggers if SQL inserted them
        fetchLogs();
      } else {
        setDiagnosticMessage(`Analysis completed with warnings: ${report.usersError || report.profilesError || report.fatalError || 'Partial records found'}`);
      }
    } catch (err: any) {
      console.error(err);
      setDiagnosticMessage(`Diagnostic execution faulted: ${err.message || String(err)}`);
    } finally {
      setDiagRunning(false);
    }
  };

  // Filter logs based on filters and search queries
  const filteredLogs = logs.filter(log => {
    const term = searchQuery.toLowerCase();
    const actionMatch = log.action.toLowerCase().includes(term);
    const detailsMatch = log.details.toLowerCase().includes(term);
    const emailMatch = (log.user_email || '').toLowerCase().includes(term);
    const idMatch = (log.id || '').toLowerCase().includes(term);
    const matchesSearch = actionMatch || detailsMatch || emailMatch || idMatch;

    if (!matchesSearch) return false;

    if (filterType === 'errors') {
      const isErr = (log.action || '').toUpperCase().includes('ERROR') || 
                    (log.action || '').toUpperCase().includes('FAIL') ||
                    (log.action || '').toUpperCase().includes('WARNING') ||
                    (log.details || '').toUpperCase().includes('FAIL') ||
                    (log.details || '').toUpperCase().includes('ERROR') ||
                    (log.details || '').toUpperCase().includes('SECURITY') ||
                    (log.details || '').toUpperCase().includes('POLICY') ||
                    (log.details || '').toUpperCase().includes('VIOLATION');
      return isErr;
    }
    
    if (filterType === 'sync') {
      return (log.action || '').toUpperCase().includes('HEAL') || 
             (log.action || '').toUpperCase().includes('PROPAGAT') ||
             (log.action || '').toUpperCase().includes('SYNC') ||
             (log.action || '').toUpperCase().includes('TRIGGER') ||
             (log.action || '').toUpperCase().includes('ROSTER');
    }

    return true;
  });

  return (
    <div id="admin-audit-log-root" className="space-y-8 font-sans">
      
      {/* 1. Header and Quick Stats Row */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100">
              <ShieldAlert size={20} className="animate-pulse" />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-800 leading-tight">Admin System Audit & DB Monitoring Console</h2>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-extrabold font-mono">Real-time DB transaction logging, custom sync diagnostics & auto-healing center</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl text-center min-w-[100px]">
            <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Total Logs</span>
            <p className="text-lg font-black text-slate-700 leading-none mt-1">{logs.length}</p>
          </div>
          <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-2xl text-center min-w-[100px]">
            <span className="text-[9px] uppercase font-black text-rose-500 tracking-wider">Warnings & Errors</span>
            <p className="text-lg font-black text-rose-700 leading-none mt-1">
              {logs.filter(l => l.action.includes('ERROR') || l.action.includes('WARNING') || l.details.toLowerCase().includes('violation')).length}
            </p>
          </div>
          <button 
            type="button"
            onClick={fetchLogs}
            className="p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl border border-slate-150 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold leading-none"
            title="Refresh logs checklist"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Check Updates
          </button>
        </div>
      </div>

      {/* 2. Interactive Propagation & Sync Command Center */}
      <div id="diagnostic-command-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Single-User Propagation Diagnostic Sync Checker Widget */}
        <div className="lg:col-span-2 bg-slate-900 text-slate-100 p-8 rounded-[2rem] border border-slate-800 shadow-xl space-y-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="border-b border-slate-800 pb-4 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-indigo-400 font-mono text-[10px] uppercase font-black tracking-widest leading-none">
                  <Terminal size={12} /> Target Diagnostician & Healer
                </div>
                <h3 className="text-sm font-black text-white mt-1.5 uppercase tracking-tight">Active Propagation Recovery Utility</h3>
                <p className="text-[10.5px] text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Analyze single signup dossiers. Enter their UUID or Email below to audit metadata, restore omitted staff rosters, reconstruct synapse tables, and auto-heal access problems.
                </p>
              </div>
              <span className="text-[9px] text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 rounded-xl uppercase font-black tracking-wider whitespace-nowrap align-self-start">
                Live Checker
              </span>
            </div>

            <form onSubmit={handleRunDiagnostic} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end relative z-10 mt-6">
              <div>
                <label className="block text-[9px] text-slate-400 font-black uppercase tracking-wider mb-2">User Email Address</label>
                <input 
                  type="email"
                  placeholder="e.g. user@faithfoundation.com"
                  value={diagUserEmail}
                  onChange={(e) => setDiagUserEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[9px] text-slate-400 font-black uppercase tracking-wider mb-2">User UUID (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. a8f9-4b21-82cd-..."
                  value={diagUserId}
                  onChange={(e) => setDiagUserId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                />
              </div>

              <button 
                type="submit"
                disabled={diagRunning}
                className="w-full bg-gradient-to-r from-primary via-indigo-600 to-indigo-700 hover:opacity-90 active:scale-95 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 select-none shadow-xl cursor-pointer"
              >
                {diagRunning ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Checking Telemetry...
                  </>
                ) : (
                  <>
                    <Wrench size={14} />
                    Heal Record
                  </>
                )}
              </button>
            </form>

            {/* Diagnostic Run Status Output */}
            {diagnosticMessage && (
              <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl text-xs font-mono text-indigo-300 relative z-10 flex items-start gap-3 mt-4">
                <span className="text-indigo-400 text-sm mt-0.5">ℹ</span>
                <div>
                  <p className="font-bold uppercase text-[9px] tracking-wider text-slate-500 font-sans">Diagnosis status message:</p>
                  <p className="mt-1 leading-snug">{diagnosticMessage}</p>
                </div>
              </div>
            )}

            {/* Full Diagnostic Report Leaflet */}
            {diagResult && (
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 relative z-10 text-xs font-mono mt-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-400 font-sans flex items-center gap-1.5">
                    <Database size={13} /> Checked Directories Telemetry Leaflet
                  </span>
                  <span className="text-[10px] text-slate-500 font-sans font-bold">Time checked: {new Date(diagResult.timestamp).toLocaleTimeString()}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className={`p-3 rounded-xl border ${diagResult.authUser ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
                    <span className="text-[8px] uppercase tracking-wider font-bold display-block block font-sans">1. Supabase Auth Record</span>
                    <p className="text-[10px] font-bold mt-1.5 flex items-center gap-1 leading-none uppercase tracking-wider font-sans">
                      {diagResult.authUser ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                      {diagResult.authUser ? 'AUTHENTICATED' : 'NOT FOUND'}
                    </p>
                    {diagResult.authUser && (
                      <p className="text-[9px] text-slate-400 mt-1.5 truncate">Role: {diagResult.authUser.user_metadata?.role || 'student'}</p>
                    )}
                  </div>

                  <div className={`p-3 rounded-xl border ${diagResult.usersTableRecord ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
                    <span className="text-[8px] uppercase tracking-wider font-bold display-block block font-sans">2. main "users" profile table</span>
                    <p className="text-[10px] font-bold mt-1.5 flex items-center gap-1 leading-none uppercase tracking-wider font-sans">
                      {diagResult.usersTableRecord ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                      {diagResult.usersTableRecord ? 'RESOLVED' : 'MISSING RECOR'}
                    </p>
                    {diagResult.usersTableRecord && (
                      <p className="text-[9px] text-slate-400 mt-1.5 truncate">Name: {diagResult.usersTableRecord.full_name}</p>
                    )}
                  </div>

                  <div className={`p-3 rounded-xl border ${diagResult.profilesTableRecord ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
                    <span className="text-[8px] uppercase tracking-wider font-bold display-block block font-sans">3. synonym "profiles" table</span>
                    <p className="text-[10px] font-bold mt-1.5 flex items-center gap-1 leading-none uppercase tracking-wider font-sans">
                      {diagResult.profilesTableRecord ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                      {diagResult.profilesTableRecord ? 'RESOLVED' : 'MISSING RECOR'}
                    </p>
                    {diagResult.profilesTableRecord && (
                      <p className="text-[9px] text-slate-400 mt-1.5 truncate">Role: {diagResult.profilesTableRecord.role}</p>
                    )}
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-300">
                    <span className="text-[8px] uppercase tracking-wider font-bold display-block block font-sans text-slate-400">4. teachers dossier roster</span>
                    <p className="text-[10px] font-bold mt-1.5 flex items-center gap-1 leading-none uppercase tracking-wider font-sans text-slate-200">
                      <Database size={11} />
                      {diagResult.teachersTableRecord ? 'ROSTER WRITTEN' : 'N/A OR EMPTY'}
                    </p>
                    {diagResult.teachersTableRecord && (
                      <p className="text-[9px] text-slate-400 mt-1.5 truncate">Rating: {diagResult.teachersTableRecord.rating || 'N/A'}</p>
                    )}
                  </div>
                </div>

                {/* Actions Taken / Heal events and logs checklist */}
                <div className="mt-4 pt-4 border-t border-slate-900 space-y-2">
                  <span className="text-[9px] font-sans font-black text-slate-400 uppercase tracking-widest leading-none">Diagnostic Heal Actions Log:</span>
                  <div className="space-y-1.5 mt-1.5">
                    {diagResult.actionsTaken && diagResult.actionsTaken.length > 0 ? (
                      diagResult.actionsTaken.map((action: string, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center text-emerald-400 text-[11px]">
                          <span className="font-extrabold text-xs">✓</span>
                          <span>{action}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-[10.5px] italic">Verified complete. No structural DB repairs or row reconstruction were required during the diagnostic audit.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Bulk Sync User Profiles (Triggers Supabase RPC) */}
        <div className="bg-slate-900 text-slate-100 p-8 rounded-[2rem] border border-slate-800 shadow-xl space-y-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-5 relative z-10 w-full">
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-rose-400 font-mono text-[10px] uppercase font-black tracking-widest leading-none">
                <Database size={12} /> Database Wide Command
              </div>
              <h3 className="text-sm font-black text-white mt-1.5 uppercase tracking-tight">Sync User Profiles</h3>
              <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                Scan all registered authentication credentials and automatically build or resolve missing profiles/synonym tables for users lacking functional public directories.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3.5">
              <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider block">Scan Coverage Details</span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 border border-slate-900 bg-slate-900/40 rounded-lg text-center">
                  <span className="text-[8.5px] text-slate-400 block uppercase font-bold">In-Scope Target</span>
                  <p className="font-mono mt-1 font-bold text-white text-[10px]">auth.users</p>
                </div>
                <div className="p-2 border border-slate-900 bg-slate-900/40 rounded-lg text-center">
                  <span className="text-[8.5px] text-slate-400 block uppercase font-bold">Output Targets</span>
                  <p className="font-mono mt-1 font-bold text-emerald-400 text-[9px]">users / profiles</p>
                </div>
              </div>
            </div>

            {/* Bulk Trigger Button */}
            <button
              type="button"
              onClick={triggerBulkProfileSync}
              disabled={bulkSyncRunning}
              className="w-full bg-slate-800 hover:bg-slate-750 active:scale-95 disabled:opacity-50 text-emerald-400 font-black text-xs uppercase tracking-widest py-4 px-6 rounded-2xl border border-emerald-500/20 flex items-center justify-center gap-2 select-none pointer-events-auto cursor-pointer shadow-lg"
            >
              {bulkSyncRunning ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-emerald-400" />
                  Running RPC Scan Table...
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  Trigger Bulk Profile Sync
                </>
              )}
            </button>
          </div>

          {/* Sync Result Leaflet displaying successfully synchronized emails */}
          {bulkSyncResult && (
            <div className="bg-slate-950/90 border border-slate-800/80 p-4 rounded-xl text-xs font-mono relative z-10 space-y-2 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                <span className={`text-[8.5px] uppercase font-bold tracking-wider ${bulkSyncResult.success ? 'text-emerald-400' : 'text-rose-450'}`}>
                  {bulkSyncResult.success ? '✓ RPC Executed Success' : '✖ RPC Scan Failed'}
                </span>
                {bulkSyncResult.success && (
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-md font-bold leading-none">
                    +{bulkSyncResult.synced_count} Resolved
                  </span>
                )}
              </div>

              {bulkSyncResult.error ? (
                <p className="text-rose-400 text-[10px] leading-snug">{bulkSyncResult.error}</p>
              ) : bulkSyncResult.synced_count === 0 ? (
                <p className="text-slate-500 text-[10px] italic">No orphaned authorization accounts without profiles detected! Database is 100% healthy.</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-[8.5px] text-slate-500 font-sans tracking-wide font-bold uppercase">Healed accounts roster:</p>
                  <div className="max-h-[80px] overflow-y-auto space-y-1 pr-1">
                    {bulkSyncResult.synced_emails.map((email, i) => (
                      <div key={i} className="text-[9.5px] text-emerald-300/90 flex gap-1.5 items-center leading-none">
                        <span>•</span>
                        <span className="truncate">{email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* 3. Realtime Logs list and Filters */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Activity className="text-indigo-600 animate-pulse" size={16} />
              Recent Database Events, Ingestion Reports & Exceptions
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-extrabold">Inspect real-time authentication callback hooks, row-level policy audits and diagnostic entries</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input bar */}
            <div className="relative w-full sm:w-64 m-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="Search logs by keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-150 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold leading-none focus:outline-none focus:bg-white transition-all text-slate-700"
              />
            </div>

            {/* Filter buttons checklist */}
            <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto shrink-0 select-none">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer ${
                  filterType === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                All Events
              </button>
              <button
                type="button"
                onClick={() => setFilterType('errors')}
                className={`px-4 py-2 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer ${
                  filterType === 'errors' ? 'bg-rose-500 text-white shadow-sm' : 'text-rose-500 hover:bg-rose-50/50'
                }`}
              >
                Warnings & Failures
              </button>
              <button
                type="button"
                onClick={() => setFilterType('sync')}
                className={`px-4 py-2 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer ${
                  filterType === 'sync' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-600 hover:bg-indigo-50/50'
                }`}
              >
                Syncs & Heals
              </button>
            </div>
          </div>
        </div>

        {/* Ingested logs display viewport */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">
              <RefreshCw className="animate-spin mx-auto mb-3 text-slate-350" size={24} />
              Reading Transaction logs from Database...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
              <span className="text-xl">📭</span>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-2 font-mono italic">No system events matches the selected filter keys.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isError = log.action.includes('ERROR') || log.action.includes('WARNING') || log.details.toLowerCase().includes('fail') || log.details.toLowerCase().includes('violation');
              const isSyncHeal = log.action.includes('HEAL') || log.action.includes('ROSTER') || log.action.includes('SYNC') || log.action.includes('PROPAGAT');

              return (
                <div 
                  key={log.id} 
                  className={`p-5 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden group hover:shadow-sm ${
                    isError 
                      ? 'bg-rose-50/30 border-rose-150/80 hover:border-rose-250' 
                      : isSyncHeal
                        ? 'bg-indigo-50/10 border-indigo-100 hover:border-indigo-200'
                        : 'bg-slate-50/40 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {/* Color strip accent */}
                  <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                    isError ? 'bg-rose-500' : isSyncHeal ? 'bg-indigo-500' : 'bg-slate-300'
                  }`} />

                  <div className="space-y-1.5 pl-2 max-w-3xl">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`text-[8px] font-mono font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                        isError 
                          ? 'bg-rose-600 text-white' 
                          : isSyncHeal
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                      {log.user_email && (
                        <span className="text-[10px] font-black text-slate-700 font-mono bg-slate-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <User size={10} className="opacity-60" />
                          {log.user_email}
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-xs font-bold leading-relaxed ${isError ? 'text-rose-950 font-sans' : 'text-slate-650'}`}>
                      {log.details}
                    </p>
                  </div>

                  <div className="text-[9px] text-slate-400 font-bold whitespace-nowrap font-mono uppercase text-right self-end md:self-center">
                    <p className="leading-none text-slate-500 font-black">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                    <p className="mt-1 opacity-70 leading-none">{new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
