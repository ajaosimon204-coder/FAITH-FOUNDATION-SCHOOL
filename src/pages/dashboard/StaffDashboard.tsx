import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sendNotification } from '../../lib/notifications';
import { supabase } from '../../lib/supabase';
import Communications from './Communications';
import AttendanceTracker from '../../components/AttendanceTracker';
import ImageUploader from '../../components/ImageUploader';
import AcademicManager from './staff/AcademicManager';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { 
  Calendar, 
  Award, 
  DollarSign, 
  Clock, 
  UserCheck, 
  FileText, 
  Edit3, 
  Save, 
  User, 
  Phone, 
  Mail, 
  Star, 
  CheckCircle2,
  X,
  ShieldCheck,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';

interface StaffRecord {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  photoUrl?: string;
  dateOfAppointment?: string;
  salary?: string;
  award?: string;
  punctualityAttendance?: string;
  regularityAttendance?: string;
  rating?: string;
  review?: string;
}

function StaffDashboardView() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [staffRecord, setStaffRecord] = useState<StaffRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editSalary, setEditSalary] = useState('');
  const [editAward, setEditAward] = useState('');
  const [editPunctuality, setEditPunctuality] = useState('');
  const [editRegularity, setEditRegularity] = useState('');
  const [editRating, setEditRating] = useState('');
  const [editReview, setEditReview] = useState('');

  // Trend analytics states
  const [teachersList, setTeachersList] = useState<StaffRecord[]>([]);
  const [chartTeacherId, setChartTeacherId] = useState<string>('');

  useEffect(() => {
    if (!profile?.email) return;

    // Load full staff list from local storage
    const saved = localStorage.getItem('ff_staff');
    let list: StaffRecord[] = saved ? JSON.parse(saved) : [];

    // Find the record by email
    let record = list.find(s => s.email?.toLowerCase() === profile.email.toLowerCase());

    if (!record) {
      // Create self-healing placeholder record representing this staff member
      record = {
        id: `STF-${Math.floor(100 + Math.random() * 900)}`,
        name: profile.full_name || 'Principal Instructor',
        role: 'Academic Instructor',
        email: profile.email,
        phone: '08123456789',
        photoUrl: '',
        dateOfAppointment: '2022-09-01',
        salary: '₦250,000 / month',
        award: 'Teacher of the first tier',
        punctualityAttendance: '98%',
        regularityAttendance: '99%',
        rating: '4.8',
        review: 'Dedicated educator showing excellence in Mathematics and Physics instructions.'
      };

      list = [...list, record];
    }

    // Ensure database contains fallback teachers for beautiful selection
    if (!list.some(s => s.id === 'STF-001')) {
      list.push({ 
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
      });
    }
    if (!list.some(s => s.id === 'STF-002')) {
      list.push({ 
        id: 'STF-002', 
        name: 'Mrs. Funke Akindele', 
        role: 'Senior Registrar Office', 
        email: 'f.akindele@faithfoundation.edu.ng', 
        phone: '09055667788',
        photoUrl: '',
        dateOfAppointment: '2023-01-15',
        salary: '₦280,000 / month',
        award: 'Outstanding Service Award',
        punctualityAttendance: '96%',
        regularityAttendance: '97%',
        rating: '4.7',
        review: 'Extremely efficient in registry activities and parent communication.'
      });
    }

    localStorage.setItem('ff_staff', JSON.stringify(list));

    setStaffRecord(record);
    setEditName(record.name || '');
    setEditRole(record.role || '');
    setEditPhone(record.phone || '');
    setEditPhoto(record.photoUrl || '');
    setEditDate(record.dateOfAppointment || '');
    setEditSalary(record.salary || '');
    setEditAward(record.award || '');
    setEditPunctuality(record.punctualityAttendance || '');
    setEditRegularity(record.regularityAttendance || '');
    setEditRating(record.rating || '5.0');
    setEditReview(record.review || '');

    setTeachersList(list);
    setChartTeacherId(record.id);
  }, [profile]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffRecord || !profile?.email) return;

    const updated: StaffRecord = {
      ...staffRecord,
      name: editName,
      role: editRole,
      phone: editPhone,
      photoUrl: editPhoto,
      dateOfAppointment: editDate,
      salary: editSalary,
      award: editAward,
      punctualityAttendance: editPunctuality,
      regularityAttendance: editRegularity,
      rating: editRating,
      review: editReview
    };

    // Save back to ff_staff
    const saved = localStorage.getItem('ff_staff');
    const list: StaffRecord[] = saved ? JSON.parse(saved) : [];
    const updatedList = list.some(s => s.id === staffRecord.id)
      ? list.map(s => s.id === staffRecord.id ? updated : s)
      : [...list, updated];

    localStorage.setItem('ff_staff', JSON.stringify(updatedList));

    setStaffRecord(updated);
    setTeachersList(updatedList);
    setIsEditing(false);
    setSuccessMsg('Your institutional profile dossier has been updated successfully!');
    
    // Auto-dismiss the success banner
    setTimeout(() => {
      setSuccessMsg('');
    }, 5050);
  };

  const notifyLevel = async (type: 'assignment' | 'grade', title: string, message: string) => {
    try {
      const { data: students, error } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'student');
      
      if (error) throw error;
      
      if (students) {
        await Promise.all(students.map(s => sendNotification({
          recipientId: s.id,
          title,
          message,
          type
        })));
        alert(`Notification sent: ${title}`);
      }
    } catch (error) {
      console.error('Error notifying students:', error);
    }
  };

  return (
    <div className="space-y-10">
      
      {/* Original Overview Grid */}
      <div className="grid grid-cols-4 grid-rows-3 gap-5">
        {/* Class Overview - Large Card */}
        <div className="col-span-2 row-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Primary Assignment</span>
            <span className="text-secondary bg-green-50 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-tighter">Academic Lead</span>
          </div>
          <div className="flex items-end gap-3 mt-2">
            <span className="text-4xl font-black text-primary font-display">SS 3 Science</span>
            <span className="text-slate-400 text-sm mb-1 uppercase tracking-tight">Assigned Class</span>
          </div>
          <div className="flex gap-2 mt-4">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full w-[85%] bg-secondary rounded-full"></div>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
            <span>{profile?.full_name || 'Staff Member'}</span>
            <span>85% Syllabus Completed</span>
          </div>
        </div>

        {/* Grading Tasks - Primary Color Card */}
        <div 
          onClick={() => notifyLevel('assignment', 'Assignment Due Soon', 'Just a reminder that your Science project is due in 48 hours. Please upload on time.')}
          className="col-span-1 row-span-1 bg-primary rounded-2xl shadow-md p-6 text-white flex flex-col hover:scale-[1.02] transition-transform cursor-pointer group relative overflow-hidden"
        >
          <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider opacity-60">Grading Queue</span>
          <div className="mt-auto">
            <p className="text-3xl font-bold font-display leading-tight">14</p>
            <p className="text-[10px] mt-1 text-blue-100 italic">Pending scripts to grade (Mathematics)</p>
          </div>
          <div className="absolute inset-0 bg-secondary/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest">Send Due Date Reminders</p>
          </div>
        </div>

        {/* Notifications */}
        <div className="col-span-1 row-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Memo / Updates</span>
          <div className="mt-2">
            <p className="text-xs font-bold text-slate-800 leading-tight">Board meeting scheduled for Friday 4pm.</p>
            <p className="text-[9px] text-accent font-bold uppercase mt-1">Read Receipt Required</p>
          </div>
        </div>

        {/* Student List Preview */}
        <div className="col-span-1 row-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4">Class List (SS 3)</span>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {[
              { name: 'Adewale O.', avg: '94%', initial: 'AO', bg: 'bg-blue-50' },
              { name: 'Chioma E.', avg: '88%', initial: 'CE', bg: 'bg-blue-50' },
              { name: 'Ibrahim K.', avg: '97%', initial: 'IK', bg: 'bg-blue-50' },
              { name: 'Funke L.', avg: '99%', initial: 'FL', bg: 'bg-blue-50' },
            ].map((student, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center font-bold text-primary text-[10px] shrink-0 group-hover:border-secondary">
                  {student.initial}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold truncate leading-tight">{student.name}</p>
                  <p className="text-[9px] text-slate-500 uppercase">Avg Score: {student.avg}</p>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => navigate('/dashboard/attendance')}
            className="mt-4 w-full bg-primary text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all outline-none"
            id="dashboard-mark-attendance-btn"
          >
            Mark Attendance
          </button>
        </div>

        {/* Lesson Planning - Secondary Color Card */}
        <div className="col-span-2 row-span-2 bg-secondary rounded-2xl shadow-md p-6 text-white flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Teaching Schedule</span>
            <button className="text-[9px] border border-white/20 px-2 py-1 rounded font-bold uppercase tracking-tighter hover:bg-white/10 border-2">Add Lesson</button>
          </div>
          <div className="flex-1 space-y-4">
            {[
              { subject: 'Advanced Mathematics', time: '09:00 - 10:30', class: 'SS 3 Sci' },
              { subject: 'Physics Practical', time: '11:00 - 12:30', class: 'SS 2 Sci' },
              { subject: 'Further Mathematics', time: '14:00 - 15:30', class: 'SS 1 Sci' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <p className="text-xs font-bold mb-1">{item.subject}</p>
                <p className="text-[10px] font-medium opacity-60 uppercase tracking-tighter">{item.time} &middot; {item.class}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
            <p className="text-[9px] font-bold uppercase opacity-60">Next: Staff Review Meeting @ 16:00</p>
            <span className="text-[10px] bg-accent text-primary px-2 py-0.5 rounded font-bold uppercase">Staff Room B</span>
          </div>
        </div>

        {/* Resource Management */}
        <div className="col-span-1 row-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4">LMS Management</span>
          <div className="space-y-4 flex-1 overflow-hidden">
            <div 
              onClick={() => notifyLevel('assignment', 'New Assignment: SS3 Math', 'A new assignment on Algebra has been posted. Due in 3 days.')}
              className="border-l-2 pl-3 border-secondary py-1 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <p className="text-xs font-bold text-slate-900 leading-none">Upload New Notes</p>
            </div>
            <div 
              onClick={() => notifyLevel('assignment', 'New CBT Quiz', 'Mathematics CBT Quiz for JSS3 is now available.')}
              className="border-l-2 pl-3 border-primary py-1 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <p className="text-xs font-bold text-slate-900 leading-none">Create CBT Quiz</p>
            </div>
            <div 
              onClick={() => notifyLevel('grade', 'Results Released', 'First term mid-term results for SS3 Science are now available.')}
              className="border-l-2 pl-3 border-accent py-1 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <p className="text-xs font-bold text-slate-900 leading-none">Review Submissions</p>
            </div>
          </div>
          <div className="mt-auto">
            <div className="bg-slate-100 p-4 rounded-xl text-center mb-4 border border-slate-200/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Teaching Status</p>
              <p className="text-2xl font-black text-slate-800 font-display italic">Elite Rank</p>
            </div>
            <button className="w-full bg-slate-50 border border-slate-200 py-3 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:bg-slate-100 transition-all">
              Open LMS Panel
            </button>
          </div>
        </div>
      </div>

      {/* Semester Attendance & Regularity Analytics Graph */}
      {staffRecord && (
        <div className="bg-white rounded-[32px] border border-slate-200/80 shadow-md p-8 md:p-10 font-sans space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-150 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-primary" size={20} />
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Semester Analytics Dashboard</h3>
              </div>
              <p className="text-xs text-slate-500">
                Authorized visual inspection of punctuality and regularity curves across the last semester.
              </p>
            </div>
            
            {/* Select individual teacher */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">SELECT TEACHER:</span>
              <select
                value={chartTeacherId}
                onChange={(e) => setChartTeacherId(e.target.value)}
                className="bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white transition-all w-full md:w-56 cursor-pointer"
              >
                {teachersList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Teacher Trend overview */}
          {(() => {
            const selectedChartTeacher = teachersList.find(t => t.id === chartTeacherId) || staffRecord;
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
                
                {/* Minimal Details card for Selected Teacher */}
                <div className="lg:col-span-1 bg-slate-50/70 border border-slate-100 rounded-2xl p-6 flex flex-col justify-between space-y-6">
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
                        <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">Punctuality</span>
                        <span className="font-black text-primary bg-primary/5 px-2 py-0.5 rounded text-xs">{selectedChartTeacher.punctualityAttendance || '95%'}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100/60">
                        <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">Regularity</span>
                        <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">{selectedChartTeacher.regularityAttendance || '95%'}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100/60">
                        <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">Merit Rating</span>
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
                <div className="lg:col-span-3 bg-white border border-slate-150 rounded-2xl p-4 md:p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-5 px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Semester Trend Curve (%)</span>
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
                          <linearGradient id="colorPunctuality" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01}/>
                          </linearGradient>
                          <linearGradient id="colorRegularity" x1="0" y1="0" x2="0" y2="1">
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
                          className="font-semibold text-[10px]"
                        />
                        <YAxis 
                          domain={[50, 100]} 
                          tickLine={false}
                          axisLine={false}
                          stroke="#94a3b8"
                          className="font-semibold text-[10px]"
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
                          fill="url(#colorPunctuality)" 
                          activeDot={{ r: 6 }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="Regularity" 
                          stroke="#6366f1" 
                          strokeWidth={2.5}
                          fillOpacity={1} 
                          fill="url(#colorRegularity)" 
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

      {/* Staff Profile Dossier Panel */}
      {staffRecord && (
        <div className="bg-white rounded-[32px] border border-slate-200/80 shadow-md p-8 md:p-10 font-sans">
          
          {/* Header Area */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                {staffRecord.photoUrl ? (
                  <img src={staffRecord.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-3xl font-black text-slate-300 uppercase">{(staffRecord.name || 'P')[0]}</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full uppercase tracking-wider">{staffRecord.id}</span>
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full uppercase tracking-wider">OFFICIAL PROFILE</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mt-1 uppercase leading-tight">{staffRecord.name}</h2>
                <p className="text-xs text-slate-500 font-semibold">{staffRecord.role} &middot; {staffRecord.email}</p>
              </div>
            </div>
            
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 py-2.5 px-5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-primary hover:text-white transition-all uppercase tracking-wider border border-slate-200 hover:border-transparent cursor-pointer"
              >
                <Edit3 size={14} /> Edit Profile Dossier
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-2.5 px-5 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all uppercase tracking-wider border border-slate-200 cursor-pointer"
              >
                Discard & Exit
              </button>
            )}
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-150 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-bounce">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
              <p>{successMsg}</p>
            </div>
          )}

          {/* Body Section */}
          {!isEditing ? (
            <div className="mt-8 space-y-8">
              
              {/* Credentials / Particulars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-slate-600">
                
                {/* Appointment Date */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0 border border-blue-100 animate-pulse">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date of Appointment</span>
                    <span className="text-slate-800 font-extrabold text-sm">{staffRecord.dateOfAppointment || 'Not Set'}</span>
                  </div>
                </div>

                {/* Salary Particulars */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 border border-emerald-100">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Salary particulars</span>
                    <span className="text-slate-800 font-extrabold text-sm font-mono">{staffRecord.salary || 'Not Set'}</span>
                  </div>
                </div>

                {/* Awards */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors col-span-1 md:col-span-2 lg:col-span-1">
                  <div className="p-3 bg-amber-50 text-amber-500 rounded-xl shrink-0 border border-amber-100">
                    <Award size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Honorary Awards</span>
                    <span className="text-slate-800 font-extrabold text-sm">{staffRecord.award || 'No honors registered'}</span>
                  </div>
                </div>

                {/* Punctuality Rating */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 border border-indigo-100">
                    <Clock size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Punctuality Rating</span>
                    <span className="text-slate-800 font-extrabold text-sm">{staffRecord.punctualityAttendance || '95%'}</span>
                  </div>
                </div>

                {/* Regularity Rating */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="p-3 bg-violet-50 text-violet-600 rounded-xl shrink-0 border border-violet-100">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Regularity Rating</span>
                    <span className="text-slate-800 font-extrabold text-sm">{staffRecord.regularityAttendance || '95%'}</span>
                  </div>
                </div>

                {/* Performance Evaluation Score */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="p-3 bg-yellow-50 text-yellow-500 rounded-xl shrink-0 border border-yellow-100">
                    <Star size={18} className="fill-current" />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Teacher Merit Rating</span>
                    <span className="text-slate-800 font-extrabold text-sm">⭐ {staffRecord.rating || '5.0'} / 5.0</span>
                  </div>
                </div>

              </div>

              {/* General Staff Performance Review Section */}
              <div className="border border-slate-150 rounded-3xl p-6 bg-slate-50 space-y-3">
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                  <FileText size={12} /> Institutional Performance Review Commentaries
                </span>
                <p className="text-slate-700 italic font-medium leading-relaxed bg-white p-5 rounded-2xl border border-slate-100 text-sm">
                  "{staffRecord.review || 'No written performance evaluations generated yet.'}"
                </p>
              </div>

              {/* Basic Contact Info */}
              <div className="p-5 bg-slate-100/50 border border-slate-200/55 rounded-2xl flex flex-wrap gap-6 items-center text-xs justify-between">
                <div className="flex gap-6 flex-wrap">
                  <div>
                    <span className="text-slate-400 uppercase tracking-widest font-bold text-[8px] block">Contact Mobile</span>
                    <span className="text-slate-700 font-bold">{staffRecord.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-widest font-bold text-[8px] block">Institutional Mail</span>
                    <span className="text-slate-700 font-bold">{staffRecord.email}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-primary" /> Verified Enterprise Dossier
                </div>
              </div>

            </div>
          ) : (
            
            /* Editable Form Section */
            <form onSubmit={handleSaveProfile} className="mt-8 space-y-6 text-xs font-semibold text-slate-600">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Instructor Name</label>
                  <input 
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 p-3.5 rounded-xl text-slate-800 font-bold focus:bg-white focus:outline-none transition-colors border-2"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Educational Designation / Role</label>
                  <input 
                    type="text"
                    required
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 p-3.5 rounded-xl text-slate-800 font-bold focus:bg-white focus:outline-none transition-colors border-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Phone Contact</label>
                  <input 
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 p-3.5 rounded-xl text-slate-800 font-bold focus:bg-white focus:outline-none transition-colors border-2"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Appointment</label>
                  <input 
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 p-3.5 rounded-xl text-slate-800 font-bold focus:bg-white focus:outline-none transition-colors border-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Salary Particulars</label>
                  <input 
                    type="text"
                    value={editSalary}
                    onChange={(e) => setEditSalary(e.target.value)}
                    placeholder="e.g. ₦300,000 / month"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 p-3.5 rounded-xl text-slate-800 font-mono focus:bg-white focus:outline-none transition-colors border-2"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Honorary Awards</label>
                  <input 
                    type="text"
                    value={editAward}
                    onChange={(e) => setEditAward(e.target.value)}
                    placeholder="e.g. Teacher of the Year"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 p-3.5 rounded-xl text-slate-800 font-bold focus:bg-white focus:outline-none transition-colors border-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Punctuality Rating</label>
                  <input 
                    type="text"
                    value={editPunctuality}
                    onChange={(e) => setEditPunctuality(e.target.value)}
                    placeholder="e.g. 98%"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 p-3.5 rounded-xl text-slate-800 font-bold focus:bg-white focus:outline-none transition-colors border-2"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Regularity Rating</label>
                  <input 
                    type="text"
                    value={editRegularity}
                    onChange={(e) => setEditRegularity(e.target.value)}
                    placeholder="e.g. 99%"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 p-3.5 rounded-xl text-slate-800 font-bold focus:bg-white focus:outline-none transition-colors border-2"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Merit Assessment (1.0 - 5.0)</label>
                  <input 
                    type="text"
                    value={editRating}
                    onChange={(e) => setEditRating(e.target.value)}
                    placeholder="e.g. 4.9"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 p-3.5 rounded-xl text-slate-800 font-bold focus:bg-white focus:outline-none transition-colors border-2"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">General Staff Performance Review Evaluation Commentaries</label>
                <textarea 
                  value={editReview}
                  onChange={(e) => setEditReview(e.target.value)}
                  rows={4}
                  placeholder="Insert detailed professional goals, targets, feedback commentaries, and performance logs..."
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 p-4 rounded-xl text-slate-700 font-medium focus:bg-white focus:outline-none transition-colors border-2 line-height-relaxed"
                />
              </div>

              <div>
                <ImageUploader 
                  label="Staff Photograph File Upload"
                  currentUrl={editPhoto}
                  onUpload={setEditPhoto}
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)} 
                  className="py-3.5 px-6 bg-slate-100 text-slate-500 font-bold rounded-xl uppercase tracking-wider flex-1 cursor-pointer border border-slate-200 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                  Cancel Edits
                </button>
                <button 
                  type="submit" 
                  className="py-3.5 px-6 bg-primary text-white font-black rounded-xl uppercase tracking-wider flex-1 flex items-center justify-center gap-2 shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Save size={16} /> Save Dossier Changes
                </button>
              </div>

            </form>
          )}

        </div>
      )}

      {/* Dynamic Academic Management Controls for Teachers */}
      <AcademicManager />

    </div>
  );
}

export default function StaffDashboard() {
  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300 h-full">
      <Routes>
        <Route path="/" element={<StaffDashboardView />} />
        <Route path="/communications" element={<Communications />} />
        <Route path="/grading" element={<AcademicManager initialWorkspace="report" />} />
        <Route path="/materials" element={<AcademicManager initialWorkspace="lms" />} />
        <Route path="/attendance-teacher" element={<AcademicManager initialWorkspace="attendance" />} />
        <Route path="/attendance" element={<AttendanceTracker />} />
      </Routes>
    </div>
  );
}
