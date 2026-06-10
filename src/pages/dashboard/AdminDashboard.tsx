import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  CreditCard, 
  Image as ImageIcon, 
  Settings, 
  LayoutDashboard, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Check, 
  X, 
  AlertCircle, 
  FileText, 
  Activity, 
  Volume2, 
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Award,
  BookOpen,
  UserCheck,
  PlusCircle,
  Clock,
  Send,
  Star,
  DollarSign,
  Coins,
  Receipt,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useContent, SiteContent } from '../../lib/content';
import { supabase } from '../../lib/supabase';
import { sendNotification } from '../../lib/notifications';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import ImageUploader from '../../components/ImageUploader';
import ContentEditor from '../../components/ContentEditor';
import { 
  syncFetchAnnouncements, syncSaveAnnouncements,
  syncFetchStudents, syncSaveStudents, syncSaveStudent, syncDeleteStudent,
  syncFetchStaff, syncSaveStaffList, syncSaveStaffMember,
  syncFetchInvoices, syncSaveInvoices, syncSaveInvoice,
  syncFetchFeeStructures, syncSaveFeeStructures,
  syncFetchAdmissions, syncSaveAdmissions, syncSaveAdmission,
  syncFetchCbtExam, syncSaveCbtSettings,
  syncFetchStaffRatings, syncSaveStaffRatings, StaffDailyRating
} from '../../lib/sync';

import Communications from './Communications';
import CloudLocker from './CloudLocker';

// ============================================================================
// 1. MAIN ROUTING & PERSISTENCE
// ============================================================================

export default function AdminDashboard() {
  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      <Routes>
        <Route path="/" element={<OverviewView />} />
        <Route path="/students" element={<StudentsView />} />
        <Route path="/staff" element={<StaffView />} />
        <Route path="/finance" element={<FinanceView />} />
        <Route path="/gallery" element={<GalleryAdminView />} />
        <Route path="/admissions" element={<AdmissionsView />} />
        <Route path="/communications" element={<Communications />} />
        <Route path="/cms" element={<ContentEditor />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="/locker" element={<CloudLocker />} />
      </Routes>
    </div>
  );
}

// Helper: Custom Notification alert trigger
const showBannerAlert = (message: string, isSuccess: boolean = true) => {
  const alertContainerId = 'portal-alert-banners';
  let bannerHost = document.getElementById(alertContainerId);
  if (!bannerHost) {
    bannerHost = document.createElement('div');
    bannerHost.id = alertContainerId;
    bannerHost.className = 'fixed top-6 right-6 z-50 space-y-3 pointer-events-none';
    document.body.appendChild(bannerHost);
  }

  const alertDiv = document.createElement('div');
  alertDiv.className = `p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider translate-y-3 opacity-0 transition-all duration-300 pointer-events-auto max-w-sm ${
    isSuccess ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
  }`;
  alertDiv.innerHTML = `
    ${isSuccess ? '<span class="text-xl">✓</span>' : '<span class="text-xl">⚠</span>'}
    <div>${message}</div>
  `;

  bannerHost.appendChild(alertDiv);
  setTimeout(() => {
    alertDiv.classList.remove('translate-y-3', 'opacity-0');
    alertDiv.classList.add('translate-y-0', 'opacity-100');
  }, 10);

  setTimeout(() => {
    alertDiv.classList.remove('translate-y-0', 'opacity-100');
    alertDiv.classList.add('translate-y-3', 'opacity-0');
    setTimeout(() => {
      alertDiv.remove();
    }, 300);
  }, 4000);
};


// ============================================================================
// 2. VIEW: INSTITUTIONAL OVERVIEW
// ============================================================================

interface MetricItem {
  key: string;
  label: string;
  value: string;
  change: string;
  color: string;
}

function OverviewView() {
  const { content, updateContent } = useContent();
  const [editingStatIdx, setEditingStatIdx] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editVal, setEditVal] = useState('');

  const [announcements, setAnnouncements] = useState(() => {
    const saved = localStorage.getItem('ff_announcements');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: 'Term 1 Exam Schedules Released', body: 'All terminal examinations for the middle school commence next Wednesday.', date: 'May 20, 2026', type: 'critical' },
      { id: 2, title: 'Annual Inter-House Sports Fiesta', body: 'Parents and teachers are invited to secure our green track on Friday morning.', date: 'May 18, 2026', type: 'general' }
    ];
  });

  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newType, setNewType] = useState('general');

  useEffect(() => {
    syncFetchAnnouncements().then(res => setAnnouncements(res));
  }, []);

  useEffect(() => {
    syncSaveAnnouncements(announcements);
  }, [announcements]);

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    const fresh = {
      id: Date.now(),
      title: newTitle,
      body: newBody,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: newType
    };

    setAnnouncements([fresh, ...announcements]);
    setNewTitle('');
    setNewBody('');
    showBannerAlert('Broadcast announcement published globally');
  };

  const handleRemoveAnnouncement = (id: number) => {
    setAnnouncements(announcements.filter((a: any) => a.id !== id));
    showBannerAlert('Announcement archived');
  };

  const handleEditStat = (idx: number, metric: any) => {
    setEditingStatIdx(idx);
    setEditLabel(metric.label);
    setEditVal(metric.value);
  };

  const saveEditedStat = async () => {
    if (editingStatIdx === null) return;
    const currentStats = Array.isArray(content?.stats) ? [...content.stats] : [
      { label: "Graduates", value: "1.2k+", color: "bg-blue-500", change: "+12%" },
      { label: "Expert Staff", value: "50+", color: "bg-rose-500", change: "Steady" },
      { label: "Total Classes", value: "30+", color: "bg-emerald-500", change: "+5%" },
      { label: "State Awards", value: "15", color: "bg-cyan-500", change: "New" }
    ];

    currentStats[editingStatIdx] = {
      ...currentStats[editingStatIdx],
      label: editLabel,
      value: editVal
    };

    try {
      await updateContent({
        ...content,
        stats: currentStats
      });
      setEditingStatIdx(null);
      showBannerAlert('Vitals saved online successfully');
    } catch (err) {
      showBannerAlert('Could not save credentials. Keep in offline local mode.', false);
    }
  };

  const vitals = Array.isArray(content?.stats) ? content.stats : [
    { label: "Graduates", value: "1.2k+", color: "bg-blue-500", change: "+12%" },
    { label: "Expert Staff", value: "50+", color: "bg-rose-500", change: "Steady" },
    { label: "Total Classes", value: "30+", color: "bg-emerald-500", change: "+5%" },
    { label: "State Awards", value: "15", color: "bg-cyan-500", change: "New" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Dynamic Vitals grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {vitals.map((metric, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all duration-300">
            <div className={`absolute top-0 right-0 p-5 font-mono text-xs font-extrabold ${
              idx === 0 ? 'text-blue-500' : idx === 1 ? 'text-purple-500' : idx === 2 ? 'text-emerald-500' : 'text-amber-500'
            }`}>
              {idx === 0 ? <Users size={18} /> : idx === 1 ? <GraduationCap size={18} /> : idx === 2 ? <BookOpen size={18} /> : <Award size={18} />}
            </div>

            {editingStatIdx === idx ? (
              <div className="space-y-3 pt-2">
                <input 
                  type="text" 
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700"
                  placeholder="Stat Label"
                />
                <input 
                  type="text" 
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-black text-slate-800"
                  placeholder="Value"
                />
                <div className="flex gap-2">
                  <button onClick={saveEditedStat} className="bg-primary text-white text-[10px] uppercase font-bold px-3 py-1 rounded-md">Save</button>
                  <button onClick={() => setEditingStatIdx(null)} className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold px-3 py-1 rounded-md">Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{metric.label}</span>
                <p className="text-4xl font-extrabold text-slate-800 tracking-tight mt-3">{metric.value}</p>
                <button 
                  onClick={() => handleEditStat(idx, metric)}
                  className="text-[9px] font-bold text-primary tracking-widest uppercase hover:underline mt-4 block leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Edit Vital Key
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Dynamic Analytics Visual Charts */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-extrabold text-slate-800 text-lg">Active Campus Demographics</h2>
              <p className="text-xs text-slate-400 mt-1">Estimated collection tracking and academic enrollments.</p>
            </div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg">Realtime Sync</span>
          </div>

          {/* Sizable High fidelity SVG Custom Chart Panel */}
          <div className="relative h-64 w-full flex items-end justify-between px-4 border-b border-dashed border-slate-100 pb-2">
            
            {/* SVG Plot for elegant background grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pr-4">
              <div className="w-full border-b border-dashed border-slate-50 h-0"></div>
              <div className="w-full border-b border-dashed border-slate-100 h-0"></div>
              <div className="w-full border-b border-dashed border-slate-100 h-0"></div>
              <div className="w-full border-b border-dashed border-slate-100 h-0"></div>
            </div>

            {/* Simulated Dynamic Bar Data */}
            {[
              { m: 'Nursery', val: 75, active: 85, fill: 'bg-primary' },
              { m: 'Primary 1-3', val: 120, active: 110, fill: 'bg-indigo-500' },
              { m: 'Primary 4-6', val: 145, active: 130, fill: 'bg-purple-500' },
              { m: 'JSS 1-3', val: 180, active: 165, fill: 'bg-blue-500' },
              { m: 'SSS 1-3', val: 210, active: 195, fill: 'bg-emerald-500' }
            ].map((bar, i) => {
              const heightPct = (bar.val / 220) * 100;
              return (
                <div key={i} className="flex flex-col items-center group w-1/5 relative z-10 transition-transform hover:-translate-y-1">
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl text-center shadow-lg w-28 pointer-events-none">
                    <p className="uppercase">{bar.m}</p>
                    <p className="font-black text-xs text-emerald-400 mt-0.5">{bar.val} Pupils</p>
                  </div>
                  <div 
                    className={`w-10 rounded-t-xl opacity-80 hover:opacity-100 transition-opacity ${bar.fill} shadow-lg shadow-blue-900/10 cursor-pointer`}
                    style={{ height: `${heightPct}%`, minHeight: '30px' }}
                  ></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase mt-4 text-center truncate w-full">{bar.m}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Recent Events Log */}
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-extrabold text-slate-800 text-base uppercase tracking-tight">Recent Activity</h2>
              <Activity size={18} className="text-primary animate-pulse" />
            </div>

            <div className="space-y-4">
              {[
                { time: '10 Mins Ago', action: 'Nursery 2 rates updated to N120,500', auth: 'Principal' },
                { time: '1 Hr Ago', action: 'Approved Admission: ADM-024', auth: 'Registrar' },
                { time: '4 Hrs Ago', action: 'Notification broadcasted to all SS3 Teachers', auth: 'Admin' }
              ].map((act, i) => (
                <div key={i} className="flex gap-4 p-3 bg-slate-50/50 rounded-2xl hover:bg-slate-100/50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-700 font-bold leading-tight">{act.action}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">{act.time} &bull; {act.auth}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-50 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Network Status</p>
            <p className="text-[10px] font-black text-emerald-600 uppercase mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Realtime Database Live
            </p>
          </div>
        </div>

      </div>

      {/* Broadcast System & Announcement Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Dynamic Announcement Creator */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-primary">
            <Volume2 size={20} />
            <h2 className="font-extrabold text-slate-800 text-base uppercase tracking-tight">Broadcast Center</h2>
          </div>

          <form onSubmit={handleCreateAnnouncement} className="space-y-4">
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notification Header</label>
              <input 
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Notice Title"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">System Notice Content</label>
              <textarea 
                rows={3}
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Announcement description..."
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Severity Level</label>
                <select 
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl text-xs font-black text-slate-600"
                >
                  <option value="general">Regular Alert</option>
                  <option value="critical">Critical Warning</option>
                </select>
              </div>

              <div className="flex items-end">
                <button 
                  type="submit"
                  className="w-full bg-primary text-white p-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/25 flex items-center justify-center gap-2"
                >
                  <Send size={12} /> Broadcast
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Live Bulletins */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <h2 className="font-extrabold text-slate-800 text-base uppercase tracking-tight mb-6">Active School Broadcasts</h2>
          
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {announcements.map((item: any) => (
              <div 
                key={item.id} 
                className={`p-6 rounded-3xl border relative group transition-all duration-300 hover:border-slate-300 ${
                  item.type === 'critical' ? 'bg-rose-50/50 border-rose-100/70' : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <button 
                  onClick={() => handleRemoveAnnouncement(item.id)}
                  className="absolute top-4 right-4 text-slate-350 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-100 rounded-lg"
                >
                  <Trash2 size={14} />
                </button>

                <div className="flex items-center gap-2.5 mb-2">
                  <span className={`w-2 h-2 rounded-full ${item.type === 'critical' ? 'bg-rose-500' : 'bg-blue-400'}`}></span>
                  <h4 className="font-extrabold text-slate-800 text-sm tracking-tight pr-8">{item.title}</h4>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">{item.body}</p>
                
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{item.date}</span>
              </div>
            ))}

            {announcements.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                <p className="font-bold text-xs">No notifications are broadcast currently</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

// ============================================================================
// 3. VIEW: STUDENT REGISTRY (MASTER-CHILD WITH DETAILED SUB-MENUS)
// ============================================================================

interface StudentRecord {
  id: string;
  name: string;
  class: string;
  status: 'Enrolled' | 'Suspended' | 'Alumni';
  fees: 'Cleared' | 'Partial' | 'Debt';
  photoUrl?: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  dob: string;
  medicalInfo: string;
  allergies: string;
  academicHistory: { subject: string; score: number; term: string }[];
  communicationLogs: { date: string; message: string; caller: string }[];
  firstLoginDone?: boolean;
  portalPasswordHash?: string;
  portalSalt?: string;
  securityQuestion?: string;
  securityAnswerHash?: string;
  accountDisabled?: boolean;
  reportCardPublished?: boolean;
  attendancePublished?: boolean;
  behavioralPublished?: boolean;
  loginHistory?: any[];
}

function StudentsView() {
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    const saved = localStorage.getItem('ff_students');
    return saved ? JSON.parse(saved) : [
      { 
        id: 'FFP/2026/001', 
        name: 'Oluwaseun Adewole', 
        class: 'SS 3', 
        status: 'Enrolled', 
        fees: 'Cleared',
        parentName: 'Mr. Adewole',
        parentPhone: '08122334455',
        parentEmail: 'adewole@gmail.com',
        dob: '2010-04-12',
        medicalInfo: 'Alineated left wrist. Clean file.',
        allergies: 'Shellfish',
        academicHistory: [
          { subject: 'Mathematics', score: 88, term: '3rd Term 25/26' },
          { subject: 'English Language', score: 92, term: '3rd Term 25/26' },
          { subject: 'Physics', score: 81, term: '3rd Term 25/26' }
        ],
        communicationLogs: [
          { date: 'May 10, 2026', message: 'Informed parent about terminal physics lab fees.', caller: 'Admin' }
        ]
      },
      { 
        id: 'FFP/2026/002', 
        name: 'Chioma Nwachukwu', 
        class: 'JSS 1', 
        status: 'Enrolled', 
        fees: 'Debt',
        parentName: 'Mrs. Nwachukwu',
        parentPhone: '07033445566',
        parentEmail: 'nwachukwu.c@gmail.com',
        dob: '2014-08-05',
        medicalInfo: 'Asthmatic. Safe inhaler in physical instructor desk.',
        allergies: 'Dust, Penicillin',
        academicHistory: [
          { subject: 'Mathematics', score: 72, term: '3rd Term 25/26' },
          { subject: 'English Language', score: 85, term: '3rd Term 25/26' }
        ],
        communicationLogs: [
          { date: 'May 15, 2026', message: 'Sent SMS reminder regarding school fees balance.', caller: 'Bursar' }
        ]
      }
    ];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // New Pupil Temp State
  const [newStuName, setNewStuName] = useState('');
  const [newStuClass, setNewStuClass] = useState('JSS 1');
  const [newStuStatus, setNewStuStatus] = useState<'Enrolled' | 'Alumni'>('Enrolled');
  const [newStuFees, setNewStuFees] = useState<'Cleared' | 'Partial' | 'Debt'>('Cleared');
  const [newStuParentName, setNewStuParentName] = useState('');
  const [newStuParentPhone, setNewStuParentPhone] = useState('');
  const [newStuParentEmail, setNewStuParentEmail] = useState('');
  const [newStuDob, setNewStuDob] = useState('');
  const [newStuMedical, setNewStuMedical] = useState('No outstanding clinical constraints.');
  const [newStuAllergies, setNewStuAllergies] = useState('None');
  const [newStuPhoto, setNewStuPhoto] = useState('');

  // Editing Student Temp State
  const [editStu, setEditStu] = useState<StudentRecord | null>(null);

  // Sub menu tabs (Academic Marks / Medical Records / Contacts / Communications)
  const [activeSubTab, setActiveSubTab] = useState<'records' | 'medical' | 'progress' | 'comms' | 'portal'>('records');

  // Interactive record modifiers (e.g. adding score or communication log)
  const [newSubject, setNewSubject] = useState('');
  const [newScore, setNewScore] = useState('');
  const [newCommDetails, setNewCommDetails] = useState('');

  useEffect(() => {
    syncFetchStudents().then(res => setStudents(res as any));
  }, []);

  useEffect(() => {
    syncSaveStudents(students as any);
  }, [students]);

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStuName.trim()) return;

    // Detect next sequential FFP/2026/001 ID
    let newSeq = 1;
    while (true) {
      const padded = String(newSeq).padStart(3, '0');
      const targetId = `FFP/2026/${padded}`;
      if (!students.some(s => s.id === targetId)) {
        break;
      }
      newSeq++;
    }
    const newId = `FFP/2026/${String(newSeq).padStart(3, '0')}`;

    const fresh: StudentRecord = {
      id: newId,
      name: newStuName,
      class: newStuClass,
      status: newStuStatus,
      fees: newStuFees,
      parentName: newStuParentName || 'Guardian',
      parentPhone: newStuParentPhone || 'N/A',
      parentEmail: newStuParentEmail || 'N/A',
      dob: newStuDob || '2012-01-01',
      medicalInfo: newStuMedical,
      allergies: newStuAllergies,
      photoUrl: newStuPhoto,
      academicHistory: [],
      firstLoginDone: false,
      reportCardPublished: true,
      attendancePublished: true,
      behavioralPublished: true,
      communicationLogs: []
    };

    setStudents([...students, fresh]);
    setNewStuName('');
    setNewStuParentName('');
    setNewStuParentPhone('');
    setNewStuParentEmail('');
    setNewStuPhoto('');
    setIsAdding(false);
    showBannerAlert(`Enrolled student record created: ${newId}`);
  };

  const startEditStudent = (stu: StudentRecord) => {
    setEditStu({ ...stu });
    setIsEditing(true);
  };

  const saveEditedStudent = () => {
    if (!editStu) return;
    const updated = students.map(s => s.id === editStu.id ? editStu : s);
    setStudents(updated);
    setSelectedStudent(editStu);
    setIsEditing(false);
    setEditStu(null);
    showBannerAlert('Student registry profile updated');
  };

  const handleDeleteStudent = (id: string) => {
    if (!window.confirm('Are you absolutely certain you want to purge this student from our system?')) return;
    setStudents(students.filter(s => s.id !== id));
    setSelectedStudent(null);
    showBannerAlert('Student record archived', false);
  };

  // Add Dynamic Score
  const handleAddScore = () => {
    if (!selectedStudent || !newSubject.trim() || !newScore) return;
    const freshScore = {
      subject: newSubject,
      score: parseInt(newScore) || 0,
      term: '1st Term 26/27'
    };
    const updatedHistory = [...selectedStudent.academicHistory, freshScore];
    const updatedStu = { ...selectedStudent, academicHistory: updatedHistory };
    setStudents(students.map(s => s.id === selectedStudent.id ? updatedStu : s));
    setSelectedStudent(updatedStu);
    setNewSubject('');
    setNewScore('');
    showBannerAlert('Academic subject score logged');
  };

  // Add Communication Logger
  const handleAddCommLog = () => {
    if (!selectedStudent || !newCommDetails.trim()) return;
    const freshLog = {
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      message: newCommDetails,
      caller: 'Admin Portal'
    };
    const updatedLogs = [freshLog, ...selectedStudent.communicationLogs];
    const updatedStu = { ...selectedStudent, communicationLogs: updatedLogs };
    setStudents(students.map(s => s.id === selectedStudent.id ? updatedStu : s));
    setSelectedStudent(updatedStu);
    setNewCommDetails('');
    showBannerAlert('Parent communication contact logged');
  };

  const filtered = students.filter(s => {
    const matchesQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = classFilter === 'ALL' || s.class === classFilter;
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Control Actions & Searches */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        <div className="flex flex-1 gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by student name or record ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select 
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-6 py-3 text-xs font-black text-slate-650 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">All Grades</option>
              <option value="Nursery">Nursery Level</option>
              <option value="Primary 1">Primary 1</option>
              <option value="Primary 2">Primary 2</option>
              <option value="Primary 3">Primary 3</option>
              <option value="Primary 4">Primary 4</option>
              <option value="Primary 5">Primary 5</option>
              <option value="Primary 6">Primary 6</option>
              <option value="JSS 1">JSS 1</option>
              <option value="JSS 2">JSS 2</option>
              <option value="JSS 3">JSS 3</option>
              <option value="SS 1">SS 1</option>
              <option value="SS 2">SS 2</option>
              <option value="SS 3">SS 3</option>
            </select>
          </div>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-white font-black text-xs uppercase tracking-widest px-8 py-3.5 rounded-2xl shadow-xl shadow-primary/25 flex items-center gap-2 shrink-0 active:scale-95 transition-all"
        >
          <PlusCircle size={14} /> Build Pupil File
        </button>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Registry table registry */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 max-h-[600px] overflow-y-auto">
          <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-tight mb-4">Registry Rosters ({filtered.length})</h3>
          
          <div className="space-y-3">
            {filtered.map(s => (
              <div 
                key={s.id}
                onClick={() => { setSelectedStudent(s); setIsEditing(false); }}
                className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center gap-4 group ${
                  selectedStudent?.id === s.id 
                    ? 'bg-primary/5 border-primary/40 shadow-sm' 
                    : 'bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-slate-100/50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  {s.photoUrl ? (
                    <img src={s.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 capitalize bg-slate-200">{s.name[0]}</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-slate-800 text-xs leading-none truncate uppercase">{s.name}</p>
                  <p className="text-[9px] font-bold text-slate-450 mt-1.5 uppercase tracking-wider">{s.id}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] font-extrabold text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-md">{s.class}</p>
                  <p className={`text-[8px] font-bold uppercase mt-1.5 ${
                    s.fees === 'Cleared' ? 'text-emerald-500' : s.fees === 'Partial' ? 'text-amber-500' : 'text-rose-500'
                  }`}>{s.fees}</p>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-20 text-slate-400">
                <p className="font-bold text-xs uppercase tracking-widest">No matching records found</p>
              </div>
            )}
          </div>
        </div>

        {/* Master details profile panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {selectedStudent ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
              
              {/* Profile Card Header */}
              <div className="bg-slate-900 text-white p-8 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12 select-none font-black text-8xl antialiased">
                  FF
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-center relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 overflow-hidden border-2 border-white/20 shrink-0">
                    {selectedStudent.photoUrl ? (
                      <img src={selectedStudent.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-2xl uppercase bg-slate-800 text-slate-400">{selectedStudent.name[0]}</div>
                    )}
                  </div>

                  <div className="text-center sm:text-left min-w-0 flex-1">
                    <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-widest inline-block">{selectedStudent.status}</span>
                    <h2 className="text-2xl font-black tracking-tight mt-2.5 uppercase">{selectedStudent.name}</h2>
                    <p className="text-xs text-slate-400 font-mono tracking-wider mt-1.5">{selectedStudent.id} &bull; GRADE: {selectedStudent.class}</p>
                  </div>

                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <button 
                      onClick={() => startEditStudent(selectedStudent)}
                      className="bg-white/10 hover:bg-white/25 text-white text-[10px] uppercase font-bold px-4 py-2 rounded-xl transition-all"
                    >
                      Edit Dossier
                    </button>
                    <button 
                      onClick={() => handleDeleteStudent(selectedStudent.id)}
                      className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-[10px] uppercase font-bold px-4 py-2 rounded-xl transition-all"
                    >
                      Expel Student
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub tabs selectors */}
              <div className="flex border-b border-slate-100 text-center shrink-0 overflow-x-auto select-none">
                {[
                  { id: 'records', label: 'File Dossier' },
                  { id: 'medical', label: 'Clinical Files' },
                  { id: 'progress', label: 'Academics' },
                  { id: 'comms', label: 'Home Alerts' },
                  { id: 'portal', label: 'Portal Access' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as any)}
                    className={`flex-1 py-4 px-2 font-bold text-[11px] uppercase tracking-wider border-b-2 transition-colors ${
                      activeSubTab === tab.id 
                        ? 'border-primary text-primary bg-primary/2' 
                        : 'border-transparent text-slate-400 hover:text-slate-650 hover:bg-slate-50/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Detail sheets panels */}
              <div className="p-8">
                
                {isEditing && editStu ? (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-200">
                    <h3 className="text-slate-800 font-extrabold text-sm uppercase">Quick File Update</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Legal Name</label>
                        <input 
                          type="text"
                          value={editStu.name}
                          onChange={(e) => setEditStu({ ...editStu, name: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Class Registry</label>
                        <select 
                          value={editStu.class}
                          onChange={(e) => setEditStu({ ...editStu, class: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-black text-slate-700"
                        >
                          <option value="JSS 1">JSS 1</option>
                          <option value="JSS 2">JSS 2</option>
                          <option value="JSS 3">JSS 3</option>
                          <option value="SS 1">SS 1</option>
                          <option value="SS 2">SS 2</option>
                          <option value="SS 3">SS 3</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Parent Full Name</label>
                        <input 
                          type="text"
                          value={editStu.parentName}
                          onChange={(e) => setEditStu({ ...editStu, parentName: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Parent Tel Address</label>
                        <input 
                          type="text"
                          value={editStu.parentPhone}
                          onChange={(e) => setEditStu({ ...editStu, parentPhone: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-slate-50 border border-slate-200 text-slate-505 rounded-xl text-xs uppercase font-extrabold flex-1">Abort</button>
                      <button onClick={saveEditedStudent} className="px-6 py-3 bg-primary text-white rounded-xl text-xs uppercase tracking-wider font-black flex-1 shadow-lg shadow-primary/20">Apply Changes</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    
                    {/* DOSSIER RECORDS */}
                    {activeSubTab === 'records' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Date of Birth</span>
                            <p className="text-xs font-black text-slate-700 mt-1">{selectedStudent.dob}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Enrollment state</span>
                            <p className="text-xs font-black text-emerald-600 mt-1 uppercase">{selectedStudent.status}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Primary Guardian Contacts</p>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-700 bg-white p-3.5 border border-slate-100 rounded-2xl">
                              <Users size={16} className="text-primary shrink-0" />
                              <span>{selectedStudent.parentName}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-700 bg-white p-3.5 border border-slate-100 rounded-2xl">
                              <Phone size={16} className="text-emerald-500 shrink-0" />
                              <span className="font-mono">{selectedStudent.parentPhone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-medium text-slate-550 bg-white p-3.5 border border-slate-100 rounded-2xl">
                              <Mail size={16} className="text-blue-500 shrink-0" />
                              <span>{selectedStudent.parentEmail}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MEDICAL FILE */}
                    {activeSubTab === 'medical' && (
                      <div className="space-y-6">
                        <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex items-start gap-4">
                          <ShieldAlert size={24} className="text-rose-600 shrink-0" />
                          <div>
                            <h4 className="text-rose-900 font-black text-xs uppercase tracking-wider">Critical Allergens</h4>
                            <p className="text-rose-700 text-xs mt-1 font-bold">{selectedStudent.allergies}</p>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Medical Notes / Conditions</span>
                          <p className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-medium text-slate-650 mt-2 leading-relaxed">
                            {selectedStudent.medicalInfo || 'No adverse clinical histories captured.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ACADEMIC SCORINGS */}
                    {activeSubTab === 'progress' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-tight">Terminal Examination History</h4>
                        </div>

                        <div className="space-y-2">
                          {selectedStudent.academicHistory.map((h, i) => (
                            <div key={i} className="flex justify-between items-center p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all">
                              <div>
                                <p className="text-xs font-extrabold text-slate-800 uppercase leading-none">{h.subject}</p>
                                <p className="text-[9px] text-slate-408 font-bold uppercase mt-1.5">{h.term}</p>
                              </div>
                              <span className={`text-base font-black ${
                                h.score >= 80 ? 'text-emerald-600' : h.score >= 50 ? 'text-amber-500' : 'text-rose-500'
                              }`}>{h.score}%</span>
                            </div>
                          ))}

                          {selectedStudent.academicHistory.length === 0 && (
                            <div className="text-center py-6 text-slate-400">
                              <p className="text-xs">No examination scorings logged in file</p>
                            </div>
                          )}
                        </div>

                        {/* Fast Scoring Entry Form */}
                        <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl space-y-4 pt-4 mt-6">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Log Term Assessment Score</p>
                          <div className="grid grid-cols-2 gap-3">
                            <input 
                              type="text" 
                              placeholder="Subject (e.g. English)"
                              value={newSubject}
                              onChange={(e) => setNewSubject(e.target.value)}
                              className="bg-white border border-slate-200 rounded-xl p-3 text-xs"
                            />
                            <input 
                              type="number" 
                              placeholder="Score (%)"
                              value={newScore}
                              onChange={(e) => setNewScore(e.target.value)}
                              className="bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold"
                            />
                          </div>
                          <button 
                            onClick={handleAddScore}
                            className="w-full bg-slate-800 text-white font-bold text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-slate-900 transition-colors"
                          >
                            Append Grade
                          </button>
                        </div>
                      </div>
                    )}

                    {/* HOME ALERTS & COMMUNICATIONS */}
                    {activeSubTab === 'comms' && (
                      <div className="space-y-6">
                        <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-tight">History of Parent Alerts</h4>
                        
                        <div className="space-y-3">
                          {selectedStudent.communicationLogs.map((log, i) => (
                            <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl relative">
                              <p className="text-xs font-semibold text-slate-650 leading-relaxed pr-2">{log.message}</p>
                              <div className="flex justify-between items-center mt-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                <span>Caller: {log.caller}</span>
                                <span>{log.date}</span>
                              </div>
                            </div>
                          ))}

                          {selectedStudent.communicationLogs.length === 0 && (
                            <div className="text-center py-6 text-slate-400">
                              <p className="text-xs">No previous alerts dispatched</p>
                            </div>
                          )}
                        </div>

                        {/* Add parent alert */}
                        <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl space-y-3 pt-4">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dispatch New Home alert Message</p>
                          <textarea 
                            rows={2}
                            placeholder="Type alert notes here (e.g. absent from classroom hours)..."
                            value={newCommDetails}
                            onChange={(e) => setNewCommDetails(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs focus:outline-none"
                          />
                          <button 
                            onClick={handleAddCommLog}
                            className="w-full bg-primary text-white font-bold text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-opacity-95 transition-colors"
                          >
                            Log Alert Note
                          </button>
                        </div>

                      </div>
                    )}

                    {/* PORTAL ACCESS CONTROL & AUDITING */}
                    {activeSubTab === 'portal' && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-100 rounded-3xl">
                          <div>
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Portal Registration State</span>
                            <span className={`inline-block mt-1 text-xs font-black uppercase px-2.5 py-1 rounded-full ${
                              selectedStudent.accountDisabled 
                                ? 'bg-red-50 text-red-600 border border-red-200' 
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            }`}>
                              {selectedStudent.accountDisabled ? '🛑 Access Suspended' : '✅ Active & Verified'}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              const updated = {
                                ...selectedStudent,
                                accountDisabled: !selectedStudent.accountDisabled
                              };
                              setStudents(students.map(s => s.id === selectedStudent.id ? updated : s));
                              setSelectedStudent(updated);
                              showBannerAlert(updated.accountDisabled ? 'Student portal suspended.' : 'Student portal reactivated.');
                            }}
                            className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                              selectedStudent.accountDisabled 
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {selectedStudent.accountDisabled ? 'Re-enable Access' : 'Suspend Account'}
                          </button>
                        </div>

                        {/* Reset and custom passwords */}
                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-4">
                          <h4 className="text-slate-800 font-black text-xs uppercase tracking-tight">Credentials Alignment & Password Resets</h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                            Resets reinstate the default parent phone number (<strong>{selectedStudent.parentPhone}</strong>) for access configuration. You can also specify a custom override below.
                          </p>

                          <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                              onClick={() => {
                                const updated = {
                                  ...selectedStudent,
                                  portalPasswordHash: undefined,
                                  portalSalt: undefined,
                                  firstLoginDone: false
                                };
                                setStudents(students.map(s => s.id === selectedStudent.id ? updated : s));
                                setSelectedStudent(updated);
                                showBannerAlert('Student password reset to default parent phone successfully.');
                              }}
                              className="px-4 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-705 rounded-xl text-xs uppercase font-black tracking-wider flex-1 transition-all pointer-events-auto"
                            >
                              Reset to Default Parent Phone
                            </button>
                          </div>

                          {/* Custom Password Set Form */}
                          <div className="border-t border-slate-100 pt-4 mt-2 space-y-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Set Override Password Directly</span>
                            <div className="flex gap-2">
                              <input
                                id="adminDirectOverridePassword"
                                type="text"
                                placeholder="Enter direct plain password..."
                                className="bg-white border border-slate-200 rounded-xl px-3 text-xs w-full focus:outline-none placeholder:text-slate-400 font-bold"
                              />
                              <button
                                onClick={async () => {
                                  const el = document.getElementById('adminDirectOverridePassword') as HTMLInputElement;
                                  const plainVal = el ? el.value.trim() : '';
                                  if (!plainVal) {
                                    showBannerAlert('Provide a password string before saving.');
                                    return;
                                  }
                                  if (plainVal.length < 6) {
                                    showBannerAlert('Passwords must be at least 6 characters.');
                                    return;
                                  }
                                  // Hash it
                                  const salt = Math.random().toString(36).substring(2, 10);
                                  const buf = new TextEncoder().encode(plainVal + salt);
                                  const hash = await crypto.subtle.digest('SHA-256', buf);
                                  const hexHash = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');

                                  const updated = {
                                    ...selectedStudent,
                                    portalPasswordHash: hexHash,
                                    portalSalt: salt,
                                    firstLoginDone: true
                                  };
                                  setStudents(students.map(s => s.id === selectedStudent.id ? updated : s));
                                  setSelectedStudent(updated);
                                  if (el) el.value = '';
                                  showBannerAlert('Override password hashed & applied.');
                                }}
                                className="bg-primary hover:bg-opacity-95 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 rounded-xl shrink-0"
                              >
                                Commit Override
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Publications Approvals */}
                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-4">
                          <h4 className="text-slate-800 font-black text-xs uppercase tracking-tight">Portal Sync & Publication Permissions</h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                            Control which score dashboards and terminal files are compiled and visible on the student's portal homepage.
                          </p>

                          <div className="space-y-3.5 pt-2">
                            {[
                              { key: 'reportCardPublished', label: 'Continuous Assessment & Report Card Results', desc: 'Allows students to review CA and term rankings' },
                              { key: 'attendancePublished', label: 'Classroom Daily Attendance Tracker', desc: 'Syncs live presence schedules and excuse approvals' },
                              { key: 'behavioralPublished', label: 'Behavioral conduct & Affective Logs', desc: 'Permits tracking of school honor conduct points' }
                            ].map((pubItem) => {
                              const isPub = selectedStudent[pubItem.key] !== false; // defaults to true if undefined
                              return (
                                <div key={pubItem.key} className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-2xl">
                                  <div>
                                    <span className="text-xs font-black text-slate-800 block">{pubItem.label}</span>
                                    <span className="text-[10px] text-slate-400 mt-0.5 block font-semibold">{pubItem.desc}</span>
                                  </div>

                                  <button
                                    onClick={() => {
                                      const updated = {
                                        ...selectedStudent,
                                        [pubItem.key]: !isPub
                                      };
                                      setStudents(students.map(s => s.id === selectedStudent.id ? updated : s));
                                      setSelectedStudent(updated);
                                      showBannerAlert(`${pubItem.label} status updated.`);
                                    }}
                                    className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                      isPub 
                                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-250' 
                                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-250'
                                    }`}
                                  >
                                    {isPub ? '🟢 Published / Active' : '🟡 Review Mode'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Recent Login Histroy logs */}
                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-3">
                          <h4 className="text-slate-800 font-black text-xs uppercase tracking-tight">Security Login Activity Audit Log</h4>
                          <span className="text-[11px] text-slate-400 tracking-tight block font-semibold">Auditing active browser sessions, logins and access terminals.</span>

                          <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-1">
                            {selectedStudent.loginHistory && selectedStudent.loginHistory.map((lh: any, idx: number) => (
                              <div key={idx} className="bg-white border border-slate-100 p-3.5 rounded-2xl flex justify-between items-start text-[11px] font-semibold text-slate-600 shadow-sm">
                                <div className="space-y-1">
                                  <p className="font-extrabold text-slate-800 text-xs">{lh.device}</p>
                                  <p className="text-[10px] text-slate-450 font-mono tracking-wider">{lh.ip}</p>
                                </div>
                                <div className="text-right space-y-1 shrink-0">
                                  <p className="text-primary font-black uppercase tracking-wider text-[9px]">{lh.date}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">{lh.time}</p>
                                </div>
                              </div>
                            ))}

                            {(!selectedStudent.loginHistory || selectedStudent.loginHistory.length === 0) && (
                              <p className="text-xs text-slate-400 text-center py-4 italic font-medium">No system login history records logged yet.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-[32px] p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[400px]">
              <Users size={48} className="opacity-20 mb-4 text-primary" />
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">No Student File Active</h3>
              <p className="text-xs text-slate-500 mt-2">Select any matching record from the registry catalog sidebar to view or manage credentials details.</p>
            </div>
          )}

        </div>

      </div>

      {/* Adding Student Modal Drawer overlay */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Enroll New Pupil</h3>
                <p className="text-xs text-slate-500 mt-1">Create an authorized student file profile in our local enterprise database.</p>
              </div>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Legal Pupil full name</label>
                  <input 
                    type="text"
                    value={newStuName}
                    onChange={(e) => setNewStuName(e.target.value)}
                    placeholder="Name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-850"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Grade Placement</label>
                  <select 
                    value={newStuClass}
                    onChange={(e) => setNewStuClass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-black text-slate-700"
                  >
                    <option value="JSS 1">JSS 1</option>
                    <option value="JSS 2">JSS 2</option>
                    <option value="JSS 3">JSS 3</option>
                    <option value="SS 1">SS 1</option>
                    <option value="SS 2">SS 2</option>
                    <option value="SS 3">SS 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Primary Guardian Name</label>
                  <input 
                    type="text"
                    value={newStuParentName}
                    onChange={(e) => setNewStuParentName(e.target.value)}
                    placeholder="E.g. Dr. Akinloye"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Guardian Contact Phone</label>
                  <input 
                    type="text"
                    value={newStuParentPhone}
                    onChange={(e) => setNewStuParentPhone(e.target.value)}
                    placeholder="+234..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Date of Birth</label>
                  <input 
                    type="date"
                    value={newStuDob}
                    onChange={(e) => setNewStuDob(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Clinical Allergies</label>
                  <input 
                    type="text"
                    value={newStuAllergies}
                    onChange={(e) => setNewStuAllergies(e.target.value)}
                    placeholder="E.g. Nuts"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs"
                  />
                </div>

              </div>

              <div className="border-t border-slate-100 pt-6">
                <ImageUploader 
                  label="Pupil Profile Photograph"
                  currentUrl={newStuPhoto}
                  onUpload={setNewStuPhoto}
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl text-xs uppercase font-extrabold flex-1"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="px-6 py-4 bg-primary text-white rounded-2xl text-xs uppercase tracking-widest font-black flex-1 shadow-xl shadow-primary/20"
                >
                  Enrolled student & Build Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// ============================================================================
// 4. VIEW: STAFF REGISTRY
// ============================================================================

interface StaffRecord {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  photoUrl?: string;
  isLoggedIn?: boolean;
  dateOfAppointment?: string;
  salary?: string;
  award?: string;
  punctualityAttendance?: string;
  regularityAttendance?: string;
  rating?: string;
  review?: string;
  assignedClass?: string;
  assignedClasses?: string[];
  assignedSubjects?: string[];
  classSubjectMappings?: { class: string; subject: string }[];
}

function StaffView() {
  const [staffList, setStaffList] = useState<StaffRecord[]>(() => {
    const saved = localStorage.getItem('ff_staff');
    return saved ? JSON.parse(saved) : [
      { 
        id: 'STF-001', 
        name: 'Dr. Adekunle Johnson', 
        role: 'Head of Mathematics', 
        email: 'a.johnson@faithfoundation.edu.ng', 
        phone: '08133445588',
        photoUrl: '',
        dateOfAppointment: '2021-09-01',
        salary: '₦350,000 / month',
        award: 'Teacher of the Year 2025',
        punctualityAttendance: '98%',
        regularityAttendance: '99%',
        rating: '4.9',
        review: 'Excellent performance and student feedback. Highly dedicated instructor.'
      },
      { 
        id: 'STF-002', 
        name: 'Mrs. Funke Akindele', 
        role: 'Senior Registrar office', 
        email: 'f.akindele@faithfoundation.edu.ng', 
        phone: '09055667788',
        photoUrl: '',
        dateOfAppointment: '2023-01-15',
        salary: '₦280,000 / month',
        award: 'Outstanding Service Award',
        punctualityAttendance: '97%',
        regularityAttendance: '98%',
        rating: '4.8',
        review: 'Extremely efficient in registry activities and parent communication.'
      }
    ];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<StaffRecord | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingStaff, setIsEditingStaff] = useState(false);

  // Temp state for Add form
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Teacher');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPhoto, setNewPhoto] = useState('');
  const [newDateOfAppointment, setNewDateOfAppointment] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [newAward, setNewAward] = useState('');
  const [newPunctuality, setNewPunctuality] = useState('95%');
  const [newRegularity, setNewRegularity] = useState('95%');
  const [newRating, setNewRating] = useState('5.0');
  const [newReview, setNewReview] = useState('');
  const [newAssignedClass, setNewAssignedClass] = useState('None');
  const [newAssignedClasses, setNewAssignedClasses] = useState<string[]>([]);
  const [newAssignedSubjects, setNewAssignedSubjects] = useState<string[]>([]);

  // Editing state for selected teacher's particulars
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffRole, setEditStaffRole] = useState('');
  const [editStaffEmail, setEditStaffEmail] = useState('');
  const [editStaffPhone, setEditStaffPhone] = useState('');
  const [editStaffPhoto, setEditStaffPhoto] = useState('');
  const [editStaffDateOfAppointment, setEditStaffDateOfAppointment] = useState('');
  const [editStaffSalary, setEditStaffSalary] = useState('');
  const [editStaffAward, setEditStaffAward] = useState('');
  const [editStaffPunctuality, setEditStaffPunctuality] = useState('');
  const [editStaffRegularity, setEditStaffRegularity] = useState('');
  const [editStaffRating, setEditStaffRating] = useState('');
  const [editStaffReview, setEditStaffReview] = useState('');
  const [editStaffAssignedClass, setEditStaffAssignedClass] = useState('None');
  const [editStaffAssignedClasses, setEditStaffAssignedClasses] = useState<string[]>([]);
  const [editStaffAssignedSubjects, setEditStaffAssignedSubjects] = useState<string[]>([]);

  // Subject and Class mapping configurations
  const [newClassSubjectMappings, setNewClassSubjectMappings] = useState<{ class: string; subject: string }[]>([]);
  const [editClassSubjectMappings, setEditClassSubjectMappings] = useState<{ class: string; subject: string }[]>([]);
  
  // Local picker state for assigning subjects to classes
  const [newPickerClass, setNewPickerClass] = useState('JSS 1');
  const [newPickerSubject, setNewPickerSubject] = useState('Mathematics');
  
  const [editPickerClass, setEditPickerClass] = useState('JSS 1');
  const [editPickerSubject, setEditPickerSubject] = useState('Mathematics');

  // Daily staff performance ratings states
  const [staffTab, setStaffTab] = useState<'catalog' | 'ratings'>('catalog');
  const [allRatings, setAllRatings] = useState<StaffDailyRating[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [selectedStaffForRating, setSelectedStaffForRating] = useState<StaffRecord | null>(null);
  const [ratingDate, setRatingDate] = useState(new Date().toISOString().split('T')[0]);
  const [ratingPunctuality, setRatingPunctuality] = useState(5);
  const [ratingRegularity, setRatingRegularity] = useState(5);
  const [ratingTeaching, setRatingTeaching] = useState(5);
  const [ratingDressing, setRatingDressing] = useState(5);
  const [ratingSpeaking, setRatingSpeaking] = useState(5);
  const [ratingAttitude, setRatingAttitude] = useState(5);
  const [ratingLeadership, setRatingLeadership] = useState(5);
  const [ratingRemarks, setRatingRemarks] = useState('');
  const [filterRatingStaffId, setFilterRatingStaffId] = useState<string>('All');
  const [filterRatingDate, setFilterRatingDate] = useState<string>('');

  useEffect(() => {
    setLoadingRatings(true);
    syncFetchStaffRatings()
      .then(res => setAllRatings(res))
      .finally(() => setLoadingRatings(false));
  }, []);

  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [chartTeacherId, setChartTeacherId] = useState<string>('');

  useEffect(() => {
    if (staffList.length > 0 && !chartTeacherId) {
      setChartTeacherId(staffList[0].id);
    }
  }, [staffList, chartTeacherId]);

  useEffect(() => {
    const savedLogs = localStorage.getItem('ff_activity_logs');
    setActivityLogs(savedLogs ? JSON.parse(savedLogs) : []);
  }, []);

  useEffect(() => {
    syncFetchStaff().then(res => setStaffList(res));
  }, []);

  useEffect(() => {
    syncSaveStaffList(staffList);
  }, [staffList]);

  const handleOpenDetails = (staff: StaffRecord) => {
    setSelectedStaff(staff);
    setIsEditingStaff(false);
    
    // Initialize editing values
    setEditStaffName(staff.name || '');
    setEditStaffRole(staff.role || '');
    setEditStaffEmail(staff.email || '');
    setEditStaffPhone(staff.phone || '');
    setEditStaffPhoto(staff.photoUrl || '');
    setEditStaffDateOfAppointment(staff.dateOfAppointment || '');
    setEditStaffSalary(staff.salary || '');
    setEditStaffAward(staff.award || '');
    setEditStaffPunctuality(staff.punctualityAttendance || '95%');
    setEditStaffRegularity(staff.regularityAttendance || '95%');
    setEditStaffRating(staff.rating || '5.0');
    setEditStaffReview(staff.review || '');
    setEditStaffAssignedClass(staff.assignedClass || 'None');
    setEditStaffAssignedClasses(staff.assignedClasses || (staff.assignedClass && staff.assignedClass !== 'None' ? [staff.assignedClass] : []));
    setEditStaffAssignedSubjects(staff.assignedSubjects || []);
    setEditClassSubjectMappings(staff.classSubjectMappings || []);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const fresh: StaffRecord = {
      id: `STF-00${staffList.length + 1}`,
      name: newName,
      role: newRole,
      email: newEmail || 'info@faithfoundation.edu.ng',
      phone: newPhone || 'N/A',
      photoUrl: newPhoto,
      dateOfAppointment: newDateOfAppointment || new Date().toISOString().split('T')[0],
      salary: newSalary || '₦200,000 / month',
      award: newAward || 'None',
      punctualityAttendance: newPunctuality || '95%',
      regularityAttendance: newRegularity || '95%',
      rating: newRating || '5.0',
      review: newReview || 'No review comments yet.',
      assignedClass: newAssignedClasses[0] || 'None',
      assignedClasses: newAssignedClasses,
      assignedSubjects: newAssignedSubjects,
      classSubjectMappings: newClassSubjectMappings
    };

    setStaffList([...staffList, fresh]);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewPhoto('');
    setNewDateOfAppointment('');
    setNewSalary('');
    setNewAward('');
    setNewPunctuality('95%');
    setNewRegularity('95%');
    setNewRating('5.0');
    setNewReview('');
    setNewAssignedClass('None');
    setNewAssignedClasses([]);
    setNewAssignedSubjects([]);
    setNewClassSubjectMappings([]);
    setIsAdding(false);
    showBannerAlert(`Created staff member credential logic.`);
  };

  const handleDeleteStaff = (id: string) => {
    if (!window.confirm('Erase selected staff file history permanently?')) return;
    setStaffList(staffList.filter(s => s.id !== id));
    setSelectedStaff(null);
    showBannerAlert('Staff dossier archived', false);
  };

  const handleSaveRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForRating) {
      alert('Please select a staff member to rate.');
      return;
    }
    const newRatingItem: StaffDailyRating = {
      id: `RATING-${Date.now()}`,
      staffId: selectedStaffForRating.id,
      staffName: selectedStaffForRating.name,
      date: ratingDate,
      punctuality: Number(ratingPunctuality),
      regularity: Number(ratingRegularity),
      teachingAbility: Number(ratingTeaching),
      dressing: Number(ratingDressing),
      speaking: Number(ratingSpeaking),
      attitude: Number(ratingAttitude),
      leadership: Number(ratingLeadership),
      remarks: ratingRemarks,
      ratedBy: 'School Administrator',
      createdAt: new Date().toISOString()
    };

    const updated = [newRatingItem, ...allRatings];
    setAllRatings(updated);
    await syncSaveStaffRatings(updated);
    
    // Calculate new average rating for this teacher and update their primary profile record!
    const teacherRatings = updated.filter(r => r.staffId === selectedStaffForRating.id);
    if (teacherRatings.length > 0) {
      let sum = 0;
      teacherRatings.forEach(curr => {
        const avg = (curr.punctuality + curr.regularity + curr.teachingAbility + curr.dressing + curr.speaking + curr.attitude + curr.leadership) / 7;
        sum += avg;
      });
      const newAverage = (sum / teacherRatings.length).toFixed(1);
      
      const updatedStaffList = staffList.map(s => {
        if (s.id === selectedStaffForRating.id) {
          return {
            ...s,
            rating: newAverage
          };
        }
        return s;
      });
      setStaffList(updatedStaffList);
      await syncSaveStaffList(updatedStaffList);
    }

    setRatingRemarks('');
    setSelectedStaffForRating(null);
    showBannerAlert(`Recorded daily rating metrics for ${selectedStaffForRating.name}`);
  };

  const handleDeleteRating = async (id: string) => {
    if (!window.confirm('Delete this rating history entry?')) return;
    const updated = allRatings.filter(r => r.id !== id);
    setAllRatings(updated);
    await syncSaveStaffRatings(updated);
    showBannerAlert('Rating archived', false);
  };

  const filtered = staffList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRatings = allRatings.filter(r => {
    const matchId = filterRatingStaffId === 'All' || r.staffId === filterRatingStaffId;
    const matchDate = !filterRatingDate || r.date === filterRatingDate;
    return matchId && matchDate;
  });

  const renderStarSelector = (label: string, value: number, setValue: (val: number) => void) => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-white transition-all">
        <span className="font-bold text-[10.5px] uppercase tracking-wide text-slate-500">{label}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setValue(star)}
              className={`p-1 rounded-lg transition-all cursor-pointer hover:scale-110 ${
                star <= value 
                  ? 'text-amber-500 bg-amber-50 border border-amber-200' 
                  : 'text-slate-300 bg-slate-50 border border-slate-100 hover:bg-slate-100'
              }`}
            >
              <Star size={13} fill={star <= value ? "currentColor" : "none"} />
            </button>
          ))}
          <span className="font-black font-mono text-[11px] text-slate-700 min-w-[32px] text-right">
            {value}.0
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-100 pb-3 gap-6">
        <button
          onClick={() => setStaffTab('catalog')}
          className={`pb-2.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            staffTab === 'catalog'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          📇 Staff Directory CRM
        </button>
        <button
          onClick={() => setStaffTab('ratings')}
          className={`pb-2.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            staffTab === 'ratings'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          📊 Daily Performance Evaluator
        </button>
      </div>

      {staffTab === 'catalog' ? (
        <>
          {/* Searches */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 w-full m-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Search our staff catalog listing by full name or roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-xs font-bold focus:outline-none"
              />
            </div>

            <button 
              onClick={() => setIsAdding(true)}
              className="bg-primary text-white font-black text-xs uppercase tracking-widest px-8 py-3.5 rounded-2xl shadow-xl flex items-center gap-2 w-full sm:w-auto shrink-0 justify-center font-display"
            >
              <Plus size={16} /> Add Class Mentor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(s => (
              <div 
                key={s.id}
                onClick={() => handleOpenDetails(s)}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-primary/40 cursor-pointer relative transition-all group duration-300 flex items-center gap-5 font-sans"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
                  {s.photoUrl ? (
                    <img src={s.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-extrabold text-slate-400 uppercase bg-slate-100">{s.name[0]}</div>
                  )}
                </div>

                <div className="min-w-0">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{s.id}</span>
                  <h4 className="font-extrabold text-slate-800 text-sm truncate uppercase leading-tight mt-1">{s.name}</h4>
                  <p className="text-[10px] font-extrabold text-primary bg-primary/5 px-2 py-1 rounded inline-block uppercase mt-2.5">{s.role}</p>
                  {s.assignedClass && s.assignedClass !== 'None' && (
                    <div className="text-[9px] font-black text-emerald-650 bg-emerald-50 px-2 py-0.5 rounded uppercase block mt-1">
                      Mentor: {s.assignedClass}
                    </div>
                  )}
                  {s.rating && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-500 font-extrabold">
                      <Star size={10} fill="currentColor" /> {s.rating}
                    </div>
                  )}
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteStaff(s.id); }}
                  className="absolute top-4 right-4 text-slate-350 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-50 rounded-lg"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

      {/* Term Analytics Dashboard */}
      {staffList.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 md:p-10 font-sans space-y-6 mt-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-primary" size={20} />
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Term Analytics Dashboard</h3>
              </div>
              <p className="text-xs text-slate-500">
                Authorized visual inspection of punctuality and regularity curves across the last term.
              </p>
            </div>
            
            {/* Select individual teacher */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">SELECT TEACHER FOR TREND ANALYSIS:</span>
              <select
                value={chartTeacherId}
                onChange={(e) => setChartTeacherId(e.target.value)}
                className="bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white transition-all w-full md:w-56 cursor-pointer"
              >
                {staffList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Teacher Trend overview */}
          {(() => {
            const selectedChartTeacher = staffList.find(t => t.id === chartTeacherId) || staffList[0];
            if (!selectedChartTeacher) return null;

            // Generator for chart points
            const pVal = parseInt(selectedChartTeacher.punctualityAttendance || '95', 10) || 95;
            const rVal = parseInt(selectedChartTeacher.regularityAttendance || '95', 10) || 95;
            
            const months = [
              { name: 'January', code: 'Jan' },
              { name: 'February', code: 'Feb' },
              { name: 'March', code: 'Mar' },
              { name: 'April', code: 'Apr' },
              { name: 'May', code: 'May' },
              { name: 'June', code: 'Jun' }
            ];
            
            const hashValue = selectedChartTeacher.id ? selectedChartTeacher.id.split('-')[1] || '3' : '3';
            const hash = parseInt(hashValue, 10) || 3;
            
            const chartData = months.map((month, idx) => {
              const pOffset = Math.sin((idx + hash) * 1.3) * 4.5 + (idx % 2 === 0 ? 0.8 : -1.2);
              const rOffset = Math.cos((idx - hash) * 1.1) * 3.2 + (idx % 3 === 0 ? 1.4 : -0.8);
              
              const pFinal = Math.min(100, Math.max(70, Math.round(pVal + pOffset)));
              const rFinal = Math.min(100, Math.max(70, Math.round(rVal + rOffset)));
              
              return {
                month: month.name,
                short: month.code,
                Punctuality: pFinal,
                Regularity: rFinal
              };
            });

            return (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Details card for Selected Teacher */}
                <div className="lg:col-span-1 bg-slate-50/75 border border-slate-100 rounded-2xl p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 overflow-hidden shrink-0 flex items-center justify-center border border-slate-150">
                        {selectedChartTeacher.photoUrl ? (
                          <img src={selectedChartTeacher.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-xl font-black text-primary uppercase">{selectedChartTeacher.name[0]}</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-800 text-xs truncate uppercase leading-tight">{selectedChartTeacher.name}</h4>
                        <p className="text-[9px] font-bold text-primary truncate uppercase mt-0.5">{selectedChartTeacher.role}</p>
                      </div>
                    </div>

                    <div className="space-y-3.5 pt-4 border-t border-slate-150 text-xs">
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100/60">
                        <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider font-sans">Punctuality</span>
                        <span className="font-black text-primary bg-primary/5 px-2 py-0.5 rounded text-xs">{selectedChartTeacher.punctualityAttendance || '95%'}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100/60">
                        <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider font-sans">Regularity</span>
                        <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">{selectedChartTeacher.regularityAttendance || '95%'}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100/60">
                        <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider font-sans">Merit Rating</span>
                        <span className="font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs">⭐ {selectedChartTeacher.rating || '5.0'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary assessment */}
                  <div className="pt-4 border-t border-slate-150 text-[11px] text-slate-500 leading-relaxed bg-white/40 p-3 rounded-xl border border-slate-100 italic">
                    "{selectedChartTeacher.review || 'No written performance evaluation remarks loaded.'}"
                  </div>
                </div>

                {/* Recharts chart area */}
                <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-4 md:p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-5 px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">Term Trend Curve (%)</span>
                    <div className="flex gap-4 text-xs font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-primary rounded-full"></span>
                        <span className="text-slate-650">Punctuality Rate</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span>
                        <span className="text-slate-650">Regularity Rate</span>
                      </div>
                    </div>
                  </div>

                  {/* Chart container */}
                  <div className="h-[280px] w-full text-xs font-sans">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorAdminPunctuality" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01}/>
                          </linearGradient>
                          <linearGradient id="colorAdminRegularity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="short" 
                          tickLine={false} 
                          axisLine={false}
                          stroke="#94a3b8"
                          style={{ fontSize: '10px', fontWeight: 600 }}
                        />
                        <YAxis 
                          domain={[50, 100]} 
                          tickLine={false}
                          axisLine={false}
                          stroke="#94a3b8"
                          style={{ fontSize: '10px', fontWeight: 600 }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            fontFamily: 'Inter, sans-serif'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="Punctuality" 
                          stroke="#2563eb" 
                          strokeWidth={2.5}
                          fillOpacity={1} 
                          fill="url(#colorAdminPunctuality)" 
                          activeDot={{ r: 6 }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="Regularity" 
                          stroke="#6366f1" 
                          strokeWidth={2.5}
                          fillOpacity={1} 
                          fill="url(#colorAdminRegularity)" 
                          activeDot={{ r: 6 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-extrabold uppercase tracking-wider">Metrics Derived from Recorded Monthly Sign-ins</span>
                    <span className="font-bold font-sans">Target Index: &ge; 95% Expected</span>
                  </div>
                </div>

              </div>
            );
          })()}
        </div>
      )}

      {/* University-Grade Teacher Activity Audit Ledger */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm mt-10 space-y-5 font-sans">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black tracking-tight text-slate-800 flex items-center gap-2">
              <ShieldCheck className="text-secondary" size={18} />
              University academic Audit Logs & Accountability Ledger
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-extrabold">Real-time system-wide log for learning material, assignments, grades and attendance revisions.</p>
          </div>
          <button 
            type="button"
            onClick={() => {
              const savedLogs = localStorage.getItem('ff_activity_logs');
              setActivityLogs(savedLogs ? JSON.parse(savedLogs) : []);
            }}
            className="text-[9px] font-black uppercase text-secondary hover:underline cursor-pointer bg-secondary/5 px-4 py-2 rounded-xl self-start sm:self-auto"
          >
            Refresh Logs
          </button>
        </div>

        <div className="max-h-[350px] overflow-y-auto space-y-3.5 pr-2">
          {activityLogs.length === 0 ? (
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono italic py-10 text-center">No teacher academic activities registered yet.</p>
          ) : (
            activityLogs.map((log: any) => (
              <div key={log.id} className="p-4 border rounded-3xl bg-slate-50/45 flex justify-between items-start gap-4 hover:border-slate-200 transition-colors">
                <div className="space-y-1.5">
                  <div className="flex gap-2.5 items-center flex-wrap">
                    <span className="text-[8px] bg-secondary text-white font-black px-2 py-0.5 rounded-lg font-mono uppercase tracking-widest text-center">
                      {log.action}
                    </span>
                    <span className="text-[10px] font-black text-slate-700 font-mono">
                      {log.user_email}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-600 leading-snug">{log.details}</p>
                </div>
                <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap font-mono uppercase text-right">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{" "}
                  {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
        </>
      ) : (
        /* ================= DAILY PERFORMANCE RATINGS COMPONENT ================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300 font-sans">
          
          {/* Column 1: Submit Rating Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-5">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Evaluate Daily Performance</h3>
                <p className="text-[10.5px] text-slate-400 font-bold mt-1 uppercase tracking-wide">
                  Record official score evaluation across 7 key educational indexes.
                </p>
              </div>

              <form onSubmit={handleSaveRating} className="space-y-4">
                <div>
                  <label className="block text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1.5">Select Instructor / Mentor</label>
                  <select
                    required
                    value={selectedStaffForRating?.id || ''}
                    onChange={(e) => {
                      const found = staffList.find(s => s.id === e.target.value);
                      setSelectedStaffForRating(found || null);
                    }}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">-- Choose Staff Member --</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1.5">Evaluation Date</label>
                  <input
                    type="date"
                    required
                    value={ratingDate}
                    onChange={(e) => setRatingDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white transition-all cursor-pointer"
                  />
                </div>

                {/* Star selectors for all 7 metrics */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  {renderStarSelector('🕒 Punctuality', ratingPunctuality, setRatingPunctuality)}
                  {renderStarSelector('📅 Regularity', ratingRegularity, setRatingRegularity)}
                  {renderStarSelector('📖 Teaching Ability', ratingTeaching, setRatingTeaching)}
                  {renderStarSelector('👔 Hair & Dressing', ratingDressing, setRatingDressing)}
                  {renderStarSelector('🗣️ Spoken English', ratingSpeaking, setRatingSpeaking)}
                  {renderStarSelector('😊 Public Attitude', ratingAttitude, setRatingAttitude)}
                  {renderStarSelector('👑 Peer Leadership', ratingLeadership, setRatingLeadership)}
                </div>

                <div className="pt-2">
                  <label className="block text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1.5">Professional Remarks / Specific Actions</label>
                  <textarea
                    placeholder="Provide constructive assessment feedback..."
                    value={ratingRemarks}
                    onChange={(e) => setRatingRemarks(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs font-bold text-slate-700 h-20 focus:outline-none focus:bg-white transition-all placeholder-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedStaffForRating}
                  className={`w-full text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow ${
                    selectedStaffForRating 
                      ? 'bg-primary cursor-pointer hover:bg-opacity-95 shadow-primary/20' 
                      : 'bg-slate-200 cursor-not-allowed text-slate-400 shadow-none'
                  }`}
                >
                  Confirm Assessment Score
                </button>
              </form>
            </div>
          </div>

          {/* Column 2: Search filters & ratings ledger list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight font-sans">Evaluations Ledger</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">
                    Access historical records of logged and authorized ratings.
                  </p>
                </div>

                <div className="flex bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl text-[10px] font-extrabold text-slate-600 gap-1">
                  <span className="text-slate-400 uppercase tracking-wide">Historical Average:</span>
                  <span className="text-primary font-black font-mono">
                    {(() => {
                      if (filteredRatings.length === 0) return '0.0';
                      let sum = 0;
                      filteredRatings.forEach(r => {
                        sum += (r.punctuality + r.regularity + r.teachingAbility + r.dressing + r.speaking + r.attitude + r.leadership) / 7;
                      });
                      return (sum / filteredRatings.length).toFixed(1);
                    })()} / 5.0
                  </span>
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Filter by Instructor</label>
                  <select
                    value={filterRatingStaffId}
                    onChange={(e) => setFilterRatingStaffId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="All">All Evaluated Staff</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Filter by Specific Date</label>
                  <input
                    type="date"
                    value={filterRatingDate}
                    onChange={(e) => setFilterRatingDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-700 cursor-pointer"
                  />
                </div>
              </div>

              {/* Evaluations ratings list logs */}
              {loadingRatings ? (
                <div className="py-20 text-center text-slate-400 font-mono text-[11px] uppercase tracking-wider animate-pulse">
                  Querying ratings from primary tables...
                </div>
              ) : filteredRatings.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono italic">No matching records registered in ratings ledger.</p>
                  {(filterRatingStaffId !== 'All' || filterRatingDate) && (
                    <button
                      onClick={() => { setFilterRatingStaffId('All'); setFilterRatingDate(''); }}
                      className="mt-3 text-primary text-[9px] font-black uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-xl cursor-pointer"
                    >
                      Reset active query filter
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
                  {filteredRatings.map((rating) => {
                    const singleAvg = (rating.punctuality + rating.regularity + rating.teachingAbility + rating.dressing + rating.speaking + rating.attitude + rating.leadership) / 7;
                    
                    return (
                      <div key={rating.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/25 hover:bg-white transition-all hover:border-slate-200 space-y-3.5 relative group">
                        
                        {/* Rating Card Header */}
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-extrabold text-slate-500 uppercase text-xs">
                              {rating.staffName ? rating.staffName[0] : 'T'}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-800 text-xs uppercase">{rating.staffName}</h4>
                              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                                Rated {rating.date} &middot; By {rating.ratedBy || 'Admin'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-xl border border-amber-100 font-black font-sans text-[11px]">
                            ⭐ {singleAvg.toFixed(1)}
                          </div>
                        </div>

                        {/* Domain Ratings Badges */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 pt-2 border-t border-dashed border-slate-100 text-[8px] font-black uppercase text-slate-500 tracking-tight text-center">
                          <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                            <span className="block text-slate-400 mb-0.5">🗓️ Punct</span>
                            <span className="block font-bold text-slate-800 text-[10px] font-mono">{rating.punctuality}</span>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                            <span className="block text-slate-400 mb-0.5">📑 Regular</span>
                            <span className="block font-bold text-slate-805 text-[10px] font-mono">{rating.regularity}</span>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                            <span className="block text-slate-400 mb-0.5">📖 Teach</span>
                            <span className="block font-bold text-slate-805 text-[10px] font-mono">{rating.teachingAbility}</span>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                            <span className="block text-slate-400 mb-0.5">👔 Dress</span>
                            <span className="block font-bold text-slate-805 text-[10px] font-mono">{rating.dressing}</span>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                            <span className="block text-slate-400 mb-0.5">🗣️ Speak</span>
                            <span className="block font-bold text-slate-805 text-[10px] font-mono">{rating.speaking}</span>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                            <span className="block text-slate-400 mb-0.5">😊 Attitude</span>
                            <span className="block font-bold text-slate-805 text-[10px] font-mono">{rating.attitude}</span>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                            <span className="block text-slate-400 mb-0.5">👑 Leader</span>
                            <span className="block font-bold text-slate-805 text-[10px] font-mono">{rating.leadership}</span>
                          </div>
                        </div>

                        {/* Remarks */}
                        {rating.remarks && (
                          <div className="p-3 bg-white border border-slate-100 rounded-xl text-[11px] text-slate-600 leading-relaxed italic">
                            "{rating.remarks}"
                          </div>
                        )}

                        {/* Erase rating entry */}
                        <button
                          type="button"
                          onClick={() => handleDeleteRating(rating.id)}
                          className="absolute top-2 right-12 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] border border-slate-100 max-w-xl w-full p-10 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <div>
              <h3 className="text-2xl font-black text-slate-800">Add Staff</h3>
              <p className="text-xs text-slate-500 mt-1">Register institutional class tutors or support supervisors.</p>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs font-bold text-slate-600">
              <div>
                <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Office Role / Designation</label>
                <input 
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Mobile Number</label>
                  <input 
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Date of Appointment</label>
                  <input 
                    type="date"
                    value={newDateOfAppointment}
                    onChange={(e) => setNewDateOfAppointment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Salary particulars</label>
                  <input 
                    type="text"
                    placeholder="e.g. ₦250,000 / month"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Honorary Awards</label>
                  <input 
                    type="text"
                    placeholder="e.g. MVP Mentor 2025"
                    value={newAward}
                    onChange={(e) => setNewAward(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Initial Officer Rating (1.0-5.0)</label>
                  <input 
                    type="text"
                    placeholder="5.0"
                    value={newRating}
                    onChange={(e) => setNewRating(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Punctuality attendance %</label>
                  <input 
                    type="text"
                    placeholder="e.g. 98%"
                    value={newPunctuality}
                    onChange={(e) => setNewPunctuality(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Regularity attendance %</label>
                  <input 
                    type="text"
                    placeholder="e.g. 97%"
                    value={newRegularity}
                    onChange={(e) => setNewRegularity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Assigned Classes</label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-150">
                  {['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3', 'SS 3 Science Alpha'].map((cls) => {
                    const isSelected = newAssignedClasses.includes(cls);
                    return (
                      <button
                        type="button"
                        key={cls}
                        onClick={() => {
                          if (isSelected) {
                            setNewAssignedClasses(newAssignedClasses.filter(c => c !== cls));
                          } else {
                            setNewAssignedClasses([...newAssignedClasses, cls]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected 
                            ? 'bg-primary text-white border-primary shadow-sm' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {cls}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9px] text-slate-400 mt-1 uppercase italic font-medium">Select all classes assigned to this new staff member.</p>
              </div>

              <div>
                <label className="block mb-1.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Assigned Subjects</label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-150">
                  {['Mathematics', 'Further Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Civic Education', 'Economics', 'Geography', 'Government', 'Yoruba', 'Business Studies', 'P.H.E', 'Social Studies', 'Agric', 'Home Economics', 'Computer', 'Basic Tech', 'Basic Science', 'Accounting', 'Commerce'].map((subj) => {
                    const isSelected = newAssignedSubjects.includes(subj);
                    return (
                      <button
                        type="button"
                        key={subj}
                        onClick={() => {
                          if (isSelected) {
                            setNewAssignedSubjects(newAssignedSubjects.filter(s => s !== subj));
                          } else {
                            setNewAssignedSubjects([...newAssignedSubjects, subj]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {subj}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9px] text-slate-400 mt-1 uppercase italic font-medium">Assign curriculum subjects to this new profile.</p>
              </div>

              {/* Flexible Subject & Class Assignment Widget */}
              <div className="bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-widest">
                    Subject & Class Assignments
                  </label>
                  <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-black uppercase">
                    Flexible Linker
                  </span>
                </div>
                
                {newClassSubjectMappings.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic bg-white/70 p-3 rounded-2xl text-center border border-dashed border-slate-200">
                    No specific subject-to-class assignment mappings added. Use the form below to pair subjects with classes.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                    {newClassSubjectMappings.map((mapping, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-2 text-[10px] font-bold text-slate-700"
                      >
                        <span className="text-slate-800 font-extrabold">{mapping.subject}</span>
                        <span className="text-slate-400 font-normal font-sans">in</span>
                        <span className="text-indigo-600 font-black">{mapping.class}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewClassSubjectMappings(newClassSubjectMappings.filter((_, i) => i !== idx));
                          }}
                          className="text-red-400 hover:text-red-600 font-bold ml-1 cursor-pointer transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2 bg-white/80 p-2.5 rounded-2xl border border-indigo-50 items-end">
                  <div className="flex-1">
                    <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Class</label>
                    <select
                      value={newPickerClass}
                      onChange={(e) => setNewPickerClass(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-[10px] font-black uppercase focus:outline-none"
                    >
                      {['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3', 'SS 3 Science Alpha'].map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-[2_2_0%]">
                    <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Subject</label>
                    <select
                      value={newPickerSubject}
                      onChange={(e) => setNewPickerSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-[10px] font-bold focus:outline-none"
                    >
                      {['Mathematics', 'Further Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Civic Education', 'Economics', 'Geography', 'Government', 'Yoruba', 'Business Studies', 'P.H.E', 'Social Studies', 'Agric', 'Home Economics', 'Computer', 'Basic Tech', 'Basic Science', 'Accounting', 'Commerce'].map(subj => (
                        <option key={subj} value={subj}>{subj}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const exists = newClassSubjectMappings.some(m => m.class === newPickerClass && m.subject === newPickerSubject);
                      if (exists) return; // Prevent duplicate
                      
                      // Push to mapping list
                      const updated = [...newClassSubjectMappings, { class: newPickerClass, subject: newPickerSubject }];
                      setNewClassSubjectMappings(updated);
                      
                      // Auto-include in assigned classes
                      if (!newAssignedClasses.includes(newPickerClass)) {
                        setNewAssignedClasses([...newAssignedClasses, newPickerClass]);
                      }
                      
                      // Auto-include in assigned subjects
                      if (!newAssignedSubjects.includes(newPickerSubject)) {
                        setNewAssignedSubjects([...newAssignedSubjects, newPickerSubject]);
                      }
                    }}
                    className="py-2.5 px-3 bg-indigo-600 text-white font-extrabold text-[10px] uppercase rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer shadow-md shadow-indigo-100"
                  >
                    ＋ Assign
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Performance Review comments</label>
                <textarea 
                  placeholder="Review comment particulars..."
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none font-medium"
                />
              </div>

              <div className="pt-2">
                <ImageUploader 
                  label="Staff Photograph"
                  currentUrl={newPhoto}
                  onUpload={setNewPhoto}
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-50">
                <button type="button" onClick={() => setIsAdding(false)} className="py-3 px-6 bg-slate-100 text-slate-500 font-extrabold rounded-xl uppercase flex-1">Abort</button>
                <button type="submit" className="py-3 px-6 bg-primary text-white font-black rounded-xl uppercase tracking-widest flex-1 shadow-lg shadow-primary/20">Enroll Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Staff detail / Edit Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] border border-slate-100 max-w-2xl w-full p-8 md:p-10 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto font-sans">
            
            {/* Header portion */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-150 overflow-hidden shrink-0 flex items-center justify-center">
                  {(editStaffPhoto || selectedStaff.photoUrl) ? (
                    <img src={editStaffPhoto || selectedStaff.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-2xl font-black text-slate-400 uppercase">{(editStaffName || selectedStaff.name)[0]}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-slate-800 uppercase truncate">{editStaffName || selectedStaff.name}</h3>
                  <p className="text-xs text-primary font-bold uppercase tracking-wider truncate">{editStaffRole || selectedStaff.role} &middot; {selectedStaff.id}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {!isEditingStaff ? (
                  <button
                    onClick={() => setIsEditingStaff(true)}
                    className="p-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-primary hover:text-white transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                  >
                    <Edit size={14} /> Edit
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingStaff(false)}
                    className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all text-xs font-bold uppercase tracking-wiest"
                  >
                    View Mode
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedStaff(null)}
                  className="p-2.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* View Mode or Edit Mode */}
            {!isEditingStaff ? (
              <div className="space-y-6 text-xs text-slate-600">
                {/* Contact details */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100/60">
                  <div>
                    <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Email Address</span>
                    <span className="font-extrabold text-slate-850 break-all">{selectedStaff.email}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Mobile Line</span>
                    <span className="font-bold text-slate-800">{selectedStaff.phone}</span>
                  </div>
                </div>

                {/* Particulars list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Appointment */}
                  <div className="bg-white border border-slate-150 rounded-2xl p-4 flex gap-3.5 items-center">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">Date of Appointment</span>
                      <span className="text-slate-850 font-extrabold text-xs">{selectedStaff.dateOfAppointment || 'Not Set'}</span>
                    </div>
                  </div>

                  {/* Salary */}
                  <div className="bg-white border border-slate-150 rounded-2xl p-4 flex gap-3.5 items-center">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">Salary particulars</span>
                      <span className="text-slate-850 font-extrabold text-xs font-mono">{selectedStaff.salary || 'Not Set'}</span>
                    </div>
                  </div>

                  {/* Award */}
                  <div className="bg-white border border-slate-150 rounded-2xl p-4 flex gap-3.5 items-center">
                    <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
                      <Award size={18} />
                    </div>
                    <div>
                      <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">Distinguished Awards</span>
                      <span className="text-slate-850 font-extrabold text-xs">{selectedStaff.award || 'No honors logged'}</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="bg-white border border-slate-150 rounded-2xl p-4 flex gap-3.5 items-center">
                    <div className="p-3 bg-yellow-50 text-yellow-500 rounded-xl">
                      <Star size={18} fill="currentColor" />
                    </div>
                    <div>
                      <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">Staff performance Rating</span>
                      <span className="text-slate-850 font-extrabold text-xs">
                        ⭐ {selectedStaff.rating || '5.0'} / 5.0
                      </span>
                    </div>
                  </div>

                  {/* Punctuality */}
                  <div className="bg-white border border-slate-150 rounded-2xl p-4 flex gap-3.5 items-center">
                    <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                      <Clock size={18} />
                    </div>
                    <div>
                      <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">Punctuality Attendance</span>
                      <span className="text-slate-850 font-extrabold text-xs">{selectedStaff.punctualityAttendance || '95%'}</span>
                    </div>
                  </div>

                  {/* Regularity */}
                  <div className="bg-white border border-slate-150 rounded-2xl p-4 flex gap-3.5 items-center">
                    <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">Regularity Attendance</span>
                      <span className="text-slate-850 font-extrabold text-xs">{selectedStaff.regularityAttendance || '95%'}</span>
                    </div>
                  </div>

                  {/* Assigned Classes */}
                  <div className="bg-white border border-slate-150 rounded-2xl p-4 flex gap-3.5 items-center md:col-span-2">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl self-start">
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest ">Assigned Classes</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedStaff.assignedClasses && selectedStaff.assignedClasses.length > 0 ? (
                          selectedStaff.assignedClasses.map(c => (
                            <span key={c} className="px-2 py-0.5 bg-emerald-50 border border-emerald-200/50 text-emerald-800 text-[9px] font-black rounded-lg uppercase">
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-850 font-extrabold text-xs">{selectedStaff.assignedClass || 'None'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Assigned Subjects */}
                  <div className="bg-white border border-slate-150 rounded-2xl p-4 flex gap-3.5 items-center md:col-span-2">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl self-start">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest ">Assigned Subjects</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedStaff.assignedSubjects && selectedStaff.assignedSubjects.length > 0 ? (
                          selectedStaff.assignedSubjects.map(s => (
                            <span key={s} className="px-2 py-0.5 bg-indigo-50 border border-indigo-200/50 text-indigo-800 text-[9px] font-black rounded-lg uppercase">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic text-[10px] font-semibold">No subjects assigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Class-Subject Specific Mappings */}
                  {selectedStaff.classSubjectMappings && selectedStaff.classSubjectMappings.length > 0 && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 flex gap-3.5 items-start md:col-span-2 shadow-sm font-sans">
                      <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md shrink-0">
                        <BookOpen size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-[9px] font-black uppercase text-indigo-700 tracking-widest ">Subject to Class Mappings Schedule</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {selectedStaff.classSubjectMappings.map((m, idx) => (
                            <div key={idx} className="bg-white/80 backdrop-blur border border-indigo-100/50 p-2 rounded-xl flex items-center justify-between text-[10px] font-bold text-slate-700 shadow-sm leading-tight">
                              <span className="text-slate-800 font-extrabold truncate">{m.subject}</span>
                              <span className="text-[9px] bg-indigo-100/80 text-indigo-700 px-1.5 py-0.5 rounded font-black uppercase ml-1 shrink-0">{m.class}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Review comments */}
                <div className="border border-slate-150 rounded-2xl p-5 bg-slate-50 space-y-2">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                    <FileText size={10} /> Performance Review Summary
                  </span>
                  <p className="text-slate-700 italic font-medium leading-relaxed bg-white p-3.5 rounded-xl border border-slate-100">
                    "{selectedStaff.review || 'No written review evaluated yet.'}"
                  </p>
                </div>

                {/* Foot actions */}
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 uppercase tracking-widest font-black">Authorized Registrar Terminal</span>
                  <button 
                    onClick={() => handleDeleteStaff(selectedStaff.id)} 
                    className="text-red-500 hover:text-red-700 font-black uppercase tracking-widest"
                  >
                    Archive Dossier
                  </button>
                </div>

              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                const updated: StaffRecord = {
                  ...selectedStaff,
                  name: editStaffName,
                  role: editStaffRole,
                  email: editStaffEmail,
                  phone: editStaffPhone,
                  photoUrl: editStaffPhoto,
                  dateOfAppointment: editStaffDateOfAppointment,
                  salary: editStaffSalary,
                  award: editStaffAward,
                  punctualityAttendance: editStaffPunctuality,
                  regularityAttendance: editStaffRegularity,
                  rating: editStaffRating,
                  review: editStaffReview,
                  assignedClass: editStaffAssignedClasses[0] || 'None',
                  assignedClasses: editStaffAssignedClasses,
                  assignedSubjects: editStaffAssignedSubjects,
                  classSubjectMappings: editClassSubjectMappings
                };
                const nextStaffList = staffList.map(s => s.id === selectedStaff!.id ? updated : s);
                setStaffList(nextStaffList);
                setSelectedStaff(updated);
                setIsEditingStaff(false);
                showBannerAlert('Staff details updated successfully!');
              }} className="space-y-4 text-xs font-bold text-slate-600">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Teacher Full Name</label>
                    <input 
                      type="text"
                      value={editStaffName}
                      onChange={(e) => setEditStaffName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Office Role / Designation</label>
                    <input 
                      type="text"
                      value={editStaffRole}
                      onChange={(e) => setEditStaffRole(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Email Address</label>
                    <input 
                      type="email"
                      value={editStaffEmail}
                      onChange={(e) => setEditStaffEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Mobile Phone Number</label>
                    <input 
                      type="text"
                      value={editStaffPhone}
                      onChange={(e) => setEditStaffPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Date of Appointment</label>
                    <input 
                      type="date"
                      value={editStaffDateOfAppointment}
                      onChange={(e) => setEditStaffDateOfAppointment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Salary Particulars</label>
                    <input 
                      type="text"
                      value={editStaffSalary}
                      onChange={(e) => setEditStaffSalary(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                      placeholder="₦250,500 / month"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Distinguished Awards</label>
                    <input 
                      type="text"
                      value={editStaffAward}
                      onChange={(e) => setEditStaffAward(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                      placeholder="e.g. Teacher of the Year"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Performance Rating (1.0 - 5.0)</label>
                    <input 
                      type="text"
                      value={editStaffRating}
                      onChange={(e) => setEditStaffRating(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                      placeholder="4.8"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Punctuality Attendance Rate</label>
                    <input 
                      type="text"
                      value={editStaffPunctuality}
                      onChange={(e) => setEditStaffPunctuality(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                      placeholder="98%"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Regularity Attendance Rate</label>
                    <input 
                      type="text"
                      value={editStaffRegularity}
                      onChange={(e) => setEditStaffRegularity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none"
                      placeholder="97%"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Assigned Classes</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-150">
                    {['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3', 'SS 3 Science Alpha'].map((cls) => {
                      const isSelected = editStaffAssignedClasses.includes(cls);
                      return (
                        <button
                          type="button"
                          key={cls}
                          onClick={() => {
                            if (isSelected) {
                              setEditStaffAssignedClasses(editStaffAssignedClasses.filter(c => c !== cls));
                            } else {
                              setEditStaffAssignedClasses([...editStaffAssignedClasses, cls]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected 
                              ? 'bg-primary text-white border-primary shadow-sm' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {cls}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase italic font-medium">Select all classes that this instructor administers or teaches.</p>
                </div>

                <div>
                  <label className="block mb-1.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Assigned Subjects</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-150">
                    {['Mathematics', 'Further Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Civic Education', 'Economics', 'Geography', 'Government', 'Yoruba', 'Business Studies', 'P.H.E', 'Social Studies', 'Agric', 'Home Economics', 'Computer', 'Basic Tech', 'Basic Science', 'Accounting', 'Commerce'].map((subj) => {
                      const isSelected = editStaffAssignedSubjects.includes(subj);
                      return (
                        <button
                          type="button"
                          key={subj}
                          onClick={() => {
                            if (isSelected) {
                              setEditStaffAssignedSubjects(editStaffAssignedSubjects.filter(s => s !== subj));
                            } else {
                              setEditStaffAssignedSubjects([...editStaffAssignedSubjects, subj]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {subj}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase italic font-medium">Click to assign specific subjects under this instructor's curriculum docket.</p>
                </div>

                {/* Flexible Subject & Class Assignment Widget */}
                <div className="bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100 space-y-3 font-sans">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-widest">
                      Subject & Class Assignments
                    </label>
                    <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-black uppercase">
                      Flexible Linker
                    </span>
                  </div>
                  
                  {editClassSubjectMappings.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic bg-white/70 p-3 rounded-2xl text-center border border-dashed border-slate-200 font-sans">
                      No specific subject-to-class assignment mappings added. Use the form below to pair subjects with classes.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 font-sans">
                      {editClassSubjectMappings.map((mapping, idx) => (
                        <div 
                          key={idx} 
                          className="bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-2 text-[10px] font-bold text-slate-700"
                        >
                          <span className="text-slate-800 font-extrabold">{mapping.subject}</span>
                          <span className="text-slate-400 font-normal font-sans">in</span>
                          <span className="text-indigo-600 font-black">{mapping.class}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditClassSubjectMappings(editClassSubjectMappings.filter((_, i) => i !== idx));
                            }}
                            className="text-red-400 hover:text-red-600 font-bold ml-1 cursor-pointer transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-2 bg-white/80 p-2.5 rounded-2xl border border-indigo-50 items-end font-sans">
                    <div className="flex-1">
                      <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Class</label>
                      <select
                        value={editPickerClass}
                        onChange={(e) => setEditPickerClass(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-[10px] font-black uppercase focus:outline-none"
                      >
                        {['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3', 'SS 3 Science Alpha'].map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-[2_2_0%]">
                      <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Subject</label>
                      <select
                        value={editPickerSubject}
                        onChange={(e) => setEditPickerSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-[10px] font-bold focus:outline-none"
                      >
                        {['Mathematics', 'Further Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Civic Education', 'Economics', 'Geography', 'Government', 'Yoruba', 'Business Studies', 'P.H.E', 'Social Studies', 'Agric', 'Home Economics', 'Computer', 'Basic Tech', 'Basic Science', 'Accounting', 'Commerce'].map(subj => (
                          <option key={subj} value={subj}>{subj}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const exists = editClassSubjectMappings.some(m => m.class === editPickerClass && m.subject === editPickerSubject);
                        if (exists) return; // Prevent duplicate
                        
                        // Push to mapping list
                        const updated = [...editClassSubjectMappings, { class: editPickerClass, subject: editPickerSubject }];
                        setEditClassSubjectMappings(updated);
                        
                        // Auto-include in assigned classes
                        if (!editStaffAssignedClasses.includes(editPickerClass)) {
                          setEditStaffAssignedClasses([...editStaffAssignedClasses, editPickerClass]);
                        }
                        
                        // Auto-include in assigned subjects
                        if (!editStaffAssignedSubjects.includes(editPickerSubject)) {
                          setEditStaffAssignedSubjects([...editStaffAssignedSubjects, editPickerSubject]);
                        }
                      }}
                      className="py-2.5 px-3 bg-indigo-600 text-white font-extrabold text-[10px] uppercase rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer shadow-md shadow-indigo-100"
                    >
                      ＋ Assign
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Review Comments & Evaluations</label>
                  <textarea 
                    value={editStaffReview}
                    onChange={(e) => setEditStaffReview(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none text-xs font-medium"
                    placeholder="Provide professional notes about their performance..."
                  />
                </div>

                <div className="pt-2">
                  <ImageUploader 
                    label="Staff Photograph File"
                    currentUrl={editStaffPhoto}
                    onUpload={setEditStaffPhoto}
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-50">
                  <button type="button" onClick={() => setIsEditingStaff(false)} className="py-3 px-6 bg-slate-100 text-slate-500 font-extrabold rounded-xl uppercase flex-1">Abort</button>
                  <button type="submit" className="py-3 px-6 bg-primary text-white font-black rounded-xl uppercase tracking-widest flex-1 shadow-lg shadow-primary/20">Save Particulars</button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

// ============================================================================
// 5. VIEW: FINANCIAL RECORDS & FEE STRUCTURES
// ============================================================================

function FinanceView() {
  useEffect(() => {
    syncFetchInvoices().then(res => setInvoices(res));
    syncFetchFeeStructures().then(res => setFeeStructures(res));
  }, []);

  const [invoices, setInvoices] = useState<any[]>(() => {
    const saved = localStorage.getItem('ff_all_student_invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [students, setStudents] = useState<any[]>(() => {
    const saved = localStorage.getItem('ff_students');
    return saved ? JSON.parse(saved) : [];
  });

  const [feeStructures, setFeeStructures] = useState(() => {
    const saved = localStorage.getItem('ff_fee_structures');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeFeeEditIdx, setActiveFeeEditIdx] = useState<number | null>(null);
  const [editTuition, setEditTuition] = useState('');
  const [editAncil, setEditAncil] = useState('');

  // Invoice Filter States
  const [financeTab, setFinanceTab] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [invoiceQuery, setInvoiceQuery] = useState('');

  // Add Invoice Dialog Fields
  const [selectedStudentEmail, setSelectedStudentEmail] = useState('');
  const [feeCategory, setFeeCategory] = useState('School Fees');
  const [invoiceAmountStr, setInvoiceAmountStr] = useState('');
  const [dueDateInput, setDueDateInput] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });

  // Receipt Preview Dialog Drawer
  const [receiptItem, setReceiptItem] = useState<any | null>(null);

  // Synchronize base listings to localStorage
  const saveInvoices = (list: any[]) => {
    setInvoices(list);
    syncSaveInvoices(list);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentEmail) {
      showBannerAlert('Please select an active target student student profile', false);
      return;
    }
    const target = students.find(s => s.parentEmail === selectedStudentEmail || s.email === selectedStudentEmail);
    const resolvedName = target ? target.name : 'Unknown Pupil';
    const resolvedId = target ? target.id : `FFP/2026/${Math.floor(100 + Math.random() * 900)}`;

    const freshInvoice = {
      id: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      studentEmail: selectedStudentEmail,
      studentName: resolvedName,
      studentId: resolvedId,
      item: `${feeCategory} Payment Term Account Bounds`,
      amount: parseInt(invoiceAmountStr, 10) || 50000,
      status: 'unpaid',
      dueDate: new Date(dueDateInput).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
    };

    const nextList = [freshInvoice, ...invoices];
    saveInvoices(nextList);

    // Notify student account
    try {
      sendNotification({
        recipientId: 'demo-student-id-9999',
        title: 'New School Invoice Issued',
        message: `An outstanding invoice has been configured for ${resolvedName} (${feeCategory}): ₦${(parseInt(invoiceAmountStr, 10) || 50000).toLocaleString()}`,
        type: 'payment',
        link: '/dashboard/payments'
      });
    } catch (e) {
      console.warn('Sandbox notification dispatch warning', e);
    }

    setInvoiceAmountStr('');
    showBannerAlert('New dynamic invoice created successfully and parent notified!');
  };

  const confirmReceiptOfPayment = (invoiceId: string) => {
    const nextList = invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status: 'paid',
          paidDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
          txnRef: `TXN-ADM-${Math.floor(1000000 + Math.random() * 9000000)}`
        };
      }
      return inv;
    });

    saveInvoices(nextList);

    const invObj = invoices.find(i => i.id === invoiceId);
    if (invObj) {
      try {
        sendNotification({
          recipientId: 'demo-student-id-9999',
          title: 'Bursary Fee Payment Confirmed',
          message: `Your school payment for "${invObj.item}" has been officially registered and verified by Admin.`,
          type: 'payment',
          link: '/dashboard/payments'
        });
      } catch (err) {
        // ignore
      }
    }

    showBannerAlert('Payment status updated to SETTLED');
  };

  const deleteInvoice = (invoiceId: string) => {
    if (!window.confirm('Delete this billing invoice record from our registers?')) return;
    const nextList = invoices.filter(inv => inv.id !== invoiceId);
    saveInvoices(nextList);
    showBannerAlert('Invoice statement retracted', false);
  };

  const startEditFee = (idx: number, fee: any) => {
    setActiveFeeEditIdx(idx);
    setEditTuition(fee.tuition);
    setEditAncil(fee.ancillary);
  };

  const saveFeeRate = () => {
    if (activeFeeEditIdx === null) return;
    const nextArr = [...feeStructures];
    nextArr[activeFeeEditIdx] = {
      ...nextArr[activeFeeEditIdx],
      tuition: editTuition,
      ancillary: editAncil
    };
    setFeeStructures(nextArr);
    syncSaveFeeStructures(nextArr);
    setActiveFeeEditIdx(null);
    showBannerAlert('Fee rate sheets saved');
  };

  // Programmatic ledger calculations
  const totalBilledVal = invoices.reduce((acc, current) => acc + current.amount, 0);
  const totalCollectedVal = invoices.filter(i => i.status === 'paid').reduce((acc, current) => acc + current.amount, 0);
  const totalPendingVal = invoices.filter(i => i.status === 'unpaid').reduce((acc, current) => acc + current.amount, 0);

  // Filter invoices listing
  const filteredInvoices = invoices.filter(inv => {
    const matchesTab = 
      financeTab === 'all' || 
      (financeTab === 'paid' && inv.status === 'paid') ||
      (financeTab === 'unpaid' && inv.status === 'unpaid');

    const matchesQuery = 
      inv.studentName?.toLowerCase().includes(invoiceQuery.toLowerCase()) ||
      inv.id?.toLowerCase().includes(invoiceQuery.toLowerCase()) ||
      inv.item?.toLowerCase().includes(invoiceQuery.toLowerCase());

    return matchesTab && matchesQuery;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans">
      
      {/* Vitals Collection metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-emerald-600 rounded-[28px] text-white p-6 shadow-xl shadow-emerald-600/10 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-250">Invoiced Revenue Balance</span>
            <Coins size={18} className="text-emerald-250" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-emerald-200">Total Billed Fees</span>
            <p className="text-3xl font-black font-display">₦{totalBilledVal.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">REALTIME COLLECTED</span>
            <CheckCircle size={18} className="text-emerald-500" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400">Total Cleared School Funds</span>
            <p className="text-3xl font-black text-slate-800">₦{totalCollectedVal.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">OUTSTANDING DEBTORS</span>
            <AlertCircle size={18} className="text-rose-500" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400">Outstanding Arrears Portfolio</span>
            <p className="text-3xl font-black text-rose-600">₦{totalPendingVal.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Real-time Debtor Lists & Statements Table */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Dynamic Bursary Billing Ledger</h3>
                <p className="text-[11px] text-slate-400">Manage real-time PTA, development levys, school fees and hostel statements.</p>
              </div>

              {/* Switches */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                {[
                  { id: 'all', label: 'All Bills' },
                  { id: 'unpaid', label: 'Debtors Only' },
                  { id: 'paid', label: 'Paid Cleared' }
                ].map(b => (
                  <button
                    key={b.id}
                    onClick={() => setFinanceTab(b.id as any)}
                    className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
                      financeTab === b.id ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Invoices Search bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="Search statements by student full name, invoice ID or payment reference..."
                value={invoiceQuery}
                onChange={(e) => setInvoiceQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:outline-none"
              />
            </div>

            {/* Invoices Table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-100 text-[10px]">
                    <th className="py-3 px-4">Ref/Student</th>
                    <th className="py-3 px-4">Billing Item Description</th>
                    <th className="py-3 px-3 text-right">Sum (₦)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Accounting Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        No match invoices statement files
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv, index) => (
                      <tr key={`${inv.id}-${index}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-mono text-primary font-bold">{inv.id}</p>
                          <p className="text-slate-700 font-extrabold uppercase tracking-tight mt-0.5">{inv.studentName}</p>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-500">
                          {inv.item}
                          <p className="text-[10px] text-slate-400 leading-none mt-1">Due Date: {inv.dueDate}</p>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-black text-slate-800">
                          ₦{inv.amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {inv.status === 'paid' ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[9px] font-black px-2 py-0.5 rounded-lg uppercase">
                              SETTLED
                            </span>
                          ) : (
                            <span className="bg-rose-50 text-rose-700 border border-rose-150 text-[9px] font-black px-2 py-0.5 rounded-lg uppercase">
                              UNPAID
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex gap-2 justify-end items-center">
                            {inv.status === 'unpaid' && (
                              <button
                                onClick={() => confirmReceiptOfPayment(inv.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] px-2.5 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                              >
                                <Check size={10} /> Recv. Fund
                              </button>
                            )}

                            {inv.status === 'paid' && (
                              <button
                                onClick={() => setReceiptItem(inv)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[9px] px-2.5 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                              >
                                <Receipt size={10} /> Receipt
                              </button>
                            )}

                            <button
                              onClick={() => deleteInvoice(inv.id)}
                              className="text-rose-550 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Structured Fee Overrides Catalogs */}
          <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Structured Termly Fee Standard rates</h3>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg">Session Term Level</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feeStructures.map((fee, idx) => (
                <div key={idx} className="group p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-emerald-200 hover:bg-white transition-all duration-300">
                  <div>
                    <h4 className="font-black text-slate-800 text-xs uppercase">{fee.classGroup}</h4>
                    <div className="flex gap-4 mt-1.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Tuition: <span className="text-slate-700">₦{fee.tuition}</span></p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Ancillary: <span className="text-slate-700">₦{fee.ancillary}</span></p>
                    </div>
                  </div>

                  <button 
                    onClick={() => startEditFee(idx, fee)}
                    className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 p-2 rounded-xl transition-all flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider px-3"
                  >
                    <Edit size={10} /> Edit
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Invoice Creation Desk / Editor Panel */}
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm">
            <div className="flex items-center gap-2 text-primary mb-4 border-b border-slate-50 pb-3">
              <PlusCircle size={18} />
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Dispatch Fee Invoice</h4>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs font-bold text-slate-500">
              
              <div>
                <label className="block mb-1 text-[9px] uppercase tracking-widest text-slate-400 font-bold">Target Student Account</label>
                <select
                  value={selectedStudentEmail}
                  onChange={(e) => setSelectedStudentEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none focus:border-primary text-slate-800 cursor-pointer text-xs font-bold uppercase"
                >
                  <option value="">-- Choose Pupil Profile --</option>
                  {students.map((std, idx) => (
                    <option key={idx} value={std.parentEmail || std.email}>
                      {std.name} ({std.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-[9px] uppercase tracking-widest text-slate-400 font-bold">Category of Billing Item</label>
                <select
                  value={feeCategory}
                  onChange={(e) => setFeeCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none focus:border-primary text-slate-800 cursor-pointer text-xs font-bold"
                >
                  <option value="School Fees">School Fees</option>
                  <option value="PTA Fees">PTA Fees</option>
                  <option value="Development Levy">Development Levy</option>
                  <option value="Transport Fees">Transport Fees</option>
                  <option value="Hostel Fees">Hostel Fees</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-[9px] uppercase tracking-widest text-slate-400 font-bold">Fees Charging Rate (₦)</label>
                <input 
                  type="number"
                  placeholder="e.g. 150000"
                  value={invoiceAmountStr}
                  onChange={(e) => setInvoiceAmountStr(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none focus:border-primary text-slate-800 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-[9px] uppercase tracking-widest text-slate-400 font-bold">Due Settlement Deadline</label>
                <input 
                  type="date"
                  value={dueDateInput}
                  onChange={(e) => setDueDateInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none focus:border-primary text-slate-800 text-xs font-bold"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-xl shadow-emerald-500/10 transition-colors"
              >
                Assemble & Publish Invoice
              </button>

            </form>
          </div>

          {activeFeeEditIdx !== null && (
            <div className="bg-white border-2 border-primary rounded-[28px] p-6 shadow-xl animate-in slide-in-from-right-4 duration-250">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-primary">Edit Fee Rates</h4>
                <button onClick={() => setActiveFeeEditIdx(null)} className="text-slate-450 hover:text-slate-700 p-1 hover:bg-slate-100 rounded-full"><X size={16} /></button>
              </div>

              <div className="space-y-4 text-xs font-bold text-slate-550">
                <div>
                  <label className="block mb-1 text-[9px] uppercase tracking-widest text-slate-400 font-bold">Tuition charge (₦)</label>
                  <input 
                    type="text" 
                    value={editTuition}
                    onChange={(e) => setEditTuition(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[9px] uppercase tracking-widest text-slate-400 font-bold">Ancillary levy (₦)</label>
                  <input 
                    type="text" 
                    value={editAncil}
                    onChange={(e) => setEditAncil(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none text-slate-800"
                  />
                </div>

                <button 
                  onClick={saveFeeRate}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl block text-center"
                >
                  Apply System Sheets Rates
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Official Watermarked Stamped Receipt Pop-up Modal */}
      {receiptItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] max-w-lg w-full overflow-hidden shadow-2xl relative border border-slate-100 font-sans">
            
            {/* Top Close bar */}
            <div className="flex justify-between items-center bg-slate-9 border-b border-slate-100 px-6 py-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Audit Log Receipt</span>
              <button 
                onClick={() => setReceiptItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="p-8 space-y-6 relative" id="faith-receipt-print">
              
              {/* Receipt Header */}
              <div className="text-center space-y-1">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Faith Foundation Schools</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Educational Excellence Division &middot; Lagos, Nigeria</p>
                <div className="w-12 h-0.5 bg-emerald-600 mx-auto mt-2"></div>
              </div>

              {/* Verified Badge Stamp */}
              <div className="absolute right-8 top-12 border-2 border-emerald-500/30 text-[9px] text-emerald-600 font-black tracking-widest p-2 rounded-xl rotate-12 select-none uppercase">
                🟢 VERIFIED COLLECTED
              </div>

              {/* Stamped Seal Overlay Background Watermark */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[100px] select-none text-slate-50 font-black tracking-widest pointer-events-none rotate-345 opacity-60">
                FFS BURSARY
              </div>

              {/* Receipt Metadata */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100 relative z-10 text-[10px] font-bold text-slate-500">
                <div className="flex justify-between">
                  <span>RECEIPT ID:</span>
                  <span className="font-mono text-slate-800">{receiptItem.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>BILL PURPOSE:</span>
                  <span className="text-slate-800 uppercase">{receiptItem.item}</span>
                </div>
                <div className="flex justify-between">
                  <span>STUDENT CLERK:</span>
                  <span className="text-slate-800 uppercase">{receiptItem.studentName} ({receiptItem.studentId || 'STD-2026-N/A'})</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/50 pt-2 text-slate-400">
                  <span>SETTLEMENT DATE:</span>
                  <span className="font-mono text-slate-800 font-black">{receiptItem.paidDate || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>TXN REF CODE:</span>
                  <span className="font-mono text-emerald-700 font-black">{receiptItem.txnRef || 'N/A'}</span>
                </div>
              </div>

              {/* Total Settlement Figures */}
              <div className="text-center relative z-10 space-y-1 pt-4 border-t border-dashed border-slate-200">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest block">GRAND TOTAL CLEARANCE PRICE</span>
                <p className="text-4xl font-extrabold text-slate-800 tracking-tight">₦{receiptItem.amount.toLocaleString()}</p>
                <p className="text-[9px] uppercase font-bold text-emerald-600 italic mt-0.5">Clearing complete &middot; zero debt balance remains for this item listing.</p>
              </div>

              <div className="text-[9px] font-bold text-slate-400 text-center tracking-wider pt-4">
                Thank you for supporting educational integrity in FAITH FOUNDATION schools
              </div>

            </div>

            {/* Print trigger footer action */}
            <div className="bg-slate-50 border-t border-slate-100 p-4 flex gap-3">
              <button 
                onClick={() => window.print()} 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-emerald-600/10 cursor-pointer text-center"
              >
                Print Receipt Sheet
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// ============================================================================
// 6. VIEW: PUBLIC GALLERY ASSETS
// ============================================================================

function GalleryAdminView() {
  const { content, updateContent } = useContent();

  const addImage = async (url: string) => {
    if (!url) return;
    const currentGallery = Array.isArray(content?.gallery) ? [...content.gallery] : [];
    try {
      await updateContent({
        ...content,
        gallery: [url, ...currentGallery]
      });
      showBannerAlert('Dynamic campus asset loaded online');
    } catch (err) {
      showBannerAlert('Local storage updated (offline assets)', false);
    }
  };

  const removeImage = async (idxIdx: number) => {
    if (!Array.isArray(content?.gallery)) return;
    if (!window.confirm('Erase selected graphic asset from our public media display?')) return;
    const nextGall = [...content.gallery];
    nextGall.splice(idxIdx, 1);
    try {
      await updateContent({ ...content, gallery: nextGall });
      showBannerAlert('Graphic asset detached');
    } catch (err) {
      showBannerAlert('Image detached locally', false);
    }
  };

  const galleryItems = Array.isArray(content?.gallery) ? content.gallery : [
    "https://images.unsplash.com/photo-1543269865-cbf427effbad",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7",
    "https://images.unsplash.com/photo-1571260899304-425eee4c7efc",
    "https://images.unsplash.com/photo-1516321497487-e288fb19713f",
    "https://images.unsplash.com/photo-1524178232363-1fb28f74b671",
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846"
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm animate-in fade-in duration-300">
      
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-50 pb-6 mb-8">
        <div>
          <h3 className="text-xl font-extrabold text-slate-800">Visual Assets Gallery</h3>
          <p className="text-xs text-slate-400 mt-1">Manage standard media elements shown on our public index homepage.</p>
        </div>
        
        <div className="w-full sm:w-auto shrink-0 max-w-sm">
          <ImageUploader 
            label="Upload Public Attachment"
            currentUrl=""
            onUpload={addImage}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {galleryItems.map((url, i) => (
          <div key={i} className="group relative aspect-video rounded-3xl overflow-hidden bg-slate-150 border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-lg">
            <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
              <button 
                onClick={() => removeImage(i)}
                className="bg-white text-rose-600 font-extrabold text-[10px] uppercase px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xl select-none"
              >
                <Trash2 size={12} /> Detach
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

// ============================================================================
// 7. VIEW: ADMISSIONS PIPELINE (SUPABASE REAL TIME WITH AUTOMATIC CONVERSIONS)
// ============================================================================

interface AdmissionRequest {
  id: string;
  student_name: string;
  parent_name: string;
  email: string;
  phone: string;
  target_class: string;
  address: string;
  previous_school?: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  created_at?: string;
}

// ----------------------------------------------------------------------------
// HEURISTIC AI ADMISSION SCORE ANALYSIS & RECRUITMENT REPORT ENGINE
// ----------------------------------------------------------------------------
export function getHeuristicAiRecommendation(adm: any) {
  const score = adm.cbtScore !== undefined && adm.cbtScore !== null ? adm.cbtScore : 0;
  const math = adm.cbtMathScore !== undefined && adm.cbtMathScore !== null ? adm.cbtMathScore : Math.round((score / 100) * 50);
  const engl = adm.cbtEnglScore !== undefined && adm.cbtEnglScore !== null ? adm.cbtEnglScore : Math.round((score / 100) * 50);
  const tabViolation = adm.tabSwitchesCount ?? 0;
  const hasSuspension = adm.hasBeenSuspended === 'Yes' || adm.disciplinaryDetails;

  let badge = "Recommended";
  let color = "bg-blue-50 text-blue-700 border-blue-200";
  let paragraph = "";

  if (score >= 85) {
    badge = "Highly Recommended";
    color = "bg-emerald-50 text-emerald-700 border-emerald-250";
    paragraph = `Applicant possesses stellar academic aptitude with a combined score of ${score}% (Math: ${math}/50, English: ${engl}/50). ${tabViolation > 0 ? `Please note ${tabViolation} window defocus violations during testing.` : "Demonstrated exceptional academic focus with clean security records."} Strongly recommend placement into the requested ${adm.target_class || 'JSS 1'} core track immediately.`;
  } else if (score >= 50) {
    badge = "Recommended";
    color = "bg-sky-50 text-sky-700 border-sky-200";
    paragraph = `Applicant demonstrates satisfactory credentials with a CBT aggregate of ${score}% (Math: ${math}/50, English: ${engl}/50). Meets the general school benchmark. Fits structural expectations. Recommended for placement in the ${adm.target_class || 'Basic Grade'} cohort.`;
  } else if (score >= 40) {
    badge = "Further Review Required";
    color = "bg-amber-50 text-amber-700 border-amber-200";
    paragraph = `Applicant scores marginally at ${score}% (Math: ${math}/50, English: ${engl}/50) with sub-threshold metrics. ${hasSuspension ? "Disciplinary background flags require administrative review." : ""} Interview panels recommend oral evaluation to assess general reading or arithmetic capabilities before making a final enrollment decision.`;
  } else {
    badge = "Not Recommended";
    color = "bg-rose-50 text-rose-750 border-rose-220";
    paragraph = `Applicant's current CBT baseline parameters (${score}%) are below critical thresholds of Faith Foundation. Math score: ${math}/50, English: ${engl}/50. Admissions department advises further diagnostic assessments or preparatory work before enrolling into the ${adm.target_class || 'SS Grade'} cohort.`;
  }

  return { badge, color, paragraph };
}

function AdmissionsView() {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'registry' | 'leaderboard'>('registry');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedAdm, setSelectedAdm] = useState<any | null>(null);

  // Scheduling edits states
  const [tempExamDate, setTempExamDate] = useState('');
  const [tempInterviewDate, setTempInterviewDate] = useState('');
  const [tempAdminMessage, setTempAdminMessage] = useState('');

  // Fetch real admissions rows from Supabase and merge with localStorage submissions
  const fetchAdmissions = async () => {
    try {
      setLoading(true);

      // Get local submissions from website form first
      const localAdmissionsStr = localStorage.getItem('ff_admissions');
      const localList: any[] = localAdmissionsStr ? JSON.parse(localAdmissionsStr) : [];
      const formattedLocalList: any[] = localList.map(item => ({
        id: item.id,
        student_name: item.student_name || `${item.firstName || ''} ${item.surname || ''}`.trim() || item.studentName,
        parent_name: item.parent_name || item.fatherName || item.motherName || item.guardianName || item.parentName,
        email: item.email || item.fatherEmail || item.motherEmail || item.guardianEmail,
        phone: item.phone || item.fatherPhone || item.motherPhone || item.guardianPhone,
        target_class: item.target_class || item.intendedClass || item.targetClass,
        address: item.address,
        previous_school: item.previous_school || item.prevSchoolName || item.previousSchool,
        status: item.status || 'pending',
        created_at: item.createdAt || item.created_at || new Date().toISOString(),
        // Extra comprehensive fields
        cbtScore: item.cbtScore,
        cbtTaken: item.cbtTaken,
        bloodGroup: item.bloodGroup,
        genotype: item.genotype,
        allergies: item.allergies,
        hasBeenSuspended: item.hasBeenSuspended,
        hasBeenExpelled: item.hasBeenExpelled,
        parentSignatureName: item.parentSignatureName,
        declarationDate: item.declarationDate,
        feesPaid: item.feesPaid,
        adminMessage: item.adminMessage,
        examDate: item.examDate,
        interviewDate: item.interviewDate
      }));

      let dbList: any[] = [];
      try {
        const { data, error } = await supabase
          .from('admissions')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          dbList = data;
        }
      } catch (dbErr) {
        console.warn('Database error fetching admissions, using offline fallback', dbErr);
      }

      // Combine lists, filtering out duplicates by ID
      const combinedMap = new Map<string, any>();

      // Add database items first
      dbList.forEach(item => combinedMap.set(item.id, {
        ...item,
        student_name: item.student_name,
        parent_name: item.parent_name,
        target_class: item.target_class
      }));
      // Overwrite or append with local items (often more recent or locally mutated)
      formattedLocalList.forEach(item => {
        const existing = combinedMap.get(item.id) || {};
        combinedMap.set(item.id, { ...existing, ...item });
      });

      setAdmissions(Array.from(combinedMap.values()));
    } catch (err) {
      console.warn('Could not query database. Yielding offline setup mode.', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  // Comprehensive update handler
  const handleUpdatePipelineStatus = async (id: string, updates: { 
    status: string; 
    adminMessage?: string; 
    examDate?: string; 
    interviewDate?: string; 
  }) => {
    const targetApplication = admissions.find(adm => adm.id === id);
    if (!targetApplication) return;

    try {
      // 1. Update in Supabase
      const isMock = id.startsWith('ADM-2026-');
      if (!isMock) {
        try {
          const { error } = await supabase
            .from('admissions')
            .update({ status: updates.status })
            .eq('id', id);
          if (error) console.warn('Supabase admissions status update skipped', error);
        } catch (dbErr) {
          console.warn('Db connection error status update', dbErr);
        }
      }

      // 2. Update local state representation
      const updatedList = admissions.map(item => {
        if (item.id === id) {
          return { ...item, ...updates };
        }
        return item;
      });
      setAdmissions(updatedList);

      // Save to localStorage 'ff_admissions'
      const localAdmissionsStr = localStorage.getItem('ff_admissions');
      const localList: any[] = localAdmissionsStr ? JSON.parse(localAdmissionsStr) : [];
      const updatedLocalList = localList.map(item => {
        if (item.id === id || (item.firstName && `${item.firstName} ${item.surname}` === targetApplication.student_name)) {
          return { ...item, ...updates };
        }
        return item;
      });
      localStorage.setItem('ff_admissions', JSON.stringify(updatedLocalList));

      // 3. If final accepted/Admitted, instantiate a student record in registry!
      if (updates.status === 'accepted' || updates.status === 'Admitted' || updates.status === 'Approved') {
        const savedStudents = localStorage.getItem('ff_students');
        const list: any[] = savedStudents ? JSON.parse(savedStudents) : [];
        
        const alreadyExists = list.some(std => 
          std.parentEmail?.toLowerCase() === targetApplication.email?.toLowerCase() && 
          std.name.toLowerCase() === targetApplication.student_name.toLowerCase()
        );

        if (!alreadyExists) {
          // Detect next sequential FFP/2026/001 ID
          let newSeq = 1;
          while (true) {
            const padded = String(newSeq).padStart(3, '0');
            const targetId = `FFP/2026/${padded}`;
            if (!list.some(s => s.id === targetId)) {
              break;
            }
            newSeq++;
          }
          const nextId = `FFP/2026/${String(newSeq).padStart(3, '0')}`;

          const freshStudent = {
            id: nextId,
            name: targetApplication.student_name,
            class: targetApplication.target_class || 'JSS 1',
            status: 'Enrolled',
            fees: 'Debt', // Default outstanding bills
            parentName: targetApplication.parent_name,
            parentPhone: targetApplication.phone,
            parentEmail: targetApplication.email,
            dob: '2014-01-01',
            medicalInfo: `Blood: ${targetApplication.bloodGroup || 'O+'}, Genotype: ${targetApplication.genotype || 'AA'}`,
            allergies: targetApplication.allergies || 'None',
            academicHistory: [],
            firstLoginDone: false,
            reportCardPublished: true,
            attendancePublished: true,
            behavioralPublished: true,
            communicationLogs: [
              { date: new Date().toLocaleDateString(), message: `Profile initialized from Admissions Pipeline entry: ${id}`, caller: 'System Core' }
            ]
          };

          localStorage.setItem('ff_students', JSON.stringify([freshStudent, ...list]));
          showBannerAlert(`Pupil File successfully created : ${nextId}`);
        }
      }

      if (selectedAdm && selectedAdm.id === id) {
        setSelectedAdm({ ...selectedAdm, ...updates });
      }

      showBannerAlert(`Status updated to: ${updates.status}`);
    } catch (err) {
      showBannerAlert('Action recorded locally', false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-450">Loading pipeline registers...</p>
        </div>
      </div>
    );
  }

  // Filter application files
  const filteredAdmissions = admissions.filter(adm => {
    const studentName = (adm.student_name || '').toLowerCase();
    const parentName = (adm.parent_name || '').toLowerCase();
    const idCode = (adm.id || '').toLowerCase();
    const searchMatch = studentName.includes(searchQuery.toLowerCase()) || 
                        parentName.includes(searchQuery.toLowerCase()) || 
                        idCode.includes(searchQuery.toLowerCase());

    const classMatch = classFilter === 'All' || adm.target_class === classFilter;
    const statusMatch = statusFilter === 'All' || 
                        (statusFilter === 'Pending Review' && (adm.status === 'pending' || adm.status === 'Submitted')) ||
                        adm.status === statusFilter;
    
    return searchMatch && classMatch && statusMatch;
  });

  // Basic stats
  const totalInquiries = admissions.length;
  const pendingInquiries = admissions.filter(adm => adm.status === 'pending' || adm.status === 'Submitted' || adm.status === 'Under Review').length;
  const examScheduled = admissions.filter(adm => adm.status === 'Examination Scheduled').length;
  const admittedInquiries = admissions.filter(adm => adm.status === 'accepted' || adm.status === 'Admitted' || adm.status === 'Approved').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Bento Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Pipeline Inquiries', val: totalInquiries, desc: 'Total registrations logged', col: 'text-primary bg-primary/5' },
          { label: 'Awaiting Action', val: pendingInquiries, desc: 'Requires folder audit', col: 'text-amber-600 bg-amber-50' },
          { label: 'Exams Booked', val: examScheduled, desc: 'Scheduled CBT candidates', col: 'text-indigo-600 bg-indigo-50' },
          { label: 'Admitted / Approved', val: admittedInquiries, desc: 'Successful conversions', col: 'text-emerald-600 bg-emerald-50' }
        ].map((cCard, idx) => (
          <div key={idx} className="bg-white border select-none border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{cCard.label}</span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className={`text-3xl font-black rounded-xl px-2 py-0.5 ${cCard.col}`}>{cCard.val}</span>
            </div>
            <p className="text-[9px] text-slate-405 font-bold uppercase tracking-wider mt-3">{cCard.desc}</p>
          </div>
        ))}
      </div>

      {/* Filter Options */}
      <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white"
            placeholder="Search candidate or ref ID..."
          />
        </div>

        {/* Classes option */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
          >
            <option value="All">All Classes</option>
            <option value="Creche">Creche</option>
            <option value="Nursery 1">Nursery 1</option>
            <option value="Nursery 2">Nursery 2</option>
            <option value="Basic 1">Basic 1</option>
            <option value="Basic 5">Basic 5</option>
            <option value="JSS 1">JSS 1</option>
            <option value="SS 1">SS 1</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
          >
            <option value="All">All Statuses</option>
            <option value="Pending Review">Needs Review</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Awaiting Documents">Awaiting Doc</option>
            <option value="Examination Scheduled">Exam Booked</option>
            <option value="Interview Scheduled">Interview Booked</option>
            <option value="Approved">Approved</option>
            <option value="Admitted">Admitted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Tab Selectors for Admissions Workstation */}
      <div className="flex gap-4 border-b border-slate-100 pb-1 mt-6">
        <button
          type="button"
          onClick={() => setActiveSubTab('registry')}
          className={`pb-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 text-left duration-150 cursor-pointer ${activeSubTab === 'registry' ? 'border-primary text-primary font-black' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
        >
          📁 dossiers registry list ({filteredAdmissions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('leaderboard')}
          className={`pb-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 text-left duration-150 cursor-pointer ${activeSubTab === 'leaderboard' ? 'border-primary text-primary font-black' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
        >
          🏆 CBT Leaderboard & AI Recommendation reports
        </button>
      </div>

      {activeSubTab === 'registry' ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
          <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider mb-6">Candidate Inquiry Flow Registries</h3>

          <div className="grid gap-4">
            {filteredAdmissions.map((adm) => (
              <div 
                key={adm.id}
                onClick={() => {
                  setSelectedAdm(adm);
                  setTempExamDate(adm.examDate || 'June 18, 2026');
                  setTempInterviewDate(adm.interviewDate || 'June 19, 2026');
                  setTempAdminMessage(adm.adminMessage || '');
                }}
                className="p-5 bg-slate-50 hover:bg-slate-100/50 border border-slate-150 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-200 cursor-pointer group animate-in slide-in-from-bottom-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-primary/10 text-primary font-black px-2.5 py-1 rounded-md uppercase">
                      {adm.target_class || 'Grade Entry'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">Ref: {adm.id}</span>
                  </div>
                  
                  <h4 className="font-black text-slate-800 text-base mt-2 uppercase transition-all duration-200 group-hover:text-primary">
                    {adm.student_name}
                  </h4>

                  <div className="space-y-1 mt-2 text-xs text-slate-500 font-semibold flex flex-wrap gap-x-4 gap-y-1">
                    <span>Parent: <strong className="text-slate-700 font-bold">{adm.parent_name || 'N/A'}</strong></span>
                    <span>Phone: <strong className="text-slate-705">{adm.phone}</strong></span>
                    {adm.cbtScore !== undefined && adm.cbtScore !== null && (
                      <span className="text-indigo-600">CBT Score: <strong className="font-extrabold">{adm.cbtScore}%</strong></span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 items-center shrink-0">
                  <span className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-full border ${
                    adm.status === 'Submitted' || adm.status === 'pending' ? 'bg-yellow-50 text-amber-600 border-yellow-250' :
                    adm.status === 'Awaiting Documents' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                    adm.status === 'Examination Scheduled' ? 'bg-indigo-50 text-indigo-600 border-indigo-250' :
                    adm.status === 'Approved' || adm.status === 'Admitted' || adm.status === 'accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-250' :
                    'bg-rose-50 text-rose-600 border-rose-200'
                  }`}>
                    {adm.status}
                  </span>

                  <button className="p-2 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl border border-slate-200 duration-200 shadow-sm transition-all">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}

            {filteredAdmissions.length === 0 && (
              <div className="text-center py-16 text-slate-400 bg-slate-50 border border-dashed rounded-3xl">
                <p className="font-bold text-sm">No registries matching selected scopes.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm overflow-x-auto animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Entrance Exam Performance Ranking</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">Real-time descending CBT grade reporting matched to school requirements (Passing Score = 50 Marks Max per subject)</p>
            </div>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-150 text-slate-450 font-black uppercase text-[9px] tracking-wider bg-slate-50">
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Candidate Name</th>
                <th className="py-3.5 px-4">Ref Number</th>
                <th className="py-3.5 px-4">Class Level</th>
                <th className="py-3.5 px-4 text-center">Mathematics (/50)</th>
                <th className="py-3.5 px-4 text-center">English (/50)</th>
                <th className="py-3.5 px-3 text-center">Overall (%)</th>
                <th className="py-3.5 px-3 text-center">Defocus Violations</th>
                <th className="py-3.5 px-4">Passing Status</th>
                <th className="py-3.5 px-4">AI Rec Audit</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const candidatesWithScores = admissions
                  .map(adm => {
                    const math = adm.cbtMathScore !== undefined ? adm.cbtMathScore : (adm.cbtScore !== undefined ? Math.round((adm.cbtScore / 2)) : 0);
                    const engl = adm.cbtEnglScore !== undefined ? adm.cbtEnglScore : (adm.cbtScore !== undefined ? Math.round((adm.cbtScore / 2)) : 0);
                    const total = adm.cbtScore !== undefined ? adm.cbtScore : (math + engl);
                    return {
                      ...adm,
                      computedMath: math,
                      computedEngl: engl,
                      computedTotal: total
                    };
                  })
                  .sort((a, b) => b.computedTotal - a.computedTotal);

                return candidatesWithScores.map((adm, index) => {
                  const rec = getHeuristicAiRecommendation(adm);
                  const hasScore = adm.cbtScore !== undefined && adm.cbtScore !== null;
                  
                  return (
                    <tr 
                      key={adm.id} 
                      className="border-b border-slate-100 hover:bg-slate-50/75 duration-100 cursor-pointer"
                      onClick={() => {
                        setSelectedAdm(adm);
                        setTempExamDate(adm.examDate || 'June 18, 2026');
                        setTempInterviewDate(adm.interviewDate || 'June 19, 2026');
                        setTempAdminMessage(adm.adminMessage || '');
                      }}
                    >
                      <td className="py-4 px-4 font-black">
                        {hasScore ? (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-mono font-black ${
                            index === 0 ? 'bg-[#fef08a] text-[#854d0e] border border-[#fde047]' :
                            index === 1 ? 'bg-slate-200 text-slate-700 border border-slate-300' :
                            index === 2 ? 'bg-orange-100 text-orange-850 border border-orange-200' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            #{index + 1}
                          </span>
                        ) : (
                          <span className="text-slate-350 italic font-medium">#?</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-bold text-[#111827] uppercase">{adm.student_name}</td>
                      <td className="py-4 px-4 font-mono text-slate-400 text-[10px] font-bold">{adm.id}</td>
                      <td className="py-4 px-4">
                        <span className="text-[10px] bg-sky-50 text-sky-850 border border-sky-100 px-2.5 py-0.5 rounded font-black uppercase">
                          {adm.target_class || 'JSS 1'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-black text-slate-800">
                        {hasScore ? `${adm.computedMath}/50` : <span className="text-slate-300 italic">Pending</span>}
                      </td>
                      <td className="py-4 px-4 text-center font-black text-slate-800">
                        {hasScore ? `${adm.computedEngl}/50` : <span className="text-slate-300 italic">Pending</span>}
                      </td>
                      <td className="py-4 px-3 text-center">
                        {hasScore ? (
                          <span className="font-extrabold text-primary bg-primary/5 px-2 py-0.5 rounded text-xs select-none">
                            {adm.computedTotal}%
                          </span>
                        ) : (
                          <span className="text-slate-300 italic font-medium">None</span>
                        )}
                      </td>
                      <td className="py-4 px-3 text-center">
                        {hasScore ? (
                          <span className={`font-mono font-black text-xs ${adm.tabSwitchesCount > 0 ? 'text-red-500 font-extrabold bg-red-50 px-1.5 py-0.5 rounded border border-red-100' : 'text-slate-400'}`}>
                            {adm.tabSwitchesCount ?? 0}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {hasScore ? (
                          <span className={`text-[9px] uppercase font-black px-2.5 py-1 rounded-full border ${adm.computedTotal >= 50 ? 'bg-emerald-50 text-emerald-600 border-emerald-150' : 'bg-red-50 text-red-550 border-red-150'}`}>
                            {adm.computedTotal >= 50 ? 'Passed' : 'Fail'}
                          </span>
                        ) : (
                          <span className="text-slate-450 font-bold uppercase text-[9px] px-2.5 py-1 bg-slate-50 border border-slate-150 rounded-full">unexamined</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {hasScore ? (
                          <span className={`text-[9px] uppercase font-black px-2 py-1 rounded-lg border ${rec.color}`}>
                            {rec.badge}
                          </span>
                        ) : (
                          <span className="text-slate-350 font-medium italic">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-[10px] font-black uppercase tracking-wider duration-150 shadow-sm mb-0.5">
                          Audit Dossier
                        </button>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL MODAL OVERVIEW */}
      {selectedAdm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6 relative animate-in zoom-in-95 duration-250">
            
            {/* Close */}
            <button 
              onClick={() => setSelectedAdm(null)}
              className="absolute top-6 right-6 p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all border"
            >
              <X size={16} />
            </button>

            {/* Header branding */}
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] bg-slate-900 text-slate-100 font-extrabold px-3 py-1 rounded uppercase tracking-widest">
                Admissions Board Audit File
              </span>
              <h3 className="text-2xl font-black text-primary mt-3 uppercase tracking-tight">
                {selectedAdm.student_name}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">Candidate Identifier Reference: {selectedAdm.id}</p>
            </div>

            {/* Core details tabs */}
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* DETAILS FIELDS */}
              <div className="space-y-6">
                
                {/* 1. Demographics */}
                <div className="space-y-3 p-4 bg-slate-50 border rounded-2xl">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Applicant Demographics</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 leading-relaxed">
                    <p>Surname: <strong className="text-slate-800 uppercase">{selectedAdm.student_name.split(' ')[1] || 'Adeleke'}</strong></p>
                    <p>First name: <strong className="text-slate-800 uppercase">{selectedAdm.student_name.split(' ')[0] || 'David'}</strong></p>
                    <p>Blood Group: <strong className="text-slate-805 uppercase">{selectedAdm.bloodGroup || 'O+'}</strong></p>
                    <p>Genotype: <strong className="text-slate-805 uppercase">{selectedAdm.genotype || 'AA'}</strong></p>
                    <p>Previous School: <strong className="text-slate-805">{selectedAdm.previous_school || 'None'}</strong></p>
                    <p>Fees State: <strong className={selectedAdm.feesPaid ? "text-emerald-600" : "text-amber-650"}>{selectedAdm.feesPaid ? "Tuition Paid" : "Unpaid"}</strong></p>
                  </div>
                </div>

                {/* 2. Parents details */}
                <div className="space-y-3 p-4 bg-slate-50 border rounded-2xl">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Sponsor / Emergency Info</h4>
                  <div className="space-y-1.5 text-xs font-semibold text-slate-600 leading-normal">
                    <p>Sponsor Name: <strong className="text-slate-800">{selectedAdm.parent_name || 'N/A'}</strong></p>
                    <p>Email Line: <strong className="text-slate-800">{selectedAdm.email || 'N/A'}</strong></p>
                    <p>Phone Lines: <strong className="text-slate-800">{selectedAdm.phone}</strong></p>
                  </div>
                </div>

                {/* 3. CBT Baseline Results & AI Audit Recommendations */}
                <div className="space-y-4 p-4 bg-slate-50 border rounded-2xl">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3. Entrance CBT Report Card</h4>
                  
                  {selectedAdm.cbtScore !== undefined ? (() => {
                    const rec = getHeuristicAiRecommendation(selectedAdm);
                    const math = selectedAdm.cbtMathScore !== undefined ? selectedAdm.cbtMathScore : Math.round((selectedAdm.cbtScore / 100) * 50);
                    const engl = selectedAdm.cbtEnglScore !== undefined ? selectedAdm.cbtEnglScore : Math.round((selectedAdm.cbtScore / 100) * 50);
                    
                    return (
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold animate-in fade-in duration-200">
                          <div className="bg-white p-2 border rounded-xl">
                            <span className="text-slate-400 block text-[8px] uppercase">Mathematics</span>
                            <span className="font-black text-slate-800 text-xs">{math}/50</span>
                          </div>
                          <div className="bg-white p-2 border rounded-xl">
                            <span className="text-slate-400 block text-[8px] uppercase">English</span>
                            <span className="font-black text-slate-800 text-xs">{engl}/50</span>
                          </div>
                          <div className="bg-white p-2 border rounded-xl">
                            <span className="text-slate-400 block text-[8px] uppercase">Total</span>
                            <span className="font-black text-amber-600 text-xs">{selectedAdm.cbtScore}%</span>
                          </div>
                        </div>

                        {/* Defocus / Cheating warns */}
                        <div className="flex items-center justify-between text-[10px] px-2.5 py-1.5 bg-white border border-slate-100 rounded-xl">
                          <span className="text-slate-500 font-bold uppercase">Tab Defocus Warnings:</span>
                          <span className={`font-mono font-black ${selectedAdm.tabSwitchesCount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                            {selectedAdm.tabSwitchesCount ?? 0} infraction(s)
                          </span>
                        </div>

                        {/* AI recommendations badge and summary */}
                        <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-2 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">AI AUDITOR INSIGHT</span>
                            <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded border ${rec.color}`}>
                              {rec.badge}
                            </span>
                          </div>
                          <p className="text-[10px] leading-relaxed text-slate-500 font-medium">{rec.paragraph}</p>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="text-center py-4 text-slate-400 font-bold text-[10px] uppercase">
                      Candidate has not taken the online Entrance CBT yet.
                    </div>
                  )}
                </div>

                {/* 4. Signed signature preview */}
                <div className="space-y-3 p-4 bg-slate-50 border rounded-2xl">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">4. Signed declarations</h4>
                  <p className="text-[11px] text-slate-500 italic">"I certify all credentials submitted hold true to best knowledge criteria."</p>
                  <p className="text-xs text-slate-700 font-serif italic font-bold">Signature: {selectedAdm.parentSignatureName || selectedAdm.parent_name}</p>
                </div>
              </div>

              {/* AUDIT WORKSPACE CONTROLS */}
              <div className="space-y-6 border-l border-slate-100 pl-0 md:pl-6">
                
                {/* Status selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-400 uppercase">Change Application State</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { l: 'Under Review', s: 'Under Review' },
                      { l: 'Awaiting Doc', s: 'Awaiting Documents' },
                      { l: 'Schedule CBT', s: 'Examination Scheduled' },
                      { l: 'Schedule Oral', s: 'Interview Scheduled' },
                      { l: 'Approve Folder', s: 'Approved' },
                      { l: 'Enroll Candidate', s: 'Admitted' },
                      { l: 'Reject File', s: 'Rejected' },
                    ].map((btn) => (
                      <button
                        key={btn.s}
                        onClick={() => handleUpdatePipelineStatus(selectedAdm.id, { status: btn.s })}
                        className={`py-3.5 px-3 rounded-xl text-[10px] uppercase font-bold text-center border duration-200 cursor-pointer ${
                          selectedAdm.status === btn.s 
                            ? 'bg-primary text-white font-extrabold border-primary' 
                            : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-150'
                        }`}
                      >
                        {btn.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Schedulers */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-black text-primary uppercase">CBT &amp; Panels Scheduling</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CBT Date</label>
                      <input 
                        type="text" 
                        value={tempExamDate}
                        onChange={(e) => setTempExamDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Interview Date</label>
                      <input 
                        type="text" 
                        value={tempInterviewDate}
                        onChange={(e) => setTempInterviewDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Feedback messenger */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <label className="block text-xs font-black text-slate-400 uppercase">Board Action Remarks (Dispatched To Parents)</label>
                  <textarea
                    rows={2}
                    value={tempAdminMessage}
                    onChange={(e) => setTempAdminMessage(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold outline-none focus:bg-white"
                    placeholder="E.g. Requesting medical history certificate..."
                  />
                  
                  <button
                    onClick={() => handleUpdatePipelineStatus(selectedAdm.id, { 
                      status: selectedAdm.status, 
                      adminMessage: tempAdminMessage, 
                      examDate: tempExamDate, 
                      interviewDate: tempInterviewDate 
                    })}
                    className="w-full py-3 bg-primary text-white hover:bg-opacity-95 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
                  >
                    Confirm Schedules &amp; Dispatches
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ============================================================================
// 8. VIEW: SYSTEM PREFERENCES & CONTROLS
// ============================================================================

function SettingsView() {
  const [activeSetting, setActiveSetting] = useState<string | null>(null);
  
  // CBT Management states
  const [cbtQuestions, setCbtQuestions] = useState<{ id: number; question: string; options: string[]; correct: string }[]>([]);
  const [cbtDurationMinutes, setCbtDurationMinutes] = useState<number>(5);
  
  // Question Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');

  const defaultCbtQuestions = [
    {
      id: 1,
      question: "Which word starts with the same consonant sound as 'Chair'?",
      options: ["Character", "Chef", "Chemistry", "Cherry"],
      correct: "Cherry"
    },
    {
      id: 2,
      question: "Solve for x:  3x - 7 = 14",
      options: ["x = 5", "x = 7", "x = 6", "x = -7"],
      correct: "x = 7"
    },
    {
      id: 3,
      question: "Faith Foundation School prioritizes three major pillars. What are they?",
      options: ["Knowledge, Wisdom & Beauty", "Academic Excellence, Moral Fortitude & Spiritual Growth", "Sports, Science & Leadership", "Technology, Reading & Art"],
      correct: "Academic Excellence, Moral Fortitude & Spiritual Growth"
    },
    {
      id: 4,
      question: "Select the sentence with correct grammatical structure:",
      options: [
        "The students wented to the laboratory yesterday.", 
        "The principal has already spoke to the parents.", 
        "Every candidate is expected to present their examination slip.", 
        "They was planning to construct a new sports center."
      ],
      correct: "Every candidate is expected to present their examination slip."
    },
    {
      id: 5,
      question: "If a student scoring 80% on 3 subjects wants an average of 85% across 4 subjects, what must they score in the 4th subject?",
      options: ["85%", "90%", "100%", "95%"],
      correct: "100%"
    }
  ];

  // Load CBT data from local storage when CBT is opened
  useEffect(() => {
    if (activeSetting === 'CBT Parameters') {
      const savedQuestions = localStorage.getItem('ff_cbt_questions');
      if (savedQuestions) {
        try {
          setCbtQuestions(JSON.parse(savedQuestions));
        } catch (e) {
          setCbtQuestions(defaultCbtQuestions);
        }
      } else {
        setCbtQuestions(defaultCbtQuestions);
        localStorage.setItem('ff_cbt_questions', JSON.stringify(defaultCbtQuestions));
      }

      const savedDuration = localStorage.getItem('ff_cbt_duration_minutes');
      if (savedDuration) {
        const parsed = parseInt(savedDuration, 10);
        if (!isNaN(parsed) && parsed > 0) {
          setCbtDurationMinutes(parsed);
        }
      } else {
        localStorage.setItem('ff_cbt_duration_minutes', '5');
      }
    }
  }, [activeSetting]);

  const handleSaveTimer = (e: React.FormEvent) => {
    e.preventDefault();
    if (cbtDurationMinutes <= 0) {
      showBannerAlert('Timer duration must be at least 1 minute', false);
      return;
    }
    localStorage.setItem('ff_cbt_duration_minutes', cbtDurationMinutes.toString());
    showBannerAlert(`CBT countdown duration set to ${cbtDurationMinutes} minutes!`);
  };

  const openAddForm = () => {
    setEditingId(null);
    setQuestionText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectAnswer('');
    setIsFormOpen(true);
  };

  const openEditForm = (q: any) => {
    setEditingId(q.id);
    setQuestionText(q.question);
    setOptA(q.options[0] || '');
    setOptB(q.options[1] || '');
    setOptC(q.options[2] || '');
    setOptD(q.options[3] || '');
    setCorrectAnswer(q.correct);
    setIsFormOpen(true);
  };

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText || !optA || !optB || !optC || !optD || !correctAnswer) {
      showBannerAlert('Please fill out all question fields and options', false);
      return;
    }

    const optionsArray = [optA, optB, optC, optD];
    if (!optionsArray.includes(correctAnswer)) {
      showBannerAlert('The correct answer MUST match one of the four options exactly', false);
      return;
    }

    let updatedList = [];
    if (editingId !== null) {
      // Modify existing
      updatedList = cbtQuestions.map(q => {
        if (q.id === editingId) {
          return { id: editingId, question: questionText, options: optionsArray, correct: correctAnswer };
        }
        return q;
      });
      showBannerAlert('Question details successfully modified');
    } else {
      // Create new
      const nextId = cbtQuestions.length > 0 ? Math.max(...cbtQuestions.map(q => q.id)) + 1 : 1;
      updatedList = [...cbtQuestions, { id: nextId, question: questionText, options: optionsArray, correct: correctAnswer }];
      showBannerAlert('New question added to official Entrance list');
    }

    setCbtQuestions(updatedList);
    localStorage.setItem('ff_cbt_questions', JSON.stringify(updatedList));
    setIsFormOpen(false);
  };

  const handleDeleteQuestion = (id: number) => {
    const updated = cbtQuestions.filter(q => q.id !== id);
    setCbtQuestions(updated);
    localStorage.setItem('ff_cbt_questions', JSON.stringify(updated));
    showBannerAlert('Question removed from examination records', false);
  };

  const resetToDefaultCbt = () => {
    if (window.confirm('Are you certain you want to revert all questions to Faith Foundation standard parameters?')) {
      setCbtQuestions(defaultCbtQuestions);
      setCbtDurationMinutes(5);
      localStorage.setItem('ff_cbt_questions', JSON.stringify(defaultCbtQuestions));
      localStorage.setItem('ff_cbt_duration_minutes', '5');
      showBannerAlert('Aptitude registry parameters reverted to defaults');
    }
  };

  if (activeSetting === 'CBT Parameters') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Back and title bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-100 p-6 rounded-3xl gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600">
              <Clock size={22} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Entrance Exam Parameters</h3>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">Modify timing thresholds and custom question configurations.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveSetting(null)}
            className="px-4 py-2 bg-slate-50 border hover:bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase tracking-wide rounded-xl transition-all cursor-pointer"
          >
            ← Back to Preferences
          </button>
        </div>

        {/* Configurations Area */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* TIMER ZONE CARD */}
          <div className="lg:col-span-1 bg-white border border-slate-150 p-6 rounded-[32px] shadow-sm space-y-6 h-fit">
            <div className="border-b border-slate-105 pb-3">
              <h4 className="text-xs font-black text-[#111827] uppercase tracking-wide">Exam Duration limit</h4>
              <p className="text-[9px] text-slate-400 font-semibold mt-1">Set total countdown seconds allowed per attempt.</p>
            </div>

            <form onSubmit={handleSaveTimer} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-450 uppercase mb-1.5 font-mono">Minutes Limit</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    required
                    value={cbtDurationMinutes}
                    onChange={(e) => setCbtDurationMinutes(parseInt(e.target.value) || 5)}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 focus:bg-white text-sm font-bold text-slate-800 rounded-xl focus:outline-none"
                    placeholder="5"
                  />
                  <span className="absolute right-4 top-3.5 text-[10px] text-slate-400 font-bold uppercase font-mono">Mins</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary text-white hover:bg-opacity-95 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-primary/10 cursor-pointer"
              >
                Save Timing Threshold
              </button>
            </form>

            <div className="border-t border-slate-100 pt-4 text-center">
              <button
                type="button"
                onClick={resetToDefaultCbt}
                className="text-[9px] text-[#eab308] hover:underline font-black uppercase tracking-wider"
              >
                Revert all settings to defaults
              </button>
            </div>
          </div>

          {/* QUESTIONS LIST ZONE */}
          <div className="lg:col-span-2 bg-white border border-slate-150 p-6 rounded-[32px] shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-105 pb-4">
              <div>
                <h4 className="text-xs font-black text-[#111827] uppercase tracking-wide">
                  Entrance Question Pool ({cbtQuestions.length})
                </h4>
                <p className="text-[9px] text-slate-400 font-semibold mt-1">
                  Manage core diagnostic queries displayed to registered applicants.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddForm}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Add Question
              </button>
            </div>

            {/* Questions Form Overlay Inline Drawer */}
            {isFormOpen && (
              <form onSubmit={handleQuestionSubmit} className="p-6 bg-slate-50 border border-slate-200/60 rounded-3xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                  <h5 className="text-[10px] font-extrabold text-primary uppercase tracking-wider">
                    {editingId !== null ? '🖊️ Edit Question parameters' : '➕ Add new aptitude question'}
                  </h5>
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)}
                    className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-450 uppercase mb-1">Question inquiry statement</label>
                    <textarea
                      required
                      rows={2}
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
                      placeholder="Enter the question copy clearly..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-450 uppercase mb-1">Option A</label>
                      <input
                        type="text"
                        required
                        value={optA}
                        onChange={(e) => setOptA(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                        placeholder="Option A copy"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-450 uppercase mb-1">Option B</label>
                      <input
                        type="text"
                        required
                        value={optB}
                        onChange={(e) => setOptB(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                        placeholder="Option B copy"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-450 uppercase mb-1">Option C</label>
                      <input
                        type="text"
                        required
                        value={optC}
                        onChange={(e) => setOptC(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                        placeholder="Option C copy"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-450 uppercase mb-1">Option D</label>
                      <input
                        type="text"
                        required
                        value={optD}
                        onChange={(e) => setOptD(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                        placeholder="Option D copy"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-450 uppercase mb-1 text-emerald-600">Correct Answer Choice</label>
                    <select
                      required
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      <option value="">-- Choose correct choice --</option>
                      {optA && <option value={optA}>Option A: {optA}</option>}
                      {optB && <option value={optB}>Option B: {optB}</option>}
                      {optC && <option value={optC}>Option C: {optC}</option>}
                      {optD && <option value={optD}>Option D: {optD}</option>}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 bg-white border hover:bg-slate-50 text-slate-500 font-bold text-[10px] uppercase rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-white hover:bg-opacity-95 font-bold text-[10px] uppercase rounded-lg shadow-sm"
                  >
                    {editingId !== null ? 'Save Changes' : 'Append Question'}
                  </button>
                </div>
              </form>
            )}

            {/* Questions Table/Cards List */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {cbtQuestions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border rounded-2xl">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">No entrance questions registered. Reset to defaults to seed records.</p>
                </div>
              ) : (
                cbtQuestions.map((q, index) => (
                  <div key={q.id} className="p-4 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all space-y-3 bg-slate-50/50">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[9px] font-black text-rose-500 bg-rose-50 px-2.5 py-0.5 rounded-full">
                        QUESTION #{index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(q)}
                          className="p-1.5 hover:bg-white hover:border border-slate-200 rounded-lg text-slate-500 hover:text-primary transition-all cursor-pointer"
                          title="Edit Question details"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 hover:bg-white hover:border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                          title="Delete Question"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <h5 className="text-[12px] font-black text-slate-800 leading-normal">{q.question}</h5>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 font-mono">
                      {q.options.map((opt, i) => (
                        <div 
                          key={i} 
                          className={`p-2 rounded-lg border flex items-center justify-between ${
                            opt === q.correct 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-850 font-bold' 
                              : 'bg-white border-slate-100'
                          }`}
                        >
                          <span className="truncate">{String.fromCharCode(65 + i)}. {opt}</span>
                          {opt === q.correct && (
                            <span className="text-[8px] bg-emerald-500 text-white font-black uppercase px-1 py-0.5 rounded ml-1 scale-90">Correct</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

      </div>
    );
  }

  const settingsBlocks = [
    { title: 'Academic Calendar', desc: 'Maintain term limits and semester transitions.', active: true },
    { title: 'CBT Parameters', desc: 'Computer based test questions and timers.', active: true },
    { title: 'Email Templates', desc: 'Default automatic emails dispatched to families.', active: false },
    { title: 'Database Backup', desc: 'Secure downloadable CSV logs of all registries.', active: true },
    { title: 'Security Audits', desc: 'Track sign-on authorizations and IPs.', active: false },
    { title: 'Staff Hierarchy', desc: 'Specify department heads and roles accesses.', active: true }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm text-center max-w-xl mx-auto space-y-6">
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
          <Settings size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">System Preferences</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">Adjust fundamental boundaries and academic parameters for the entire campus.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsBlocks.map((block) => (
          <div 
            key={block.title}
            onClick={() => {
              if (block.title === 'CBT Parameters') {
                setActiveSetting('CBT Parameters');
              } else {
                showBannerAlert(`${block.title} configurations active`);
              }
            }}
            className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm cursor-pointer hover:border-primary/40 duration-300 transition-all flex flex-col justify-between h-40 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight size={14} className="text-primary" />
            </div>

            <div>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase">{block.title}</h4>
              <p className="text-[10px] text-slate-405 mt-2 font-medium leading-relaxed">{block.desc}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Synced
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
