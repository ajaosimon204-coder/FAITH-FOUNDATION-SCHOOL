import React, { useState, useEffect } from 'react';
import { sendNotification } from '../../../lib/notifications';
import { useAuth } from '../../../contexts/AuthContext';
import { syncFetchStudents, syncFetchReportCardsMap, syncSaveReportCardsMap, logSystemActivity, syncSaveStudents } from '../../../lib/sync';
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
  ShieldCheck,
  Edit,
  Users,
  Search,
  BookOpenCheck
} from 'lucide-react';
import ImageUploader from '../../../components/ImageUploader';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function AcademicManager({ initialWorkspace }: { initialWorkspace?: string }) {
  const { profile } = useAuth();
  const [activeWorkspace, setActiveWorkspace] = useState<string>(initialWorkspace || 'report');
  const [successMsg, setSuccessMsg] = useState('');

  // Re-usable university audit and activity log tracker
  const logAudit = (action: string, details: string) => {
    try {
      const saved = localStorage.getItem('ff_activity_logs');
      const list = saved ? JSON.parse(saved) : [];
      const newLog = {
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        user_email: profile?.email || 'teacher@faithfoundation.edu.ng',
        action,
        details,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('ff_activity_logs', JSON.stringify([newLog, ...list]));
      
      if (profile?.email) {
        logSystemActivity(profile.email, action, details);
      }
    } catch (err) {
      console.warn('Audit logger fallback logs suppressed:', err);
    }
  };

  // Assigned Class Restrictions and Active Student
  const [assignedClass, setAssignedClass] = useState<string>('None');
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([]);
  const [teacherName, setTeacherName] = useState<string>('Academic Tracker');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

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
  const [newNoteFileUrl, setNewNoteFileUrl] = useState('');

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

  // Attendance Modes
  const [attMode, setAttMode] = useState<'individual' | 'class'>('individual');
  const [classAttendanceStates, setClassAttendanceStates] = useState<Record<string, { status: 'early' | 'late' | 'absent' | 'excused'; remark: string }>>({});

  // 4. CBT states
  const [cbtSubject, setCbtSubject] = useState<string>('Mathematics');
  const [cbtClass, setCbtClass] = useState<string>('JSS 1');
  const [cbtQuestions, setCbtQuestions] = useState<Question[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);

  // 5. Awards states
  const [studentAchievements, setStudentAchievements] = useState<any[]>([]);
  const [leaderboardList, setLeaderboardList] = useState<any[]>([]);

  // 6. Subject Exam Record and Student Profile Temp states
  const [subjectExamScores, setSubjectExamScores] = useState<Record<string, { ca1: number; ca2: number; exam: number; remarks: string }>>({});
  
  // Student Profiles temp state (CRUD for posting profiles)
  const [newStuName, setNewStuName] = useState('');
  const [newStuDOB, setNewStuDOB] = useState('2012-04-12');
  const [newStuParentName, setNewStuParentName] = useState('');
  const [newStuParentPhone, setNewStuParentPhone] = useState('');
  const [newStuParentEmail, setNewStuParentEmail] = useState('');
  const [newStuAllergies, setNewStuAllergies] = useState('None');
  const [newStuMedical, setNewStuMedical] = useState('Clean file');
  const [newStuPhoto, setNewStuPhoto] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editStuName, setEditStuName] = useState('');
  const [editStuDOB, setEditStuDOB] = useState('');
  const [editStuParentName, setEditStuParentName] = useState('');
  const [editStuParentPhone, setEditStuParentPhone] = useState('');
  const [editStuParentEmail, setEditStuParentEmail] = useState('');
  const [editStuAllergies, setEditStuAllergies] = useState('');
  const [editStuMedical, setEditStuMedical] = useState('');
  const [editStuPhoto, setEditStuPhoto] = useState('');

  // Helper alias and handlers for continuous assessment & class-wide attendance
  const [classAttendanceValues, setClassAttendanceValues] = [classAttendanceStates, setClassAttendanceStates];

  const handleClassAttendanceChange = (studentId: string, field: 'status' | 'remark', value: any) => {
    setClassAttendanceStates(prev => {
      const existing = prev[studentId] || { status: 'early', remark: '' };
      return {
        ...prev,
        [studentId]: {
          ...existing,
          [field]: value
        }
      };
    });
  };

  const handleScoreChange = (studentId: string, field: 'ca1' | 'ca2' | 'exam' | 'remarks', value: any) => {
    setSubjectExamScores(prev => {
      const existing = prev[studentId] || { ca1: 0, ca2: 0, exam: 0, remarks: 'Good attempt' };
      return {
        ...prev,
        [studentId]: {
          ...existing,
          [field]: value
        }
      };
    });
  };

  // Load everything from LocalStorage/Supabase or seed defaults
  useEffect(() => {
    // 1. Fetch staff roster to locate this logged-in teacher's assignment
    const savedStaff = localStorage.getItem('ff_staff');
    const staffList = savedStaff ? JSON.parse(savedStaff) : [];
    const activeEmail = profile?.email || localStorage.getItem('supabase_user_email') || '';
    let currentAssignedClasses: string[] = [];
    let currentAssignedSubjects: string[] = [];
    
    if (activeEmail) {
      const currentTeacher = staffList.find((s: any) => s.email?.toLowerCase() === activeEmail.toLowerCase());
      if (currentTeacher) {
        setTeacherName(currentTeacher.name || 'Academic Instructor');
        currentAssignedClasses = currentTeacher.assignedClasses || (currentTeacher.assignedClass && currentTeacher.assignedClass !== 'None' ? [currentTeacher.assignedClass] : []);
        currentAssignedSubjects = currentTeacher.assignedSubjects || [];
        setAssignedClasses(currentAssignedClasses);
        setAssignedSubjects(currentAssignedSubjects);
        setAssignedClass(currentAssignedClasses[0] || 'None');
        
        // Auto-configure default subject selections based on assignments
        if (currentAssignedSubjects.length > 0) {
          setNewNoteSubject(currentAssignedSubjects[0]);
          setNewAsgSubject(currentAssignedSubjects[0]);
        }
      }
    }

    // 2. Load all system students
    syncFetchStudents().then(studentList => {
      const matching = studentList.filter((std: any) => {
        if (!currentAssignedClasses || currentAssignedClasses.length === 0) return false;
        return currentAssignedClasses.some(c => std.class?.toLowerCase().trim() === c.toLowerCase().trim());
      });

      setStudents(matching);
      if (matching.length > 0) {
        setSelectedStudent(matching[0]);
      }
    });

    // 3. LMS Lecture Note materials
    const savedLectures = localStorage.getItem('ff_lecture_notes');
    if (savedLectures) {
      setLectures(JSON.parse(savedLectures));
    }

    // 4. LMS assignments
    const savedAssignments = localStorage.getItem('ff_student_assignments');
    if (savedAssignments) {
      setAssignments(JSON.parse(savedAssignments));
    }

    // 5. Attendance logs
    const savedLogs = localStorage.getItem('ff_attendance_student_logs');
    if (savedLogs) {
      setAttendanceLogs(JSON.parse(savedLogs));
    }

    // 6. Excuse requests
    const savedReqs = localStorage.getItem('ff_attendance_student_requests');
    if (savedReqs) {
      setExcuseRequests(JSON.parse(savedReqs));
    }

    // 7. Achievements Setup
    const savedAchivements = localStorage.getItem('ff_student_achievements');
    if (savedAchivements) {
      setStudentAchievements(JSON.parse(savedAchivements));
    }

    // 8. Leaderboard setup
    const savedLeaderboard = localStorage.getItem('ff_student_leaderboard');
    if (savedLeaderboard) {
      setLeaderboardList(JSON.parse(savedLeaderboard));
    }
  }, [profile]);

  // Synchronize Report Card details when active student selection changes
  useEffect(() => {
    if (!selectedStudent) return;

    syncFetchReportCardsMap().then(reportsMap => {
      let studentReport = reportsMap[selectedStudent.id];
      if (!studentReport) {
        const savedReport = localStorage.getItem('ff_student_report_card');
        studentReport = savedReport ? JSON.parse(savedReport) : {
          "1st": { subjects: [], GPA: "0.0", standing: "N/A", teacherRemarks: "", principalRemarks: "", cognitive: {}, affective: {} },
          "2nd": { subjects: [], GPA: "0.0", standing: "N/A", teacherRemarks: "", principalRemarks: "", cognitive: {}, affective: {} },
          "3rd": { subjects: [], GPA: "0.0", standing: "N/A", teacherRemarks: "", principalRemarks: "", cognitive: {}, affective: {} }
        };
      }
      setReportData(studentReport);
    });

    // Synchronize Student-Specific Attendance logs from localStorage
    const studentLogsKey = `ff_attendance_student_logs_${selectedStudent.id}`;
    const studentLogsStr = localStorage.getItem(studentLogsKey);
    if (studentLogsStr) {
      setAttendanceLogs(JSON.parse(studentLogsStr));
    } else {
      const defaultStudentLogs = [
        { date: '2026-06-01', day: 'Monday', status: 'early', timestamp: '07:44 AM', remark: 'Perfect punctuality record' },
        { date: '2026-06-02', day: 'Tuesday', status: 'early', timestamp: '07:38 AM', remark: 'Arrived for Devotions early' },
      ];
      setAttendanceLogs(defaultStudentLogs);
      localStorage.setItem(studentLogsKey, JSON.stringify(defaultStudentLogs));
    }
  }, [selectedStudent]);

  // Load existing subject exam scores when subject or class or student list changes
  useEffect(() => {
    if (students.length === 0) return;
    
    syncFetchReportCardsMap().then(reportsMap => {
      const initialScores: Record<string, { ca1: number; ca2: number; exam: number; remarks: string }> = {};
      students.forEach((std: any) => {
        const studentCard = reportsMap[std.id];
        if (studentCard && studentCard[reportTerm]) {
          const subjectsList = studentCard[reportTerm].subjects || [];
          const existingSubj = subjectsList.find((s: any) => s.subject?.toLowerCase().trim() === cbtSubject.toLowerCase().trim());
          if (existingSubj) {
            initialScores[std.id] = {
              ca1: parseFloat(existingSubj.ca1) || 0,
              ca2: parseFloat(existingSubj.ca2) || 0,
              exam: parseFloat(existingSubj.exam) || parseFloat(existingSubj.test) || 0,
              remarks: existingSubj.remarks || 'Recorded attempt'
            };
          } else {
            initialScores[std.id] = { ca1: 0, ca2: 0, exam: 0, remarks: 'Good attempt' };
          }
        } else {
          initialScores[std.id] = { ca1: 0, ca2: 0, exam: 0, remarks: 'Good attempt' };
        }
      });
      setSubjectExamScores(initialScores);
    });
  }, [students, cbtSubject, reportTerm]);

  // Initialize class attendance choices when students roster or date updates
  useEffect(() => {
    if (students.length === 0) return;
    const initial: Record<string, { status: 'early' | 'late' | 'absent' | 'excused'; remark: string }> = {};
    students.forEach((std: any) => {
      initial[std.id] = { status: 'early', remark: 'Roster validation clearance' };
    });
    setClassAttendanceStates(initial);
  }, [students, attDate]);

  // Sync CBT questions on subject and class select
  useEffect(() => {
    const key = `ff_cbt_${cbtSubject.toLowerCase().replace(/\s+/g, '_')}_${cbtClass.toLowerCase().replace(/\s+/g, '_')}_questions`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setCbtQuestions(JSON.parse(saved));
    } else {
      // Legacy falling back parameters for Mathematics and Physics
      const legacyKey = cbtSubject === 'Mathematics' ? 'ff_cbt_mathematics_questions' : cbtSubject === 'Physics' ? 'ff_cbt_physics_questions' : '';
      if (legacyKey) {
        const savedLegacy = localStorage.getItem(legacyKey);
        if (savedLegacy) {
          setCbtQuestions(JSON.parse(savedLegacy));
          setEditingQuestionId(null);
          return;
        }
      }

      // Generate dynamic mock questions for newly assigned subjects
      const defaults = [
        { id: 1, question: `Which of the following represents the main academic module of study in ${cbtSubject} for class ${cbtClass}?`, options: ['Operational definition unit', 'Standard theoretical derivation', 'Hands-on practical exploration', 'Introductory concepts section'], correctIndex: 3, explanation: `Basic introductory topic coverage for grade cohort of ${cbtClass} corresponding syllabus.` },
        { id: 2, question: `Explain the fundamental concept of standard ${cbtSubject} curricula for ${cbtClass}.`, options: ['Basic definitions unit', 'Advanced application', 'Theoretical formulas derivation', 'None of these choices'], correctIndex: 0, explanation: 'Basic assessment questions templates.' }
      ];
      setCbtQuestions(defaults);
      localStorage.setItem(key, JSON.stringify(defaults));
    }
    setEditingQuestionId(null);
  }, [cbtSubject, cbtClass]);

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
    if (field === 'exam') {
      subjectsCopy[idx].test = parseInt(value, 10) || 0;
    }

    const newReportData = {
      ...reportData,
      [reportTerm]: {
        ...termData,
        subjects: subjectsCopy
      }
    };
    setReportData(newReportData);
  };

  const handleAddSubject = () => {
    if (!reportData) return;
    const termData = { ...reportData[reportTerm] };
    const subjectsCopy = [...termData.subjects];
    
    subjectsCopy.push({
      subject: "NEW SUBJECT",
      ca1: 0,
      ca2: 0,
      exam: 0,
      test: 0,
      total: "0",
      grade: "F9",
      remarks: "Awaiting calculation"
    });

    const newReportData = {
      ...reportData,
      [reportTerm]: {
        ...termData,
        subjects: subjectsCopy
      }
    };
    setReportData(newReportData);
    showSuccessBanner("Added subject entry. Rename the subject and key in the student score!");
  };

  const handleRemoveSubject = (idx: number, subjectName: string) => {
    if (!reportData) return;
    if (!window.confirm(`Are you sure you want to delete "${subjectName}" from this report card?`)) return;

    const termData = { ...reportData[reportTerm] };
    const subjectsCopy = termData.subjects.filter((_: any, i: number) => i !== idx);

    const newReportData = {
      ...reportData,
      [reportTerm]: {
        ...termData,
        subjects: subjectsCopy
      }
    };
    setReportData(newReportData);
    showSuccessBanner(`Deleted "${subjectName}" reference successfully.`);
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

    // Save of this specific student's report card to the global registry
    if (selectedStudent) {
      const savedMapStr = localStorage.getItem('ff_student_report_cards_map');
      const reportsMap = savedMapStr ? JSON.parse(savedMapStr) : {};
      reportsMap[selectedStudent.id] = updatedData;
      syncSaveReportCardsMap(reportsMap);
      
      // Log the action to system audit log
      logAudit('Result Submission', `Compiled, certified, and published ${reportTerm} Term continuous assessment scores and exam grades for student ${selectedStudent.name} (${selectedStudent.id})`);
    }
    
    // Broadcast notifications
    try {
      sendNotification({
        recipientId: selectedStudent?.id || 'demo-student-id-9999',
        title: 'Academic Report Card Published',
        message: `Great news! Your terminal academic report card for the ${reportTerm} Term has been officially compiled, certified, and published.`,
        type: 'assignment',
        link: '/dashboard/results'
      });
    } catch (err) {
      console.warn('Sandbox notification dispatch error', err);
    }

    showSuccessBanner(`Grade Report Card for ${selectedStudent?.name || 'Student'} (${reportTerm} Term) has been compiled, computed, and successfully published.`);
  };


  // --- 2. LMS Material posting logic ---
  const deleteLecture = (id: string) => {
    const target = lectures.find(l => l.id === id);
    const updated = lectures.filter(l => l.id !== id);
    setLectures(updated);
    localStorage.setItem('ff_lecture_notes', JSON.stringify(updated));
    showSuccessBanner('Learning resource successfully redacted from directory.');
    logAudit('Material Delete', `Deleted syllabus learning material titled "${target?.title || id}" for subject: ${target?.subject || 'N/A'}`);
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
      author: newNoteAuthor,
      fileUrl: newNoteFileUrl
    };

    const updated = [newLec, ...lectures];
    setLectures(updated);
    localStorage.setItem('ff_lecture_notes', JSON.stringify(updated));
    setNewNoteTitle('');
    setNewNoteFileUrl('');
    showSuccessBanner('Institutional syllabus lecture note published successfully to learning hub.');
    logAudit('Material Upload', `Uploaded and published classroom learning material "${newNoteTitle}" for Subject: ${newNoteSubject}`);
  };

  const deleteAssignment = (id: string) => {
    const target = assignments.find(a => a.id === id);
    const updated = assignments.filter(a => a.id !== id);
    setAssignments(updated);
    localStorage.setItem('ff_student_assignments', JSON.stringify(updated));
    showSuccessBanner('Assignment folder deleted successfully.');
    logAudit('Assignment Delete', `Reclaimed student assignment folder "${target?.title || id}" for Subject: ${target?.subject || 'N/A'}`);
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
    logAudit('Assignment Creation', `Published new student assignment worksheet "${newAsgTitle}" with Points budget: ${newAsgPoints} for Subject: ${newAsgSubject}`);
  };


  // --- 3. Attendance recording & excuse tracking ---
  const recordAttendanceLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    // Block teachers from updating already-logged dates per structural safety rules
    const isDateAlreadyLogged = attendanceLogs.some(l => l.date === attDate);
    if (isDateAlreadyLogged) {
      alert("Operational Lockout: Daily attendance logs are final. Please request administrative overrides from the Admin Dashboard for editing logged dates.");
      return;
    }

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
    const studentLogsKey = `ff_attendance_student_logs_${selectedStudent.id}`;
    localStorage.setItem(studentLogsKey, JSON.stringify(updated));
    localStorage.setItem('ff_attendance_student_logs', JSON.stringify(updated));
    
    showSuccessBanner(`Attendance ledger update recorded for student ${selectedStudent.name} on date ${attDate}.`);
    logAudit('Attendance Submission', `Recorded classroom attendance register status [${attStatus.toUpperCase()}] for Student: ${selectedStudent.name}, Date: ${attDate}`);
  };

  const handleSaveClassAttendance = () => {
    try {
      students.forEach((std: any) => {
        const studentState = classAttendanceStates[std.id] || { status: 'early', remark: 'Roster validation clearance' };
        const isLate = studentState.status === 'late';
        const finalTime = isLate ? '08:15 AM' : studentState.status === 'early' ? '07:35 AM' : '--';

        const newLog = {
          date: attDate,
          day: new Date(attDate).toLocaleDateString('en-US', { weekday: 'long' }),
          status: studentState.status,
          timestamp: finalTime,
          remark: studentState.remark || 'Marked by Class Instructor'
        };

        const logsKey = `ff_attendance_student_logs_${std.id}`;
        const savedStr = localStorage.getItem(logsKey);
        const savedLogs = savedStr ? JSON.parse(savedStr) : [];
        const filtered = savedLogs.filter((l: any) => l.date !== attDate);
        const updated = [newLog, ...filtered];

        localStorage.setItem(logsKey, JSON.stringify(updated));

        if (selectedStudent && std.id === selectedStudent.id) {
          setAttendanceLogs(updated);
        }

        // Send warning alert notification if student is absent
        if (studentState.status === 'absent') {
          sendNotification({
            recipientId: std.id,
            title: 'Attendance Absence Warning',
            message: `Absence Alert: ${std.name} has been marked ABSENT for ${attDate}. Please notify emergency contacts.`,
            type: 'attendance'
          }).catch(err => console.error("Notification failed", err));
        }
      });

      // Set general log backup
      const activeState = classAttendanceStates[selectedStudent?.id || ''] || { status: attStatus, remark: attRemark };
      const fallbackLog = {
        date: attDate,
        day: new Date(attDate).toLocaleDateString('en-US', { weekday: 'long' }),
        status: activeState.status,
        timestamp: activeState.status === 'late' ? '08:15 AM' : activeState.status === 'early' ? '07:35 AM' : '--',
        remark: activeState.remark || attRemark
      };
      const generalFiltered = attendanceLogs.filter(l => l.date !== attDate);
      localStorage.setItem('ff_attendance_student_logs', JSON.stringify([fallbackLog, ...generalFiltered]));

      showSuccessBanner(`Successfully logged class attendance register for all ${students.length} students on ${attDate}.`);
      logAudit('Class Attendance Committed', `Recorded class attendance roster with absolute compliance auditing for ${students.length} students.`);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Student Profiles CRUD (Posting Profiles of students in assigned class) ---
  const handlePostStudentProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStuName.trim()) return;

    try {
      const newId = `STD-2026-${Math.floor(100 + Math.random() * 900)}`;
      const fresh = {
        id: newId,
        name: newStuName,
        class: assignedClass !== 'None' ? assignedClass : 'JSS 1',
        status: 'Enrolled' as const,
        fees: 'Cleared' as const,
        parentName: newStuParentName || 'Guardian',
        parentPhone: newStuParentPhone || 'N/A',
        parentEmail: newStuParentEmail || 'N/A',
        dob: newStuDOB,
        medicalInfo: newStuMedical,
        allergies: newStuAllergies,
        photoUrl: newStuPhoto,
        academicHistory: [],
        communicationLogs: []
      };

      // Load all students, add fresh, save
      const allStudents = await syncFetchStudents();
      const updatedList = [fresh, ...allStudents];
      await syncSaveStudents(updatedList);

      // Reload matching students for the teacher's active view
      const matching = updatedList.filter((std: any) => {
        if (!assignedClasses || assignedClasses.length === 0) return false;
        return assignedClasses.some(c => std.class?.toLowerCase().trim() === c.toLowerCase().trim());
      });
      setStudents(matching);
      setSelectedStudent(fresh);

      showSuccessBanner(`Enrolled student profile successfully created: ${newStuName} (${newId})`);
      logAudit('Student Enrollment', `Posted a new student file profile for ${newStuName} in class ${assignedClass}`);

      // Clear fields
      setNewStuName('');
      setNewStuParentName('');
      setNewStuParentPhone('');
      setNewStuParentEmail('');
      setNewStuPhoto('');
      setIsAddingStudent(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStudentProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentId) return;

    try {
      const allStudents = await syncFetchStudents();
      const updatedList = allStudents.map((std: any) => {
        if (std.id === editingStudentId) {
          return {
            ...std,
            name: editStuName,
            dob: editStuDOB,
            parentName: editStuParentName,
            parentPhone: editStuParentPhone,
            parentEmail: editStuParentEmail,
            allergies: editStuAllergies,
            medicalInfo: editStuMedical,
            photoUrl: editStuPhoto
          };
        }
        return std;
      });

      await syncSaveStudents(updatedList);

      // Update matching local list
      const matching = updatedList.filter((std: any) => {
        if (!assignedClasses || assignedClasses.length === 0) return false;
        return assignedClasses.some(c => std.class?.toLowerCase().trim() === c.toLowerCase().trim());
      });
      setStudents(matching);
      const updatedSelected = matching.find(s => s.id === editingStudentId);
      if (updatedSelected) {
        setSelectedStudent(updatedSelected);
      }

      showSuccessBanner(`Successfully updated student profile for ${editStuName}`);
      logAudit('Student Profile Updated', `Teacher updated files and biodata parameters for ${editStuName}`);
      setEditingStudentId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Subject Exam Recording & Batch entry synchronizer ---
  const saveSubjectExamRecords = async () => {
    try {
      const reportsMap = await syncFetchReportCardsMap();
      const updatedMap = { ...reportsMap };

      for (const std of students) {
        let studentCard = updatedMap[std.id];
        if (!studentCard) {
          studentCard = {
            "1st": { subjects: [], GPA: "0.0", standing: "N/A", teacherRemarks: "Satisfactory", principalRemarks: "Good", cognitive: {}, affective: {} },
            "2nd": { subjects: [], GPA: "0.0", standing: "N/A", teacherRemarks: "Satisfactory", principalRemarks: "Good", cognitive: {}, affective: {} },
            "3rd": { subjects: [], GPA: "0.0", standing: "N/A", teacherRemarks: "Satisfactory", principalRemarks: "Good", cognitive: {}, affective: {} }
          };
        }

        const termData = studentCard[reportTerm] || { subjects: [], GPA: "0.0", standing: "N/A", teacherRemarks: "", principalRemarks: "", cognitive: {}, affective: {} };
        const subjectsList = [...(termData.subjects || [])];

        const scoreObj = subjectExamScores[std.id] || { ca1: 0, ca2: 0, exam: 0, remarks: 'Good attempt' };
        const total = scoreObj.ca1 + scoreObj.ca2 + scoreObj.exam;
        
        let gradeLetter = 'F9';
        let remark = 'Fail';
        if (total >= 85) { gradeLetter = 'A1'; remark = 'Excellent'; }
        else if (total >= 75) { gradeLetter = 'B2'; remark = 'Very Good'; }
        else if (total >= 65) { gradeLetter = 'B3'; remark = 'Good'; }
        else if (total >= 55) { gradeLetter = 'C4'; remark = 'Credit'; }
        else if (total >= 50) { gradeLetter = 'C5'; remark = 'Credit'; }
        else if (total >= 45) { gradeLetter = 'C6'; remark = 'Credit'; }
        else if (total >= 40) { gradeLetter = 'D7'; remark = 'Pass'; }
        else if (total >= 35) { gradeLetter = 'E8'; remark = 'Pass'; }

        const updatedSubjectEntry = {
          subject: cbtSubject, // using cbtSubject which represents active selected subject
          ca1: String(scoreObj.ca1),
          ca2: String(scoreObj.ca2),
          exam: String(scoreObj.exam),
          test: String(scoreObj.exam),
          total: String(total),
          grade: gradeLetter,
          remarks: scoreObj.remarks || remark
        };

        const existingIdx = subjectsList.findIndex((s: any) => s.subject?.toLowerCase().trim() === cbtSubject.toLowerCase().trim());
        if (existingIdx !== -1) {
          subjectsList[existingIdx] = updatedSubjectEntry;
        } else {
          subjectsList.push(updatedSubjectEntry);
        }

        // Recalculate average and total scores for the report card
        let sumTotal = 0;
        subjectsList.forEach((s: any) => {
          sumTotal += parseFloat(s.total) || 0;
        });
        const average = subjectsList.length > 0 ? (sumTotal / subjectsList.length).toFixed(1) : "0";
        
        termData.subjects = subjectsList;
        termData.summary = {
          totalScore: sumTotal.toString(),
          average: average,
          classPosition: termData.summary?.classPosition || "1st of 24",
          attendance: termData.summary?.attendance || "91/96 Days",
          principalComment: parseFloat(average) >= 75 ? "Excellent academic showcase. Outstanding study track." : parseFloat(average) >= 50 ? "Passable aggregate result. Encouraged to study more." : "Academic warning. Urgent help needed."
        };
        termData.GPA = (parseFloat(average) / 20).toFixed(2);
        termData.standing = parseFloat(average) >= 75 ? 'First Class Honor' : parseFloat(average) >= 60 ? 'Second Class Upper' : 'Third Class Pass';

        studentCard[reportTerm] = termData;
        updatedMap[std.id] = studentCard;
      }

      await syncSaveReportCardsMap(updatedMap);
      
      // If the currently selected student is one of the updated, refresh reportData state
      if (selectedStudent && updatedMap[selectedStudent.id]) {
        setReportData(updatedMap[selectedStudent.id]);
        localStorage.setItem('ff_student_report_card', JSON.stringify(updatedMap[selectedStudent.id]));
      }

      // Trigger user release banner notice
      students.forEach(std => {
        sendNotification({
          recipientId: std.id,
          title: 'Exam Results Released',
          message: `Continuous Assessment & Exam results released for subject ${cbtSubject}!`,
          type: 'grade'
        }).catch(err => console.error("Error sending grade notification:", err));
      });

      showSuccessBanner(`Exam records for ${cbtSubject} in class ${assignedClass} saved & synchronized successfully!`);
      logAudit('Subject Exam Recording', `Recorded and synchronized exam scores for ${students.length} class students in ${cbtSubject}, Grade: ${assignedClass}`);
    } catch (err) {
      console.error(err);
    }
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
      
      const studentLogsKey = `ff_attendance_student_logs_${selectedStudent?.id || ''}`;
      localStorage.setItem(studentLogsKey, JSON.stringify(updatedLogs));
      localStorage.setItem('ff_attendance_student_logs', JSON.stringify(updatedLogs));
    }

    showSuccessBanner(`Excuse duty request ticket [${id}] has been statefully ${action}.`);
    logAudit('Student Record Modification', `Modified student attendance excuse status to [${action.toUpperCase()}] for Request Ticket Reference ID: ${id}`);
  };


  // --- 4. CBT Exam Questions posting and editing ---
  const saveCbtExamPool = () => {
    const key = `ff_cbt_${cbtSubject.toLowerCase().replace(/\s+/g, '_')}_${cbtClass.toLowerCase().replace(/\s+/g, '_')}_questions`;
    localStorage.setItem(key, JSON.stringify(cbtQuestions));
    setEditingQuestionId(null);
    showSuccessBanner(`Automated ${cbtSubject} CBT diagnostic examination questions pool for ${cbtClass} has been updated.`);
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
    const studentName = selectedStudent?.name || 'Ajao Demola Simon';
    const updatedLeaderboard = leaderboardList.map(item => {
      if (item.name === studentName) {
        return { ...item, points: pts };
      }
      return item;
    });

    setLeaderboardList(updatedLeaderboard);
    localStorage.setItem('ff_student_leaderboard', JSON.stringify(updatedLeaderboard));
  };


  // Filter students based on assigned class format safely
  const classFilteredStudents = students.filter(std => {
    if (!assignedClass || assignedClass === 'None') return true;
    return std.class?.toLowerCase().trim() === assignedClass.toLowerCase().trim();
  });

  return (
    <div className="bg-white border border-slate-205 shadow-md rounded-[32px] overflow-hidden">
      
      {/* Banner Intro */}
      <div className="bg-slate-900 px-8 py-7 text-white flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest leading-none">
            <UserCheck size={14} /> Teacher Portal Access (Instructor: {teacherName})
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight font-display">Central Academic Curriculum Console</h2>
          <p className="text-[11px] text-slate-400">Class master and subject instructor controls for publishing grades, materials, schedules, and exams.</p>
        </div>
        <div className="text-[10px] bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 font-mono text-slate-300 font-bold uppercase">
          Class Assignee: {assignedClass === 'None' ? 'All Classes' : assignedClass}
        </div>
      </div>

      {/* Class & Student Control Board */}
      <div className="bg-slate-100 border-b border-slate-200 px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
            <ShieldCheck size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Active Instructor Context</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase">
              Mentor Target: <span className="text-primary font-black bg-primary/5 px-2 py-0.5 rounded">{assignedClass === 'None' ? 'All Classes (Admin Mode)' : assignedClass}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Active Student Portfolio:</span>
          {classFilteredStudents.length === 0 ? (
            <span className="text-xs text-rose-500 font-black uppercase">No enrolled students in class</span>
          ) : (
            <select
              value={selectedStudent?.id || ''}
              onChange={(e) => {
                const selected = students.find(s => s.id === e.target.value);
                if (selected) {
                  setSelectedStudent(selected);
                  // Sync ff_student_report_card with selected student report card
                  const savedMapStr = localStorage.getItem('ff_student_report_cards_map');
                  const reportsMap = savedMapStr ? JSON.parse(savedMapStr) : {};
                  const studentReport = reportsMap[selected.id];
                  if (studentReport) {
                    localStorage.setItem('ff_student_report_card', JSON.stringify(studentReport));
                  }
                }
              }}
              className="bg-white border-2 border-slate-205 text-slate-700 font-black text-xs uppercase px-4 py-2 rounded-xl focus:border-primary focus:outline-none cursor-pointer tracking-wider shadow-sm"
            >
              {classFilteredStudents.map((std: any) => (
                <option key={std.id} value={std.id}>
                  {std.name} ({std.id} - {std.class})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tabs list with counting highlights */}
      <div className="flex flex-wrap bg-slate-50 border-b border-slate-200 p-2 gap-1 text-xs">
        {[
          { key: 'report', label: 'Class Report Cards', count: null, icon: FileText },
          { key: 'subject-exam', label: 'Subject Exam Marks', count: null, icon: BookOpenCheck },
          { key: 'class-students', label: 'My Students Biodata', count: students.length || null, icon: Users },
          { key: 'lms', label: 'Syllabi & LMS Notes', count: lectures.length + assignments.length, icon: BookOpen },
          { key: 'attendance', label: 'Attendance Register', count: excuseRequests.filter(r => r.status === 'pending').length || null, icon: Clock },
          { key: 'cbt', label: 'CBT Question Pools', count: null, icon: Tv },
          { key: 'awards', label: 'Awards Desk', count: studentAchievements.filter(a => a.unlocked).length || null, icon: Award }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeWorkspace === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveWorkspace(tab.key)}
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
        
        {/* ================= MY STUDENTS BIODATA PORTAL / CRUD ================= */}
        {activeWorkspace === 'class-students' && (
          <div className="space-y-6 text-xs">
            
            {/* Header banner */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-primary" /> Class Roster & Student Biodata Master Desk
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Browse, review, edit, and enrol new student records for your assigned cohort class (<strong>{assignedClass === 'None' ? 'All Classes' : assignedClass}</strong>).
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingStudentId(null);
                  setIsAddingStudent(!isAddingStudent);
                }}
                className="bg-primary text-white font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer text-[10px]"
              >
                {isAddingStudent ? <X size={12} /> : <Plus size={12} />} 
                {isAddingStudent ? 'Close Form' : 'Enrol New Student Profile'}
              </button>
            </div>

            {/* Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Student Roster Cards List (4 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white border rounded-3xl p-5 space-y-4">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest block border-b pb-2">Academic Cohort Directory</span>
                  
                  {students.length === 0 ? (
                    <div className="p-6 text-center text-slate-450 italic bg-slate-50 rounded-2xl border border-dashed border-slate-205">
                      No active students found assigned to this classroom tier. Enrol an academic file to start.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {students.map((std: any) => {
                        const isSelected = selectedStudent?.id === std.id;
                        return (
                          <div
                            key={std.id}
                            onClick={() => {
                              setSelectedStudent(std);
                              setIsAddingStudent(false);
                              setEditingStudentId(null);
                            }}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center gap-3 ${
                              isSelected 
                                ? 'bg-primary/5 border-primary shadow-sm' 
                                : 'bg-slate-50 hover:bg-slate-100/85 border-slate-150'
                            }`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-9 h-9 rounded-xl bg-white border flex items-center justify-center font-black text-slate-650 shrink-0 text-xs shadow-sm uppercase font-mono overflow-hidden">
                                {std.photoUrl ? (
                                  <img src={std.photoUrl} alt="student" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  std.name.slice(0, 2)
                                )}
                              </div>
                              <div className="overflow-hidden">
                                <h5 className="font-extrabold text-slate-850 truncate text-[11px]">{std.name}</h5>
                                <p className="text-[9px] text-slate-500 uppercase tracking-tight font-mono">{std.id} &middot; {std.class}</p>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent(std);
                                setIsAddingStudent(false);
                                setEditingStudentId(std.id);
                                setEditStuName(std.name);
                                setEditStuDOB(std.dob || '2012-04-12');
                                setEditStuParentName(std.parentName || 'Guardian');
                                setEditStuParentPhone(std.parentPhone || '');
                                setEditStuParentEmail(std.parentEmail || '');
                                setEditStuAllergies(std.allergies || 'None');
                                setEditStuMedical(std.medicalInfo || 'Clean record');
                                setEditStuPhoto(std.photoUrl || '');
                              }}
                              className="text-[10px] bg-white border px-2.5 py-1.5 rounded-lg hover:bg-slate-50 font-bold uppercase text-slate-600 transition-colors cursor-pointer shrink-0"
                            >
                              Edit Profile
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Profile Detailed Dossier, Add profile form, or edit profile form (7 cols) */}
              <div className="lg:col-span-7">
                
                {/* 1. Add Student Form */}
                {isAddingStudent && (
                  <form onSubmit={handlePostStudentProfile} className="bg-slate-50/70 p-6 rounded-3xl border space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b pb-2 flex items-center gap-1.5">
                      <Plus size={14} className="text-primary" /> Enrol New Student Profile File
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Full Legal Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Surname First, Other Names"
                          value={newStuName}
                          onChange={(e) => setNewStuName(e.target.value)}
                          className="w-full bg-white border p-3 rounded-xl outline-none font-extrabold text-slate-800 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Date of Birth (DOB)</label>
                        <input
                          type="date"
                          value={newStuDOB}
                          onChange={(e) => setNewStuDOB(e.target.value)}
                          className="w-full bg-white border p-3 rounded-xl outline-none font-bold text-slate-800 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Assigned Roster Class</label>
                        <select
                          value={assignedClass !== 'None' ? assignedClass : 'JSS 1'}
                          onChange={(e) => setAssignedClass(e.target.value)}
                          className="w-full bg-white border p-3 rounded-xl outline-none font-bold text-slate-800 focus:border-primary"
                        >
                          {(assignedClasses.length > 0 ? assignedClasses : ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3']).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Parent/Guardian Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Kolawole Simon"
                          value={newStuParentName}
                          onChange={(e) => setNewStuParentName(e.target.value)}
                          className="w-full bg-white border p-3 rounded-xl outline-none font-bold text-slate-800 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Parent Contact Phone</label>
                        <input
                          type="text"
                          placeholder="+234..."
                          value={newStuParentPhone}
                          onChange={(e) => setNewStuParentPhone(e.target.value)}
                          className="w-full bg-white border p-3 rounded-xl outline-none font-mono font-bold text-slate-800 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Parent Contact Email (Sync Access)</label>
                        <input
                          type="email"
                          placeholder="parent@example.com"
                          value={newStuParentEmail}
                          onChange={(e) => setNewStuParentEmail(e.target.value)}
                          className="w-full bg-white border p-3 rounded-xl outline-none font-mono font-bold text-slate-800 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Food Allergies / Dietary</label>
                        <input
                          type="text"
                          placeholder="e.g. Groundnuts, None"
                          value={newStuAllergies}
                          onChange={(e) => setNewStuAllergies(e.target.value)}
                          className="w-full bg-white border p-3 rounded-xl outline-none font-bold text-slate-800 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Medical Records File Memo</label>
                        <input
                          type="text"
                          placeholder="e.g. Blood Group AA, Asthmatic"
                          value={newStuMedical}
                          onChange={(e) => setNewStuMedical(e.target.value)}
                          className="w-full bg-white border p-3 rounded-xl outline-none font-bold text-slate-800 focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Student Profile Portrait Photo (Direct Upload or Link)</label>
                      <ImageUploader 
                        onUpload={(url) => setNewStuPhoto(url)} 
                        currentUrl={newStuPhoto} 
                        label="Upload Student Photo"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <button
                        type="button"
                        onClick={() => setIsAddingStudent(false)}
                        className="px-4 py-2 bg-white border rounded-xl font-bold uppercase cursor-pointer hover:bg-slate-50 text-slate-650"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-primary text-white font-black uppercase tracking-wider rounded-xl cursor-pointer hover:bg-opacity-95 shadow-md flex items-center gap-1"
                      >
                        <Save size={12} /> Post Student Profile File
                      </button>
                    </div>
                  </form>
                )}

                {/* 2. Edit Student Form */}
                {editingStudentId && (
                  <form onSubmit={handleUpdateStudentProfile} className="bg-slate-50/70 p-6 rounded-3xl border space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b pb-2 flex items-center gap-1.5">
                      <Edit size={14} className="text-primary" /> Modify Student File Properties
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Full Legal Name</label>
                        <input
                          type="text"
                          required
                          value={editStuName}
                          onChange={(e) => setEditStuName(e.target.value)}
                          className="w-full bg-white border p-3 rounded-xl outline-none font-extrabold text-slate-800 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Date of Birth (DOB)</label>
                        <input
                          type="date"
                          value={editStuDOB}
                          onChange={(e) => setEditStuDOB(e.target.value)}
                          className="w-full bg-white border p-3 rounded-xl outline-none font-bold text-slate-800 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Parent/Guardian Name</label>
                        <input
                          type="text"
                          value={editStuParentName}
                          onChange={(e) => setEditStuParentName(e.target.value)}
                          className="w-full bg-white border p-3 rounded-xl outline-none font-bold text-slate-800 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Parent Contact Phone</label>
                        <input
                          type="text"
                          value={editStuParentPhone}
                          onChange={(e) => setEditStuParentPhone(e.target.value)}
                          className="w-full bg-white border p-3 rounded-xl outline-none font-mono font-bold text-slate-800 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Parent Contact Email</label>
                        <input
                          type="email"
                          value={editStuParentEmail}
                          onChange={(e) => setEditStuParentEmail(e.target.value)}
                          className="w-full bg-white border p-3 rounded-xl outline-none font-mono font-bold text-slate-800 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Food Allergies / Dietary</label>
                        <input
                          type="text"
                          value={editStuAllergies}
                          onChange={(e) => setEditStuAllergies(e.target.value)}
                          className="w-full bg-white border p-3 rounded-xl outline-none font-bold text-slate-800 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Medical Records File Memo</label>
                        <input
                          type="text"
                          value={editStuMedical}
                          onChange={(e) => setEditStuMedical(e.target.value)}
                          className="w-full bg-white border p-3 rounded-xl outline-none font-bold text-slate-800 focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Student Profile Portrait Photo (Direct Upload or Link)</label>
                      <ImageUploader 
                        onUpload={(url) => setEditStuPhoto(url)} 
                        currentUrl={editStuPhoto} 
                        label="Modify Student Photo"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <button
                        type="button"
                        onClick={() => setEditingStudentId(null)}
                        className="px-4 py-2 bg-white border rounded-xl font-bold uppercase cursor-pointer hover:bg-slate-50 text-slate-650"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-primary text-white font-black uppercase tracking-wider rounded-xl cursor-pointer hover:bg-opacity-95 shadow-md flex items-center gap-1"
                      >
                        <Save size={12} /> Save Changes
                      </button>
                    </div>
                  </form>
                )}

                {/* 3. Review Student Profile Detail Card */}
                {!isAddingStudent && !editingStudentId && selectedStudent && (
                  <div className="bg-white border rounded-3xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center gap-4 pb-4 border-b">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 border flex items-center justify-center font-mono font-black text-slate-800 text-lg uppercase shadow-inner overflow-hidden shrink-0">
                        {selectedStudent.photoUrl ? (
                          <img src={selectedStudent.photoUrl} alt="portrait" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          selectedStudent.name.slice(0, 2)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black uppercase text-slate-805 tracking-tight">{selectedStudent.name}</h4>
                          <span className="text-[8px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full uppercase tracking-widest leading-none">ACTIVE STUDENT</span>
                        </div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 font-mono">Registry ID: {selectedStudent.id} &middot; Class Grade: {selectedStudent.class || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Meta Fields and Parental Records */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
                      
                      <div className="space-y-4">
                        <div>
                          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">Date of Birth (DOB)</span>
                          <p className="font-extrabold text-slate-800">{selectedStudent.dob || 'April 12, 2012 (Age 14)'}</p>
                        </div>
                        
                        <div>
                          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">Parent/Guardian Identity</span>
                          <p className="font-extrabold text-slate-800">{selectedStudent.parentName || 'Guardian'}</p>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">Parent Contact Coordinates</span>
                          <p className="font-extrabold text-slate-800 font-mono">{selectedStudent.parentPhone || 'No contact coordinates provided'}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{selectedStudent.parentEmail || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="space-y-4 border-l pl-0 md:pl-6">
                        <div>
                          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">Food Allergies / Dietary Status</span>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider inline-block ${
                            selectedStudent.allergies && selectedStudent.allergies !== 'None' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            ⚠️ {selectedStudent.allergies || 'None'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">Clinics & Medical Clearance Profile</span>
                          <div className="bg-slate-50 p-3 rounded-xl border">
                            <p className="font-bold text-slate-700">{selectedStudent.medicalInfo || 'AA, No medical concerns registered.'}</p>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1 font-mono">Academic Status</span>
                          <p className="text-[10px] font-extrabold uppercase text-emerald-600">✓ Enrolled & Clearances Approved</p>
                        </div>
                      </div>

                    </div>

                    {/* Profile release notice */}
                    <p className="text-[9px] text-slate-400 italic text-center pt-2 border-t font-mono">
                      All structural changes apply across the educational portal in real time.
                    </p>
                  </div>
                )}

                {/* If no student selected */}
                {!selectedStudent && !isAddingStudent && (
                  <div className="p-12 text-center bg-slate-50 border rounded-3xl border-dashed border-slate-200">
                    <p className="text-slate-400 italic uppercase tracking-widest font-bold">Select a student from the active directory roster to review files.</p>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* ================= SUBJECT EXAM GRADES MASTER ENTRY ================= */}
        {activeWorkspace === 'subject-exam' && (
          <div className="space-y-6 text-xs">
            
            {/* Header control box */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  <BookOpenCheck size={14} className="text-primary" /> Continuous Assessment & Exam Spreadsheet Desk
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                  Perform rapid batch records entry. Input Continuous Assessment 1 (15m), CA 2 (15m), and Terminal Examination score (70m) below. These reflect instantly on student lockers.
                </p>
              </div>

              {/* Filters setup */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-450 block font-mono">Select Active Subject</span>
                  <select
                    value={cbtSubject}
                    onChange={(e) => setCbtSubject(e.target.value)}
                    className="bg-white border text-xs px-3.5 py-2 rounded-xl outline-none font-black text-slate-800 focus:border-primary shadow-sm"
                  >
                    {(assignedSubjects.length > 0 ? assignedSubjects : ['Mathematics', 'Physics', 'English Language', 'Civic Education', 'Chemistry']).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-455 block font-mono">Active Term Select</span>
                  <div className="flex bg-white p-1 rounded-xl border shadow-sm">
                    {(['1st', '2nd', '3rd'] as const).map(termKey => {
                      const isActive = reportTerm === termKey;
                      return (
                        <button
                          key={termKey}
                          onClick={() => setReportTerm(termKey)}
                          className={`px-3 py-1.5 font-mono font-black text-[10px] rounded-lg transition-all border cursor-pointer uppercase ${
                            isActive 
                              ? 'bg-primary text-white border-primary shadow-none' 
                              : 'bg-white text-slate-600 hover:bg-slate-50 border-transparent shadow-none'
                          }`}
                        >
                          {termKey}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Scores Ledger Grid */}
            <div className="bg-white border rounded-[32px] p-6 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Cohort Scores Spreadsheet Ledger ({students.length} Members)</span>
                <span className="text-[10px] bg-amber-50 rounded px-2 py-0.5 border border-amber-200 uppercase font-mono font-black text-amber-700 italic">Continuous Assessment Validation Active: Maximum 100%</span>
              </div>

              {students.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border-dashed border">
                  No cohort students found. Register your students directory first to run batch scores analysis.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b text-[9px] uppercase font-bold text-slate-400 tracking-widest bg-slate-50/60 font-mono">
                        <th className="p-3">Student File Profile</th>
                        <th className="p-3 text-center w-24">CA 1 (Max 15)</th>
                        <th className="p-3 text-center w-24">CA 2 (Max 15)</th>
                        <th className="p-3 text-center w-24">Exam (Max 70)</th>
                        <th className="p-3 text-center w-24">Aggregate Total</th>
                        <th className="p-3 text-center w-20">Grade Log</th>
                        <th className="p-3">Specific Performance Comments / Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {students.map((std: any) => {
                        const scoreObj = subjectExamScores[std.id] || { ca1: 0, ca2: 0, exam: 0, remarks: 'Good attempt' };
                        const total = (parseFloat(String(scoreObj.ca1)) || 0) + (parseFloat(String(scoreObj.ca2)) || 0) + (parseFloat(String(scoreObj.exam)) || 0);
                        
                        let grade = 'F9';
                        let gradeColor = 'bg-rose-50 text-rose-600 border-rose-200';
                        if (total >= 85) { grade = 'A1'; gradeColor = 'bg-emerald-50 text-emerald-600 border-emerald-300'; }
                        else if (total >= 75) { grade = 'B2'; gradeColor = 'bg-emerald-50/70 text-emerald-600 border-emerald-250'; }
                        else if (total >= 65) { grade = 'B3'; gradeColor = 'bg-indigo-50 text-indigo-600 border-indigo-200'; }
                        else if (total >= 55) { grade = 'C4'; gradeColor = 'bg-blue-50 text-blue-600 border-blue-200'; }
                        else if (total >= 50) { grade = 'C5'; gradeColor = 'bg-blue-50/80 text-blue-500 border-blue-150'; }
                        else if (total >= 45) { grade = 'C6'; gradeColor = 'bg-amber-50 text-amber-600 border-amber-200'; }
                        else if (total >= 40) { grade = 'D7'; gradeColor = 'bg-amber-50/70 text-amber-500 border-amber-200'; }
                        else if (total >= 35) { grade = 'E8'; gradeColor = 'bg-amber-50/60 text-amber-500 border-amber-150'; }

                        return (
                          <tr key={std.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-slate-50 border flex items-center justify-center font-black text-slate-650 text-[10px] shrink-0 overflow-hidden font-mono uppercase shadow-sm">
                                  {std.photoUrl ? (
                                    <img src={std.photoUrl} alt="student" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    std.name.slice(0, 2)
                                  )}
                                </div>
                                <div>
                                  <h6 className="font-extrabold text-slate-800 text-[11px]">{std.name}</h6>
                                  <p className="text-[9px] text-slate-450 uppercase tracking-tighter font-mono">{std.id}</p>
                                </div>
                              </div>
                            </td>

                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="15"
                                value={scoreObj.ca1}
                                onChange={(e) => {
                                  let val = parseFloat(e.target.value) || 0;
                                  if (val > 15) val = 15;
                                  if (val < 0) val = 0;
                                  handleScoreChange(std.id, 'ca1', val);
                                }}
                                className="w-16 border rounded-lg p-2 font-mono text-center font-extrabold text-slate-800 bg-slate-50 focus:bg-white outline-none focus:border-primary"
                              />
                            </td>

                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="15"
                                value={scoreObj.ca2}
                                onChange={(e) => {
                                  let val = parseFloat(e.target.value) || 0;
                                  if (val > 15) val = 15;
                                  if (val < 0) val = 0;
                                  handleScoreChange(std.id, 'ca2', val);
                                }}
                                className="w-16 border rounded-lg p-2 font-mono text-center font-extrabold text-slate-800 bg-slate-50 focus:bg-white outline-none focus:border-primary"
                              />
                            </td>

                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="70"
                                value={scoreObj.exam}
                                onChange={(e) => {
                                  let val = parseFloat(e.target.value) || 0;
                                  if (val > 70) val = 70;
                                  if (val < 0) val = 0;
                                  handleScoreChange(std.id, 'exam', val);
                                }}
                                className="w-18 border rounded-lg p-2 font-mono text-center font-extrabold text-slate-800 bg-slate-50 focus:bg-white outline-none focus:border-primary"
                              />
                            </td>

                            <td className="p-3 text-center">
                              <span className="font-mono font-black text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded-lg text-xs leading-none">
                                {total}
                              </span>
                            </td>

                            <td className="p-3 text-center">
                              <span className={`px-2 py-1 border text-[10px] font-black rounded-lg leading-none ${gradeColor}`}>
                                {grade}
                              </span>
                            </td>

                            <td className="p-3">
                              <input
                                type="text"
                                placeholder="Specific assessment comments..."
                                value={scoreObj.remarks}
                                onChange={(e) => handleScoreChange(std.id, 'remarks', e.target.value)}
                                className="w-full border rounded-lg p-2 font-bold text-slate-700 bg-slate-50 focus:bg-white outline-none focus:border-slate-400"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Spreadsheets Save Area */}
              {students.length > 0 && (
                <div className="flex justify-between items-center pt-4 border-t flex-wrap gap-4 leading-normal">
                  <p className="text-[10px] text-slate-400 font-bold max-w-md italic">
                    ⚠️ Review Continuous Assessment ranges. Saving compiles collective terminal standing metrics and distributes reports instantly to student terminals.
                  </p>
                  <button
                    onClick={saveSubjectExamRecords}
                    className="bg-primary text-white font-black uppercase tracking-widest px-6 py-3.5 rounded-xl hover:bg-opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save size={14} /> Commit & Release Subjects Marks list
                  </button>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ================= REPORT CARD EDITOR ================= */}
        {activeWorkspace === 'report' && reportData && (
          <div className="space-y-6">
            <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-150 flex justify-between items-center gap-4 flex-wrap">
              <div>
                <h4 className="text-sm font-bold text-slate-800 uppercase">Grades Dossier Compiler: {selectedStudent?.name || 'Ajao Demola Simon'}</h4>
                <p className="text-[11px] text-slate-500">{selectedStudent?.class || 'SS 3'} Terminal assessment logs.</p>
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
            <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-extrabold uppercase">
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4 text-center w-24">CA I (15)</th>
                    <th className="py-3 px-4 text-center w-24">CA II (15)</th>
                    <th className="py-3 px-4 text-center w-24">Exam (70)</th>
                    <th className="py-3 px-4 text-center w-20">Total</th>
                    <th className="py-3 px-4">Specific Remark Comments</th>
                    <th className="py-3 px-4 text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData[reportTerm].subjects.map((sub: any, idx: number) => {
                    const total = (parseInt(sub.ca1, 10) || 0) + (parseInt(sub.ca2, 10) || 0) + (parseInt(sub.exam, 10) || parseInt(sub.test, 10) || 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/20">
                        <td className="py-2 px-3">
                          <input 
                            type="text"
                            value={sub.subject}
                            required
                            onChange={(e) => {
                              if (!reportData) return;
                              const termData = { ...reportData[reportTerm] };
                              const subjectsCopy = [...termData.subjects];
                              subjectsCopy[idx] = {
                                ...subjectsCopy[idx],
                                subject: e.target.value
                              };
                              const newReportData = {
                                ...reportData,
                                [reportTerm]: {
                                  ...termData,
                                  subjects: subjectsCopy
                                }
                              };
                              setReportData(newReportData);
                            }}
                            className="bg-slate-50 border border-slate-150 rounded-xl p-2 w-full font-bold text-slate-800 uppercase focus:bg-white focus:ring-1 focus:ring-primary outline-none focus:border-primary transition-all"
                            placeholder="e.g. Mathematics"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input 
                            type="number"
                            min={0}
                            max={15}
                            value={sub.ca1}
                            onChange={(e) => handleUpdateReportSubject(idx, 'ca1', e.target.value)}
                            className="bg-slate-50 border border-slate-150 rounded-xl p-2 w-16 text-center font-bold text-slate-800 outline-none focus:bg-white focus:border-primary transition-all"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input 
                            type="number"
                            min={0}
                            max={15}
                            value={sub.ca2}
                            onChange={(e) => handleUpdateReportSubject(idx, 'ca2', e.target.value)}
                            className="bg-slate-50 border border-slate-150 rounded-xl p-2 w-16 text-center font-bold text-slate-800 outline-none focus:bg-white focus:border-primary transition-all"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input 
                            type="number"
                            min={0}
                            max={70}
                            value={sub.exam || sub.test || 0}
                            onChange={(e) => handleUpdateReportSubject(idx, 'exam', e.target.value)}
                            className="bg-slate-50 border border-slate-150 rounded-xl p-2 w-20 text-center font-bold text-slate-800 outline-none focus:bg-white focus:border-primary transition-all"
                          />
                        </td>
                        <td className="py-3 px-4 text-center font-black text-primary font-mono">{total}</td>
                        <td className="py-2 px-4">
                          <input 
                            type="text"
                            value={sub.remarks}
                            onChange={(e) => handleUpdateReportSubject(idx, 'remarks', e.target.value)}
                            placeholder="e.g. Splendid performance"
                            className="bg-slate-50 border border-slate-150 rounded-xl p-2 px-3 w-full text-slate-600 italic font-medium outline-none focus:bg-white focus:border-primary transition-all"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(idx, sub.subject)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove Subject"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex justify-between items-center bg-slate-50 p-4 border-t border-slate-200">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                  Total listed subjects: {reportData[reportTerm].subjects.length} entries
                </span>
                <button
                  type="button"
                  onClick={handleAddSubject}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus size={14} /> Add Subject Score Row
                </button>
              </div>
            </div>

            {/* General commentary & signatures */}
            {(() => {
              const isClassMentor = selectedStudent && (
                (assignedClasses && assignedClasses.some((c: string) => c.toLowerCase().trim() === selectedStudent.class?.toLowerCase().trim())) ||
                (assignedClass && assignedClass !== 'None' && assignedClass.toLowerCase().trim() === selectedStudent.class?.toLowerCase().trim())
              );
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-600">
                  <div>
                    <label className="block mb-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-1">
                      Class Teacher's Remark Commentary
                      {!isClassMentor && (
                        <span className="text-[7px] font-extrabold uppercase bg-slate-100 text-slate-400 px-1 py-0.5 rounded">Mentor Only</span>
                      )}
                    </label>
                    <textarea 
                      rows={3}
                      value={reportData[reportTerm].teacherRemarks}
                      disabled={!isClassMentor}
                      onChange={(e) => handleUpdateReportText('teacherRemarks', e.target.value)}
                      placeholder={isClassMentor ? "Enter class teacher review..." : "Review locked. You are not the assigned mentor for this class."}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:bg-white outline-none italic leading-relaxed font-semibold focus:border-primary border-2 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-1">
                      Principal's Evaluation Commentary
                      <span className="text-[7px] font-extrabold uppercase bg-slate-100 text-slate-400 px-1 py-0.5 rounded">Principal Clearance Required</span>
                    </label>
                    <textarea 
                      rows={3}
                      value={reportData[reportTerm].principalRemarks}
                      disabled={true}
                      placeholder="Only administrators with Principal credentials can issue a Master Principal signature evaluation."
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none italic leading-relaxed font-semibold disabled:opacity-50 disabled:bg-slate-150 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              );
            })()}

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
                        className="w-full border rounded-xl p-3 bg-white text-slate-700 font-bold cursor-pointer"
                      >
                        {assignedSubjects && assignedSubjects.length > 0 ? (
                          assignedSubjects.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))
                        ) : (
                          <>
                            <option value="Mathematics">Mathematics</option>
                            <option value="Physics">Physics</option>
                            <option value="Further Mathematics">Further Mathematics</option>
                            <option value="Chemistry">Chemistry</option>
                            <option value="English Language">English Language</option>
                          </>
                        )}
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

                  <div className="bg-white/50 p-3 rounded-2xl border border-slate-100">
                    <ImageUploader 
                      label="Upload Resource File (PDF, MP4 Video, Word Doc, or Image)"
                      currentUrl={newNoteFileUrl}
                      onUpload={(url) => {
                        setNewNoteFileUrl(url);
                        if (url) {
                          const parts = url.split('/');
                          const fileName = parts[parts.length - 1] || '';
                          if (fileName && (!newNoteTitle || newNoteTitle === '')) {
                            const withoutExt = fileName.split('_').slice(1).join('_').split('.')[0] || fileName.split('.')[0];
                            const cleanName = withoutExt.replace(/_/g, ' ');
                            setNewNoteTitle(cleanName);
                          }
                        }
                      }}
                      accept="application/pdf,video/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
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
                  {(() => {
                    const filtered = lectures.filter(lec => assignedSubjects.length === 0 || assignedSubjects.some(subj => subj.toLowerCase().trim() === lec.subject?.toLowerCase().trim()));
                    if (filtered.length === 0) {
                      return <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono italic text-center py-6">No materials in your assigned subjects</p>;
                    }
                    return filtered.map((lec) => (
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
                    ));
                  })()}
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
                        className="w-full border rounded-xl p-3 bg-white text-slate-700 font-bold cursor-pointer"
                      >
                        {assignedSubjects && assignedSubjects.length > 0 ? (
                          assignedSubjects.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))
                        ) : (
                          <>
                            <option value="Mathematics">Mathematics</option>
                            <option value="Physics">Physics</option>
                            <option value="Chemistry">Chemistry</option>
                            <option value="Civic Education">Civic Education</option>
                          </>
                        )}
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
                  {(() => {
                    const filtered = assignments.filter(asg => assignedSubjects.length === 0 || assignedSubjects.some(subj => subj.toLowerCase().trim() === asg.subject?.toLowerCase().trim()));
                    if (filtered.length === 0) {
                      return <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono italic text-center py-6">No assignments in your assigned subjects</p>;
                    }
                    return filtered.map((asg) => (
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
                    ));
                  })()}
                </div>
              </div>

            </div>

          </div>
        )}

                {/* ================= ATTENDANCE & EXCUSES OFFICE ================= */}
        {activeWorkspace === 'attendance' && (
          <div className="space-y-6 text-xs">
            
            {/* Mode selection tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-md border shadow-inner font-bold text-slate-700">
              <button
                onClick={() => setAttMode('individual')}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  attMode === 'individual' 
                    ? 'bg-primary text-white font-bold shadow-md' 
                    : 'text-slate-650 hover:bg-slate-50'
                }`}
              >
                👤 Individual Student Mode
              </button>
              <button
                onClick={() => setAttMode('class')}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  attMode === 'class' 
                    ? 'bg-primary text-white font-bold shadow-md' 
                    : 'text-slate-650 hover:bg-slate-50'
                }`}
              >
                👥 Class-Wide Register Mode ({students.length})
              </button>
            </div>

            {attMode === 'individual' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs animate-in fade-in duration-205">
                
                {/* Left Col: Attendance Ledger Entry */}
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b pb-2 flex items-center justify-between">
                      <span>👤 Custom Student Attendance Logger</span>
                      <span className="text-[9px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase font-mono">{selectedStudent?.id}</span>
                    </h3>
                    
                    {attendanceLogs.some(l => l.date === attDate) && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl font-bold flex flex-col gap-1 items-start leading-relaxed animate-pulse">
                        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-rose-900 font-extrabold">
                          🔒 OPERATIONAL ERROR: LOG TIMELINE COMMITTED
                        </span>
                        <span className="text-[10.5px] font-medium text-rose-700">
                          Attendance for <strong>{selectedStudent?.name}</strong> on <strong>{attDate}</strong> has already been locked. Any further state override requests must be processed by the School Administration from the Admin Dashboard.
                        </span>
                      </div>
                    )}

                    <form onSubmit={recordAttendanceLog} className="space-y-4 font-semibold text-slate-600">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block mb-1 font-bold text-[9px] uppercase text-slate-450">Session Date</label>
                          <input 
                            type="date"
                            required
                            value={attDate}
                            onChange={(e) => setAttDate(e.target.value)}
                            className="w-full border rounded-xl p-3 bg-white text-slate-800 font-bold font-mono"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 font-bold text-[9px] uppercase text-slate-450 font-mono">Arrived Timestamps</label>
                          <input 
                            type="text"
                            required
                            disabled={attendanceLogs.some(l => l.date === attDate)}
                            value={attTime}
                            onChange={(e) => setAttTime(e.target.value)}
                            className="w-full border rounded-xl p-3 bg-white text-slate-800 font-bold disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            const isLocked = attendanceLogs.some(l => l.date === attDate);
                            const styleSel = attStatus === st.key ? st.color : st.inactive;
                            return (
                              <button
                                key={st.key}
                                type="button"
                                disabled={isLocked}
                                onClick={() => setAttStatus(st.key as any)}
                                className={`py-3 border-2 rounded-xl transition-all cursor-pointer ${styleSel} disabled:opacity-50 disabled:cursor-not-allowed`}
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
                          disabled={attendanceLogs.some(l => l.date === attDate)}
                          placeholder="e.g. Verified early morning devotions attendee card"
                          value={attRemark}
                          onChange={(e) => setAttRemark(e.target.value)}
                          className="w-full border p-3 rounded-xl bg-white disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      <button 
                        type="submit"
                        disabled={attendanceLogs.some(l => l.date === attDate)}
                        className="w-full bg-primary text-white py-3.5 rounded-xl font-black uppercase tracking-widest hover:bg-opacity-95 shadow shadow-primary/10 cursor-pointer disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                      >
                        {attendanceLogs.some(l => l.date === attDate) ? "🔒 Daily Submission Locked" : "Commit Attendance Status"}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Attendance Log history */}
                <div className="space-y-6">
                  <div className="border border-slate-150 rounded-2xl p-5 space-y-3 bg-white">
                    <h4 className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider">Attendance Register Timeline</h4>
                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                      {attendanceLogs.map((log, i) => (
                        <div key={i} className="p-3 border rounded-xl flex justify-between items-center gap-4 bg-slate-50/20 text-xs text-slate-655">
                          <div>
                            <div className="flex gap-2 items-center">
                              <span className="font-extrabold text-slate-800">{log.date}</span>
                              <span className="text-[10px] text-slate-400">(Day)</span>
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

              </div>
            ) : (
              <div className="bg-white border rounded-[32px] p-6 space-y-4 shadow-sm animate-in fade-in duration-205">
                <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="font-black text-slate-805 text-xs uppercase tracking-tight">Class-Wide Daily Attendance Register Matrix</h3>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">Toggle compliance statuses for each member of your assigned classroom cohort.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1 text-[9px] font-bold uppercase text-slate-400">
                      <span>Date Logged:</span>
                      <input 
                        type="date"
                        value={attDate}
                        onChange={(e) => setAttDate(e.target.value)}
                        className="border rounded-lg p-2 font-mono font-black text-slate-700 w-32 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {students.length === 0 ? (
                  <div className="p-12 text-center text-slate-450 bg-slate-50 rounded-2xl border-dashed border">
                    No active cohort students discovered. Register class roster to maintain logs.
                  </div>
                ) : (
                  <div className="overflow-x-auto font-bold text-slate-705">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b text-[9px] uppercase font-bold text-slate-400 tracking-widest bg-slate-50/60 font-mono">
                          <th className="p-3">Student File Profile</th>
                          <th className="p-3 text-center">Early Punctual</th>
                          <th className="p-3 text-center font-mono text-amber-500">Late Clock</th>
                          <th className="p-3 text-center font-mono text-rose-500">Absent</th>
                          <th className="p-3 text-center font-mono text-sky-500">Excused Notes</th>
                          <th className="p-3">Specific Attendance Comments & Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-xs">
                        {students.map((std: any) => {
                          const statusVal = classAttendanceValues[std.id]?.status || 'early';
                          const remarkVal = classAttendanceValues[std.id]?.remark || '';
                          return (
                            <tr key={std.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3">
                                <div>
                                  <h6 className="font-extrabold text-slate-850 text-xs">{std.name}</h6>
                                  <p className="text-[9px] text-slate-500 font-mono uppercase">{std.id}</p>
                                </div>
                              </td>

                              <td className="p-3 text-center w-28">
                                <button
                                  type="button"
                                  onClick={() => handleClassAttendanceChange(std.id, 'status', 'early')}
                                  className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    statusVal === 'early' 
                                      ? 'bg-emerald-500 text-white border-emerald-500' 
                                      : 'bg-white text-emerald-650 border-emerald-200 hover:bg-emerald-50'
                                  }`}
                                >
                                  Punctual
                                </button>
                              </td>

                              <td className="p-3 text-center w-28">
                                <button
                                  type="button"
                                  onClick={() => handleClassAttendanceChange(std.id, 'status', 'late')}
                                  className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    statusVal === 'late' 
                                      ? 'bg-amber-500 text-white border-amber-500' 
                                      : 'bg-white text-amber-650 border-amber-200 hover:bg-amber-50'
                                  }`}
                                >
                                  Late
                                </button>
                              </td>

                              <td className="p-3 text-center w-28">
                                <button
                                  type="button"
                                  onClick={() => handleClassAttendanceChange(std.id, 'status', 'absent')}
                                  className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    statusVal === 'absent' 
                                      ? 'bg-rose-500 text-white border-rose-500' 
                                      : 'bg-white text-rose-650 border-rose-200 hover:bg-rose-50'
                                  }`}
                                >
                                  Absent
                                </button>
                              </td>

                              <td className="p-3 text-center w-28">
                                <button
                                  type="button"
                                  onClick={() => handleClassAttendanceChange(std.id, 'status', 'excused')}
                                  className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    statusVal === 'excused' 
                                      ? 'bg-sky-500 text-white border-sky-505' 
                                      : 'bg-white text-sky-650 border-sky-150 hover:bg-sky-50'
                                  }`}
                                >
                                  Excused
                                </button>
                              </td>

                              <td className="p-3">
                                <input
                                  type="text"
                                  placeholder="Observation notes, excuse mentions..."
                                  value={remarkVal}
                                  onChange={(e) => handleClassAttendanceChange(std.id, 'remark', e.target.value)}
                                  className="w-full border rounded-lg p-2 bg-slate-50 focus:bg-white text-slate-705 font-bold outline-none"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t flex-wrap gap-4 leading-normal">
                  <p className="text-[9px] text-slate-400 italic">
                    ⚠️ Batch attendance logs synchronize with all parent portals and general admin summary modules automatically.
                  </p>
                  <button
                    onClick={handleSaveClassAttendance}
                    className="bg-primary text-white font-black uppercase tracking-widest px-6 py-3.5 rounded-xl hover:bg-opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer ml-auto text-[10px]"
                  >
                    <Save size={12} /> Save & Broadcast Cohort Attendance
                  </button>
                </div>
              </div>
            )}

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
                <p className="text-[11px] text-slate-500">Configure computerized questionnaires. Access is strictly limited to your authorized subjects and classes.</p>
              </div>

              {/* Subject & Class Select Limits */}
              <div className="flex bg-white p-1 rounded-xl border border-slate-205 items-center gap-4 flex-wrap md:flex-nowrap">
                <div className="flex items-center gap-1.5 border-r pr-3">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider font-mono">Class Limit:</span>
                  <select
                    value={cbtClass}
                    onChange={(e) => setCbtClass(e.target.value)}
                    className="bg-slate-50 border p-1 rounded text-[10px] font-bold text-slate-700 outline-none uppercase font-mono cursor-pointer"
                  >
                    {(assignedClasses && assignedClasses.length > 0 ? assignedClasses : ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3']).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider font-mono">Subject Limit:</span>
                  <select
                    value={cbtSubject}
                    onChange={(e) => setCbtSubject(e.target.value)}
                    className="bg-slate-50 border p-1 rounded text-[10px] font-bold text-slate-700 outline-none uppercase font-mono cursor-pointer"
                  >
                    {(assignedSubjects && assignedSubjects.length > 0 ? assignedSubjects : ['Mathematics', 'Physics', 'Yoruba', 'Business Studies', 'P.H.E', 'Social Studies', 'Agric', 'Home Economics', 'Computer', 'Basic Tech', 'Basic Science', 'Accounting', 'Commerce']).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
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
                  Manually calibrate performance XP credits of <strong>{selectedStudent?.name || 'Ajao Demola Simon'}</strong>. Ranks update in accordance with aggregate totals.
                </p>

                {/* Points Tuner input field */}
                {(() => {
                  const studentName = selectedStudent?.name || 'Ajao Demola Simon';
                  const studentRecord = leaderboardList.find(i => i.name === studentName);
                  if (!studentRecord) return null;
                  return (
                    <div className="p-4 bg-white border rounded-2xl space-y-3 shadow-inner">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-slate-700 uppercase tracking-tight">Modify {studentName === 'Ajao Demola Simon' ? "Demola" : studentName}'s XP points balance:</span>
                        <span className="font-mono font-black text-primary bg-primary/10 px-2 py-0.5 rounded italic">Scholar</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number"
                          value={studentRecord.points}
                          onChange={(e) => handleAdjustPoints(e.target.value)}
                          className="flex-1 bg-slate-50 border p-3 rounded-xl font-black text-slate-800 outline-none text-center text-lg focus:bg-white font-mono"
                        />
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Current Rank: #{studentRecord.rank || '--'}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Display Mock Leaderboard with sorted items */}
                <div className="border border-slate-150 rounded-2xl p-4 bg-white space-y-3">
                  <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest font-bold">Calculated Rank Standings (Sorted dynamically)</span>
                  
                  <div className="space-y-2">
                    {[...leaderboardList]
                      .sort((a,b) => b.points - a.points)
                      .map((user, idx) => {
                        const studentName = selectedStudent?.name || 'Ajao Demola Simon';
                        const isDemola = user.name === studentName;
                        return (
                          <div 
                            key={user.name} 
                            className={`p-3 border rounded-xl flex items-center justify-between gap-3 text-xs ${
                              isDemola ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-5 h-5 flex items-center justify-center font-black rounded text-[10px] ${
                                idx === 0 ? 'bg-yellow-450 text-white font-bold' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {idx + 1}
                              </span>
                              <div className="w-7 h-7 rounded-lg bg-slate-100 border flex items-center justify-center font-black text-slate-600 text-[10px] shrink-0 uppercase font-mono">
                                {user.avatarLetter || user.name.slice(0, 1)}
                              </div>
                              <div>
                                <h5 className={`font-black text-xs ${isDemola ? 'text-primary font-extrabold' : 'text-slate-800 font-bold'}`}>
                                  {user.name} {isDemola && '(SELECTED)'}
                                </h5>
                                <span className="text-[9px] text-slate-400 uppercase tracking-tight">{user.role || 'Scholar Student'}</span>
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
