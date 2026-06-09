import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Communications from './Communications';
import CloudLocker from './CloudLocker';
import ReportCard from './student/ReportCard';
import LearningHub from './student/LearningHub';
import PaymentsPortal from './student/PaymentsPortal';
import AttendanceTrackerStudent from './student/AttendanceTrackerStudent';
import AwardsAchievements from './student/AwardsAchievements';
import CbtExam from './student/CbtExam';

function hasCompletedTermlyExam(profile: any) {
  if (!profile) return false;
  const studentId = profile.studentId || profile.id;
  if (!studentId) return false;

  const savedMapStr = localStorage.getItem('ff_student_report_cards_map');
  if (savedMapStr) {
    try {
      const map = JSON.parse(savedMapStr);
      const studentCard = map[studentId];
      if (studentCard && !studentCard.noExamData) {
        return true;
      }
    } catch (e) {
      console.error(e);
    }
  }
  return false;
}

function StudentDashboardView() {
  const { profile } = useAuth();
  const hasExams = hasCompletedTermlyExam(profile);
  const studentId = profile?.studentId || profile?.id || '';
  
  // Realtime Outstanding balance and academic standing lookup
  const [balance, setBalance] = React.useState(0);
  const [gpa, setGpa] = React.useState('N/A');
  const [rank, setRank] = React.useState('Newly Enrolled');
  const [attendance, setAttendance] = React.useState({
    percentage: 'N/A',
    presentCount: 0,
    absentCount: 0,
    status: 'Pending'
  });
  const [realPerformance, setRealPerformance] = React.useState<any[]>([]);
  const [lmsNotifications, setLmsNotifications] = React.useState<any[]>([]);
  const [recentBadge, setRecentBadge] = React.useState('Student');

  React.useEffect(() => {
    if (!profile?.email || !studentId) return;

    // Load outstanding invoices
    const savedInvoices = localStorage.getItem('ff_all_student_invoices');
    if (savedInvoices) {
      try {
        const list = JSON.parse(savedInvoices);
        const studentInvoices = list.filter((inv: any) => inv.studentEmail?.toLowerCase() === profile.email.toLowerCase());
        const outstandingSum = studentInvoices.filter((inv: any) => inv.status === 'unpaid').reduce((sum: number, inv: any) => sum + inv.amount, 0);
        setBalance(outstandingSum);
      } catch (e) {
        console.error(e);
      }
    }

    // Load actual student attendance percentage
    const savedLogs = localStorage.getItem(`ff_attendance_student_logs_${studentId}`) || localStorage.getItem('ff_attendance_student_logs');
    if (savedLogs) {
      try {
        const logsParsed = JSON.parse(savedLogs);
        if (Array.isArray(logsParsed) && logsParsed.length > 0) {
          const present = logsParsed.filter((l: any) => l.status === 'present' || l.status === 'early' || l.status === 'late' || l.status === 'excused').length;
          const absent = logsParsed.filter((l: any) => l.status === 'absent').length;
          const percentage = Math.round((present / logsParsed.length) * 105);
          const finalPercentage = percentage > 100 ? 100 : percentage;
          const status = finalPercentage >= 90 ? 'Excellent' : finalPercentage >= 75 ? 'Good' : 'Needs Improve';
          setAttendance({
            percentage: `${finalPercentage}%`,
            presentCount: present,
            absentCount: absent,
            status: status
          });
        }
      } catch (e) {
        console.error('Error calculating attendance rate:', e);
      }
    }

    // Load report card & compute GPA
    let studentCard: any = null;
    const savedMapStr = localStorage.getItem('ff_student_report_cards_map');
    if (savedMapStr) {
      try {
        const map = JSON.parse(savedMapStr);
        studentCard = map[studentId];
      } catch (e) {
        console.error(e);
      }
    }
    if (!studentCard) {
      const savedGrades = localStorage.getItem('ff_student_report_card');
      if (savedGrades) {
        try {
          studentCard = JSON.parse(savedGrades);
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (studentCard && !studentCard.noExamData) {
      const activeTerm = studentCard['3rd'] ? '3rd' : studentCard['2nd'] ? '2nd' : '1st';
      const termData = studentCard[activeTerm];
      if (termData) {
        if (termData.gpa) {
          setGpa(termData.gpa.toString());
          setRank(termData.standing || 'Evaluated');
        } else if (termData.subjects && Array.isArray(termData.subjects)) {
          const subjects = termData.subjects;
          const totalScores = subjects.reduce((sum: number, s: any) => sum + (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0), 0);
          const maxScores = subjects.length * 100;
          const percentage = maxScores > 0 ? (totalScores / maxScores) * 100 : 0;
          const computedGpa = (percentage / 20).toFixed(2);
          setGpa(computedGpa);
          setRank(`Avg: ${percentage.toFixed(1)}%`);
        }

        // Mapped Subject Performance scorebars
        if (termData.subjects && Array.isArray(termData.subjects)) {
          const mapped = termData.subjects.map((s: any) => {
            const scoreValue = (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0);
            return {
              name: s.subject,
              score: scoreValue,
              color: scoreValue >= 70 ? 'bg-accent' : 'bg-white'
            };
          });
          setRealPerformance(mapped.slice(0, 4));
        }
      }
    } else {
      setGpa('N/A');
      setRank('Newly Enrolled');
      setRealPerformance([]);
    }

    // Load real recent resources/assignments
    const realNotifs: any[] = [];
    const savedAsgs = localStorage.getItem('ff_student_assignments');
    if (savedAsgs) {
      try {
        const asgs = JSON.parse(savedAsgs);
        if (Array.isArray(asgs)) {
          asgs.filter(a => !a.submitted).forEach(a => {
            realNotifs.push({
              title: a.title,
              type: 'Assignment',
              date: a.deadline || 'Pending',
              active: true
            });
          });
        }
      } catch (e) {
        console.error(e);
      }
    }

    const savedLecs = localStorage.getItem('ff_lecture_notes');
    if (savedLecs) {
      try {
        const lecs = JSON.parse(savedLecs);
        if (Array.isArray(lecs)) {
          lecs.slice(0, 2).forEach(l => {
            realNotifs.push({
              title: l.title,
              type: 'E-Material',
              date: l.subject,
              active: false
            });
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    setLmsNotifications(realNotifs.slice(0, 3));

    // Load real dynamic recent achievement badge
    const savedAch = localStorage.getItem(`ff_student_achievements_${studentId}`) || localStorage.getItem('ff_student_achievements');
    if (savedAch) {
      try {
        const list = JSON.parse(savedAch);
        if (Array.isArray(list)) {
          const unlocked = list.find((a: any) => a.unlocked);
          if (unlocked) {
            setRecentBadge(unlocked.title);
          } else {
            setRecentBadge('Candidate');
          }
        }
      } catch (e) {
        setRecentBadge('Student');
      }
    } else {
      setRecentBadge('Student');
    }

  }, [profile, studentId]);

  // Generate real daily class stream schedule dynamically based on enrolled class department
  const getDailySchedule = () => {
    const studentClass = (profile?.studentClass || profile?.class || '').toLowerCase();
    if (studentClass.includes('science') || studentClass.includes('s3') || studentClass.includes('ss3')) {
      return [
        { time: '08:30', subject: 'Mathematics', room: 'Lab 2', icon: '📐' },
        { time: '10:15', subject: 'Physics Lecture', room: 'Block A', icon: '⚡' },
        { time: '12:00', subject: 'Lunch Break', room: 'Cafeteria', icon: '🍱' },
        { time: '13:30', subject: 'Chemistry Pract.', room: 'Lab 1', icon: '🧪' },
      ];
    } else if (studentClass.includes('art') || studentClass.includes('com')) {
      return [
        { time: '08:30', subject: 'Literature', room: 'Room 12', icon: '📚' },
        { time: '10:15', subject: 'Government', room: 'Block B', icon: '⚖️' },
        { time: '12:00', subject: 'Lunch Break', room: 'Cafeteria', icon: '🍱' },
        { time: '13:30', subject: 'CRS / Islamic S.', room: 'Assembly', icon: '📖' },
      ];
    } else {
      return [
        { time: '08:30', subject: 'Basic Math', room: 'Room 5', icon: '📐' },
        { time: '10:15', subject: 'English Grammar', room: 'Block A', icon: '📝' },
        { time: '12:00', subject: 'Lunch & Recess', room: 'Cafeteria', icon: '🍱' },
        { time: '13:30', subject: 'Basic Science', room: 'Workshop', icon: '⚙️' },
      ];
    }
  };

  const scheduleList = getDailySchedule();

  return (
    <div className="grid grid-cols-4 grid-rows-3 gap-5">
      {/* Attendance Stats - Large Card */}
      <div className="col-span-2 row-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between focus-within:ring-2 focus-within:ring-primary/20 transition-all font-sans">
        <div className="flex justify-between items-start">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Attendance Percentage</span>
          <span className={`text-xs text-white px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
            attendance.status === 'Excellent' ? 'bg-emerald-500' : attendance.percentage === 'N/A' ? 'bg-slate-400' : 'bg-amber-500'
          }`}>
            {attendance.status}
          </span>
        </div>
        <div className="flex items-end gap-3 mt-2">
          <span className="text-4xl font-black text-primary font-display">{attendance.percentage}</span>
          <span className="text-slate-400 text-sm mb-1 uppercase tracking-tight">Evaluated Days</span>
        </div>
        <div className="flex gap-2 mt-4">
          {attendance.percentage === 'N/A' ? (
            <div className="h-1.5 w-full bg-slate-100 rounded-full"></div>
          ) : (
            <>
              <div 
                className="h-1.5 bg-primary rounded-full transition-all duration-500" 
                style={{ flex: parseFloat(attendance.percentage) / 100 }}
              ></div>
              <div 
                className="h-1.5 bg-slate-100 rounded-full transition-all duration-500" 
                style={{ flex: (100 - parseFloat(attendance.percentage)) / 100 }}
              ></div>
            </>
          )}
        </div>
        <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
          <span>{attendance.percentage === 'N/A' ? '0 present logs' : `${attendance.presentCount} Days Attended`}</span>
          <span>{attendance.percentage === 'N/A' ? '' : `${attendance.absentCount} Days Absent`}</span>
        </div>
      </div>

      {/* Account Balance - Primary Color Card */}
      <div className={`col-span-1 row-span-1 rounded-2xl shadow-md p-6 text-white flex flex-col hover:scale-[1.02] transition-transform font-sans ${balance > 0 ? 'bg-rose-650' : 'bg-primary'}`}>
        <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider opacity-80">Outstanding Balance</span>
        <div className="mt-auto">
          <p className="text-3xl font-bold font-display leading-tight">₦{balance.toLocaleString()}</p>
          <p className="text-[10px] mt-1 text-blue-100 italic">
            {balance > 0 ? 'Urgent school fee invoice pending' : 'No pending bursary arrears'}
          </p>
        </div>
      </div>

      {/* Grade Points */}
      <div className="col-span-1 row-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between font-sans">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cumulative GPA</span>
        <div className="mt-2 text-right">
          <p className="text-3xl font-bold text-slate-800 font-display">{gpa}</p>
          <p className="text-[10px] text-accent font-bold uppercase tracking-widest mt-1">{rank}</p>
        </div>
      </div>

      {/* Timetable / Schedule */}
      <div className="col-span-1 row-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4">Today's Schedule</span>
        <div className="space-y-3 flex-1 overflow-y-auto">
          {scheduleList.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group cursor-default">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center text-xs shrink-0 group-hover:border-secondary transition-colors">
                {item.icon}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate leading-tight">{item.subject}</p>
                <p className="text-[9px] text-slate-500 uppercase">{item.time} &middot; {item.room}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Progress - Secondary Color Card */}
      <div className="col-span-2 row-span-2 bg-secondary rounded-2xl shadow-md p-6 text-white flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Subject Performance</span>
        </div>
        <div className="flex-1 space-y-4 flex flex-col justify-center">
          {realPerformance.length > 0 ? (
            realPerformance.map((subj, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1 opacity-90">
                  <span>{subj.name}</span>
                  <span>{subj.score}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${subj.color} rounded-full transition-all duration-1000 ease-out`} 
                    style={{ width: `${subj.score}%` }}
                  ></div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 space-y-2">
              <span className="text-2xl block">📈</span>
              <p className="text-xs font-bold uppercase tracking-wider text-white">No Graded Progress Registered</p>
              <p className="text-[10px] text-blue-100 max-w-xs mx-auto opacity-80 leading-relaxed font-semibold">Your grades, assessments, and continuous terminal scores will compile here once graded by teachers.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Resources */}
      <div className="col-span-1 row-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col font-sans">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4">LMS Notifications</span>
        <div className="space-y-4 flex-1 overflow-hidden">
          {lmsNotifications.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-xl block mb-1">📢</span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No active alerts</p>
            </div>
          ) : (
            lmsNotifications.map((item, idx) => (
              <div key={idx} className={`border-l-2 pl-3 ${item.active ? 'border-primary' : 'border-slate-200'}`}>
                <p className="text-xs font-bold text-slate-900 leading-none mb-1 truncate uppercase" title={item.title}>{item.title}</p>
                <p className="text-[9px] text-slate-550 uppercase font-black">{item.type} &middot; {item.date}</p>
              </div>
            ))
          )}
        </div>
        <div className="mt-auto">
          <div className="bg-slate-150 p-4 rounded-xl text-center mb-1.5 border border-slate-200/50">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Rank Merit</p>
            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{recentBadge}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { profile } = useAuth();
  const hasExams = hasCompletedTermlyExam(profile);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300 h-full">
      <Routes>
        <Route path="/" element={<StudentDashboardView />} />
        <Route path="/results" element={<ReportCard />} />
        <Route path="/lms" element={<LearningHub />} />
        <Route path="/payments" element={<PaymentsPortal />} />
        <Route path="/attendance" element={<AttendanceTrackerStudent />} />
        <Route path="/awards" element={<AwardsAchievements />} />
        <Route path="/cbt" element={<CbtExam />} />
        <Route path="/communications" element={<Communications />} />
        <Route path="/locker" element={<CloudLocker />} />
      </Routes>
    </div>
  );
}
