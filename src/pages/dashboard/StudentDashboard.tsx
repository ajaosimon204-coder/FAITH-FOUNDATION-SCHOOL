import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Communications from './Communications';
import ReportCard from './student/ReportCard';
import LearningHub from './student/LearningHub';
import PaymentsPortal from './student/PaymentsPortal';
import AttendanceTrackerStudent from './student/AttendanceTrackerStudent';
import AwardsAchievements from './student/AwardsAchievements';
import CbtExam from './student/CbtExam';

function StudentDashboardView() {
  const { profile } = useAuth();
  
  // Realtime Outstanding balance and academic standing lookup
  const [balance, setBalance] = React.useState(0);
  const [gpa, setGpa] = React.useState('4.2');
  const [rank, setRank] = React.useState('First Class Rank');

  React.useEffect(() => {
    if (!profile?.email) return;

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

    // Load report card & compute GPA
    const savedGrades = localStorage.getItem('ff_student_report_card');
    if (savedGrades) {
      try {
        const grades = JSON.parse(savedGrades);
        const activeTerm = grades['3rd'] ? '3rd' : grades['2nd'] ? '2nd' : '1st';
        if (grades[activeTerm] && grades[activeTerm].summary) {
          const avg = parseFloat(grades[activeTerm].summary.average) || 0;
          // Map average (e.g. 84.5) to a standard 5.0 scale GPA helper
          const computedGpa = (avg / 20).toFixed(2);
          setGpa(computedGpa);
          setRank(avg >= 75 ? 'First Class Honor' : avg >= 60 ? 'Second Class Upper' : 'Third Class Pass');
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [profile]);

  return (
    <div className="grid grid-cols-4 grid-rows-3 gap-5">
      {/* Attendance Stats - Large Card */}
      <div className="col-span-2 row-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between focus-within:ring-2 focus-within:ring-primary/20 transition-all font-sans">
        <div className="flex justify-between items-start">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Attendance Percentage</span>
          <span className="text-secondary bg-green-50 text-[10px] px-2 py-1 rounded font-bold">Excellent</span>
        </div>
        <div className="flex items-end gap-3 mt-2">
          <span className="text-4xl font-black text-primary font-display">94.2%</span>
          <span className="text-slate-400 text-sm mb-1 uppercase tracking-tight">Present Days</span>
        </div>
        <div className="flex gap-2 mt-4">
          <div className="h-1.5 flex-[0.942] bg-primary rounded-full"></div>
          <div className="h-1.5 flex-[0.058] bg-slate-100 rounded-full"></div>
        </div>
        <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
          <span>162 Days Attended</span>
          <span>10 Days Absent</span>
        </div>
      </div>

      {/* Account Balance - Primary Color Card */}
      <div className={`col-span-1 row-span-1 rounded-2xl shadow-md p-6 text-white flex flex-col hover:scale-[1.02] transition-transform font-sans ${balance > 0 ? 'bg-rose-650' : 'bg-primary'}`}>
        <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider opacity-80">Outstanding Balance</span>
        <div className="mt-auto">
          <p className="text-3xl font-bold font-display leading-tight">₦{balance.toLocaleString()}</p>
          <p className="text-[10px] mt-1 text-blue-100 italic">
            {balance > 0 ? 'Urgent financial arrears pending details' : 'Termly cleared statement invoice account'}
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
          {[
            { time: '08:30', subject: 'Mathematics', room: 'Lab 2', icon: '📐' },
            { time: '10:15', subject: 'English Lang.', room: 'Block A', icon: '📝' },
            { time: '12:00', subject: 'Lunch Break', room: 'Cafeteria', icon: '🍱' },
            { time: '13:30', subject: 'Intro. Tech', room: 'Workshop', icon: '⚙️' },
          ].map((item, idx) => (
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
        <button className="mt-4 w-full bg-primary text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-opacity-90 active:scale-95 transition-all">
          Full Schedule
        </button>
      </div>

      {/* Learning Progress - Secondary Color Card */}
      <div className="col-span-2 row-span-2 bg-secondary rounded-2xl shadow-md p-6 text-white flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Subject Performance</span>
          <button className="text-[9px] border border-white/20 px-2 py-1 rounded font-bold uppercase tracking-tighter hover:bg-white/10">Compare Terms</button>
        </div>
        <div className="flex-1 space-y-4">
          {[
            { name: 'Mathematics', score: 85, color: 'bg-accent' },
            { name: 'Physics', score: 72, color: 'bg-white' },
            { name: 'Further Math', score: 91, color: 'bg-accent' },
            { name: 'English', score: 68, color: 'bg-white font-normal' },
          ].map((subj, idx) => (
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
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
          <p className="text-[9px] font-bold uppercase opacity-60">Upcoming Exam: Chemistry (June 4)</p>
          <span className="text-[10px] bg-accent text-primary px-2 py-0.5 rounded font-bold">12 Days Left</span>
        </div>
      </div>

      {/* Recent Resources */}
      <div className="col-span-1 row-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4">LMS Notifications</span>
        <div className="space-y-4 flex-1 overflow-hidden">
          {[
            { title: 'Algebra Worksheet', type: 'assignment', date: 'Due 6pm', active: true },
            { title: 'Periodic Table PDF', type: 'resource', date: 'Added Today', active: false },
            { title: 'Project Rubric', type: 'notice', date: 'Yesterday', active: false },
          ].map((item, idx) => (
            <div key={idx} className={`border-l-2 pl-3 ${item.active ? 'border-primary' : 'border-slate-200'}`}>
              <p className="text-xs font-bold text-slate-900 leading-none mb-1">{item.title}</p>
              <p className="text-[9px] text-slate-500 uppercase">{item.type} &middot; {item.date}</p>
            </div>
          ))}
        </div>
        <div className="mt-auto">
          <div className="bg-slate-100 p-4 rounded-xl text-center mb-4 border border-slate-200/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">New Badges</p>
            <p className="text-2xl font-black text-slate-800 font-display italic tracking-tight">Scholar</p>
          </div>
          <button className="w-full bg-slate-50 border border-slate-200 py-3 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:bg-slate-100 active:bg-slate-200 transition-all">
            Open Portal
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
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
      </Routes>
    </div>
  );
}
