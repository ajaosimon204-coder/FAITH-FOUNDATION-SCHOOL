import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckCircle, 
  AlertTriangle, 
  XSquare, 
  HelpCircle,
  FileText,
  UserCheck,
  Send,
  PlaneTakeoff,
  ClipboardCheck,
  Award
} from 'lucide-react';
import ImageUploader from '../../../components/ImageUploader';
import { useAuth } from '../../../contexts/AuthContext';

interface AttendanceLog {
  date: string;
  day: string;
  status: 'early' | 'late' | 'absent' | 'excused';
  timestamp?: string;
  remark?: string;
}

interface ExcuseDutyRequest {
  id: string;
  dateOfAbsence: string;
  reason: string;
  details: string;
  uploadedReceipt?: string;
  status: 'pending' | 'approved' | 'declined';
  requestDate: string;
}

export default function AttendanceTrackerStudent() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [excuseRequests, setExcuseRequests] = useState<ExcuseDutyRequest[]>([]);
  const [activeStudentId, setActiveStudentId] = useState('FFP/2026/001');
  
  // Form submission state
  const [reqDate, setReqDate] = useState('');
  const [reqReason, setReqReason] = useState('Sick Leave');
  const [reqExplanation, setReqExplanation] = useState('');
  const [attachedDoc, setAttachedDoc] = useState('');
  
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'calendar' | 'excuse'>('calendar');

  useEffect(() => {
    import('../../../lib/sync').then(({ syncFetchStudents }) => {
      syncFetchStudents().then(students => {
        const student = students.find((s: any) => 
          s.email?.toLowerCase() === profile?.email?.toLowerCase() || 
          s.parentEmail?.toLowerCase() === profile?.email?.toLowerCase()
        );
        const resolvedId = student?.id || 'FFP/2026/001';
        setActiveStudentId(resolvedId);

        const savedLogs = localStorage.getItem(`ff_attendance_student_logs_${resolvedId}`) || localStorage.getItem('ff_attendance_student_logs');
        const savedReqs = localStorage.getItem(`ff_attendance_student_requests_${resolvedId}`) || localStorage.getItem('ff_attendance_student_requests');

        if (savedLogs) {
          setLogs(JSON.parse(savedLogs));
        } else {
          const defaultLogs: AttendanceLog[] = [
            { date: '2026-06-01', day: 'Monday', status: 'early', timestamp: '07:44 AM', remark: 'Perfect punctuality record' },
            { date: '2026-06-02', day: 'Tuesday', status: 'early', timestamp: '07:38 AM', remark: 'Arrived for Devotions early' },
            { date: '2026-06-03', day: 'Wednesday', status: 'late', timestamp: '08:12 AM', remark: 'Traffic delays at ringroad' },
            { date: '2026-05-28', day: 'Thursday', status: 'excused', timestamp: '--', remark: 'Approved excuse duty' },
            { date: '2026-05-29', day: 'Friday', status: 'absent', timestamp: '--', remark: 'Unexcused absentee report' },
            { date: '2026-05-25', day: 'Monday', status: 'early', timestamp: '07:41 AM', remark: 'Early sign in verified' },
            { date: '2026-05-26', day: 'Tuesday', status: 'early', timestamp: '07:45 AM', remark: 'On time' },
            { date: '2026-05-27', day: 'Wednesday', status: 'early', timestamp: '07:35 AM', remark: 'Perfect punctuality record' },
          ];
          setLogs(defaultLogs);
          localStorage.setItem(`ff_attendance_student_logs_${resolvedId}`, JSON.stringify(defaultLogs));
        }

        if (savedReqs) {
          setExcuseRequests(JSON.parse(savedReqs));
        } else {
          const defaultReqs: ExcuseDutyRequest[] = [
            {
              id: 'EXC-2001',
              dateOfAbsence: '2026-05-28',
              reason: 'Medical Dental Checkup',
              details: 'Had to visit the general hospital to pull a wisdom tooth under medical anesthesia.',
              status: 'approved',
              requestDate: '2026-05-27',
              uploadedReceipt: 'hospital_referral_checkup.pdf'
            }
          ];
          setExcuseRequests(defaultReqs);
          localStorage.setItem(`ff_attendance_student_requests_${resolvedId}`, JSON.stringify(defaultReqs));
        }
      });
    });
  }, [profile]);

  const handleDocumentUploaded = (url: string) => {
    setAttachedDoc(url);
  };

  const handleApplyExcuse = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newRequest: ExcuseDutyRequest = {
      id: `EXC-FF-${Math.floor(1000 + Math.random() * 9000)}`,
      dateOfAbsence: reqDate,
      reason: reqReason,
      details: reqExplanation,
      status: 'pending',
      uploadedReceipt: attachedDoc || 'medical_appointment_notified.pdf',
      requestDate: new Date().toISOString().slice(0, 10)
    };

    const updated = [newRequest, ...excuseRequests];
    setExcuseRequests(updated);
    localStorage.setItem(`ff_attendance_student_requests_${activeStudentId}`, JSON.stringify(updated));
    localStorage.setItem('ff_attendance_student_requests', JSON.stringify(updated));

    setSuccessMsg('Your excuse duty ticket has been successfully transmitted to the Principal’s office for review!');
    setReqDate('');
    setReqExplanation('');
    setAttachedDoc('');

    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  // Stats calculation
  const totalExcused = logs.filter(l => l.status === 'excused').length;
  const totalLate = logs.filter(l => l.status === 'late').length;
  const totalAbsent = logs.filter(l => l.status === 'absent').length;
  const totalEarly = logs.filter(l => l.status === 'early').length;
  const totalTracked = logs.length;
  const punctualityScore = totalTracked > 0 ? Math.round(((totalEarly + totalExcused) / totalTracked) * 100) : 100;

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Top action header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <CalendarIcon size={20} />
            </span>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight uppercase">Terminal Attendance Ledger</h2>
          </div>
          <p className="text-xs text-slate-500">
            Monitor daily sign-in timestamps, view compliance percentages, and file formal excuse duty applications.
          </p>
        </div>

        {/* Tabs switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-black rounded-lg transition-all uppercase tracking-wider ${
              activeTab === 'calendar' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign-In Logs
          </button>
          <button
            onClick={() => setActiveTab('excuse')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-black rounded-lg transition-all uppercase tracking-wider ${
              activeTab === 'excuse' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Excuse Duty Portal
          </button>
        </div>
      </div>

      {/* Visual Stats Block layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Present Days ratio */}
        <div className="bg-white border border-slate-200 rounded-[22px] p-5 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Present Sign-Ins</span>
            <p className="text-sm font-black text-slate-800">{totalEarly} days early / logged</p>
          </div>
        </div>

        {/* Late markings */}
        <div className="bg-white border border-slate-200 rounded-[22px] p-5 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Late Arrivals</span>
            <p className="text-sm font-black text-slate-800">{totalLate} times flagged</p>
          </div>
        </div>

        {/* Absences registered */}
        <div className="bg-white border border-slate-200 rounded-[22px] p-5 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold">
            <XSquare size={20} />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Absent Markings</span>
            <p className="text-sm font-black text-slate-800">{totalAbsent} days unaccounted</p>
          </div>
        </div>

        {/* Punctuality Rate Index */}
        <div className="bg-slate-900 text-white rounded-[22px] p-5 flex items-center gap-4 shadow-md">
          <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center font-black">
            <Award size={20} />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider text-slate-300">Punctuality Score</span>
            <p className="text-lg font-extrabold text-blue-400">{punctualityScore}% Rate</p>
          </div>
        </div>

      </div>

      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Detailed logs table column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-5 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-105 pb-3">Latest Check-In Logs & Timestamps</h3>
              
              <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider">
                      <th className="py-4 px-5">Day / Date</th>
                      <th className="py-4 px-4">Verification mark</th>
                      <th className="py-4 px-4 text-center font-mono">Sign-In Time</th>
                      <th className="py-4 px-5">Administrative Comments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {logs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5 font-bold text-slate-850">
                          <div>{log.day}</div>
                          <span className="text-[10px] font-mono text-slate-400 font-medium">{log.date}</span>
                        </td>
                        <td className="py-4 px-4">
                          {log.status === 'early' && (
                            <span className="bg-green-50 text-green-700 border border-green-150 px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block">Early</span>
                          )}
                          {log.status === 'late' && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-150 px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block">Late arrival</span>
                          )}
                          {log.status === 'absent' && (
                            <span className="bg-rose-50 text-rose-700 border border-rose-150 px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block">Absent</span>
                          )}
                          {log.status === 'excused' && (
                            <span className="bg-blue-50 text-blue-700 border border-blue-150 px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block">Excused</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center font-mono font-extrabold text-slate-650">{log.timestamp}</td>
                        <td className="py-4 px-5 text-slate-500 italic font-medium">{log.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Visual Heatmap widget */}
          <div>
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm text-center">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest text-left border-b border-slate-100 pb-2.5">Monthly Heatmap Grid</h3>
              
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>
              
              <div className="grid grid-cols-7 gap-1.5">
                {/* Visual grid representations */}
                {Array.from({ length: 28 }).map((_, idx) => {
                  let colorClass = 'bg-slate-100 border border-slate-150 hover:bg-slate-200';
                  let tip = 'Present & Early';
                  if (idx % 7 === 5 || idx % 7 === 6) {
                    colorClass = 'bg-slate-50 text-slate-300 border border-dashed border-slate-150 cursor-not-allowed';
                    tip = 'Weekend';
                  } else if (idx === 2) {
                    colorClass = 'bg-amber-400 text-white border border-amber-500';
                    tip = 'Late marking';
                  } else if (idx === 10 || idx === 18) {
                    colorClass = 'bg-rose-500 text-white border border-rose-600';
                    tip = 'Absent';
                  } else if (idx === 14) {
                    colorClass = 'bg-blue-500 text-white border border-blue-600';
                    tip = 'Excused Leave';
                  } else if (idx < 20) {
                    colorClass = 'bg-emerald-500 text-white border border-emerald-600';
                  }
                  
                  return (
                    <div 
                      key={idx} 
                      title={tip}
                      className={`h-7 rounded-lg flex items-center justify-center font-semibold cursor-pointer text-[10px] transition-all hover:scale-[1.1] ${colorClass}`}
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-[9px] font-black uppercase text-slate-450 tracking-tight text-left">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded"></span>
                  <span>Present / Early</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-amber-400 rounded"></span>
                  <span>Arrived Late</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded"></span>
                  <span>Absent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded"></span>
                  <span>Excused absence</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'excuse' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* excuse duty submission form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-105 pb-3">Submit Formal Excuse Duty Certificate</h3>
              
              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-xs text-emerald-800 font-bold mb-4 animate-pulse">
                  ✓ {successMsg}
                </div>
              )}

              <form onSubmit={handleApplyExcuse} className="space-y-4 text-xs text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block font-black text-slate-700 uppercase tracking-wider">Date of Absence:</label>
                    <input 
                      type="date"
                      required
                      value={reqDate}
                      onChange={(e) => setReqDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 p-3 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-black text-slate-700 uppercase tracking-wider">Reason Category:</label>
                    <select
                      value={reqReason}
                      onChange={(e) => setReqReason(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 p-3 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 text-xs font-bold"
                    >
                      <option value="Sick Leave">Sick Leave / Hospital Admission</option>
                      <option value="Family Bereavement">Family Bereavement</option>
                      <option value="Religious Duty">Pilgrimage / Religious devotions</option>
                      <option value="Official Representation">Representing School in competition</option>
                      <option value="Severe Travel Delay">Severe flight/transportation collapse</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-black text-slate-700 uppercase tracking-wider">Provide details explanation for absence:</label>
                  <textarea
                    required
                    value={reqExplanation}
                    onChange={(e) => setReqExplanation(e.target.value)}
                    placeholder="Provide a detailed official message explaining the grounds for missing classes on the specified date..."
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 p-3 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 text-xs font-semibold leading-relaxed"
                  ></textarea>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-black text-slate-700 uppercase tracking-wider">Upload Medical Certificate/Doctor Note attachment (Optional):</label>
                  <ImageUploader 
                    currentUrl={attachedDoc}
                    onUpload={handleDocumentUploaded} 
                    label="Drop doctor note slips or receipt files here" 
                  />
                  {attachedDoc && (
                    <p className="text-[10px] text-emerald-600 font-bold font-mono">Attachment linked: {attachedDoc.slice(-30)}...</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-opacity-95 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg shadow-primary/15 transition-all text-center flex items-center justify-center gap-2"
                >
                  <Send size={14} /> Submit Leave Request Form
                </button>
              </form>
            </div>
          </div>

          {/* Historical requested excuse list */}
          <div>
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm flex flex-col">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2.5">Leave Request Status</h3>
              
              <div className="space-y-3 flex-1 overflow-y-auto">
                {excuseRequests.map((req) => (
                  <div key={req.id} className="p-4 border border-slate-150 rounded-xl space-y-2.5">
                    <div className="flex justify-between items-center bg-slate-50/70 p-1.5 rounded-lg border border-slate-100/65">
                      <span className="font-mono text-[9px] font-black text-slate-400">{req.id}</span>
                      {req.status === 'approved' && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-black uppercase px-2 py-0.5 rounded-md">Approved</span>
                      )}
                      {req.status === 'pending' && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[8px] font-black uppercase px-2 py-0.5 rounded-md animate-pulse">Pending approval</span>
                      )}
                      {req.status === 'declined' && (
                        <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[8px] font-black uppercase px-2 py-0.5 rounded-md">Declined</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-[11px] font-bold text-slate-800 uppercase">{req.reason}</h4>
                      <p className="text-[9px] font-medium text-slate-450 uppercase tracking-wide">Target Absense: <span className="font-mono font-bold">{req.dateOfAbsence}</span></p>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal italic">"{req.details}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
