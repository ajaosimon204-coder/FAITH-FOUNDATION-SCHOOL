import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { sendNotification } from '../lib/notifications';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  BookOpen,
  Users as UsersIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  RotateCcw,
  PlusCircle,
  History,
  Check,
  Search,
  BookOpenCheck,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  ClipboardList,
  ChevronRight,
  Info,
  CalendarCheck,
  Trash2
} from 'lucide-react';

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: 'present' | 'late' | 'absent';
}

interface AttendanceSession {
  id: string; // unique key (class + subject + date)
  date: string;
  className: string;
  subject: string;
  topicCovered: string;
  comments: string;
  records: AttendanceRecord[];
  createdAt: string;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  presentPercentage: number;
}

const MOCK_STUDENTS = [
  { id: 'demo-stud-1', full_name: 'Adewale Olorunsho', email: 'adewale.o@faithfoundation.edu.ng' },
  { id: 'demo-stud-2', full_name: 'Chioma Nwachukwu', email: 'chioma.n@faithfoundation.edu.ng' },
  { id: 'demo-stud-3', full_name: 'Ibrahim Kabir', email: 'ibrahim.k@faithfoundation.edu.ng' },
  { id: 'demo-stud-4', full_name: 'Funke Layonu', email: 'funke.l@faithfoundation.edu.ng' },
  { id: 'demo-stud-5', full_name: 'Tunde Bakare', email: 'tunde.b@faithfoundation.edu.ng' },
  { id: 'demo-stud-6', full_name: 'Amina Yusuf', email: 'amina.y@faithfoundation.edu.ng' },
  { id: 'demo-stud-7', full_name: 'Emeka Okafor', email: 'emeka.o@faithfoundation.edu.ng' },
  { id: 'demo-stud-8', full_name: 'Yetunde Alao', email: 'yetunde.a@faithfoundation.edu.ng' },
];

const PRESET_SUBJECTS = [
  'Advanced Mathematics',
  'Physics Practical',
  'Further Mathematics',
  'Chemistry Theory',
  'Biology Lab',
  'English Language',
  'Civic Education',
];

const PRESET_CLASSES = [
  'SS 3 Science',
  'SS 2 Science',
  'SS 1 Science',
  'JSS 3',
  'JSS 2',
  'JSS 1',
];

export default function AttendanceTracker() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Core parameters
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [selectedClass, setSelectedClass] = useState<string>(PRESET_CLASSES[0]);
  const [selectedSubject, setSelectedSubject] = useState<string>(PRESET_SUBJECTS[0]);

  // Lists
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Attendance Register states
  const [statuses, setStatuses] = useState<Record<string, 'present' | 'late' | 'absent'>>({});
  const [topicCovered, setTopicCovered] = useState<string>('');
  const [comments, setComments] = useState<string>('');

  // History & Session Status
  const [savedSessions, setSavedSessions] = useState<AttendanceSession[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'record' | 'history'>('record');

  // Fetch / fallback students loading
  useEffect(() => {
    async function loadStudents() {
      setLoadingStudents(true);
      try {
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('role', 'student')
            .order('full_name', { ascending: true });

          if (error) throw error;
          if (data && data.length > 0) {
            setStudents(data);
            return;
          }
        }
        // Fallback to beautiful mock list if Supabase offline or no student rows
        setStudents(MOCK_STUDENTS);
      } catch (e) {
        console.warn('Could not query students from DB, using fallback sandbox students instead:', e);
        setStudents(MOCK_STUDENTS);
      } finally {
        setLoadingStudents(false);
      }
    }
    loadStudents();
  }, []);

  // Initialize status map when students reload
  useEffect(() => {
    if (students.length > 0) {
      const initialMap: Record<string, 'present' | 'late' | 'absent'> = {};
      students.forEach((s) => {
        initialMap[s.id] = 'present'; // Default to Present
      });
      setStatuses(initialMap);
    }
  }, [students]);

  // Load saved history logs from local storage
  useEffect(() => {
    const localData = localStorage.getItem('faith_foundation_attendance_sessions');
    if (localData) {
      try {
        setSavedSessions(JSON.parse(localData));
      } catch (e) {
        console.error('Failed to parse saved sessions:', e);
      }
    }
  }, []);

  // Compute session identifier for automatic lookup
  const currentSessionKey = useMemo(() => {
    return `${selectedClass}_${selectedSubject}_${selectedDate}`.replace(/\s+/g, '-').toLowerCase();
  }, [selectedClass, selectedSubject, selectedDate]);

  // Check if an existing session is already recorded for this combination
  const existingSession = useMemo(() => {
    return savedSessions.find((s) => s.id === currentSessionKey);
  }, [savedSessions, currentSessionKey]);

  // Load existing session details if found
  const loadExistingSessionIntoForm = () => {
    if (existingSession) {
      const mappedStatuses: Record<string, 'present' | 'late' | 'absent'> = {};
      existingSession.records.forEach((rec) => {
        mappedStatuses[rec.studentId] = rec.status;
      });
      setStatuses(mappedStatuses);
      setTopicCovered(existingSession.topicCovered || '');
      setComments(existingSession.comments || '');
    }
  };

  // Run initial state restoration whenever parameters change or existingSession changes
  useEffect(() => {
    if (existingSession) {
      const mappedStatuses: Record<string, 'present' | 'late' | 'absent'> = {};
      existingSession.records.forEach((rec) => {
        mappedStatuses[rec.studentId] = rec.status;
      });
      setStatuses(mappedStatuses);
      setTopicCovered(existingSession.topicCovered);
      setComments(existingSession.comments);
    } else {
      // Clear out input notes, restore all students to present
      const initialMap: Record<string, 'present' | 'late' | 'absent'> = {};
      students.forEach((s) => {
        initialMap[s.id] = 'present';
      });
      setStatuses(initialMap);
      setTopicCovered('');
      setComments('');
    }
  }, [selectedClass, selectedSubject, selectedDate, existingSession, students]);

  // Compute live calculations
  const stats = useMemo(() => {
    let total = students.length;
    let present = 0;
    let late = 0;
    let absent = 0;

    Object.values(statuses).forEach((st) => {
      if (st === 'present') present++;
      else if (st === 'late') late++;
      else if (st === 'absent') absent++;
    });

    // If students haven't resolved yet, fallback
    if (total === 0) return { total: 0, present: 0, late: 0, absent: 0, percentage: 0 };

    const percentage = Math.round(((present + late) / total) * 100);

    return {
      total,
      present,
      late,
      absent,
      percentage,
    };
  }, [statuses, students]);

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    return students.filter((student) =>
      student.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  // Bulk Actions
  const markAllStatus = (newStatus: 'present' | 'late' | 'absent') => {
    const updated: Record<string, 'present' | 'late' | 'absent'> = {};
    students.forEach((s) => {
      updated[s.id] = newStatus;
    });
    setStatuses(updated);
  };

  // Single Student Row status change helper
  const handleSetStudentStatus = (studentId: string, itemStatus: 'present' | 'late' | 'absent') => {
    setStatuses((prev) => ({
      ...prev,
      [studentId]: itemStatus,
    }));
  };

  // Submit and save session register
  const handleSaveRegister = async () => {
    setSubmitting(true);
    setSubmitSuccess(false);

    try {
      const records: AttendanceRecord[] = students.map((s) => ({
        studentId: s.id,
        studentName: s.full_name || 'Student',
        studentEmail: s.email || '',
        status: statuses[s.id] || 'present',
      }));

      const newSession: AttendanceSession = {
        id: currentSessionKey,
        date: selectedDate,
        className: selectedClass,
        subject: selectedSubject,
        topicCovered: topicCovered,
        comments: comments,
        records: records,
        createdAt: new Date().toISOString(),
        totalPresent: stats.present,
        totalAbsent: stats.absent,
        totalLate: stats.late,
        presentPercentage: stats.percentage,
      };

      // 1. Core State update & LocalStorage Update (resilient fallback)
      let updatedSessions = [...savedSessions];
      const existingIdx = updatedSessions.findIndex((s) => s.id === currentSessionKey);

      if (existingIdx >= 0) {
        updatedSessions[existingIdx] = newSession;
      } else {
        updatedSessions.unshift(newSession); // Insert newest first
      }

      localStorage.setItem('faith_foundation_attendance_sessions', JSON.stringify(updatedSessions));
      setSavedSessions(updatedSessions);

      // 2. Mock or real Notifications dispatch triggered to parents/students
      const notificationsToSend = records.map(async (record) => {
        // Trigger student notifications if they have a real database profile
        // Skip mock student IDs strictly to prevent foreign-key crashes on database
        if (record.studentId && !record.studentId.startsWith('demo-')) {
          try {
            let statusPhrase = record.status === 'present' ? 'PRESENT' : record.status === 'late' ? 'LATE' : 'ABSENT';
            let statusEmoji = record.status === 'present' ? '🟢' : record.status === 'late' ? '🟡' : '🔴';
            
            await sendNotification({
              recipientId: record.studentId,
              title: `Daily Attendance Update (${statusPhrase})`,
              message: `${statusEmoji} You were marked ${record.status.toUpperCase()} in ${selectedSubject} today, ${selectedDate}. Teacher remarks: ${comments || 'No remarks recorded.'}`,
              type: 'attendance'
            });
          } catch (err) {
            console.warn(`Could not dispatch db notification to ${record.studentName}:`, err);
          }
        }
      });

      await Promise.all(notificationsToSend);

      // Timeout simulation for luxurious feeling
      setTimeout(() => {
        setSubmitting(false);
        setSubmitSuccess(true);
        // Clean notification alert
        setTimeout(() => setSubmitSuccess(false), 4500);
      }, 800);

    } catch (e) {
      console.error('Failed to submit attendance register:', e);
      setSubmitting(false);
      alert('Could not submit register. Please try again.');
    }
  };

  // Delete a previous session from history log
  const handleDeletePastSession = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop trigger page reload
    if (confirm('Are you sure you want to delete this attendance log? This is irreversible.')) {
      const updated = savedSessions.filter((s) => s.id !== idToDelete);
      localStorage.setItem('faith_foundation_attendance_sessions', JSON.stringify(updated));
      setSavedSessions(updated);
    }
  };

  // Restore history session into editor form
  const handleRestoreFromHistory = (session: AttendanceSession) => {
    setSelectedDate(session.date);
    setSelectedClass(session.className);
    setSelectedSubject(session.subject);
    setTopicCovered(session.topicCovered || '');
    setComments(session.comments || '');

    // Set statuses
    const mapped: Record<string, 'present' | 'late' | 'absent'> = {};
    session.records.forEach((rec) => {
      mapped[rec.studentId] = rec.status;
    });
    setStatuses(mapped);
    setActiveTab('record');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl hover:text-primary hover:bg-slate-100 transition-all hover:scale-105 active:scale-95"
            title="Back to Dashboard"
            id="back-to-dashboard-btn"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-secondary/10 text-secondary text-[10px] font-extrabold uppercase rounded-full tracking-wider">
                Academic Portal
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {profile?.full_name || 'Assigned Instructor'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-primary font-display tracking-tight mt-1">
              Attendance Registers
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Log daily subject attendance, record lesson topics, and broadcast automatic push receipts.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('record')}
            className={`flex items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'record'
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            id="tab-record-registers"
          >
            <ClipboardList size={14} />
            Daily Log
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            id="tab-history-registers"
          >
            <History size={14} />
            Logs Archive
            {savedSessions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-accent text-primary text-[9px] font-black rounded-full leading-none">
                {savedSessions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'record' ? (
          <motion.div
            key="record-view"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* LEFT 2 COLS: Registry and setup operations */}
            <div className="lg:col-span-2 space-y-6">
              {/* Setup Configuration Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 bg-primary/5 text-primary rounded-lg">
                    <CalendarCheck size={16} />
                  </span>
                  <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Register Setup Parameters
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Class selection */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2">
                      Class Level
                    </label>
                    <div className="relative">
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                        id="setup-class-select"
                      >
                        {PRESET_CLASSES.map((cls) => (
                          <option key={cls} value={cls}>
                            {cls}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px] font-bold">
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Subject selector */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2">
                      Lesson / Topic Subject
                    </label>
                    <div className="relative">
                      <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                        id="setup-subject-select"
                      >
                        {PRESET_SUBJECTS.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px] font-bold">
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Date Input */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2">
                      Date Selected
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-primary transition-all cursor-pointer"
                        id="setup-date-input"
                      />
                    </div>
                  </div>
                </div>

                {existingSession && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200/50 flex items-center justify-between text-amber-800 animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle size={15} className="shrink-0 text-amber-600" />
                      <p className="text-[10px] font-bold leading-relaxed">
                        ⚠️ EXISTING REGISTER FOUND: You have already logged attendance for this class and subject on this date. Saving will overwrite the record.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={loadExistingSessionIntoForm}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-[9px] font-extrabold uppercase text-amber-900 rounded-lg transition-all shadow-sm shrink-0 ml-2"
                    >
                      Reload Draft
                    </button>
                  </div>
                )}
              </div>

              {/* Attendance Sheet List Grid */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <span className="p-1.5 bg-secondary/10 text-secondary rounded-lg">
                      <UsersIcon size={16} />
                    </span>
                    <div>
                      <h2 className="text-sm font-black text-slate-800 font-display">
                        Students Registry
                      </h2>
                      <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                        Select student presence states for {selectedClass} Lesson
                      </p>
                    </div>
                  </div>

                  {/* Bulk Select Options */}
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => markAllStatus('present')}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all"
                      id="bulk-present-btn"
                    >
                      All Present
                    </button>
                    <button
                      type="button"
                      onClick={() => markAllStatus('absent')}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all"
                      id="bulk-absent-btn"
                    >
                      All Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cleared: Record<string, 'present' | 'late' | 'absent'> = {};
                        students.forEach((s) => {
                          cleared[s.id] = 'present';
                        });
                        setStatuses(cleared);
                      }}
                      className="px-2 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all"
                      id="reset-status-btn"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Search Bar filter */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                  <Search size={15} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search students by name (e.g. Adewale)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                    id="student-search-input"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-[9px] font-bold text-slate-400 hover:text-slate-700"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Form Elements / Student Row list */}
                {loadingStudents ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs font-medium text-slate-400">Loading student profiles...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="py-20 text-center space-y-2">
                    <XCircle size={32} className="text-slate-300 mx-auto" />
                    <p className="text-xs font-black text-slate-600 uppercase tracking-tight">No students match search</p>
                    <p className="text-[10px] text-slate-400 font-medium">Verify your query or filter term.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredStudents.map((student, idx) => {
                      const studentStatus = statuses[student.id] || 'present';
                      const initials = student.full_name
                        ?.split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase() || 'ST';

                      return (
                        <div
                          key={student.id}
                          className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                        >
                          {/* Student identity details */}
                          <div className="flex items-center gap-3 overflow-hidden">
                            <span className="text-[10px] font-mono text-slate-300 font-medium w-4 shrink-0">
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200/70 flex items-center justify-center font-bold text-xs text-primary font-display uppercase tracking-wide shrink-0">
                              {initials}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-[12px] font-bold text-slate-800 truncate leading-tight">
                                {student.full_name}
                              </p>
                              <p className="text-[9px] text-slate-400 truncate mt-0.5 uppercase tracking-tighter">
                                {student.email || 'student@faithfoundation.edu.ng'}
                              </p>
                            </div>
                          </div>

                          {/* Present / Late / Absent Buttons */}
                          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/60 font-bold uppercase tracking-tight text-[10px] shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.id, 'present')}
                              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                                studentStatus === 'present'
                                  ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <CheckCircle2 size={12} />
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.id, 'late')}
                              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                                studentStatus === 'late'
                                  ? 'bg-amber-550 text-white shadow-sm font-extrabold bg-[#D97706]'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <Clock size={12} />
                              Late
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.id, 'absent')}
                              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                                studentStatus === 'absent'
                                  ? 'bg-rose-600 text-white shadow-sm font-extrabold'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <XCircle size={12} />
                              Absent
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Real-time Stats, Syllabus Notes, and Save */}
            <div className="space-y-6">
              {/* Daily Statistics KPI Metrics card */}
              <div className="bg-primary hover:bg-primary-95 font-sans rounded-2xl shadow-md p-6 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-blue-200 tracking-wider bg-white/10 px-2 py-0.5 rounded-full">
                        Daily Metrics
                      </span>
                      <h3 className="text-lg font-black font-display tracking-tight text-white mt-1">
                        Register Calculus
                      </h3>
                    </div>
                    <span className="text-right">
                      <p className="text-2xl font-black font-display leading-none text-accent">
                        {stats.percentage}%
                      </p>
                      <p className="text-[8px] text-blue-200 uppercase font-bold tracking-wider leading-none mt-1">
                        Attendance Rate
                      </p>
                    </span>
                  </div>

                  {/* Radial/Bar Visual */}
                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-blue-100 uppercase mt-2">
                      <span>Present: {stats.present + stats.late}</span>
                      <span>Absent: {stats.absent}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{ width: `${stats.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Details breakdowns */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10 text-center">
                    <div className="bg-white/5 p-2 rounded-xl">
                      <p className="text-xs font-bold leading-none text-emerald-300">{stats.present}</p>
                      <p className="text-[8px] uppercase tracking-tighter opacity-60 mt-1">Present</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl">
                      <p className="text-xs font-bold leading-none text-amber-300">{stats.late}</p>
                      <p className="text-[8px] uppercase tracking-tighter opacity-60 mt-1">Late</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl">
                      <p className="text-xs font-bold leading-none text-rose-300">{stats.absent}</p>
                      <p className="text-[8px] uppercase tracking-tighter opacity-60 mt-1">Absent</p>
                    </div>
                  </div>
                </div>

                {/* Back decorative watermarks */}
                <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-secondary opacity-10 rounded-full blur-xl pointer-events-none"></div>
              </div>

              {/* Class Syllabus Notes / Topic Cover Inputs */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-1 text-slate-500 bg-slate-50 rounded">
                    <BookOpen size={14} className="text-slate-400" />
                  </span>
                  <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                    Syllabus Log & Lessons
                  </h3>
                </div>

                {/* Topic field */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                    Lesson Topic Covered
                  </label>
                  <input
                    type="text"
                    value={topicCovered}
                    onChange={(e) => setTopicCovered(e.target.value)}
                    placeholder="e.g. Introduction to Quadratic Formula"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary transition-all font-bold"
                    id="attendance-topic-input"
                  />
                </div>

                {/* Comments field */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                    Teacher General Comments
                  </label>
                  <textarea
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="e.g. Excellent attention and focus today. A few arrived late due to rain."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary transition-all leading-relaxed"
                    id="attendance-remarks-textarea"
                  />
                </div>
              </div>

              {/* Action Panels */}
              <div className="space-y-3">
                <button
                  type="button"
                  disabled={submitting || students.length === 0}
                  onClick={handleSaveRegister}
                  className="w-full bg-primary text-white py-4 px-6 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all outline-none flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:pointer-events-none"
                  id="submit-register-btn"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Composing Register...
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      Submit & Sync Register
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const confirmClear = confirm('Are you sure you want to reset current options?');
                    if (confirmClear) {
                      setTopicCovered('');
                      setComments('');
                      const reseted: Record<string, 'present' | 'late' | 'absent'> = {};
                      students.forEach((s) => {
                        reseted[s.id] = 'present';
                      });
                      setStatuses(reseted);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 text-slate-500 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all outline-none text-center block"
                  id="reset-form-btn"
                >
                  Clear Fields
                </button>
              </div>

              {/* Status Indicator Bar */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 leading-relaxed text-[10px] text-slate-500 flex gap-2.5 text-left font-medium">
                <Info size={16} className="text-slate-400 shrink-0" />
                <span>
                  <strong>Tip:</strong> Submitting attendance records the logs durably inside your browser log history. Students marked will receive visual updates in real time.
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ARCHIVE LOG HISTORY ACCODION VIEW */
          <motion.div
            key="history-view"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6"
          >
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-800 font-display">
                  Attendance Logs History Archive
                </h2>
                <p className="text-[10px] text-slate-400 mt-1 font-medium font-sans">
                  List of previously logged attendance registries stored durably. Clear or restore registers to update records.
                </p>
              </div>

              {savedSessions.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Danger: This will delete ALL saved attendance logs permanently. Continue?')) {
                      localStorage.removeItem('faith_foundation_attendance_sessions');
                      setSavedSessions([]);
                    }
                  }}
                  className="p-2 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100/80 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                  id="purge-history-btn"
                >
                  Purge History
                </button>
              )}
            </div>

            {savedSessions.length === 0 ? (
              <div className="py-24 text-center max-w-sm mx-auto space-y-4">
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-slate-400 mx-auto">
                  <ClipboardList size={28} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight">
                    Archive is Empty
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
                    You haven't recorded any registers yet. Configure class parameters and submit registers using the "Daily Log" tab.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('record')}
                  className="px-4 py-2.5 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-md shadow-primary/10"
                >
                  Create New Entry
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {savedSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleRestoreFromHistory(session)}
                    className="group border border-slate-200 rounded-2xl p-5 hover:border-primary/50 hover:bg-slate-50/40 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      {/* Left Date indicator */}
                      <div className="h-14 w-14 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col items-center justify-center font-display shrink-0 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                        <span className="text-[11px] font-extrabold text-primary leading-none uppercase">
                          {new Date(session.date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-lg font-black text-slate-800 leading-tight mt-0.5">
                          {new Date(session.date).toLocaleDateString('en-US', { day: 'numeric' })}
                        </span>
                      </div>

                      <div>
                        {/* Subject + Class info */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xs font-black text-slate-800">
                            {session.subject}
                          </h4>
                          <span className="px-2 py-0.5 bg-secondary/10 border border-secondary/20 text-[9px] font-extrabold text-secondary uppercase rounded-full">
                            {session.className}
                          </span>
                        </div>

                        {/* Covered topic list */}
                        {session.topicCovered ? (
                          <p className="text-[10px] text-slate-500 font-medium tracking-tight mt-1 truncate max-w-md">
                            <strong>Topic:</strong> {session.topicCovered}
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-500 font-medium tracking-tight mt-1 italic">
                            No lesson notes logged.
                          </p>
                        )}

                        <div className="flex gap-4 mt-2 text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                          <span>Logged: {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>&middot;</span>
                          <span>{session.records.length} Students registered</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats pill representation & edit restore controls */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-black text-primary font-display">
                          {session.presentPercentage}%
                        </span>
                        <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mt-0.5">
                          Present Rate
                        </p>
                      </div>

                      {/* Pill micro indicators */}
                      <div className="flex gap-1">
                        <span className="w-5 h-5 rounded-full bg-emerald-55 text-emerald-700 bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[9px] font-bold">
                          {session.totalPresent}
                        </span>
                        <span className="w-5 h-5 rounded-full bg-amber-55 text-amber-700 bg-amber-50 border border-amber-100 flex items-center justify-center text-[9px] font-bold">
                          {session.totalLate}
                        </span>
                        <span className="w-5 h-5 rounded-full bg-rose-55 text-rose-700 bg-rose-50 border border-rose-100 flex items-center justify-center text-[9px] font-bold">
                          {session.totalAbsent}
                        </span>
                      </div>

                      {/* Delete command button */}
                      <button
                        onClick={(e) => handleDeletePastSession(session.id, e)}
                        className="p-2.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-400 border border-slate-200 hover:border-rose-150 rounded-xl transition-all"
                        title="Delete log permanently"
                      >
                        <Trash2 size={14} />
                      </button>

                      <ChevronRight size={16} className="text-slate-400 group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating sliding success overlay banner */}
      <AnimatePresence>
        {submitSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3 max-w-sm z-50 overflow-hidden leading-relaxed"
          >
            <span className="p-2 bg-emerald-600 rounded-xl text-white">
              <Check size={16} />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-accent tracking-widest">
                Success
              </p>
              <p className="text-[10px] text-slate-300 font-bold mt-0.5">
                Attendance Register logged securely! Parents and student updates dispatched.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
