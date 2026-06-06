import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FileText, 
  Video, 
  UploadCloud, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  MessageCircle,
  HelpCircle,
  FolderMinus,
  Check,
  Download
} from 'lucide-react';
import ImageUploader from '../../../components/ImageUploader';

interface Assignment {
  id: string;
  subject: string;
  title: string;
  deadline: string;
  description: string;
  points: number;
  resources: string[];
  submitted: boolean;
  submitDate?: string;
  grade?: string;
  teacherRemarks?: string;
  studentSubmissionFile?: string;
}

interface LectureNote {
  id: string;
  subject: string;
  title: string;
  type: 'pdf' | 'video' | 'doc';
  sizeOrDuration: string;
  author: string;
  fileUrl?: string;
}

export default function LearningHub() {
  const [activeTab, setActiveTab] = useState<'syllabus' | 'assignments' | 'materials'>('assignments');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [lectures, setLectures] = useState<LectureNote[]>([]);
  const [syllabusItems, setSyllabusItems] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  
  // Custom uploader states
  const [commentText, setCommentText] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');

  useEffect(() => {
    // Populate or read from localStorage for consistency
    const saved = localStorage.getItem('ff_student_assignments');
    if (saved) {
      setAssignments(JSON.parse(saved));
    } else {
      const defaultAssignments: Assignment[] = [
        {
          id: 'ASN-01',
          subject: 'Mathematics',
          title: 'Calculus: Derivatives of Trigonometric Functions Worksheet',
          deadline: 'June 10, 2026',
          description: 'Apply basic chain rules and standard differentiation definitions to resolve questions 1 through 15 in Chapter 4 of the core workbook.',
          points: 20,
          resources: ['Differentiation formulas.pdf', 'Worksheet Chapter 4.docx'],
          submitted: false
        },
        {
          id: 'ASN-02',
          subject: 'Physics',
          title: 'Coulomb\'s Law electrostatic calculation drills',
          deadline: 'June 05, 2026',
          description: 'Perform advanced distance and force interactions audits between three distinct charged nodes at custom alignments. Show all mathematical process proofs.',
          points: 15,
          resources: ['Coulomb constant chart.pdf'],
          submitted: false
        },
        {
          id: 'ASN-03',
          subject: 'Chemistry',
          title: 'Periodic Table Alkaline Elements Reactivity Journal',
          deadline: 'May 28, 2026',
          description: 'Submit an itemized analytical laboratory journal comparing hydrogen liberation levels when exposing lithium up to potassium inside normal water.',
          points: 25,
          resources: [],
          submitted: true,
          submitDate: 'May 26, 2026',
          grade: '22 / 25',
          teacherRemarks: 'Excellent work. Lab report was meticulous, highly descriptive, and well-researched.'
        }
      ];
      setAssignments(defaultAssignments);
      localStorage.setItem('ff_student_assignments', JSON.stringify(defaultAssignments));
    }

    // Load static lectures list dynamically from localStorage
    const savedLectures = localStorage.getItem('ff_lecture_notes');
    if (savedLectures) {
      setLectures(JSON.parse(savedLectures));
    } else {
      const defaultLectures: LectureNote[] = [
        { id: 'LEC-01', subject: 'Mathematics', title: 'Quadratic Polynomial Equations Part II', type: 'pdf', sizeOrDuration: '2.4 MB', author: 'Dr. Adekunle Johnson' },
        { id: 'LEC-02', subject: 'Physics', title: 'Calculus approach to Electrostatic Flux definitions', type: 'video', sizeOrDuration: '18 mins video', author: 'Mrs. Funke Akindele' },
        { id: 'LEC-03', subject: 'Further Mathematics', title: 'Double Integrals over Polar Coordinates coordinates', type: 'pdf', sizeOrDuration: '4.1 MB', author: 'Dr. Adekunle Johnson' },
        { id: 'LEC-04', subject: 'Chemistry', title: 'Stoichiometry and volumetric analysis principles', type: 'pdf', sizeOrDuration: '1.8 MB', author: 'Mr. Jude Balogun' },
        { id: 'LEC-05', subject: 'English Language', title: 'Direct and Indirect Speech transformation rules', type: 'doc', sizeOrDuration: '800 KB', author: 'Mrs. Anita Charles' }
      ];
      setLectures(defaultLectures);
      localStorage.setItem('ff_lecture_notes', JSON.stringify(defaultLectures));
    }

    // Load static syllabus items dynamically from localStorage
    const savedSyllabus = localStorage.getItem('ff_syllabus_items');
    if (savedSyllabus) {
      setSyllabusItems(JSON.parse(savedSyllabus));
    } else {
      const defaultSyllabus = [
        { subject: 'Mathematics', topics: ['Linear Inequalities', 'Calculus (Limits, Derivatives, Integrals)', 'Coordinate Geometry', 'Trigonometry identities'], progress: 85 },
        { subject: 'Physics', topics: ['Electrostatics fields', 'Electromagnetic wave radiation', 'Atomic Physics model', 'Kinetics of fluids'], progress: 75 },
        { subject: 'Chemistry', topics: ['Organic Chemistry (Alkanes/Alkanols)', 'Gas Laws kinetics', 'Periodic Table periodicity', 'Electrochemical cells'], progress: 80 },
        { subject: 'Further Math', topics: ['Complex Numbers coordinates', 'Vector projections', 'Matrices & Determinants', 'Differential equations'], progress: 90 }
      ];
      setSyllabusItems(defaultSyllabus);
      localStorage.setItem('ff_syllabus_items', JSON.stringify(defaultSyllabus));
    }
  }, []);

  const handleOpenSubmission = (asgId: string) => {
    setSelectedAssignmentId(asgId);
    setCommentText('');
    setUploadedFileUrl('');
    setSuccessMsg('');
  };

  const handleUploadComplete = (url: string) => {
    setUploadedFileUrl(url);
  };

  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId) return;

    const updated = assignments.map(a => {
      if (a.id === selectedAssignmentId) {
        return {
          ...a,
          submitted: true,
          submitDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
          studentSubmissionFile: uploadedFileUrl || 'Uploaded_Written_Solution.pdf',
          teacherRemarks: 'Your instructor will evaluate this file shortly.'
        };
      }
      return a;
    });

    setAssignments(updated);
    localStorage.setItem('ff_student_assignments', JSON.stringify(updated));
    setSuccessMsg('Your assignment response file and review notes have been safely uploaded to active classroom queue!');
    
    // Clear modal after 3.5 seconds
    setTimeout(() => {
      setSelectedAssignmentId('');
      setSuccessMsg('');
    }, 3500);
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Top dashboard header banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <BookOpen size={20} />
            </span>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight uppercase">Learning Management System (LMS)</h2>
          </div>
          <p className="text-xs text-slate-500">
            Submit assignments, download lecture notes, access video recordings, and monitor topic completion curves.
          </p>
        </div>

        {/* Tab selection switches */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          {[
            { id: 'assignments', label: 'Assignments' },
            { id: 'materials', label: 'E-Materials' },
            { id: 'syllabus', label: 'Curriculum' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-black rounded-lg transition-all uppercase tracking-wider ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main assignments listing column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Available & Graded Homework Tasks</h3>
              
              <div className="space-y-4">
                {assignments.map((asg) => (
                  <div 
                    key={asg.id} 
                    className={`border rounded-2xl p-5 hover:border-slate-350 transition-all shadow-sm flex flex-col justify-between gap-4 ${
                      asg.submitted ? 'bg-slate-50/50' : 'bg-white'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                            {asg.subject}
                          </span>
                          <span className="text-slate-400 text-xs font-mono font-semibold">
                            {asg.id}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 tracking-tight leading-snug">{asg.title}</h4>
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                        {asg.submitted ? (
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black px-2.5 py-1 rounded uppercase flex items-center gap-1">
                            <Check size={12} /> Submitted
                          </span>
                        ) : (
                          <span className="bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black px-2.5 py-1 rounded uppercase flex items-center gap-1">
                            <Clock size={12} /> Action Needed
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed font-normal">{asg.description}</p>

                    {asg.resources.length > 0 && (
                      <div className="p-3 bg-white rounded-xl border border-slate-150">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Attached Helper Documents:</span>
                        <div className="flex flex-wrap gap-2">
                          {asg.resources.map((res, i) => (
                            <a 
                              key={i} 
                              href="#" 
                              onClick={(e) => { e.preventDefault(); alert(`Downloading helper document reference: ${res}`); }}
                              className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 font-mono uppercase bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100"
                            >
                              <FileText size={10} /> {res}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {asg.submitted && asg.grade && (
                      <div className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-150/60 text-xs mt-1">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-extrabold text-emerald-800 uppercase text-[9px] tracking-wider">Evaluation Gradesheet</span>
                          <span className="bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded text-xs font-mono">{asg.grade}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed italic">"{asg.teacherRemarks}"</p>
                      </div>
                    )}

                    {asg.submitted && !asg.grade && (
                      <div className="p-3 bg-slate-100/55 rounded-xl border border-slate-150 text-xs mt-1 flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider block">Submission Record</span>
                          <p className="text-[10px] text-slate-400 font-semibold italic mt-0.5">Uploaded answers file: {asg.studentSubmissionFile}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 bg-slate-100/10 px-2 rounded font-bold font-mono">Date: {asg.submitDate}</span>
                      </div>
                    )}

                    {!asg.submitted && (
                      <button 
                        onClick={() => handleOpenSubmission(asg.id)}
                        className="mt-2 w-full bg-primary hover:bg-opacity-95 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center shadow-md shadow-primary/15"
                      >
                        Start Upload Submission
                      </button>
                    )}

                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lateral quick details panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col space-y-5 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                <MessageCircle size={14} className="text-primary" />
                Study Group Help
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Need urgent assistance with dynamic calculus rules, organic mechanics, or agricultural experiments? Connect with school tutors or join peer circles.
              </p>
              <div className="space-y-3">
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); alert("Launching Virtual Science Hub Chat Room..."); }}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 rounded-xl hover:bg-slate-100 border border-slate-150/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🧪</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">SS3 Science Guild</h4>
                      <p className="text-[9px] text-slate-400">14 pupils active now</p>
                    </div>
                  </div>
                  <ExternalLink size={12} className="text-slate-400" />
                </a>

                <a 
                  href="tel:+2347034817051"
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 rounded-xl hover:bg-slate-100 border border-slate-150/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🌿</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Ask Dr. Adekunle</h4>
                      <p className="text-[9px] text-slate-400">Open for Math reviews</p>
                    </div>
                  </div>
                  <PhoneMsg />
                </a>
              </div>
            </div>

            <div className="bg-secondary rounded-3xl p-6 text-white space-y-4 shadow-md">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Institution Reminder</span>
              <p className="text-xs leading-relaxed font-bold">
                West African Senior School Certificate (WASSC) practice examinations start on the Computer-Based testing (CBT) portal next week! Make sure to take practice exams in Mathematics, General Studies and core Science.
              </p>
              <div className="text-[10px] bg-accent text-primary px-3 py-1 rounded inline-block font-black uppercase tracking-wider">
                Practice exams available now
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'materials' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-105 pb-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Lecture Slidenotes & Recorded Stream Resources</h3>
            <span className="text-xs text-slate-400 font-semibold">{lectures.length} files downloadable</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lectures.map((lec) => (
              <div key={lec.id} className="p-5 border border-slate-150 bg-slate-50/50 rounded-2xl hover:bg-slate-50/100 hover:border-slate-300 transition-all flex justify-between items-center group">
                <div className="space-y-1.5 max-w-[75%]">
                  <div className="flex items-center gap-2">
                    {lec.type === 'video' ? (
                      <span className="p-1.5 rounded-lg bg-orange-100 text-orange-600"><Video size={14} /></span>
                    ) : (
                      <span className="p-1.5 rounded-lg bg-blue-100 text-blue-600"><FileText size={14} /></span>
                    )}
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider font-mono">{lec.subject}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 leading-tight truncate uppercase" title={lec.title}>{lec.title}</h4>
                  <p className="text-[9px] text-slate-400 font-medium">Author/Instructor: {lec.author} &middot; <span className="font-mono">{lec.sizeOrDuration}</span></p>
                </div>
                {lec.fileUrl ? (
                  <a 
                    href={lec.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    download={lec.title}
                    className="bg-primary/10 text-primary hover:bg-primary hover:text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm"
                    title="Download Syllabus Attachment"
                  >
                    <Download size={14} />
                  </a>
                ) : (
                  <button 
                    onClick={() => alert(`Starting client offline cache buffer downloading: ${lec.title}`)}
                    className="bg-white group-hover:bg-primary group-hover:text-white border border-slate-200 group-hover:border-primary w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 transition-all shadow-sm"
                  >
                    <ExternalLink size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'syllabus' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-105 pb-3">SS3 Alpha Core Science Curriculum Coverage</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {syllabusItems.map((item, idx) => (
              <div key={idx} className="p-6 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-2.5">
                  <span className="font-extrabold text-slate-800 text-sm uppercase tracking-tight">{item.subject}</span>
                  <span className="text-xs font-black text-primary bg-blue-50 px-2 py-0.5 rounded font-mono">{item.progress}% Covered</span>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Core Subject Topics:</span>
                  <div className="grid grid-cols-1 gap-2">
                    {item.topics.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <span className="w-1.5 h-1.5 bg-primary/40 rounded-full shrink-0"></span>
                        <p>{t}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${item.progress}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignment Submit Modal Form overlay */}
      {selectedAssignmentId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white rounded-3xl shadow-xl border border-slate-150 max-w-lg w-full p-6 md:p-8 space-y-6 transition-all ${
            successMsg ? 'border-emerald-300' : ''
          }`}>
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">HIMODAL TRANSMISSION SYSTEM</span>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Assignment Response Uploader</h3>
              </div>
              <button 
                onClick={() => setSelectedAssignmentId('')}
                className="w-8 h-8 rounded-full bg-slate-50 border hover:bg-slate-100 transition-colors flex items-center justify-center text-slate-400 text-xs font-extrabold"
              >
                ✕
              </button>
            </div>

            {successMsg ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200">
                  <CheckCircle size={30} className="animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Transmission complete</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">{successMsg}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitAssignment} className="space-y-5 text-xs text-left">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Uploading for:</span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">
                    {assignments.find(a => a.id === selectedAssignmentId)?.title}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block font-black text-slate-700 uppercase tracking-wider">Solution Submission Comments:</label>
                  <textarea
                    required
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Hello Teacher. I have completed the exercise calculations carefully. Please find attached my PDF sheets..."
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 p-3 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 text-xs leading-relaxed"
                  ></textarea>
                </div>

                <div className="space-y-2">
                  <label className="block font-black text-slate-700 uppercase tracking-wider">Attach Solution Files (PDF or Images):</label>
                  <ImageUploader 
                    currentUrl={uploadedFileUrl}
                    onUpload={handleUploadComplete} 
                    label="Drop solution sheets here or browse local folders"
                  />
                  {uploadedFileUrl ? (
                    <p className="text-[10px] text-emerald-600 font-bold font-mono">✓ Attachment linked: {uploadedFileUrl.slice(-30)}...</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">No custom file uploaded. We will submit a mock certified solution file automatically.</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-opacity-95 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg shadow-primary/15 transition-all text-center"
                >
                  Confirm Submission Upload
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

// Private helper microcomponent
function PhoneMsg() {
  return (
    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors">
      <MessageCircle size={14} />
    </span>
  );
}
