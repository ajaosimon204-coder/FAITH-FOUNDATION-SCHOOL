import React, { useState, useEffect } from 'react';
import { sendNotification } from '../../../lib/notifications';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  UserCheck, 
  Tv, 
  Award, 
  Plus, 
  Trash2, 
  Save, 
  ChevronRight, 
  Check, 
  X, 
  Filter, 
  Calendar,
  ThumbsUp,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import ImageUploader from '../../../components/ImageUploader';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function AcademicManager({ initialWorkspace }: { initialWorkspace?: 'report' | 'lms' | 'attendance' | 'cbt' | 'awards' }) {
  const [activeWorkspace, setActiveWorkspace] = useState<'report' | 'lms' | 'attendance' | 'cbt' | 'awards'>(initialWorkspace || 'report');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Report Card state
  const [reportTerm, setReportTerm] = useState<'1st' | '2nd' | '3rd'>('1st');
  const [reportData, setReportData] = useState<any>(null);

  // 2. LMS states
  const [lectures, setLectures] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  
  // LMS New note form
  const [newNoteSubject, setNewNoteSubject] = useState('Mathematics');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteType, setNewNoteType] = useState<'pdf' | 'video' | 'doc'>('pdf');
  const [newNoteSize, setNewNoteSize] = useState('2.5 MB');
  const [newNoteAuthor, setNewNoteAuthor] = useState('Dr. Adekunle Johnson');

  // LMS New assignment form
  const [newAsgSubject, setNewAsgSubject] = useState('Mathematics');
  const [newAsgTitle, setNewAsgTitle] = useState('');
  const [newAsgDeadline, setNewAsgDeadline] = useState('June 15, 2026');
  const [newAsgDesc, setNewAsgDesc] = useState('');
  const [newAsgPoints, setNewAsgPoints] = useState(20);
  const [newAsgResource, setNewAsgResource] = useState('');

  // 3. Attendance states
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [excuseRequests, setExcuseRequests] = useState<any[]>([]);
  
  // New Attendance Log Form
  const [attDate, setAttDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attStatus, setAttStatus] = useState<'early' | 'late' | 'absent' | 'excused'>('early');
  const [attRemark, setAttRemark] = useState('Marked by class supervisor');
  const [attTime, setAttTime] = useState('07:30 AM');

  // 4. CBT states
  const [cbtSubject, setCbtSubject] = useState<'Mathematics' | 'Physics'>('Mathematics');
  const [cbtQuestions, setCbtQuestions] = useState<Question[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);

  // 5. Awards states
  const [studentAchievements, setStudentAchievements] = useState<any[]>([]);
  const [leaderboardList, setLeaderboardList] = useState<any[]>([]);

  // Load everything from LocalStorage or seed defaults same as student portals
  useEffect(() => {
    // Report Card
    const savedReport = localStorage.getItem('ff_student_report_card');
    if (savedReport) {
      setReportData(JSON.parse(savedReport));
    }

    // LMS Lecture Note materials
    const savedLectures = localStorage.getItem('ff_lecture_notes');
    if (savedLectures) {
      setLectures(JSON.parse(savedLectures));
    }

    // LMS assignments
    const savedAssignments = localStorage.getItem('ff_student_assignments');
    if (savedAssignments) {
      setAssignments(JSON.parse(savedAssignments));
    }

    // Attendance logs
    const savedLogs = localStorage.getItem('ff_attendance_student_logs');
    if (savedLogs) {
      setAttendanceLogs(JSON.parse(savedLogs));
    }

    // Excuse requests
    const savedReqs = localStorage.getItem('ff_attendance_student_requests');
    if (savedReqs) {
      setExcuseRequests(JSON.parse(savedReqs));
    }

    // Achievements Setup
    const savedAchivements = localStorage.getItem('ff_student_achievements');
    if (savedAchivements) {
      setStudentAchievements(JSON.parse(savedAchivements));
    }

    // Leaderboard setup
    const savedLeaderboard = localStorage.getItem('ff_student_leaderboard');
    if (savedLeaderboard) {
      setLeaderboardList(JSON.parse(savedLeaderboard));
    }
  }, []);

  // Sync CBT questions on subject select
  useEffect(() => {
    const key = cbtSubject === 'Mathematics' ? 'ff_cbt_mathematics_questions' : 'ff_cbt_physics_questions';
    const saved = localStorage.getItem(key);
    if (saved) {
      setCbtQuestions(JSON.parse(saved));
    } else {
      // Pull defaults
      const defaults = cbtSubject === 'Mathematics' ? [
        { id: 1, question: 'Find the derivative of f(x) = x * sin(x) with respect to x.', options: ['cos(x)', 'sin(x) + x * cos(x)', 'x * cos(x) - sin(x)', 'sin(x) - x * cos(x)'], correctIndex: 1, explanation: 'By using product rule: u\'v + uv\'.' },
        { id: 2, question: 'Solve for x in the quadratic inequality x² - 5x + 6 < 0.', options: ['x < 2 or x > 3', '2 <= x <= 3', '2 < x < 3', 'x is any real number'], correctIndex: 2, explanation: 'Roots are 2 and 3. Testing intervals yields negative strictly in between.' },
        { id: 3, question: 'Find the limit of (sin x) / x as x approaches 0.', options: ['0', '1', 'Undefined', 'Infinity'], correctIndex: 1, explanation: 'Fundamental limits calculation.' }
      ] : [
        { id: 1, question: 'What is the force of attraction between two 1 Coulomb charges separated by exactly 1 meter in a vacuum?', options: ['1 Newton', '9.0 x 10⁹ Newtons', '8.85 x 10⁻¹² Newtons', '9.0 x 10⁻⁹ Newtons'], correctIndex: 1, explanation: 'Coulomb\'s Law constant.' },
        { id: 2, question: 'Under a constant net external force, what happens to velocity if mass increases?', options: ['Increases exponentially', 'Decreases inversely', 'Its rate of acceleration decreases', 'Stays exactly the same'], correctIndex: 2, explanation: 'F = ma, hence a = F/m.' }
      ];
      setCbtQuestions(defaults);
      localStorage.setItem(key, JSON.stringify(defaults));
    }
    setEditingQuestionId(null);
  }, [cbtSubject]);

  const showSuccessBanner = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  // --- 1. Save Report Card logic ---
  const handleUpdateReportSubject = (idx: number, field: string, value: any) => {
    if (!reportData) return;
    const termData = { ...reportData[reportTerm] };
    const subjectsCopy = [...termData.subjects];
    
    subjectsCopy[idx] = {
      ...subjectsCopy[idx],
      [field]: field === 'remarks' ? value : parseInt(value, 10) || 0
    };

    const newReportData = {
      ...reportData,
      [reportTerm]: {
        ...termData,
        subjects: subjectsCopy
      }
    };
    setReportData(newReportData);
  };

  const handleUpdateReportText = (field: string, value: string) => {
    if (!reportData) return;
    const termData = { ...reportData[reportTerm] };
    const newReportData = {
      ...reportData,
      [reportTerm]: {
        ...termData,
        [field]: value
      }
    };
    setReportData(newReportData);
  };

  const handleUpdateCognitive = (field: string, value: number) => {
    if (!reportData) return;
    const termData = { ...reportData[reportTerm] };
    const newReportData = {
      ...reportData,
      [reportTerm]: {
        ...termData,
        cognitive: {
          ...termData.cognitive,
          [field]: value
        }
      }
    };
    setReportData(newReportData);
  };

  const handleUpdateAffective = (field: string, value: number) => {
    if (!reportData) return;
    const termData = { ...reportData[reportTerm] };
    const newReportData = {
      ...reportData,
      [reportTerm]: {
        ...termData,
        affective: {
          ...termData.affective,
          [field]: value
        }
      }
    };
    setReportData(newReportData);
  };

  const saveReportCardToDisk = () => {
    if (!reportData) return;

    // Auto-calculate terminal totals, grade scores, and averages on publish
    const updatedData = { ...reportData };
    if (updatedData[reportTerm] && updatedData[reportTerm].subjects) {
      let grandTotal = 0;
      let subjectCount = 0;

      updatedData[reportTerm].subjects = updatedData[reportTerm].subjects.map((sub: any) => {
        const ca1 = parseInt(sub.ca1, 10) || 0;
        const ca2 = parseInt(sub.ca2, 10) || 0;
        const exam = parseInt(sub.test, 10) || 0; // "test" represents exam score in original layout schema
        const total = ca1 + ca2 + exam;
        
        // Map grade
        let grade = 'F9';
        let remark = 'Fail';
        if (total >= 85) { grade = 'A1'; remark = 'Excellent'; }
        else if (total >= 75) { grade = 'B2'; remark = 'Very Good'; }
        else if (total >= 65) { grade = 'B3'; remark = 'Good'; }
        else if (total >= 55) { grade = 'C4'; remark = 'Credit'; }
        else if (total >= 50) { grade = 'C5'; remark = 'Credit'; }
        else if (total >= 45) { grade = 'C6'; remark = 'Credit'; }
        else if (total >= 40) { grade = 'D7'; remark = 'Pass'; }
        else if (total >= 35) { grade = 'E8'; remark = 'Pass'; }

        grandTotal += total;
        subjectCount++;

        return {
          ...sub,
          total: total.toString(),
          grade,
          remarks: remark
        };
      });

      // Embed dynamic GPA indicators
      const averageScore = subjectCount > 0 ? (grandTotal / subjectCount) : 0;
      updatedData[reportTerm].summary = {
        totalScore: grandTotal.toString(),
        average: averageScore.toFixed(1),
        classPosition: updatedData[reportTerm].summary?.classPosition || "1st of 24", // Maintain current or set default
        attendance: updatedData[reportTerm].summary?.attendance || "91/96 Days",
        principalComment: averageScore >= 75 ? "Excellent academic showcase. Outstanding critical analytical performance." : averageScore >= 50 ? "Passable terminal outcome. Recommended study schedule optimization." : "Sub-optimal aggregate. Urgent academic review mandatory."
      };
    }

    setReportData(updatedData);
    localStorage.setItem('ff_student_report_card', JSON.stringify(updatedData));
    
    // Broadcast notifications
    try {
      sendNotification({
        recipientId: 'demo-student-id-9999',
        title: 'Academic Report Card Published',
        message: `Great news! Your terminal academic report card for the ${reportTerm} Term has been officially compiled, certified, and published.`,
        type: 'assignment',
        link: '/dashboard/results'
      });
    } catch (err) {
      console.warn('Sandbox notification dispatch error', err);
    }

    showSuccessBanner(`Grade Report Cards for ${reportTerm} Term have been compiled, computed, and successfully published.`);
  };


  // --- 2. LMS Material posting logic ---
  const deleteLecture = (id: string) => {
    const updated = lectures.filter(l => l.id !== id);
    setLectures(updated);
    localStorage.setItem('ff_lecture_notes', JSON.stringify(updated));
    showSuccessBanner('Learning resource successfully redacted from directory.');
  };

  const publishLecture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    const newLec = {
      id: `LEC-NEW-${Math.floor(100 + Math.random() * 900)}`,
      subject: newNoteSubject,
      title: newNoteTitle,
      type: newNoteType,
      sizeOrDuration: newNoteSize,
      author: newNoteAuthor
    };

    const updated = [newLec, ...lectures];
    setLectures(updated);
    localStorage.setItem('ff_lecture_notes', JSON.stringify(updated));
    setNewNoteTitle('');
    showSuccessBanner('Institutional syllabus lecture note published successfully to learning hub.');
  };

  const deleteAssignment = (id: string) => {
    const updated = assignments.filter(a => a.id !== id);
    setAssignments(updated);
    localStorage.setItem('ff_student_assignments', JSON.stringify(updated));
    showSuccessBanner('Assignment folder deleted successfully.');
  };

  const publishAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsgTitle.trim()) return;

    const newAsg = {
      id: `ASN-NEW-${Math.floor(100 + Math.random() * 900)}`,
      subject: newAsgSubject,
      title: newAsgTitle,
      deadline: newAsgDeadline,
      description: newAsgDesc,
      points: Number(newAsgPoints),
      resources: newAsgResource ? [newAsgResource] : [],
      submitted: false
    };

    const updated = [newAsg, ...assignments];
    setAssignments(updated);
    localStorage.setItem('ff_student_assignments', JSON.stringify(updated));
    setNewAsgTitle('');
    setNewAsgDesc('');
    showSuccessBanner('New academic assignment issued to classes.');
  };


  // --- 3. Attendance recording & excuse tracking ---
  const recordAttendanceLog = (e: React.FormEvent) => {
    e.preventDefault();
    const isLate = attStatus === 'late';
    const finalTime = isLate ? '08:15 AM' : attStatus === 'early' ? '07:35 AM' : '--';

    const newLog = {
      date: attDate,
      day: new Date(attDate).toLocaleDateString('en-US', { weekday: 'long' }),
      status: attStatus,
      timestamp: finalTime,
      remark: attRemark || 'Recorded by Class Instructor'
    };

    // Filter duplicates for the same day
    const filtered = attendanceLogs.filter(l => l.date !== attDate);
    const updated = [newLog, ...filtered];
    
    setAttendanceLogs(updated);
    localStorage.setItem('ff_attendance_student_logs', JSON.stringify(updated));
    showSuccessBanner(`Attendance ledger update recorded for date ${attDate}.`);
  };

  const updateExcuseRequestStatus = (id: string, action: 'approved' | 'declined') => {
    const reqIndex = excuseRequests.findIndex(r => r.id === id);
    if (reqIndex === -1) return;

    const updatedRequests = excuseRequests.map(r => {
      if (r.id === id) {
        return { ...r, status: action };
      }
      return r;
    });

    setExcuseRequests(updatedRequests);
    localStorage.setItem('ff_attendance_student_requests', JSON.stringify(updatedRequests));

    // If approved, automatically backfill an excused record in attendance logs for that date!
    if (action === 'approved') {
      const targetDate = excuseRequests[reqIndex].dateOfAbsence;
      const parsedDay = new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long' });
      
      const newExcusedLog = {
        date: targetDate,
        day: parsedDay,
        status: 'excused',
        timestamp: '--',
        remark: `Approved Excuse Note: ${excuseRequests[reqIndex].reason}`
      };

      const filteredLogs = attendanceLogs.filter(l => l.date !== targetDate);
      const updatedLogs = [newExcusedLog, ...filteredLogs];
      setAttendanceLogs(updatedLogs);
      localStorage.setItem('ff_attendance_student_logs', JSON.stringify(updatedLogs));
    }

    showSuccessBanner(`Excuse duty request ticket [${id}] has been statefully ${action}.`);
  };


  // --- 4. CBT Exam Questions posting and editing ---
  const saveCbtExamPool = () => {
    const key = cbtSubject === 'Mathematics' ? 'ff_cbt_mathematics_questions' : 'ff_cbt_physics_questions';
    localStorage.setItem(key, JSON.stringify(cbtQuestions));
    setEditingQuestionId(null);
    showSuccessBanner(`Automated ${cbtSubject} CBT diagnostic examination questions pool has been updated.`);
  };

  const handleUpdateQuestionField = (id: number, field: string, value: any) => {
    const updated = cbtQuestions.map(q => {
      if (q.id === id) {
        return { ...q, [field]: value };
      }
      return q;
    });
    setCbtQuestions(updated);
  };

  const handleUpdateQuestionOption = (id: number, optionIdx: number, value: string) => {
    const updated = cbtQuestions.map(q => {
      if (q.id === id) {
        const copyOptions = [...q.options];
        copyOptions[optionIdx] = value;
        return { ...q, options: copyOptions };
      }
      return q;
    });
    setCbtQuestions(updated);
  };

  const addEmptyQuestion = () => {
    const nextId = cbtQuestions.reduce((max, q) => Math.max(max, q.id), 0) + 1;
    const newQ: Question = {
      id: nextId,
      question: 'New Question Text?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0,
      explanation: 'Detailed response explanation justification goes here.'
    };
    const updated = [...cbtQuestions, newQ];
    setCbtQuestions(updated);
    setEditingQuestionId(nextId);
  };

  const deleteQuestion = (id: number) => {
    const updated = cbtQuestions.filter(q => q.id !== id);
    setCbtQuestions(updated);
    if (editingQuestionId === id) setEditingQuestionId(null);
  };


  // --- 5. Awards and XP Adjustments logic ---
  const toggleAchievementLock = (badgeId: string) => {
    const unlockedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
    const updated = studentAchievements.map(a => {
      if (a.id === badgeId) {
        const isUnlockedNow = !a.unlocked;
        return { 
          ...a, 
          unlocked: isUnlockedNow, 
          unlockedDate: isUnlockedNow ? unlockedDate : undefined 
        };
      }
      return a;
    });

    setStudentAchievements(updated);
    localStorage.setItem('ff_student_achievements', JSON.stringify(updated));
    showSuccessBanner('Academic honors status modified.');
  };

  const handleAdjustPoints = (newVal: string) => {
    const pts = parseInt(newVal, 10) || 0;
    const updatedLeaderboard = leaderboardList.map(item => {
      if (item.name === 'Ajao Demola Simon') {
        return { ...item, points: pts };
      }
      return item;
    });

    setLeaderboardList(updatedLeaderboard);
    localStorage.setItem('ff_student_leaderboard', JSON.stringify(updatedLeaderboard));
  };


  return (
    <div className="bg-white border border-slate-205 shadow-md rounded-[32px] overflow-hidden">
      
      {/* Banner Intro */}
      <div className="bg-slate-900 px-8 py-7 text-white flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest leading-none">
            <UserCheck size={14} /> Teacher Portal Access
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight font-display">Central Academic Curriculum Console</h2>
          <p className="text-[11px] text-slate-400">Class master and subject instructor controls for publishing grades, materials, schedules, and exams.</p>
        </div>
        <div className="text-[10px] bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 font-mono text-slate-300 font-bold uppercase">
          Class Assignee: SS 3 Science Alpha
        </div>
      </div>

      {/* Tabs list with counting highlights */}
      <div className="flex flex-wrap bg-slate-50 border-b border-slate-200 p-2 gap-1 text-xs">
        {[
          { key: 'report', label: 'Report Cards', count: null, icon: FileText },
          { key: 'lms', label: 'Learning Material & LMS', count: lectures.length + assignments.length, icon: BookOpen },
          { key: 'attendance', label: 'Attendance & Excuse notes', count: excuseRequests.filter(r => r.status === 'pending').length || null, icon: Clock },
          { key: 'cbt', label: 'CBT Exam Posting', count: null, icon: Tv },
          { key: 'awards', label: 'Awards & Standing Badges', count: studentAchievements.filter(a => a.unlocked).length || null, icon: Award }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeWorkspace === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveWorkspace(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-black uppercase tracking-wider transition-all border outline-none cursor-pointer ${
                isActive 
                  ? 'bg-primary text-white border-primary shadow-sm' 
                  : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 border-slate-200'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white text-primary' : 'bg-primary/10 text-primary'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="mx-8 mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-in fade-in duration-300">
          <CheckCircle size={16} className="text-emerald-500 shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Inner Panels */}
      <div className="p-8">
        
        {/* ================= REPORT CARD EDITOR ================= */}
        {activeWorkspace === 'report' && reportData && (
          <div className="space-y-6">
            <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-150 flex justify-between items-center gap-4 flex-wrap">
              <div>
                <h4 className="text-sm font-bold text-slate-800 uppercase">Grades Dossier Compiler: Ajao Demola Simon</h4>
                <p className="text-[11px] text-slate-500">SS3 Science Alpha Terminal assessment logs.</p>
              </div>

              {/* Term selects */}
              <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                {(['1st', '2nd', '3rd'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setReportTerm(t)}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                      reportTerm === t ? 'bg-primary text-white' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {t} Term
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Input Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-extrabold uppercase">
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4 text-center w-24">CA I (15)</th>
                    <th className="py-3 px-4 text-center w-24">CA II (15)</th>
                    <th className="py-3 px-4 text-center w-24">Exam (70)</th>
                    <th className="py-3 px-4 text-center w-20">Total</th>
                    <th className="py-3 px-4">Specific Remark Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData[reportTerm].subjects.map((sub: any, idx: number) => {
                    const total = sub.ca1 + sub.ca2 + sub.exam;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/20">
                        <td className="py-3 px-4 font-bold text-slate-800 uppercase">{sub.subject}</td>
                        <td className="py-2 px-2 text-center">
                          <input 
                            type="number"
                            min={0}
                            max={15}
                            value={sub.ca1}
                            onChange={(e) => handleUpdateReportSubject(idx, 'ca1', e.target.value)}
                            className="bg-slate-50 border rounded p-1 w-16 text-center font-bold text-slate-800 outline-none focus:bg-white"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input 
                            type="number"
                            min={0}
                            max={15}
                            value={sub.ca2}
                            onChange={(e) => handleUpdateReportSubject(idx, 'ca2', e.target.value)}
                            className="bg-slate-50 border rounded p-1 w-16 text-center font-bold text-slate-800 outline-none focus:bg-white"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input 
                            type="number"
                            min={0}
                            max={70}
                            value={sub.exam}
                            onChange={(e) => handleUpdateReportSubject(idx, 'exam', e.target.value)}
                            className="bg-slate-50 border rounded p-1 w-20 text-center font-bold text-slate-800 outline-none focus:bg-white"
                          />
                        </td>
                        <td className="py-3 px-4 text-center font-black text-primary font-mono">{total}</td>
                        <td className="py-2 px-4">
                          <input 
                            type="text"
                            value={sub.remarks}
                            onChange={(e) => handleUpdateReportSubject(idx, 'remarks', e.target.value)}
                            placeholder="e.g. Splendid continuous performance"
                            className="bg-slate-50 border rounded p-1 px-3 w-full  text-slate-600 italic font-medium outline-none focus:bg-white"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* General commentary & signatures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-600">
              <div>
                <label className="block mb-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-400">Class Teacher's Remark Commentary</label>
                <textarea 
                  rows={3}
                  value={reportData[reportTerm].teacherRemarks}
                  onChange={(e) => handleUpdateReportText('teacherRemarks', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:bg-white outline-none italic leading-relaxed font-semibold focus:border-primary border-2"
                />
              </div>
              <div>
                <label className="block mb-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-400">Principal's Evaluation Commentary</label>
                <textarea 
                  rows={3}
                  value={reportData[reportTerm].principalRemarks}
                  onChange={(e) => handleUpdateReportText('principalRemarks', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:bg-white outline-none italic leading-relaxed font-semibold focus:border-primary border-2"
                />
              </div>
            </div>

            {/* Cognitive Percentages Configuration */}
            <div className="border border-slate-150 rounded-2xl p-5 bg-slate-50/50 space-y-4 text-xs">
              <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Cognitive Proficiency Percentages</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                {[
                  { label: 'Recall Fact', key: 'knowledge' },
                  { label: 'Creative Conception', key: 'comprehension' },
                  { label: 'Practical Application', key: 'application' },
                  { label: 'Problem analysis', key: 'analysis' },
                  { label: 'Synthesis', key: 'synthesis' }
                ].map((cog) => (
                  <div key={cog.key} className="bg-white p-3 border rounded-xl space-y-1">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-tight leading-none">{cog.label}</span>
                    <input 
                      type="number"
                      min={0}
                      max={100}
                      value={reportData[reportTerm].cognitive[cog.key] || 90}
                      onChange={(e) => handleUpdateCognitive(cog.key, Number(e.target.value))}
                      className="w-full text-base font-black text-primary outline-none focus:text-slate-800"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Affective Qualities Configuration */}
            <div className="border border-slate-150 rounded-2xl p-5 bg-slate-50/50 space-y-4 text-xs">
              <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Behavioral & Affective Attributes Score (1 - 5)</span>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3.5">
                {[
                  { label: 'Punctuality', key: 'punctuality' },
                  { label: 'Neatness & Decorum', key: 'neatness' },
                  { label: 'Class Regularity', key: 'regularity' },
                  { label: 'Honesty / Integrity', key: 'honesty' },
                  { label: 'Reliability', key: 'reliability' },
                  { label: 'Polite Conduct', key: 'politeness' }
                ].map((aff) => (
                  <div key={aff.key} className="bg-white p-3 border rounded-xl space-y-1.5">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-tight leading-none">{aff.label}</span>
                    <select
                      value={reportData[reportTerm].affective[aff.key] || 5}
                      onChange={(e) => handleUpdateAffective(aff.key, Number(e.target.value))}
                      className="w-full text-sm font-black text-amber-500 bg-transparent outline-none cursor-pointer"
                    >
                      {[5, 4, 3, 2, 1].map(starNum => (
                        <option key={starNum} value={starNum}>⭐ {starNum}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t flex justify-end gap-3 text-xs">
              <button
                onClick={saveReportCardToDisk}
                className="bg-primary text-white font-black uppercase tracking-widest px-6 py-3.5 rounded-xl hover:bg-opacity-95 shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer border border-transparent active:scale-[0.99]"
              >
                <Save size={14} /> Publish Report Card Upgrades
              </button>
            </div>
          </div>
        )}


        {/* ================= LMS MANAGER (LECTURES & ASSIGNMENTS) ================= */}
        {activeWorkspace === 'lms' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
            
            {/* Left Col: Lectures Publisher */}
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b pb-2">📂 Upload Syllabus Learning Materials</h3>
                
                <form onSubmit={publishLecture} className="space-y-4 font-semibold text-slate-600">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-bold text-[9px] uppercase text-slate-400">Subject</label>
                      <select
                        value={newNoteSubject}
                        onChange={(e) => setNewNoteSubject(e.target.value)}
                        className="w-full border rounded-xl p-3 bg-white text-slate-700 font-bold"
                      >
                        <option value="Mathematics">Mathematics</option>
                        <option value="Physics">Physics</option>
                        <option value="Further Mathematics">Further Mathematics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="English Language">English Language</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-[9px] uppercase text-slate-400">Material Format</label>
                      <select
                        value={newNoteType}
                        onChange={(e) => setNewNoteType(e.target.value as any)}
                        className="w-full border rounded-xl p-3 bg-white text-slate-700 font-bold"
                      >
                        <option value="pdf">PDF E-Book (.pdf)</option>
                        <option value="video">MP4 Video Lecture (.mp4)</option>
                        <option value="doc">MS Word Document (.docx)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-[9px] uppercase text-slate-400">Lecture Resource Title</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g., Introduction to Electrostatic Volumetric Fields"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      className="w-full border p-3 rounded-xl bg-white focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-bold text-[9px] uppercase text-slate-400">File Size or Duration</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g., 2.4 MB or 15 mins"
                        value={newNoteSize}
                        onChange={(e) => setNewNoteSize(e.target.value)}
                        className="w-full border p-3 rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-[9px] uppercase text-slate-400">Lead Instructor</label>
                      <input 
                        type="text"
                        required
                        value={newNoteAuthor}
                        onChange={(e) => setNewNoteAuthor(e.target.value)}
                        className="w-full border p-3 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-primary text-white py-3.5 rounded-xl font-black uppercase tracking-widest hover:bg-opacity-95 shadow shadow-primary/10 cursor-pointer"
                  >
                    Upload & Publish Syllabus File
                  </button>
                </form>
              </div>

              {/* Published Syllabus materials list */}
              <div className="border border-slate-150 rounded-2xl p-5 space-y-3.5">
                <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider">Active Published Materials Directory</h4>
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {lectures.map((lec) => (
                    <div key={lec.id} className="p-3 border rounded-xl flex justify-between items-center gap-3 bg-slate-50/40 hover:bg-white transition-all">
                      <div>
                        <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded font-mono uppercase">{lec.subject}</span>
                        <h5 className="font-bold text-slate-800 text-xs mt-1 leading-snug">{lec.title}</h5>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">{lec.type} &middot; {lec.sizeOrDuration} &middot; {lec.author}</p>
                      </div>
                      <button
                        onClick={() => deleteLecture(lec.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete resource file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Assignments Publisher */}
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b pb-2">📝 Release New Student Assignment</h3>
                
                <form onSubmit={publishAssignment} className="space-y-4 font-semibold text-slate-600">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-bold text-[9px] uppercase text-slate-400">Subject Category</label>
                      <select
                        value={newAsgSubject}
                        onChange={(e) => setNewAsgSubject(e.target.value)}
                        className="w-full border rounded-xl p-3 bg-white text-slate-700 font-bold"
                      >
                        <option value="Mathematics">Mathematics</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Civic Education">Civic Education</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-[9px] uppercase text-slate-400">Max Points Awardable</label>
                      <input 
                        type="number"
                        required
                        value={newAsgPoints}
                        onChange={(e) => setNewAsgPoints(Number(e.target.value))}
                        className="w-full border p-3 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-[9px] uppercase text-slate-400">Assignment Headline Title</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g., Coulomb's Law Electrodynamics Worksheets"
                      value={newAsgTitle}
                      onChange={(e) => setNewAsgTitle(e.target.value)}
                      className="w-full border p-3 rounded-xl bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-bold text-[9px] uppercase text-slate-400">Deadline Date Text</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g., June 10, 2026"
                        value={newAsgDeadline}
                        onChange={(e) => setNewAsgDeadline(e.target.value)}
                        className="w-full border p-3 rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-[9px] uppercase text-slate-400">Reference URL attachment (Optional)</label>
                      <input 
                        type="text"
                        placeholder="Worksheet_Chapter_4.pdf"
                        value={newAsgResource}
                        onChange={(e) => setNewAsgResource(e.target.value)}
                        className="w-full border p-3 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-[9px] uppercase text-slate-400">Full Worksheet Directive Guidelines</label>
                    <textarea 
                      rows={3}
                      required
                      placeholder="List instructions, textbook questions numbers, and requirements..."
                      value={newAsgDesc}
                      onChange={(e) => setNewAsgDesc(e.target.value)}
                      className="w-full border p-3 rounded-xl bg-white"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-secondary text-white py-3.5 rounded-xl font-black uppercase tracking-widest hover:bg-opacity-95 shadow shadow-secondary/10 cursor-pointer"
                  >
                    Post Assignment Worksheet
                  </button>
                </form>
              </div>

              {/* Published assignments pool list */}
              <div className="border border-slate-150 rounded-2xl p-5 space-y-3.5">
                <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider">Active Assignments Directory</h4>
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {assignments.map((asg) => (
                    <div key={asg.id} className="p-3.5 border rounded-xl flex justify-between items-start gap-4 bg-slate-50/40 hover:bg-white transition-all">
                      <div>
                        <div className="flex gap-2 items-center flex-wrap">
                          <span className="text-[9px] bg-indigo-50 text-indigo-750 font-black px-1.5 py-0.5 rounded uppercase">{asg.subject}</span>
                          <span className="text-[9px] text-slate-450 uppercase font-mono">{asg.deadline}</span>
                        </div>
                        <h5 className="font-black text-slate-800 text-xs mt-1.5 leading-snug">{asg.title}</h5>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{asg.description}</p>
                        {asg.grade ? (
                          <div className="p-2.5 bg-green-50 rounded-xl mt-3.5 border border-green-100 flex items-center justify-between text-[11px] text-green-800 font-bold">
                            <span>Score: {asg.grade}</span>
                            <span className="text-[10px] font-medium leading-none max-w-xs truncate italic">"{asg.teacherRemarks}"</span>
                          </div>
                        ) : asg.submitted ? (
                          <div className="p-2.5 bg-yellow-50 rounded-xl mt-3.5 border border-yellow-105 flex flex-col gap-1 text-[11px] text-yellow-800 font-medium font-mono">
                            <span>✓ Student submitted file: {asg.studentSubmissionFile}</span>
                            <button
                              onClick={() => {
                                const scoreInput = prompt("Enter Grade / Marks (e.g. 18 / 20):", asg.points - 3 + " / " + asg.points);
                                if (scoreInput === null) return;
                                const remarks = prompt("Instructor feedback remarks:", "Well completed workbook exercise. Organized solutions.");
                                if (remarks === null) return;
                                
                                const updatedAsgs = assignments.map(a => {
                                  if (a.id === asg.id) {
                                    return { ...a, grade: scoreInput, teacherRemarks: remarks };
                                  }
                                  return a;
                                });
                                setAssignments(updatedAsgs);
                                localStorage.setItem('ff_student_assignments', JSON.stringify(updatedAsgs));
                                showSuccessBanner(`Graded Student Assignment score: ${scoreInput}`);
                              }}
                              className="self-start mt-2 px-3 py-1 bg-yellow-500 text-white rounded font-bold uppercase text-[9px] tracking-widest hover:bg-yellow-600 transition-colors"
                            >
                              Click to evaluate score
                            </button>
                          </div>
                        ) : (
                          <span className="text-[9px] text-amber-600 font-bold font-mono mt-1 block">⌛ Pending submission</span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteAssignment(asg.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Assignment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}


        {/* ================= ATTENDANCE & EXCUSES OFFICE ================= */}
        {activeWorkspace === 'attendance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
            
            {/* Left Col: Attendance Ledger Entry */}
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b pb-2">📅 Custom Daily Attendance Logger</h3>
                
                <form onSubmit={recordAttendanceLog} className="space-y-4 font-semibold text-slate-600">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-bold text-[9px] uppercase text-slate-450">Session Date</label>
                      <input 
                        type="date"
                        required
                        value={attDate}
                        onChange={(e) => setAttDate(e.target.value)}
                        className="w-full border rounded-xl p-3 bg-white text-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-[9px] uppercase text-slate-450 font-mono">Arrived Timestamps</label>
                      <input 
                        type="text"
                        required
                        value={attTime}
                        onChange={(e) => setAttTime(e.target.value)}
                        className="w-full border rounded-xl p-3 bg-white text-slate-800 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-bold text-[9px] uppercase text-slate-450">Attendance Compliance Code</label>
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-black uppercase">
                      {[
                        { key: 'early', label: 'Early Punctual', color: 'bg-emerald-500 border-emerald-500 text-white', inactive: 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' },
                        { key: 'late', label: 'Late Clock', color: 'bg-amber-500 border-amber-500 text-white', inactive: 'border-amber-200 text-amber-600 hover:bg-amber-50' },
                        { key: 'absent', label: 'Absent', color: 'bg-rose-500 border-rose-500 text-white', inactive: 'border-rose-250 text-rose-500 hover:bg-rose-50' },
                        { key: 'excused', label: 'Excused', color: 'bg-sky-500 border-sky-505 text-white', inactive: 'border-sky-150 text-sky-600 hover:bg-sky-50' },
                      ].map(st => {
                        const styleSel = attStatus === st.key ? st.color : st.inactive;
                        return (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() => setAttStatus(st.key as any)}
                            className={`py-3 border-2 rounded-xl transition-all cursor-pointer ${styleSel}`}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-[9px] uppercase text-slate-455">Instructor Comment Remark</label>
                    <input 
                      type="text"
                      placeholder="e.g. Verified early morning devotions attendee card"
                      value={attRemark}
                      onChange={(e) => setAttRemark(e.target.value)}
                      className="w-full border p-3 rounded-xl bg-white"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-primary text-white py-3.5 rounded-xl font-black uppercase tracking-widest hover:bg-opacity-95 shadow shadow-primary/10 cursor-pointer"
                  >
                    Commit Attendance Status
                  </button>
                </form>
              </div>

              {/* Attendance Log history */}
              <div className="border border-slate-150 rounded-2xl p-5 space-y-3">
                <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider">Attendance Register Timeline</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {attendanceLogs.map((log, i) => (
                    <div key={i} className="p-3 border rounded-xl flex justify-between items-center gap-4 bg-slate-50/20 text-xs">
                      <div>
                        <div className="flex gap-2 items-center">
                          <span className="font-extrabold text-slate-800">{log.date}</span>
                          <span className="text-[10px] text-slate-400">({log.day})</span>
                        </div>
                        <p className="text-[10px] text-slate-450 mt-1">{log.remark}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase ${
                          log.status === 'early' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : log.status === 'late'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : log.status === 'absent'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-sky-50 text-sky-700 border border-sky-150'
                        }`}>
                          {log.status === 'early' ? 'Punctual (Early)' : log.status}
                        </span>
                        {log.timestamp && log.timestamp !== '--' && (
                          <span className="block font-mono text-[9px] text-slate-400 mt-1 font-bold">{log.timestamp}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Excuse Duty Request Review */}
            <div className="space-y-5">
              <div className="bg-slate-50 p-6 border rounded-2xl space-y-3.5">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b pb-2 flex justify-between items-center">
                  <span>📬 Student Excuse Duty Tickets Desk</span>
                  {excuseRequests.some(r => r.status === 'pending') && (
                    <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded uppercase font-black animate-pulse">Needs Review</span>
                  )}
                </h3>

                <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                  {excuseRequests.length === 0 ? (
                    <p className="text-center font-medium italic text-slate-400 py-12">No medical excuse slips or absence duty claims filed yet.</p>
                  ) : (
                    excuseRequests.map((req) => (
                      <div key={req.id} className="p-4 border bg-white rounded-2xl relative space-y-3 shadow-sm border-2">
                        <div className="flex justify-between items-start gap-2 flex-wrap text-[10px]">
                          <div>
                            <span className="font-mono font-black text-primary bg-primary/10 px-2 py-0.5 rounded">{req.id}</span>
                            <span className="text-slate-400 ml-2">Filed: {req.requestDate}</span>
                          </div>
                          
                          <span className={`px-2.5 py-0.5 rounded-full font-black uppercase ${
                            req.status === 'pending' 
                              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' 
                              : req.status === 'approved'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {req.status}
                          </span>
                        </div>

                        <div className="text-xs text-slate-650">
                          <p className="font-bold text-slate-800 uppercase tracking-tight text-[11px]">{req.reason}</p>
                          <p className="text-[10px] text-slate-450 uppercase font-bold mt-1">Absence Date requested: {req.dateOfAbsence}</p>
                          <p className="italic text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-xl border">"{req.details}"</p>
                        </div>

                        {req.uploadedReceipt && (
                          <div className="bg-slate-100 p-2 rounded-xl text-[10px] font-mono text-slate-550 flex items-center gap-1.5 font-bold">
                            <span>📎 Document attachment links:</span>
                            <span className="text-emerald-700 underline truncate select-all">{req.uploadedReceipt}</span>
                          </div>
                        )}

                        {req.status === 'pending' && (
                          <div className="flex gap-2.5 pt-2">
                            <button
                              onClick={() => updateExcuseRequestStatus(req.id, 'approved')}
                              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[9px] tracking-widest rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <Check size={10} /> Approve ticket
                            </button>
                            <button
                              onClick={() => updateExcuseRequestStatus(req.id, 'declined')}
                              className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[9px] tracking-widest rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <X size={10} /> Decline Note
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}


        {/* ================= CBT QUESTIONNAIRE POOL EDITOR ================= */}
        {activeWorkspace === 'cbt' && (
          <div className="space-y-6 text-xs">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 flex justify-between items-center gap-4 flex-wrap">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 uppercase">CBT Exam Posting Workspace</h4>
                <p className="text-[11px] text-slate-500">Configure computerized questionnaires. Changes commit to local CBT Practice indexes instantly.</p>
              </div>

              {/* Subject selects */}
              <div className="flex bg-white p-1 rounded-xl border border-slate-205">
                {(['Mathematics', 'Physics'] as const).map(subj => (
                  <button
                    key={subj}
                    onClick={() => setCbtSubject(subj)}
                    className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
                      cbtSubject === subj ? 'bg-primary text-white shadow' : 'text-slate-450 hover:text-slate-700'
                    }`}
                  >
                    {subj} Questionnaire
                  </button>
                ))}
              </div>
            </div>

            {/* Questions Pool Manager */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">Configure pool: {cbtQuestions.length} Active Drills</span>
                <button
                  type="button"
                  onClick={addEmptyQuestion}
                  className="bg-secondary text-white font-bold uppercase py-2 px-4 rounded-xl flex items-center gap-1.5 hover:bg-opacity-95 text-[10px]"
                >
                  <Plus size={14} /> Insert New Question
                </button>
              </div>

              <div className="space-y-4">
                {cbtQuestions.map((q, index) => {
                  const isEditingThis = editingQuestionId === q.id;
                  return (
                    <div key={q.id} className="border-2 border-slate-150 rounded-2xl bg-white overflow-hidden shadow-sm">
                      
                      {/* Header bar */}
                      <div className="bg-slate-50 px-5 py-3.5 flex justify-between items-center border-b">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-primary/10 text-primary font-black flex items-center justify-center rounded text-[10px]">
                            {index + 1}
                          </span>
                          <span className="font-bold text-slate-650 font-mono">Question Item #{q.id}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingQuestionId(isEditingThis ? null : q.id)}
                            className="bg-white border rounded px-3 py-1.5 font-bold uppercase text-[9px] hover:bg-slate-50 transition-colors"
                          >
                            {isEditingThis ? 'Lock Preview' : 'Configure Entry'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteQuestion(q.id)}
                            className="text-rose-500 hover:bg-rose-50 border border-transparent p-1.5 rounded transition-colors"
                            title="Purge question"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-5 space-y-4">
                        {!isEditingThis ? (
                          <div className="space-y-3">
                            <p className="font-black text-slate-800 text-sm leading-snug">{q.question}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1.5">
                              {q.options.map((opt, oIdx) => (
                                <div 
                                  key={oIdx} 
                                  className={`p-3 border rounded-xl flex items-center gap-2.5 text-xs ${
                                    oIdx === q.correctIndex 
                                      ? 'bg-green-50 border-green-300 font-extrabold text-green-700' 
                                      : 'bg-slate-50/50'
                                  }`}
                                >
                                  <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center font-bold border text-[9px]">
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span>{opt}</span>
                                  {oIdx === q.correctIndex && (
                                    <span className="text-[9px] bg-green-500 text-white rounded px-1.5 uppercase tracking-tighter ml-auto font-black font-mono">CORRECT VALUE</span>
                                  )}
                                </div>
                              ))}
                            </div>

                            <p className="text-[11px] text-slate-450 italic font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border mt-2">
                              🐾 Explanation proofs: "{q.explanation}"
                            </p>
                          </div>
                        ) : (
                          
                          // Form editor
                          <div className="space-y-4 text-xs font-semibold text-slate-600">
                            <div>
                              <label className="block mb-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Question Narrative text</label>
                              <textarea
                                value={q.question}
                                onChange={(e) => handleUpdateQuestionField(q.id, 'question', e.target.value)}
                                className="w-full border rounded-xl p-3 bg-slate-50 text-slate-800 font-extrabold outline-none focus:bg-white"
                                rows={2}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="space-y-1">
                                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Option Label {String.fromCharCode(65 + oIdx)}</label>
                                  <div className="flex gap-1.5">
                                    <input 
                                      type="text"
                                      value={opt}
                                      onChange={(e) => handleUpdateQuestionOption(q.id, oIdx, e.target.value)}
                                      className="flex-1 border p-2.5 rounded-xl bg-slate-50 outline-none focus:bg-white text-slate-800 font-bold"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQuestionField(q.id, 'correctIndex', oIdx)}
                                      className={`px-3 rounded-xl border-2 font-black text-[9px] uppercase tracking-wider ${
                                        oIdx === q.correctIndex 
                                          ? 'bg-green-500 border-green-500 text-white' 
                                          : 'bg-white border-slate-200 text-slate-450 hover:bg-slate-50'
                                      }`}
                                    >
                                      MARK CORRECT
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div>
                              <label className="block mb-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Step-by-Step Analytical Correction explanation</label>
                              <textarea
                                value={q.explanation}
                                onChange={(e) => handleUpdateQuestionField(q.id, 'explanation', e.target.value)}
                                className="w-full border rounded-xl p-3 bg-slate-50 outline-none focus:bg-white"
                                rows={2}
                              />
                            </div>
                          </div>

                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={saveCbtExamPool}
                  className="bg-primary text-white font-black uppercase tracking-widest px-6 py-3.5 rounded-xl hover:bg-opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={14} /> Commit Exam Questionnaire Pool
                </button>
              </div>

            </div>

          </div>
        )}


        {/* ================= AWARDS & LEADERBOARD SYSTEM ================= */}
        {activeWorkspace === 'awards' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
            
            {/* Left: Trophies status controls */}
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b pb-2 flex items-center gap-1">
                  <Award size={14} className="text-amber-500" /> Grant Academic Badges & Achievements
                </h3>

                <p className="text-[11px] text-slate-500">
                  Select and toggle student trophies. Unlocking instantly grants institutional XP tokens, changing ranking order.
                </p>

                <div className="space-y-3">
                  {studentAchievements.map((badge) => (
                    <div 
                      key={badge.id}
                      className={`p-4 rounded-2xl border bg-white flex justify-between items-center gap-4 transition-all ${
                        badge.unlocked ? 'border-amber-350 shadow-sm' : 'border-slate-150 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl shrink-0">{badge.icon || '🏆'}</span>
                        <div>
                          <div className="flex gap-2 items-center flex-wrap">
                            <h4 className="font-extrabold text-slate-800 text-xs uppercase">{badge.title}</h4>
                            <span className="text-[8px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded font-mono block uppercase">{badge.id}</span>
                          </div>
                          <p className="text-[10px] text-slate-450 leading-relaxed mt-1 max-w-sm">{badge.desc}</p>
                          {badge.unlocked && (
                            <span className="text-[8px] text-emerald-600 font-bold block bg-emerald-50 rounded px-1.5 py-0.5 mt-1 truncate self-start italic">
                              ✓ Unlocked on: {badge.unlockedDate || 'Default Date'} (&middot; +{badge.xpPoints} XP)
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleAchievementLock(badge.id)}
                        className={`px-3 py-2 font-black uppercase text-[9px] tracking-wider rounded-xl cursor-pointer transition-all border-2 shrink-0 ${
                          badge.unlocked 
                            ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' 
                            : 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600'
                        }`}
                      >
                        {badge.unlocked ? 'REVOKE HONORS' : 'GRANT BADGE'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Leaderboard Standings points tuner */}
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b pb-2">
                  ⚔️ Class Leaderboard & Aggregate Point Adjuster
                </h3>

                <p className="text-[11px] text-slate-500">
                  Manually calibrate performance XP credits of <strong>Ajao Demola Simon</strong>. Ranks update in accordance with aggregate totals.
                </p>

                {/* Points Tuner input field */}
                {(() => {
                  const demolaRecord = leaderboardList.find(i => i.name === 'Ajao Demola Simon');
                  if (!demolaRecord) return null;
                  return (
                    <div className="p-4 bg-white border rounded-2xl space-y-3 shadow-inner">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-slate-700 uppercase tracking-tight">Modify Demola's XP points balance:</span>
                        <span className="font-mono font-black text-primary bg-primary/10 px-2 py-0.5 rounded italic">Level 4 Scholar</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number"
                          value={demolaRecord.points}
                          onChange={(e) => handleAdjustPoints(e.target.value)}
                          className="flex-1 bg-slate-50 border p-3 rounded-xl font-black text-slate-800 outline-none text-center text-lg focus:bg-white font-mono"
                        />
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Current Rank: #{demolaRecord.rank}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Display Mock Leaderboard with sorted items */}
                <div className="border border-slate-150 rounded-2xl p-4 bg-white space-y-3">
                  <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest">Calculated Rank Standings (Sorted dynamically)</span>
                  
                  <div className="space-y-2">
                    {[...leaderboardList]
                      .sort((a,b) => b.points - a.points)
                      .map((user, idx) => {
                        const isDemola = user.name === 'Ajao Demola Simon';
                        return (
                          <div 
                            key={user.name} 
                            className={`p-3 border rounded-xl flex items-center justify-between gap-3 text-xs ${
                              isDemola ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-55/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-5 h-5 flex items-center justify-center font-black rounded text-[10px] ${
                                idx === 0 ? 'bg-yellow-450 text-white' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {idx + 1}
                              </span>
                              <div className="w-7 h-7 rounded-lg bg-slate-100 border flex items-center justify-center font-black text-slate-600 text-[10px] shrink-0 uppercase">
                                {user.avatarLetter}
                              </div>
                              <div>
                                <h5 className={`font-black text-xs ${isDemola ? 'text-primary' : 'text-slate-800'}`}>
                                  {user.name} {isDemola && '(YOU)'}
                                </h5>
                                <span className="text-[9px] text-slate-400 uppercase tracking-tight">{user.role}</span>
                              </div>
                            </div>
                            <span className="font-mono font-extrabold text-slate-650 shrink-0 font-bold text-xs">{user.points} XP</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
