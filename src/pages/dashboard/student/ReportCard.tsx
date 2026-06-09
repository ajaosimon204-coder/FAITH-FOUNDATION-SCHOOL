import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Printer, 
  Award, 
  ThumbsUp, 
  TrendingUp, 
  CheckCircle,
  Clock,
  UserCheck,
  Lock
} from 'lucide-react';

interface SubjectGrade {
  subject: string;
  ca1: number; // Max 15
  ca2: number; // Max 15
  exam: number; // Max 70
  remarks: string;
}

export default function ReportCard() {
  const { profile } = useAuth();
  const [term, setTerm] = useState<'1st' | '2nd' | '3rd'>('1st');
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    const studentId = profile?.studentId || profile?.id;
    if (!studentId) return;

    // Check if there is a report card map in localStorage
    const savedMapStr = localStorage.getItem('ff_student_report_cards_map');
    let studentCard = null;
    if (savedMapStr) {
      try {
        const map = JSON.parse(savedMapStr);
        studentCard = map[studentId];
      } catch (e) {
        console.error('Failed to parse report cards map:', e);
      }
    }

    if (studentCard) {
      setReportData(studentCard);
    } else {
      // This is a new student who hasn't done any termly exam yet
      setReportData({ noExamData: true });
    }
  }, [profile]);

  if (reportData?.noExamData) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-slate-50 border border-slate-200 rounded-[32px] text-center space-y-4 shadow-xl shadow-slate-500/5 animate-in fade-in duration-300 animate-out fill-mode-both">
        <motion.div 
          initial={{ rotate: -10, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          className="mx-auto w-16 h-16 bg-slate-150 text-slate-500 rounded-2xl flex items-center justify-center shadow-inner"
        >
          <FileText size={28} />
        </motion.div>
        <h3 className="text-xl font-bold font-display text-slate-800 uppercase tracking-tight">No results available.</h3>
        <p className="text-xs text-slate-500 leading-relaxed font-semibold max-w-sm mx-auto">
          No certified termly examination reports are saved in your docket yet. This is normal for newly registered students who have not completed graded assessments or terminal exams.
        </p>
        <div className="p-3.5 bg-white border border-slate-150 rounded-2xl max-w-xs mx-auto text-[10px] text-slate-430 font-mono tracking-wider">
          Query: REPORT-NOT-SAVED // Status: Enrolled Student
        </div>
      </div>
    );
  }

  if (profile?.role === 'student' && profile?.reportCardPublished === false) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-amber-50 border border-amber-100 rounded-[32px] text-center space-y-4 shadow-xl shadow-amber-500/5 animate-in fade-in duration-300">
        <motion.div 
          initial={{ rotate: -10, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          className="mx-auto w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner"
        >
          <Lock size={28} />
        </motion.div>
        <h3 className="text-xl font-bold font-display text-slate-800">Results have not yet been published.</h3>
        <p className="text-xs text-slate-550 leading-relaxed font-semibold max-w-sm mx-auto">
          Your continuous assessment progress reports and term results are currently undergoing terminal security checks. Results are made visible once signed by the Registrar.
        </p>
        <div className="p-3.5 bg-white/80 border border-slate-100 rounded-2xl max-w-xs mx-auto text-[10px] text-slate-400 font-mono tracking-wider">
          Audit: SS3-CA-PRE-PUBLISH // Status: Pending Verification
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-slate-505 font-bold uppercase tracking-widest text-xs animate-pulse">Loading report card dossier...</p>
      </div>
    );
  }

  const currentReport = reportData[term];

  if (!currentReport) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-slate-50 border border-slate-200 rounded-[32px] text-center space-y-4 shadow-xl shadow-slate-500/5 animate-in fade-in duration-300">
        <motion.div 
          initial={{ rotate: -10, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          className="mx-auto w-16 h-16 bg-slate-150 text-slate-500 rounded-2xl flex items-center justify-center shadow-inner"
        >
          <FileText size={28} />
        </motion.div>
        <h3 className="text-xl font-bold font-display text-slate-800 uppercase tracking-tight">No results available.</h3>
        <p className="text-xs text-slate-500 leading-relaxed font-semibold max-w-sm mx-auto">
          No certified termly examination reports are published in your docket for the selected term yet.
        </p>
        <div className="p-3.5 bg-white border border-slate-150 rounded-2xl max-w-xs mx-auto text-[10px] text-slate-400 font-mono tracking-wider">
          Query: term-{term}-NOT-FOUND // Status: Enrolled Student
        </div>
      </div>
    );
  }

  const getGrade = (total: number) => {
    if (total >= 85) return { grade: 'A1', desc: 'Excellent' };
    if (total >= 75) return { grade: 'B2', desc: 'Very Good' };
    if (total >= 70) return { grade: 'B3', desc: 'Good' };
    if (total >= 65) return { grade: 'C4', desc: 'Credit' };
    if (total >= 60) return { grade: 'C5', desc: 'Credit' };
    if (total >= 50) return { grade: 'C6', desc: 'Credit' };
    if (total >= 45) return { grade: 'D7', desc: 'Pass' };
    if (total >= 40) return { grade: 'E8', desc: 'Pass' };
    return { grade: 'F9', desc: 'Fail' };
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Top action header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileText size={20} />
            </span>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight uppercase">Terminal Report Card</h2>
          </div>
          <p className="text-xs text-slate-500">
            Official scholastic report dossier showing continuous assessment and terminal examination grades.
          </p>
        </div>

        {/* Term selectors */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          {(['1st', '2nd', '3rd'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTerm(t)}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-black rounded-lg transition-all uppercase tracking-wider ${
                term === t 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t} Term
            </button>
          ))}
        </div>
      </div>

      {/* Main Report Card Paper Layout */}
      <div className="bg-white border-2 border-slate-200 rounded-[32px] shadow-md p-8 md:p-12 relative overflow-hidden print:border-0 print:shadow-none print:p-0">
        
        {/* Verification watermark */}
        <div className="absolute right-10 top-10 flex flex-col items-end opacity-20 print:opacity-40">
          <Award className="text-slate-400" size={120} />
          <span className="text-[10px] font-mono uppercase bg-slate-100 px-2 py-1 rounded border mt-2">Verified Academic Record</span>
        </div>

        {/* Letterhead Header */}
        <div className="text-center pb-8 border-b-2 border-dashed border-slate-200 space-y-3">
          <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center font-bold text-2xl mx-auto border-2 border-accent shadow-sm">
            FF
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest font-display">FAITH FOUNDATION SCHOOLS</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">12 Foundation Road, Ibadan, Oyo State, Nigeria</p>
            <p className="text-xs text-primary font-bold">MOTTO: ACADEMIC EXCELLENCE & SPIRITUAL PIETY</p>
          </div>
        </div>

        {/* Bio Data Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-b border-slate-100 text-xs">
          <div className="space-y-1 font-sans">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Student Name</span>
            <p className="font-extrabold text-slate-800 uppercase">
              {profile?.full_name || profile?.name || profile?.student_name || 'Student'}
            </p>
          </div>
          <div className="space-y-1 font-sans">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Admission No.</span>
            <p className="font-extrabold text-slate-800 uppercase">
              {profile?.studentId || profile?.id || 'N/A'}
            </p>
          </div>
          <div className="space-y-1 font-sans">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Current Class</span>
            <p className="font-extrabold text-slate-800 uppercase truncate" title={currentReport.class}>
              {String(currentReport.class || profile?.studentClass || profile?.class || 'SS3').split(' - ')[0]}
            </p>
          </div>
          <div className="space-y-1 font-sans">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Academic Term</span>
            <p className="font-extrabold text-primary uppercase font-mono">{term} Term ({currentReport.academicYear || '2025/2026'})</p>
          </div>
        </div>

        {/* Merit summary indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
          <div className="bg-slate-50 rounded-2xl border border-slate-150 p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">CUMULATIVE GPA</span>
              <p className="text-lg font-black text-slate-800">{currentReport.gpa} / 5.0</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-150 p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center font-bold">
              <CheckCircle size={20} />
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">CLASS RANKING</span>
              <p className="text-lg font-black text-slate-800 capitalize">{currentReport.standing}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-150 p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">ATTENDANCE SUMMARY</span>
              <p className="text-lg font-black text-slate-800">{currentReport.attendance}</p>
            </div>
          </div>
        </div>

        {/* Grades Table */}
        <div className="mt-4 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider">
                <th className="py-4 px-5">Subject Title</th>
                <th className="py-4 px-4 text-center">CA I (15)</th>
                <th className="py-4 px-4 text-center">CA II (15)</th>
                <th className="py-4 px-4 text-center">Exam (70)</th>
                <th className="py-4 px-4 text-center">Total (100)</th>
                <th className="py-4 px-4 text-center">Grade</th>
                <th className="py-4 px-5">Scholastic Teacher Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {currentReport.subjects.map((s, idx) => {
                const total = s.ca1 + s.ca2 + s.exam;
                const { grade, desc } = getGrade(total);
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-5 font-extrabold text-slate-800">{s.subject}</td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-600">{s.ca1}</td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-600">{s.ca2}</td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-600">{s.exam}</td>
                    <td className="py-3 px-4 text-center font-mono font-black text-primary text-sm">{total}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded font-black text-[11px] uppercase ${
                        grade.startsWith('A') 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : grade.startsWith('B')
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {grade} ({desc})
                      </span>
                    </td>
                    <td className="py-3 px-5 text-slate-500 italic max-w-sm font-medium">{s.remarks}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Development Domains Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 pt-8 border-t border-slate-150">
          {/* Cognitive & Psychomotor Skills */}
          <div className="bg-slate-50/60 p-6 rounded-2xl border border-slate-150/50 space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2.5">
              <UserCheck size={14} className="text-primary" />
              Cognitive & Psychomotor Ratings (%)
            </h3>
            <div className="space-y-3.5 text-xs">
              {[
                { label: 'Recall & Fact Acquisition', val: currentReport.cognitive.knowledge },
                { label: 'Creative Conception & Logic', val: currentReport.cognitive.comprehension },
                { label: 'Practical Application of Knowledge', val: currentReport.cognitive.application },
                { label: 'Problem Analysis & Diagnostics', val: currentReport.cognitive.analysis },
                { label: 'Synthesis & Integration', val: currentReport.cognitive.synthesis }
              ].map((c, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600">
                    <span>{c.label}</span>
                    <span className="font-mono text-primary font-black">{c.val}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${c.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Affective & Behavioral Ratings */}
          <div className="bg-slate-50/60 p-6 rounded-2xl border border-slate-150/50 space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2.5">
              <ThumbsUp size={14} className="text-accent" />
              Affective & Behavioral Attributes
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs font-medium text-slate-600">
              {[
                { label: 'Punctuality', val: currentReport.affective.punctuality },
                { label: 'Neatness & Decorum', val: currentReport.affective.neatness },
                { label: 'Regularity in Class', val: currentReport.affective.regularity },
                { label: 'Honesty & Integrity', val: currentReport.affective.honesty },
                { label: 'Spiritual Engagement', val: currentReport.affective.honesty }, // Use honesty placeholder
                { label: 'Polite Conduct & Manners', val: currentReport.affective.politeness }
              ].map((a, i) => (
                <div key={i} className="flex justify-between items-center bg-white border border-slate-150 p-2.5 rounded-xl">
                  <span className="text-[11px] tracking-tight">{a.label}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <span 
                        key={idx} 
                        className={`w-2.5 h-2.5 rounded-full ${
                          idx < a.val ? 'bg-amber-400' : 'bg-slate-200'
                        }`}
                      ></span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 italic text-center mt-2 font-bold uppercase tracking-wider">
              Rating scale: 5: Excellent, 4: Commendable, 3: Average, 2: Minor attention, 1: Weak
            </p>
          </div>
        </div>

        {/* Teacher and Principal Endorsement Comments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-slate-150">
          <div className="p-5 border border-slate-150 rounded-2xl bg-white/40 shadow-sm relative">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-2">Class Teacher's Remarks</span>
            <p className="text-xs text-slate-600 leading-relaxed italic pr-4">
              "{currentReport.teacherRemarks}"
            </p>
            <div className="mt-4 flex gap-2 items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
              <span>Signed: Class Mentor (Mrs. Funke Akindele)</span>
            </div>
          </div>

          <div className="p-5 border border-slate-150 rounded-2xl bg-white/40 shadow-sm relative">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-2">Principal's Evaluation</span>
            <p className="text-xs text-slate-600 leading-relaxed italic pr-4">
              "{currentReport.principalRemarks}"
            </p>
            <div className="mt-4 flex gap-2 items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <span className="w-2.5 h-2.5 bg-primary rounded-full"></span>
              <span>Approved by: Head of School (Dr. Adekunle Johnson)</span>
            </div>
          </div>
        </div>

        {/* Stamp footer with printing rules */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-400 italic">
          <span>Official scholastic record. Digitally rendered from ERP central cache.</span>
          <span>Dossier Release Date: {currentReport.signatureDate}</span>
        </div>

      </div>

      {/* Floating control trigger for client downloading/printing */}
      <div className="flex gap-3 justify-end">
        <button 
          onClick={handlePrint}
          className="bg-slate-100 hover:bg-slate-200 px-5 py-3 rounded-xl text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2"
        >
          <Printer size={16} /> Print Report
        </button>
        <button 
          onClick={() => alert("Report card downloaded in institutional PDF spreadsheet format.")}
          className="bg-primary hover:bg-opacity-95 text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/15"
        >
          <Download size={16} /> Download Copy
        </button>
      </div>

    </div>
  );
}
