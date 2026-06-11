import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Download,
  Brain,
  Cpu,
  Sparkles,
  ArrowLeft,
  Send,
  RefreshCw,
  Trophy,
  ArrowRight,
  BookOpenCheck,
  Award,
  Search,
  Filter,
  Book
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ImageUploader from '../../../components/ImageUploader';
import { useAuth } from '../../../contexts/AuthContext';

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
  gradeLevel?: string;
  isTextbook?: boolean;
  description?: string;
  uploadDate?: string;
}

interface AIQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function LearningHub() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'syllabus' | 'assignments' | 'materials'>('assignments');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [lectures, setLectures] = useState<LectureNote[]>([]);
  const [syllabusItems, setSyllabusItems] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');

  // Resource Repository Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedGrade, setSelectedGrade] = useState('All Grades');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'materials' | 'textbooks'>('all');
  
  // Custom uploader states
  const [commentText, setCommentText] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');

  // -------------------------------------------------------------
  // AI Study Companion & Interactive Player states
  // -------------------------------------------------------------
  const [activeStudyLecture, setActiveStudyLecture] = useState<LectureNote | null>(null);
  const [activeStudyTab, setActiveStudyTab] = useState<'content' | 'ai-tutor' | 'quiz'>('content');
  
  // AI Generation & Interaction States
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  // Interactive Quiz States
  const [aiQuiz, setAiQuiz] = useState<AIQuizQuestion[]>([]);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Gemini API Hook
  const apiKey = (process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY) as string;
  const ai = useMemo(() => {
    if (!apiKey || apiKey === 'null' || apiKey === 'undefined' || apiKey === '' || apiKey.length < 10) {
      return null;
    }
    try {
      return new GoogleGenAI({ apiKey });
    } catch (err: any) {
      console.warn("LearningHub Study AI: Failed to initialize AI SDK client", err);
      return null;
    }
  }, [apiKey]);

  // Robust default educational topics (matches Nigeria SS3 & Prim 6 Global curriculum guidelines)
  const defaultLectures: LectureNote[] = useMemo(() => [
    {
      id: 'LEC-CHEM-301',
      subject: 'Chemistry',
      title: 'Introduction to Organic Molecules & Alkanes',
      type: 'pdf',
      sizeOrDuration: '2.4 MB',
      author: 'Dr. Adebayo Adekunle',
      fileUrl: '#'
    },
    {
      id: 'LEC-PHYS-302',
      subject: 'Physics',
      title: 'Quantum Mechanical Models & Hydrogen Atom Spectrum',
      type: 'video',
      sizeOrDuration: '12:40 mins',
      author: 'Prof. Elizabeth Obi',
      fileUrl: '#'
    },
    {
      id: 'LEC-MATH-303',
      subject: 'Mathematics',
      title: 'Calculus: Deriving Fundamental Trigonometric Limits',
      type: 'pdf',
      sizeOrDuration: '1.8 MB',
      author: 'Engr. Simon Peters',
      fileUrl: '#'
    },
    {
      id: 'LEC-BIOL-304',
      subject: 'Biology',
      title: 'Recombinant DNA Technology & Gene Splice Syntheses',
      type: 'video',
      sizeOrDuration: '18:15 mins',
      author: 'Dr. Sarah Aremu',
      fileUrl: '#'
    }
  ], []);

  useEffect(() => {
    // Read from localStorage for consistency, default to empty arrays for real transaction checks only
    const saved = localStorage.getItem('ff_student_assignments');
    if (saved) {
      setAssignments(JSON.parse(saved));
    } else {
      setAssignments([]);
    }

    const savedLectures = localStorage.getItem('ff_lecture_notes');
    if (savedLectures && JSON.parse(savedLectures).length > 0) {
      setLectures(JSON.parse(savedLectures));
    } else {
      localStorage.setItem('ff_lecture_notes', JSON.stringify(defaultLectures));
      setLectures(defaultLectures);
    }

    const savedSyllabus = localStorage.getItem('ff_syllabus_items');
    if (savedSyllabus) {
      setSyllabusItems(JSON.parse(savedSyllabus));
    } else {
      setSyllabusItems([]);
    }
  }, [defaultLectures]);

  useEffect(() => {
    if (profile) {
      const cls = (profile.studentClass || profile.class || '').toUpperCase().trim();
      if (cls.includes('SS3') || cls.includes('SS 3')) {
        setSelectedGrade('SS3');
      } else if (cls.includes('SS2') || cls.includes('SS 2')) {
        setSelectedGrade('SS2');
      } else if (cls.includes('SS1') || cls.includes('SS 1')) {
        setSelectedGrade('SS1');
      } else if (cls.includes('JS3') || cls.includes('JS 3')) {
        setSelectedGrade('JS3');
      } else if (cls.includes('JS2') || cls.includes('JS 2')) {
        setSelectedGrade('JS2');
      } else if (cls.includes('JS1') || cls.includes('JS 1')) {
        setSelectedGrade('JS1');
      } else if (cls.includes('PRIMARY 6') || cls.includes('PRIM 6')) {
        setSelectedGrade('Primary 6');
      } else if (cls.includes('PRIMARY 5') || cls.includes('PRIM 5')) {
        setSelectedGrade('Primary 5');
      } else if (cls.includes('PRIMARY 4') || cls.includes('PRIM 4')) {
        setSelectedGrade('Primary 4');
      }
    }
  }, [profile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

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

  // -------------------------------------------------------------
  // Offline curriculum resource dictionary for instant answers
  // -------------------------------------------------------------
  const offlineDatabase: Record<string, { summary: string; quiz: AIQuizQuestion[] }> = {
    'LEC-CHEM-301': {
      summary: `### Organic Chemistry: Alkanes & Homologous Series

*   **Carbon's Tetravalency**: Carbon has four valence electrons, enabling it to form strong covalent bonds with up to four other atoms, structuring infinite molecular geometry.
*   **Saturated Hydrocarbons**: Alkanes contain only single covalent carbon-carbon bonds. Saturated chains favor stable, lower-energy configurations.
*   **General Formula**: Alkanes conform to $C_n H_{2n+2}$.
*   **Nomenclature Rules (IUPAC)**: 
    1. Identify the longest unbroken carbon chain (Parent chain).
    2. Number the carbons starting from the end closest to side-chains (substituents).
    3. List alkyl groups in alphabetical order (e.g. Methyl, Ethyl).
*   **Key Reactivity Parameters**: Saturated bonds are relatively inert but undergo combustion (highly exothermic) and photochemical substitution reactions with halogens under intensive UV rays.`,
      quiz: [
        {
          question: "What is the general chemical formula representing saturated Alkanes?",
          options: ["C_n H_{2n}", "C_n H_{2n-2}", "C_n H_{2n+2}", "C_n H_{2n+1}"],
          correctIndex: 2,
          explanation: "Conforming to methane (CH4) and ethane (C2H6), saturated alkanes adhere to C_n H_{2n+2}."
        },
        {
          question: "Which of the following describes the molecular geometric shape around a saturated carbon atom?",
          options: ["Trigonal Planar", "Linear", "Tetrahedral", "Hexagonal"],
          correctIndex: 2,
          explanation: "Saturated carbon bonds adopt sp3 hybridization, generating a tetrahedral spacing of 109.5 degrees."
        },
        {
          question: "What reactive gas is the primary operational component of natural gas (cooking fuels)?",
          options: ["Butane", "Methane", "Ethylene", "Propylene"],
          correctIndex: 1,
          explanation: "Methane (CH4) constitutes up to 90% of natural gas reserves globally."
        }
      ]
    },
    'LEC-PHYS-302': {
      summary: `### Quantum Mechanics & Hydrogen Spectra

*   **Bohr Atomic Specimen Grid**: Neils Bohr mapped atomic orbits where electrons exist at discrete mathematical intervals with specific orbital angular momentum.
*   **Emission Energy Rule**: Electron transitions from high orbital coordinates ($n_{upper}$) to lower coordinates ($n_{lower}$) unload excess electric energy as light waves.
*   **Rydberg Equation Calculation**: Mapped using the standard formula:
    $$\\frac{1}{\\lambda} = R_H \\left( \\frac{1}{n_1^2} - \\frac{1}{n_2^2} \\right)$$
*   **Spectral Wave Categories**:
    *   **Lyman Series**: Transitions crashing to ground level ($n = 1$). Emission falls in high-energy Ultraviolet spectrum.
    *   **Balmer Series**: Transitions stopping at ($n = 2$). Triggers visible rainbow colors.
    *   **Paschen Series**: Transitions ending at ($n = 3$). Infrared emissions.`,
      quiz: [
        {
          question: "Which spectral emission series corresponds to hydrogen transitions ending at quantum cell layer n = 2?",
          options: ["Lyman Series", "Balmer Series", "Paschen Series", "Brackett Series"],
          correctIndex: 1,
          explanation: "Balmer series emissions are centered around the visible spectrum range, key to experimental astronomy."
        },
        {
          question: "Who famously postulated that all matter exhibits wave-particle duality properties?",
          options: ["Albert Einstein", "Louis de Broglie", "Max Planck", "Heisenberg"],
          correctIndex: 1,
          explanation: "Louis de Broglie proposed mathematically that wavelength is Planck's constant divided by momentum (λ = h/p)."
        },
        {
          question: "The high-energy Lyman series emissions primarily fall into which electromagnetic spectrum division?",
          options: ["Infrared wavebands", "Visible Light spectrum", "Ultraviolet spectrum", "Roentgen X-Rays"],
          correctIndex: 2,
          explanation: "Because the n=1 ground state has a large energy transition gap (13.6 eV), Lyman waves are ultraviolet."
        }
      ]
    },
    'LEC-MATH-303': {
      summary: `### Calculus Trigonometric limits

*   **Fundamental Limit Proof**: The derivative equations for trigonometric functions hinge on proving the core theorem:
    $$\\lim_{\\theta \\to 0} \\frac{\\sin \\theta}{\\theta} = 1$$
*   **Squeeze Theorem Proof (Sandwich Theorem)**: Proved geometrically by comparison. By wrapping a sector area between coordinates:
    $$\\cos \\theta < \\frac{\\sin \\theta}{\\theta} < L(\\theta)$$
    As $\\theta \\to 0$, both boundaries squeeze the nested ratio exactly to 1.
*   **Secondary Fundamental Limit**:
    $$\\lim_{\\theta \\to 0} \\frac{1 - \\cos \\theta}{\\theta} = 0$$
*   **Application to Derivatives**: Used to prove that:
    $$\\frac{d}{dx}(\\sin x) = \\cos x, \\quad \\frac{d}{dx}(\\cos x) = -\\sin x$$`,
      quiz: [
        {
          question: "What is the limit of sin(x)/x as the independent variable x approaches 0?",
          options: ["0", "Infinity", "1", "Does not exist"],
          correctIndex: 2,
          explanation: "The limit equals 1, serving as the mathematical cornerstone for all trigonometric derivatives."
        },
        {
          question: "Which geometric comparison theorem is famously applied to define trigonometric limit proofs?",
          options: ["Mean Value Theorem", "Intermediate Value Theorem", "Sandwich/Squeeze Theorem", "Taylor Polynomial Series"],
          correctIndex: 2,
          explanation: "The Squeeze Theorem binds the sine ratio between cos(x) and 1, forcing convergence to 1 as x approaches 0."
        },
        {
          question: "What does the secondary calculus ratio of (1 - cos(x))/x evaluates to as x approaches 0?",
          options: ["1", "0", "0.5", "-1"],
          correctIndex: 1,
          explanation: "By multiplying by the conjugant (1 + cos(x)), it shifts to sin^2(x)/x(1+cos(x)), which converges to 0."
        }
      ]
    },
    'LEC-BIOL-304': {
      summary: `### Recombinant DNA Splicing

*   **Restriction Endonucleases (Molecular Scissors)**: Proteolytic enzymes extracted from bacteria that segment molecular nucleotide strands at specific, symmetrical palindromic target sequences (producing sticky or blunt ends).
*   **DNA Ligase (Molecular Glue)**: An engineering enzyme that rejoins segmented nucleotide fragments by rebuilding phosphodiester chemical backbones.
*   **Plasmids Vectors**: Circular, extrachromosomal bacterial DNA loops capable of independent replication inside microbial host systems. They carry target genes safely.
*   **PCR (Polymerase Chain Reaction)**: Rapidly compiles millions of matching gene replicas. Iteratively executes:
    1.  **Denaturation** (unzipping strands around 94°C)
    2.  **Annealing** (fusing primers around 55°C)
    3.  **Extension** (Taq polymerase synthesizing new chains around 72°C)`,
      quiz: [
        {
          question: "Which bio-engineered class of enzyme cuts target DNA strands at specific palindromic coordinates?",
          options: ["DNA Polymerase", "DNA Ligase", "Restriction Endonuclease", "Helicase Enzyme"],
          correctIndex: 2,
          explanation: "Restriction enzymes cut phosphodiester bonds at designated sequence hotspots (e.g. EcoRI)."
        },
        {
          question: "Which molecular helper functions to seal chemical gaps and fuse sticky ends?",
          options: ["Helicase", "Restriction Enzymes", "DNA Ligase", "Insulin Synthase"],
          correctIndex: 2,
          explanation: "DNA Ligase acts as biological glue, restoring sugar-phosphate backbones."
        },
        {
          question: "What is the secondary critical step of a PCR thermal cycle where primers bind to the single stranded target DNA?",
          options: ["Denaturation", "Annealing", "Extension", "Ligation"],
          correctIndex: 1,
          explanation: "Annealing occurs at around 50–65°C, enabling artificial primers to attach securely."
        }
      ]
    }
  };

  // Launch Classroom Active study session
  const startStudyingLecture = (lecture: LectureNote) => {
    setActiveStudyLecture(lecture);
    setActiveStudyTab('content');
    
    // Clear dynamic states
    setAiSummary('');
    setAiQuiz([]);
    setSelectedQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setChatMessages([
      { role: 'model', text: `Greetings Scholar! I am your AI Subject Mentor for ${lecture.subject}. I have mapped the academic slides for "${lecture.title}" by ${lecture.author}. How would you like to prepare today? Click Summarize, Quiz Me, or type anything below!` }
    ]);
    setChatInput('');
  };

  // -------------------------------------------------------------
  // Dynamic Gemini API triggers (falls back gracefully to offline database)
  // -------------------------------------------------------------
  const generateLectureSummary = async () => {
    if (!activeStudyLecture) return;
    setAiGenerating(true);

    try {
      if (ai) {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Summarize this syllabus topic for students at a high level. Subject: ${activeStudyLecture.subject}, Title: ${activeStudyLecture.title}, Instructor: ${activeStudyLecture.author}. Make it clear, concise, using bullet points and brief subsections.`,
          config: {
            systemInstruction: "You are a professional global-standard academic supervisor. Deliver beautiful, structural, academic summaries with markdown headers and clean bullet indicators. Avoid introductory conversational noise like 'Here is your summary'.",
            maxOutputTokens: 1000
          }
        });
        setAiSummary(response.text || "Failed to generate dynamic summary.");
      } else {
        // Safe high-fidelity fallback simulation
        await new Promise(resolve => setTimeout(resolve, 1200));
        const record = offlineDatabase[activeStudyLecture.id];
        setAiSummary(record?.summary || "Global standard curriculum notes are being fetched.");
      }
    } catch (err: any) {
      console.error(err);
      const record = offlineDatabase[activeStudyLecture.id];
      setAiSummary(record?.summary || `Error loading summary: ${err.message || err}`);
    } finally {
      setAiGenerating(false);
    }
  };

  const generateLectureQuiz = async () => {
    if (!activeStudyLecture) return;
    setAiGenerating(true);
    setQuizSubmitted(false);
    setSelectedQuizAnswers({});
    setQuizScore(null);

    try {
      if (ai) {
        const prompt = `Generate a 3-question multiple choice practice test about the topic: ${activeStudyLecture.title} (${activeStudyLecture.subject}). Provide the questions strictly in valid JSON structure.
        Format schema:
        [
          {
            "question": "question text",
            "options": ["A", "B", "C", "D"],
            "correctIndex": 0,
            "explanation": "why it is correct"
          }
        ]`;
        
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are an elite certified examination builder. Create rigorous multi-choice questions. Return ONLY the JSON array without any markdown wrappers.",
            responseMimeType: "application/json"
          }
        });

        const text = response.text || "[]";
        // Clean markdown wraps if returned despite instruction
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson) as AIQuizQuestion[];
        if (parsed && parsed.length > 0) {
          setAiQuiz(parsed);
        } else {
          throw new Error("Invalid format");
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 1200));
        const record = offlineDatabase[activeStudyLecture.id];
        setAiQuiz(record?.quiz || []);
      }
    } catch (err: any) {
      console.error("Quiz Gen Error, triggering fallback seed:", err);
      const record = offlineDatabase[activeStudyLecture.id];
      setAiQuiz(record?.quiz || []);
    } finally {
      setAiGenerating(false);
    }
  };

  const submitChatToMentor = async () => {
    if (!activeStudyLecture || !chatInput.trim() || aiGenerating) return;
    
    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');
    setAiGenerating(true);

    try {
      if (ai) {
        const historyContext = chatMessages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [...historyContext, { role: 'user', parts: [{ text: userText }] }],
          config: {
            systemInstruction: `You are 'Faith Foundation AI Tutor', an empathetic, highly intelligent, and structured academic mentor assisting a student in ${activeStudyLecture.subject}.
            Topic of Study: "${activeStudyLecture.title}".
            Answer student queries thoroughly yet concisely. Adhere to professional institutional guidelines. Use structural paragraphs, markdown bullet points for complex processes, and clear educational explanations.`,
            maxOutputTokens: 600
          }
        });
        setChatMessages(prev => [...prev, { role: 'model', text: response.text || "I apologize, my neural networks are reconciling records. Please ask that again shortly." }]);
      } else {
        // Smart simulated counselor logic
        await new Promise(resolve => setTimeout(resolve, 1500));
        let mentorResponse = `What an insightful question regarding "${activeStudyLecture.title}"! In academic standards, this is analyzed deeply. To master this for global standard exams, prepare structural revisions on definitions and double check previous study guide questions. Let's try matching a quick quiz if you are set!`;
        
        const lower = userText.toLowerCase();
        if (lower.includes('formula') || lower.includes('calculate')) {
          mentorResponse = `Great question about calculation rules. For ${activeStudyLecture.subject}, keeping core mathematical boundaries clear is crucial. Always verify the general coordinates and check the initial conditions strictly before evaluating algebraic limits or chemical coefficients.`;
        } else if (lower.includes('example') || lower.includes('describe')) {
          mentorResponse = `Certainly! For example under "${activeStudyLecture.title}", let's consider a practical implementation. In laboratory setups or geometric proofs, standard models require observing structural transitions sequentially. This ensures accurate validation.`;
        }
        
        setChatMessages(prev => [...prev, { role: 'model', text: mentorResponse }]);
      }
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'model', text: `An error occurred while connecting to the AI classroom server: ${err.message || err}` }]);
    } finally {
      setAiGenerating(false);
    }
  };

  // Evaluate solve state
  const handleSelectQuizAnswer = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    setSelectedQuizAnswers(prev => ({
      ...prev,
      [qIdx]: oIdx
    }));
  };

  const handleGradeQuiz = () => {
    if (!aiQuiz || aiQuiz.length === 0) return;
    
    let correct = 0;
    aiQuiz.forEach((q, idx) => {
      if (selectedQuizAnswers[idx] === q.correctIndex) {
        correct++;
      }
    });

    setQuizScore(correct);
    setQuizSubmitted(true);
    
    // Log academic activity and award achievement
    try {
      const achievementsStr = localStorage.getItem('ff_student_achievements') || '[]';
      const achievements = JSON.parse(achievementsStr);
      
      const newAchievement = {
        id: `ACH-QUIZ-${Date.now()}`,
        title: `AI Tutor Quiz Master`,
        details: `Successfully completed interactive prep quiz on '${activeStudyLecture?.title}' scoring ${correct}/${aiQuiz.length}.`,
        category: 'academic',
        date: new Date().toLocaleDateString(),
        points: correct * 10
      };
      
      localStorage.setItem('ff_student_achievements', JSON.stringify([newAchievement, ...achievements]));
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // ACTIVE STUDIO VIEW (Overlay interface)
  // -------------------------------------------------------------
  if (activeStudyLecture) {
    return (
      <div id="ai-study-arena" className="space-y-6 pb-16 animate-in fade-in zoom-in duration-300">
        
        {/* Top Control Navigation bar */}
        <div className="bg-slate-900 text-slate-100 p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveStudyLecture(null)}
              className="p-3 bg-slate-950 hover:bg-slate-800 rounded-2xl border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              title="Return to Catalog"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-primary/20 text-primary border border-primary/30 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded leading-none">
                  {activeStudyLecture.subject}
                </span>
                <span className="text-slate-400 font-mono text-[9px] font-semibold">{activeStudyLecture.id}</span>
              </div>
              <h2 className="text-sm md:text-base font-black text-white uppercase tracking-tight mt-1">{activeStudyLecture.title}</h2>
              <p className="text-[10px] text-slate-450">Session tutor: <span className="font-bold text-slate-200">{activeStudyLecture.author}</span></p>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setActiveStudyTab('content')}
              className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-center transition-all ${
                activeStudyTab === 'content'
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-slate-950 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              Lesson Desk
            </button>
            <button
              onClick={() => {
                setActiveStudyTab('ai-tutor');
                if (!aiSummary) {
                  generateLectureSummary();
                }
              }}
              className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-all ${
                activeStudyTab === 'ai-tutor'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-slate-950 border border-slate-850 text-slate-450 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Sparkles size={13} className="text-violet-400" />
              AI Tutor
            </button>
            <button
              onClick={() => {
                setActiveStudyTab('quiz');
                if (aiQuiz.length === 0) {
                  generateLectureQuiz();
                }
              }}
              className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-all ${
                activeStudyTab === 'quiz'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-950 border border-slate-850 text-slate-450 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Cpu size={13} className="text-emerald-400" />
              Quick Quiz
            </button>
          </div>
        </div>

        {/* Custom API Key warning banner for premium learning capability */}
        {!apiKey && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3.5 text-xs text-amber-700 font-medium">
            <span className="text-sm mt-0.5">💡</span>
            <div className="space-y-0.5">
              <p className="font-bold uppercase text-[9px] tracking-wider text-amber-600">Simulating Offline AI Engine</p>
              <p className="leading-relaxed">Faith Portal is operating in offline mode. AI outputs are powered by high-yield pre-cached local curriculum reference tables. Set a valid <span className="font-mono bg-amber-500/15 px-1 py-0.5 rounded font-bold text-amber-800">GEMINI_API_KEY</span> in Settings to query the live generative intelligence network.</p>
            </div>
          </div>
        )}

        {/* Main Work Area Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Left Workspace Column (Syllabus Reader / Slides Player) */}
          <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-200/80 shadow-md p-6 md:p-8 flex flex-col justify-between">
            <div className="space-y-6 w-full">
              <div className="flex items-center justify-between border-b pb-4">
                <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                  <BookOpenCheck size={14} className="text-primary" /> Active Syllabus Desk
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider block">
                  Status: Active Learning
                </span>
              </div>

              {activeStudyLecture.type === 'video' ? (
                <div className="space-y-4">
                  {/* Edu-Stream Video Player Screen Mock */}
                  <div className="relative aspect-video bg-slate-950 border border-slate-900 rounded-[2rem] overflow-hidden group flex items-center justify-center">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent)] pointer-events-none" />
                    
                    {/* Simulated Player Controls */}
                    <div className="text-center z-10 space-y-3 p-4">
                      <div className="w-16 h-16 bg-primary/20 hover:bg-primary/30 border-2 border-primary/50 text-white rounded-full flex items-center justify-center mx-auto transition-transform group-hover:scale-110 cursor-pointer shadow-xl">
                        <Video size={28} fill="currentColor" className="text-primary translate-x-0.5" />
                      </div>
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest font-mono">Lecture stream loaded &bull; {activeStudyLecture.sizeOrDuration}</p>
                      <p className="text-[10.5px] text-slate-500 max-w-sm mx-auto">Click play button to trigger bandwidth buffers and stream academic syllabus highlights instantly.</p>
                    </div>

                    {/* Timeline bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-slate-900/80 p-3 flex items-center gap-3 border-t border-slate-800 px-5 text-slate-400 text-[10px] font-mono">
                      <span>00:00</span>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden relative cursor-pointer">
                        <div className="absolute top-0 left-0 bottom-0 w-1/4 bg-primary rounded-full" />
                      </div>
                      <span>{activeStudyLecture.sizeOrDuration}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Active Curriculum Lesson Highlights</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal mt-1.5">
                      This digital course was recorded by specialized academic lead instructors for Faith Foundation. This educational unit targets crucial sub-chapters representing Oyo State joint examinations and international standard university preparations.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Digital Document Slides Mock */}
                  <div className="bg-slate-50 border border-slate-150 rounded-[2rem] p-6 md:p-8 space-y-6 flex flex-col justify-between min-h-[350px]">
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
                        <FileText size={22} />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest font-mono">Academic PDF Slide deck</h4>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">{activeStudyLecture.title}</h3>
                        <p className="text-xs text-slate-500">Document size: <span className="font-mono font-bold">{activeStudyLecture.sizeOrDuration}</span> &middot; Pages reference: 24 Chapters</p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-150 flex items-center justify-between text-xs gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
                        <div>
                          <p className="font-bold text-slate-800">Ready for digital inspection</p>
                          <p className="text-[10px] text-slate-450 leading-none mt-0.5">Click download button to export local PDF files.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => alert(`Starting download segment for ${activeStudyLecture.title}...`)}
                        className="bg-primary text-white hover:bg-opacity-95 font-bold uppercase tracking-widest text-[10px] px-4 py-2.5 rounded-xl cursor-pointer shadow-sm shadow-primary/10 flex items-center gap-1.5"
                      >
                        <Download size={12} /> Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Faith Foundation Curriculum Grid</span>
              <span className="font-mono">Checked standard: International CIE / WAEC</span>
            </div>
          </div>

          {/* Right Workspace Column (Dual Active Hub: Summary + AI Chat / Quiz) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* AI Generator / Chat workspace tab view */}
            {activeStudyTab === 'content' && (
              <div className="bg-slate-900 text-slate-100 p-6 md:p-8 rounded-[2rem] border border-slate-800 shadow-xl space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-mono text-[9px] uppercase font-black tracking-widest leading-none border-b border-slate-800 pb-3">
                    <Brain size={14} /> Classroom Prep Desk
                  </div>
                  <h3 className="text-sm font-black text-white mt-1.5 uppercase tracking-tight">Active Reading Support</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Access secondary study modes. Use the top navigation tab selectors to toggle the **Intelligent AI Tutor** sidebar to ask questions to the material tutor, or launch a **Syllabus Practice Quiz** to evaluate active topics immediately!
                  </p>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-3 text-xs">
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block">Available Smart Features:</span>
                    <div className="space-y-2">
                      <div className="flex gap-2.5 items-start text-[11px] text-slate-300">
                        <span className="text-indigo-400 font-bold mt-0.5">✓</span>
                        <p><span className="font-bold text-white uppercase text-[10px] tracking-wide block">1. Dynamic summaries</span> Highlights main formulas and theories instantly.</p>
                      </div>
                      <div className="flex gap-2.5 items-start text-[11px] text-slate-300">
                        <span className="text-indigo-400 font-bold mt-0.5">✓</span>
                        <p><span className="font-bold text-white uppercase text-[10px] tracking-wide block">2. conversational mentor</span> Chat directly with AI programmed in specific course details.</p>
                      </div>
                      <div className="flex gap-2.5 items-start text-[11px] text-slate-300">
                        <span className="text-indigo-400 font-bold mt-0.5">✓</span>
                        <p><span className="font-bold text-white uppercase text-[10px] tracking-wide block">3. automated examination quizzes</span> Take diagnostic exams to earn curriculum points.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <button
                    onClick={() => {
                      setActiveStudyTab('ai-tutor');
                      if(!aiSummary) generateLectureSummary();
                    }}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white font-black text-xs uppercase tracking-widest py-4 px-6 rounded-2xl flex items-center justify-center gap-2 select-none shadow-xl cursor-pointer"
                  >
                    Launch Interactive AI Buddy <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setActiveStudyTab('quiz');
                      if(aiQuiz.length === 0) generateLectureQuiz();
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-750 text-emerald-400 font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-2xl border border-emerald-500/10 flex items-center justify-center gap-2 select-none cursor-pointer"
                  >
                    Start practice quiz
                  </button>
                </div>
              </div>
            )}

            {/* AI TUTOR CHAT & SUMMARIZER VIEW */}
            {activeStudyTab === 'ai-tutor' && (
              <div className="bg-slate-900 border border-slate-800 shadow-xl rounded-[2rem] p-6 flex flex-col justify-between h-[520px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                
                {/* Chat header area */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 relative z-10 shrink-0">
                  <span className="text-xs font-black uppercase text-white flex items-center gap-1.5 font-sans">
                    <Sparkles size={14} className="text-violet-400 animate-pulse" /> Direct Study Mentor
                  </span>
                  <button 
                    onClick={generateLectureSummary}
                    disabled={aiGenerating}
                    className="text-[9px] font-black uppercase text-slate-400 hover:text-white flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded border border-slate-850 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={10} className={aiGenerating ? "animate-spin" : ""} /> Re-Summarize Notes
                  </button>
                </div>

                {/* Messages Panel or Markdown Notes */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4 relative z-10 pr-1 text-slate-300">
                  {aiGenerating && chatMessages.length <= 1 && !aiSummary ? (
                    <div className="h-full flex items-center justify-center flex-col text-center space-y-3">
                      <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                      <p className="text-[10px] text-slate-450 uppercase font-black tracking-widest">Active Neural Scan Splicing...</p>
                      <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed">AI is parsing core lecture slides and assembling high-yield summaries.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary Segment accordion block */}
                      {aiSummary && (
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2 text-xs">
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block border-b border-slate-900 pb-1 flex items-center gap-1">
                            <FileText size={11} /> Synthesized Lecture Outline
                          </span>
                          <div className="max-h-[160px] overflow-y-auto space-y-3 pr-1 text-slate-300 text-[11px] leading-relaxed select-text font-normal">
                            {aiSummary.split('\n').map((line, idx) => {
                              if (line.startsWith('###') || line.startsWith('##')) {
                                return <h4 key={idx} className="font-sans font-bold text-xs uppercase text-white mt-3 mb-1.5">{line.replace(/^#+\s*/, '')}</h4>;
                              }
                              if (line.startsWith('*')) {
                                return (
                                  <div key={idx} className="flex gap-2 items-start mt-1">
                                    <span className="text-indigo-400 font-extrabold mt-0.5">•</span>
                                    <span>{line.replace(/^\*\s*/, '')}</span>
                                  </div>
                                );
                              }
                              return <p key={idx} className="mt-1">{line}</p>;
                            })}
                          </div>
                        </div>
                      )}

                      {/* Conversational timeline */}
                      <div className="space-y-3 pt-2">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Conversation history:</span>
                        {chatMessages.map((msg, i) => (
                          <div 
                            key={i} 
                            className={`flex gap-2.5 items-start max-w-[90%] p-3 rounded-2xl text-[11px] leading-relaxed ${
                              msg.role === 'user' 
                                ? 'bg-primary/25 border border-primary/10 text-white ml-auto flex-row-reverse' 
                                : 'bg-slate-950 border border-slate-850 text-slate-300 mr-auto'
                            }`}
                          >
                            <span className="text-sm shrink-0 leading-none">{msg.role === 'user' ? '👤' : '🤖'}</span>
                            <div className="space-y-1 font-normal">
                              <p className="font-sans text-[8px] uppercase tracking-wider text-slate-500 font-black">{msg.role === 'user' ? 'Student Workspace' : 'AI Study Mentor'}</p>
                              <p className="text-[11.5px] leading-relaxed">{msg.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div ref={scrollRef} />
                    </div>
                  )}
                </div>

                {/* Input Text Form Area */}
                <form 
                  onSubmit={(e) => { e.preventDefault(); submitChatToMentor(); }}
                  className="pt-3 border-t border-slate-800 relative z-10 shrink-0 flex gap-2"
                >
                  <input 
                    type="text"
                    disabled={aiGenerating}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask standard questions (e.g. explain formula)..."
                    className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-650 focus:outline-none focus:border-indigo-500/50 transition-all font-sans"
                  />
                  <button 
                    type="submit"
                    disabled={aiGenerating || !chatInput.trim()}
                    className="px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer hover:opacity-90 active:scale-95 disabled:opacity-40"
                  >
                    {aiGenerating ? <RefreshCw size={14} className="animate-spin text-white" /> : <Send size={14} />}
                  </button>
                </form>
              </div>
            )}

            {/* DYNAMIC QUIZ WORK AREA PANEL */}
            {activeStudyTab === 'quiz' && (
              <div className="bg-slate-900 border border-slate-800 shadow-xl rounded-[2rem] p-6 flex flex-col justify-between h-[520px] relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Quiz header segment */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 relative z-10 shrink-0">
                  <span className="text-xs font-black uppercase text-white flex items-center gap-1.5 font-sans">
                    <Trophy size={14} className="text-emerald-400" /> Syllabus Practice Quiz
                  </span>
                  <button 
                    onClick={generateLectureQuiz}
                    disabled={aiGenerating}
                    className="text-[9px] font-black uppercase text-slate-400 hover:text-white flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded border border-slate-850 cursor-pointer"
                  >
                    <RefreshCw size={10} /> Dynamic Re-Gen
                  </button>
                </div>

                {/* Questions Body panel scroll */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4 relative z-10">
                  {aiGenerating ? (
                    <div className="h-full flex items-center justify-center flex-col text-center space-y-3">
                      <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                      <p className="text-[10px] text-slate-450 uppercase font-black tracking-widest">Compiling questions pool...</p>
                      <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed">Academic exam generators are constructing custom multiple-choice test segments.</p>
                    </div>
                  ) : aiQuiz.length === 0 ? (
                    <div className="h-full flex items-center justify-center flex-col text-center space-y-2 text-slate-500">
                      <span>⏱</span>
                      <p className="text-xs font-black uppercase text-slate-400">Quiz not generated yet</p>
                      <button 
                        onClick={generateLectureQuiz}
                        className="p-3 bg-slate-950 text-emerald-400 font-bold uppercase rounded-lg text-[9px] border border-slate-850 mt-1"
                      >
                        Compile Quiz Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Interactive Questions cards */}
                      {aiQuiz.map((q, qIdx) => (
                        <div key={qIdx} className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3 text-xs">
                          <div className="flex justify-between gap-1 items-start">
                            <span className="text-indigo-400 font-mono font-black shrink-0 text-[10.5px]">QUESTION 0{qIdx + 1}:</span>
                            <span className="text-slate-500 text-[10px] font-mono whitespace-nowrap font-bold">10 Points</span>
                          </div>
                          <p className="text-slate-100 font-bold leading-normal text-[12px]">{q.question}</p>
                          
                          {/* Option circles list */}
                          <div className="grid grid-cols-1 gap-2 pt-1">
                            {q.options.map((opt, oIdx) => {
                              const isSelected = selectedQuizAnswers[qIdx] === oIdx;
                              const isCorrect = q.correctIndex === oIdx;
                              let borderClass = 'border-slate-850 bg-slate-900/40 text-slate-300';
                              
                              if (isSelected) {
                                borderClass = 'border-indigo-500 bg-indigo-500/10 text-white';
                              }
                              
                              if (quizSubmitted) {
                                if (isCorrect) {
                                  borderClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-black';
                                } else if (isSelected) {
                                  borderClass = 'border-rose-500 bg-rose-500/10 text-rose-400';
                                } else {
                                  borderClass = 'border-slate-900 bg-slate-950 opacity-40 text-slate-600';
                                }
                              }

                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() => handleSelectQuizAnswer(qIdx, oIdx)}
                                  disabled={quizSubmitted}
                                  className={`w-full text-left p-3 rounded-xl border text-[11px] leading-relaxed transition-all cursor-pointer flex gap-1.5 items-center ${borderClass}`}
                                >
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-colors shrink-0 ${
                                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                                  }`}>
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span className="flex-1">{opt}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Post-submit explanations banner */}
                          {quizSubmitted && (
                            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-900 text-[10.5px] leading-relaxed text-slate-450 mt-1">
                              <span className="font-black text-[9px] uppercase tracking-wider text-amber-500 font-sans block mb-0.5">Explanation:</span>
                              <p className="italic">"{q.explanation}"</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score indicators or Grade execution handlers */}
                {aiQuiz.length > 0 && (
                  <div className="pt-3 border-t border-slate-800 relative z-10 shrink-0">
                    {quizSubmitted ? (
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🏆</span>
                          <div>
                            <p className="font-sans font-black uppercase text-[8.5px] tracking-wider text-slate-500">Evaluation complete</p>
                            <p className="text-[11px] font-bold text-slate-300">Grade Score: <span className="text-emerald-400 font-black text-xs font-mono">{quizScore} / {aiQuiz.length}</span> ({(quizScore ?? 0) * 10} Syllabus Points earned)</p>
                          </div>
                        </div>
                        <button 
                          onClick={generateLectureQuiz}
                          className="bg-slate-800 hover:bg-slate-750 text-white text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-lg cursor-pointer"
                        >
                          Retry Practice
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={handleGradeQuiz}
                        disabled={Object.keys(selectedQuizAnswers).length < aiQuiz.length}
                        className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 hover:opacity-95 text-white font-black text-xs uppercase tracking-widest py-4 px-6 rounded-2xl flex items-center justify-center gap-1.5 shadow-xl disabled:opacity-40 cursor-pointer select-none"
                      >
                        <CheckCircle size={14} /> Finish & Grade Classroom Exam
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // Extract unique subjects loaded in student repository
  const availableSubjects = useMemo(() => {
    const list = new Set<string>();
    lectures.forEach(l => {
      if (l.subject) list.add(l.subject);
    });
    return ['All Subjects', ...Array.from(list)];
  }, [lectures]);

  // Compute filtered materials & textbooks
  const filteredLectures = useMemo(() => {
    return lectures.filter(lec => {
      // 1. Text Search query
      const query = searchQuery.toLowerCase().trim();
      const matchText = !query || 
        (lec.title || '').toLowerCase().includes(query) ||
        (lec.author || '').toLowerCase().includes(query) ||
        (lec.subject || '').toLowerCase().includes(query) ||
        (lec.description || '').toLowerCase().includes(query);

      // 2. Subject select
      const matchSubject = selectedSubject === 'All Subjects' || 
        (lec.subject || '').toLowerCase().trim() === selectedSubject.toLowerCase().trim();

      // 3. Grade select
      const matchGrade = selectedGrade === 'All Grades' || 
        (lec.gradeLevel || 'SS3').toLowerCase().trim() === selectedGrade.toLowerCase().trim();

      // 4. Category select
      const matchCategory = selectedCategory === 'all' || 
        (selectedCategory === 'textbooks' && lec.isTextbook) || 
        (selectedCategory === 'materials' && !lec.isTextbook);

      return matchText && matchSubject && matchGrade && matchCategory;
    });
  }, [lectures, searchQuery, selectedSubject, selectedGrade, selectedCategory]);

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
                {assignments.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="text-3xl">📝</div>
                    <p className="text-xs font-black uppercase text-slate-800 tracking-wider">No assignments available.</p>
                    <p className="text-[10px] text-slate-450 max-w-xs mx-auto font-semibold leading-relaxed">There are currently no take-home assignments or homework tasks assigned to your classroom group.</p>
                  </div>
                ) : (
                  assignments.map((asg) => (
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

                      {asg.resources && asg.resources.length > 0 && (
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
                            <p className="text-[10px] text-slate-450 mt-0.5">Uploaded answers file: {asg.studentSubmissionFile?.slice(-30)}...</p>
                          </div>
                          <span className="text-[10px] text-slate-500 bg-slate-150 px-2 rounded font-bold font-mono">Date: {asg.submitDate}</span>
                        </div>
                      )}

                      {!asg.submitted && (
                        <button 
                          onClick={() => handleOpenSubmission(asg.id)}
                          className="mt-2 w-full bg-primary hover:bg-opacity-95 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center shadow-md shadow-primary/15 cursor-pointer"
                        >
                          Start Upload Submission
                        </button>
                      )}

                    </div>
                  ))
                )}
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
                        <p className="text-[9px] text-slate-450">14 pupils active now</p>
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
                        <p className="text-[9px] text-slate-450">Open for Math reviews</p>
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
          {/* Repository Section Intro Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-violet-505" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  📚 Digitized Course Books & Resource Repository
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Search, filter, and inspect curriculum textbook files and lecture presentations mapped to specified grades to support self-paced blended education.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 bg-slate-50 border border-slate-150 px-3.5 py-1.5 rounded-xl text-slate-500 font-mono font-black uppercase text-[10px]">
              <Book size={12} className="text-violet-500" />
              <span>{lectures.length} catalog references</span>
            </div>
          </div>

          {/* Dynamic Repository Controls Deck */}
          <div className="bg-slate-50/75 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-1.5 text-slate-700 font-black uppercase text-[10px] tracking-wider mb-1">
              <Filter size={11} className="text-primary" />
              <span>Filter Educational Catalogs</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Keyword text search */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-405 pointer-events-none">
                  <Search size={13} className="text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Query titles, instructor, synopsis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-semibold placeholder:text-slate-400 text-slate-800 transition-all shadow-sm"
                />
              </div>

              {/* Subject dropdown */}
              <div className="relative">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3.5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-bold text-slate-700 cursor-pointer shadow-sm"
                >
                  {availableSubjects.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              {/* Grade Level dropdown */}
              <div className="relative">
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3.5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-bold text-slate-700 cursor-pointer shadow-sm"
                >
                  <option value="All Grades">All Classes & Grades (General)</option>
                  <option value="SS3">Senior Secondary 3 (SS3)</option>
                  <option value="SS2">Senior Secondary 2 (SS2)</option>
                  <option value="SS1">Senior Secondary 1 (SS1)</option>
                  <option value="JS3">Junior Secondary 3 (JS3)</option>
                  <option value="JS2">Junior Secondary 2 (JS2)</option>
                  <option value="JS1">Junior Secondary 1 (JS1)</option>
                  <option value="Primary 6">Primary School 6</option>
                  <option value="Primary 5">Primary School 5</option>
                  <option value="Primary 4">Primary School 4</option>
                </select>
              </div>
            </div>

            {/* Segmented Category Toggles on formatting */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mr-2">Category:</span>
              {[
                { id: 'all', label: 'All Catalog' },
                { id: 'textbooks', label: '📖 Primary Textbooks' },
                { id: 'materials', label: '📝 Study Handouts / Presentations' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 border'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Clear Filters alert ribbon */}
            {(searchQuery !== '' || selectedSubject !== 'All Subjects' || selectedGrade !== 'All Grades' || selectedCategory !== 'all') && (
              <div className="flex justify-between items-center bg-violet-50/50 p-2.5 rounded-xl border border-violet-100 text-[10px] text-violet-700 font-extrabold uppercase tracking-wider">
                <span>Currently showing matched items ({filteredLectures.length} of {lectures.length} files matched)</span>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSubject('All Subjects');
                    setSelectedGrade('All Grades');
                    setSelectedCategory('all');
                  }}
                  className="text-violet-700 underline font-black uppercase tracking-widest cursor-pointer hover:text-violet-900"
                >
                  Reset Active Filters
                </button>
              </div>
            )}
          </div>

          {/* Catalog Items Listing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredLectures.length === 0 ? (
              <div className="col-span-1 md:col-span-2 text-center py-16 space-y-4 border border-dashed rounded-3xl bg-slate-50/40">
                <div className="text-4xl animate-pulse">📁</div>
                <p className="text-xs font-black uppercase text-slate-800 tracking-wider">No matching resources found.</p>
                <p className="text-[10px] text-slate-450 max-w-sm mx-auto font-medium leading-relaxed">
                  No materials or textbooks matched your current combination of query parameters, subjects, and grade levels. Try selecting another filter or clearing criteria.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSubject('All Subjects');
                    setSelectedGrade('All Grades');
                    setSelectedCategory('all');
                  }}
                  className="bg-primary/10 hover:bg-primary/15 text-primary font-black uppercase text-[10px] tracking-widest px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Display Whole Catalog
                </button>
              </div>
            ) : (
              filteredLectures.map((lec) => (
                <div 
                  key={lec.id} 
                  className="p-5 border border-slate-205 bg-white rounded-3xl hover:border-violet-300 hover:shadow-md transition-all flex flex-col justify-between gap-4 group hover:scale-[1.01] relative"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {lec.type === 'video' ? (
                          <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600"><Video size={13} /></span>
                        ) : (
                          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><FileText size={13} /></span>
                        )}
                        <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono tracking-wider">{lec.subject}</span>
                        <span className="text-[9px] font-black uppercase bg-violet-50 text-violet-600 px-2 py-0.5 rounded font-mono tracking-wider">{lec.gradeLevel || 'SS3'}</span>
                      </div>

                      {lec.isTextbook ? (
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse">📖 Textbook</span>
                      ) : (
                        <span className="text-[9px] font-black text-slate-400 font-mono uppercase tracking-widest">Handout</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-800 leading-snug uppercase tracking-tight group-hover:text-primary transition-colors">
                        {lec.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-normal font-sans text-left line-clamp-2">
                        {lec.description || 'This digital blended resource supports high school students in consolidating topic scope and testing syllabus completion curves.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[9px] text-slate-400 font-semibold">
                    <div className="space-y-0.5">
                      <p className="uppercase">Lead Instructor: <span className="font-bold text-slate-600">{lec.author}</span></p>
                      <p className="uppercase">File parameters: <span className="font-mono font-bold text-slate-600">{lec.sizeOrDuration}</span> &middot; <span className="font-mono">{lec.type.toUpperCase()}</span></p>
                    </div>
                    
                    {/* Action button deck */}
                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(`Initiating download for reference: ${lec.title}\nFormat: ${lec.type.toUpperCase()}\nSize: ${lec.sizeOrDuration}\nSecure transmission completed!`);
                        }}
                        className="p-2 border rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-black transition-colors shrink-0 cursor-pointer"
                        title="Download Document to local storage"
                      >
                        <Download size={13} />
                      </button>

                      <button
                        onClick={() => startStudyingLecture(lec)}
                        className="px-3.5 py-2 rounded-xl bg-primary hover:bg-opacity-95 text-white font-black uppercase tracking-widest text-[9px] flex items-center gap-1 cursor-pointer transition-all shrink-0"
                      >
                        <span>Study AI Room</span>
                        <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'syllabus' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Alpha Core Science Curriculum Coverage</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {syllabusItems.length === 0 ? (
              <div className="col-span-1 md:col-span-2 text-center py-12 space-y-3">
                <div className="text-3xl">🎯</div>
                <p className="text-xs font-black uppercase text-slate-800 tracking-wider">No curriculum progress recorded</p>
                <p className="text-[10px] text-slate-450 max-w-xs mx-auto font-semibold leading-relaxed">Curriculum tracking charts and covered subject matrices will display here once academic targets are set.</p>
              </div>
            ) : (
              syllabusItems.map((item, idx) => (
                <div key={idx} className="p-6 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-2.5">
                    <span className="font-extrabold text-slate-800 text-sm uppercase tracking-tight">{item.subject}</span>
                    <span className="text-xs font-black text-primary bg-blue-50 px-2 py-0.5 rounded font-mono">{item.progress}% Covered</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Core Subject Topics:</span>
                    <div className="grid grid-cols-1 gap-2">
                      {item.topics.map((t: string, i: number) => (
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
              ))
            )}
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
                className="w-8 h-8 rounded-full bg-slate-50 border hover:bg-slate-100 transition-colors flex items-center justify-center text-slate-400 text-xs font-extrabold cursor-pointer"
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
                    placeholder="Hello Teacher. I have completed the exercise calculations carefully... "
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
                    <p className="text-[10px] text-slate-400 italic">No custom file uploaded. You can type response remarks and confirm submission below.</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-opacity-95 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg shadow-primary/15 transition-all text-center cursor-pointer"
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
