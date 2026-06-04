import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Clock, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Award,
  BookOpen,
  Monitor,
  Flame,
  Gamepad2,
  FileText
} from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface HighScore {
  subject: string;
  score: number;
  total: number;
  percentage: number;
  date: string;
}

const MATHEMATICS_QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'Find the derivative of f(x) = x * sin(x) with respect to x.',
    options: ['cos(x)', 'sin(x) + x * cos(x)', 'x * cos(x) - sin(x)', 'sin(x) - x * cos(x)'],
    correctIndex: 1,
    explanation: 'By using the product rule: d/dx [u*v] = u\'v + uv\'. Let u = x (u\' = 1) and v = sin(x) (v\' = cos(x)). Consequently, the derivative is (1 * sin(x)) + (x * cos(x)).'
  },
  {
    id: 2,
    question: 'Solve for x in the quadratic inequality x² - 5x + 6 < 0.',
    options: ['x < 2 or x > 3', '2 <= x <= 3', '2 < x < 3', 'x is any real number'],
    correctIndex: 2,
    explanation: 'First factor the trinomial: (x - 2)(x - 3). The roots are 2 and 3. Testing intervals yields that the product is negative strictly between these boundaries, i.e., 2 < x < 3.'
  },
  {
    id: 3,
    question: 'Find the limit of (sin x) / x as x approaches 0.',
    options: ['0', '1', 'Undefined', 'Infinity'],
    correctIndex: 1,
    explanation: 'This is a fundamental engineering limit in calculus defined via squeeze theorem or L\'Hopital\'s rule: lim(x->0) (cos x) / 1 = cos(0) = 1.'
  },
  {
    id: 4,
    question: 'Given a matrix A = [[2, 3], [1, 4]], find its determinant.',
    options: ['5', '11', '8', '2'],
    correctIndex: 0,
    explanation: 'The determinant of a 2x2 matrix [[a, b], [c, d]] is calculated as (ad - bc). Here det(A) = (2 * 4) - (3 * 1) = 8 - 3 = 5.'
  },
  {
    id: 5,
    question: 'What is the sum of coordinates for the vector projection of u=(2,5) onto v=(1,0)?',
    options: ['2', '5', '0', '7'],
    correctIndex: 0,
    explanation: 'The projection of u onto the unit x-axis vector v=(1,0) is simply the x-component of u, which is (2,0). The sum of coordinates is 2 + 0 = 2.'
  }
];

const PHYSICS_QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'What is the force of attraction between two 1 Coulomb charges separated by exactly 1 meter in a vacuum?',
    options: ['1 Newton', '9.0 x 10⁹ Newtons', '8.85 x 10⁻¹² Newtons', '9.0 x 10⁻⁹ Newtons'],
    correctIndex: 1,
    explanation: 'According to Coulomb\'s Law, F = k * (|q1 * q2| / d²). Inside a vacuum, the constant k is approximately 8.9875 x 10⁹ (usually rounded to 9.0 x 10⁹ N*m²/C²). F = (9.0 x 10⁹) * (1 * 1) / 1² = 9.0 x 10⁹ N.'
  },
  {
    id: 2,
    question: 'Under a constant net external force, what happens to the velocity of an accelerating body if its mass increases?',
    options: ['Increases exponentially', 'Decreases inversely', 'Its rate of acceleration decreases', 'Stays exactly the same'],
    correctIndex: 2,
    explanation: 'Using Newton\'s second law of motion (F = ma, which converts to a = F/m), acceleration represents a strictly inverse ratio of mass. If mass increases, acceleration rates fall.'
  },
  {
    id: 3,
    question: 'Which electromagnetic spectrum wave possesses the highest photon energy?',
    options: ['Gamma Ray radiation', 'X-Rays', 'Ultraviolet light', 'Infrared thermal waves'],
    correctIndex: 0,
    explanation: 'Energy is given by E = hf (Planck\'s law). Gamma rays possess the highest frequency (f) and shortest wavelengths, meaning their individual photons harbor the greatest kinetic energy.'
  },
  {
    id: 4,
    question: 'What is the absolute speed of light in a diamond crystal of refractive index 2.42?',
    options: ['3.0 x 10⁸ m/s', '1.24 x 10⁸ m/s', '2.42 x 10⁸ m/s', '0.8 x 10⁸ m/s'],
    correctIndex: 1,
    explanation: 'The index of refraction is n = c / v. Therefore v = c / n = (3.0 x 10⁸) / 2.42, which is approximately 1.24 x 10⁸ m/s.'
  },
  {
    id: 5,
    question: 'A capacitance C connected to a DC circuit initially blocks which current flow element?',
    options: ['High frequency AC', 'Direct current (DC)', 'Magnetic leakage', 'Static friction'],
    correctIndex: 1,
    explanation: 'A capacitor acts as an open circuit to steady DC voltages because capacitive reactance Xc = 1 / (2 * pi * f * C). Since DC frequency f = 0, reactants approach infinity.'
  }
];

export default function CbtExam() {
  const [phase, setPhase] = useState<'config' | 'exam' | 'result'>('config');
  const [selectedSubject, setSelectedSubject] = useState<'Mathematics' | 'Physics'>('Mathematics');
  
  // Quiz running states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes standard countdown
  const [highScores, setHighScores] = useState<HighScore[]>([]);

  // Ticking effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === 'exam' && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1005);
    }
    return () => clearInterval(timer);
  }, [phase, timeRemaining]);

  useEffect(() => {
    const saved = localStorage.getItem('ff_cbt_highscores');
    if (saved) {
      setHighScores(JSON.parse(saved));
    }
  }, []);

  const getSubjectQuestions = (subj: 'Mathematics' | 'Physics'): Question[] => {
    const key = subj === 'Mathematics' ? 'ff_cbt_mathematics_questions' : 'ff_cbt_physics_questions';
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
    const defaults = subj === 'Mathematics' ? MATHEMATICS_QUESTIONS : PHYSICS_QUESTIONS;
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  };

  const startExam = (subject: 'Mathematics' | 'Physics') => {
    setSelectedSubject(subject);
    setQuestions(getSubjectQuestions(subject));
    setCurrentIdx(0);
    setSelectedAnswers({});
    setTimeRemaining(300);
    setPhase('exam');
  };

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  const submitExam = () => {
    setPhase('result');

    // Calculate score
    const targetQs = getSubjectQuestions(selectedSubject);
    let correctCount = 0;
    targetQs.forEach(q => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    });

    const percent = Math.round((correctCount / (targetQs.length || 1)) * 100);
    const newRecord: HighScore = {
      subject: selectedSubject,
      score: correctCount,
      total: targetQs.length,
      percentage: percent,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
    };

    const updatedScores = [newRecord, ...highScores].slice(0, 10);
    setHighScores(updatedScores);
    localStorage.setItem('ff_cbt_highscores', JSON.stringify(updatedScores));

    // Link dynamic Award Achievements tracking!
    if (percent === 100) {
      // Unlocked CBT Champion badge automatically!
      const currentAchievements = localStorage.getItem('ff_student_achievements');
      if (currentAchievements) {
        try {
          const parsed = JSON.parse(currentAchievements);
          const update = parsed.map((a: any) => {
            if (a.id === 'AW-02') {
              return { ...a, unlocked: true, unlockedDate: newRecord.date };
            }
            return a;
          });
          localStorage.setItem('ff_student_achievements', JSON.stringify(update));
        } catch (e) {}
      }
    }
  };

  const formatTime = (secs: number) => {
    const min = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${min}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  // Score stats for presentation
  const finalScore = questions.filter(q => selectedAnswers[q.id] === q.correctIndex).length;
  const finalPercent = Math.round((finalScore / (questions.length || 1)) * 100);

  return (
    <div className="space-y-8 font-sans pb-16">
      
      {/* Top title bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Tv size={20} />
            </span>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight uppercase">Computer-Based Testing (CBT) Hub</h2>
          </div>
          <p className="text-xs text-slate-500">
            Hone examination speeds under timed national standards. Results are scored and detailed step-by-step corrections are generated instantly.
          </p>
        </div>
      </div>

      {phase === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Diagnostic Subject Select Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-105 pb-3">Available CBT Practice Modules</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Mathematics Select */}
                <div className="p-6 border border-slate-150 bg-slate-50/50 rounded-2xl hover:border-slate-350 hover:bg-white transition-all flex flex-col justify-between h-[210px] group">
                  <div className="space-y-2">
                    <span className="bg-primary/10 text-primary text-[9px] font-black uppercase px-2.5 py-1 rounded inline-block font-mono tracking-wider">Engineering Mathematics</span>
                    <h4 className="text-sm font-bold text-slate-800 uppercase">Calculus & Geometry</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Calculus derivatives, polar coordinate matrices, algebraic inequalities, vector projection rules.</p>
                  </div>
                  <button 
                    onClick={() => startExam('Mathematics')}
                    className="w-full mt-4 bg-primary text-white py-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-center shadow-md shadow-primary/15 hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5"
                  >
                    Start Exam Session <ArrowRight size={12} />
                  </button>
                </div>

                {/* Physics Select */}
                <div className="p-6 border border-slate-150 bg-slate-50/50 rounded-2xl hover:border-slate-350 hover:bg-white transition-all flex flex-col justify-between h-[210px] group">
                  <div className="space-y-2">
                    <span className="bg-orange-100 text-orange-600 text-[9px] font-black uppercase px-2.5 py-1 rounded inline-block font-mono tracking-wider">Electromagnetism & Kinetics</span>
                    <h4 className="text-sm font-bold text-slate-800 uppercase">General Science Physics</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Coulomb’s Law calculations, acceleration ratios, photon energy levels, refractive optics, capacities.</p>
                  </div>
                  <button 
                    onClick={() => startExam('Physics')}
                    className="w-full mt-4 bg-primary text-white py-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-center shadow-md shadow-primary/15 hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5"
                  >
                    Start Exam Session <ArrowRight size={12} />
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* High Score Records */}
          <div>
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2.5">High Scores History</h3>
              
              <div className="space-y-3">
                {highScores.length === 0 ? (
                  <div className="text-xs text-slate-400 italic text-center py-8">
                    No historic cbt records detected. Attempt an exam module to record scores.
                  </div>
                ) : (
                  highScores.map((score, index) => (
                    <div key={index} className="p-3.5 border border-slate-150 rounded-xl flex items-center justify-between gap-3 bg-slate-50/70">
                      <div>
                        <h4 className="text-[11px] font-black text-slate-800 uppercase leading-snug">{score.subject} Practice</h4>
                        <span className="text-[9px] text-slate-400 font-mono">Date: {score.date}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-black text-primary block">{score.score} / {score.total}</span>
                        <span className="text-[9px] font-black text-emerald-600 font-mono">{score.percentage}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {phase === 'exam' && (
        <div className="bg-white border-2 border-slate-200 rounded-[32px] p-6 md:p-10 shadow-md space-y-8 relative overflow-hidden select-none">
          
          {/* Sticky Timed banner bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-150 pb-5">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">SUBJECT EXAM IN PROGRESS</span>
              <h3 className="text-base font-black text-slate-850 uppercase tracking-tight">{selectedSubject} Stream Drills</h3>
            </div>

            <div className={`flex items-center gap-2 p-3 rounded-2xl border font-mono font-black text-sm uppercase shrink-0 ${
              timeRemaining < 60 
                ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' 
                : 'bg-primary/5 text-primary border-primary/10'
            }`}>
              <Clock size={16} />
              <span>Time Remaining: {formatTime(timeRemaining)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Question Card display */}
            <div className="lg:col-span-2 space-y-6 text-xs text-left">
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-150/70 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <span>Question {currentIdx + 1} of {questions.length}</span>
                  <span>Worth 5.0 Marks</span>
                </div>

                <p className="text-sm font-bold text-slate-800 leading-relaxed font-sans">{questions[currentIdx]?.question}</p>
              </div>

              {/* Multiple Choice interactive selection */}
              <div className="space-y-3 pt-2">
                {questions[currentIdx]?.options.map((opt, oIdx) => {
                  const isChecked = selectedAnswers[questions[currentIdx].id] === oIdx;
                  return (
                    <div 
                      key={oIdx}
                      onClick={() => handleSelectOption(questions[currentIdx].id, oIdx)}
                      className={`p-4 border rounded-2xl hover:border-slate-350 cursor-pointer transition-all flex items-center justify-between text-xs font-semibold ${
                        isChecked 
                          ? 'border-primary bg-blue-50/20 text-primary font-bold' 
                          : 'border-slate-150 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg font-mono font-black text-[11px] flex items-center justify-center border transition-colors ${
                          isChecked 
                            ? 'bg-primary text-white border-primary' 
                            : 'bg-slate-50 text-slate-500'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>

                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isChecked ? 'border-primary' : 'border-slate-300'
                      }`}>
                        {isChecked && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation trigger button rows */}
              <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(prev => prev - 1)}
                  className="bg-slate-50 hover:bg-slate-100 disabled:opacity-40 border border-slate-200 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={12} /> Previous Question
                </button>

                {currentIdx < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIdx(prev => prev + 1)}
                    className="bg-slate-900 border text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    Next Question <ArrowRight size={12} />
                  </button>
                ) : (
                  <button
                    onClick={submitExam}
                    className="bg-emerald-600 hover:bg-emerald-650 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/15"
                  >
                    Submit Test Paper
                  </button>
                )}
              </div>
            </div>

            {/* Questions tracker sidebar grid */}
            <div>
              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-4">
                <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Question Tracker Board</h4>
                <div className="grid grid-cols-5 gap-2.5">
                  {questions.map((q, idx) => {
                    const isSelected = currentIdx === idx;
                    const isAnswered = selectedAnswers[q.id] !== undefined;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIdx(idx)}
                        className={`h-9 rounded-xl font-mono font-black text-center text-xs border transition-all ${
                          isSelected 
                            ? 'bg-primary text-white border-primary scale-[1.08]' 
                            : isAnswered 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-250' 
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider space-y-1.5 border-t border-slate-200 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-primary rounded-md"></span>
                    <span>Active viewing question</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-50 border border-emerald-200 rounded-md"></span>
                    <span>Answer selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-white border border-slate-200 rounded-md"></span>
                    <span>Unanswered</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {phase === 'result' && (
        <div className="space-y-8 select-none">
          
          {/* Feedback details scorecard */}
          <div className="bg-white border-2 border-slate-200 rounded-[32px] p-8 md:p-10 shadow-md text-center max-w-2xl mx-auto space-y-6">
            <div className="w-16 h-16 bg-primary/10 text-primary border-2 border-accent rounded-full flex items-center justify-center mx-auto text-3xl font-bold animate-bounce">
              🏆
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DIAGNOSTIC TEST COMPLETE RESULT</span>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{selectedSubject} Study drill Evaluation</h3>
              <p className="text-xs text-slate-500">Continuous Assessment testing successfully processed by automatic AI grader.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto p-4 bg-slate-50 rounded-2xl border border-slate-150/70">
              <div className="text-center font-mono">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">SCORE RATING</span>
                <span className="text-xl font-black text-slate-800">{finalScore} / {questions.length}</span>
              </div>
              <div className="text-center font-mono border-l border-slate-200">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">PERCENTAGE INDEX</span>
                <span className="text-xl font-black text-emerald-600">{finalPercent}%</span>
              </div>
            </div>

            <div>
              {finalPercent >= 80 ? (
                <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-black px-4 py-2 rounded-xl uppercase">✓ OUTSTANDING ACHIEVEMENT</span>
              ) : finalPercent >= 50 ? (
                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black px-4 py-2 rounded-xl uppercase">✓ PASS RECORD RECEIVED</span>
              ) : (
                <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black px-4 py-2 rounded-xl uppercase">❌ FOCUS NEEDED</span>
              )}
            </div>

            <div className="pt-2">
              <button 
                onClick={() => setPhase('config')}
                className="bg-primary hover:bg-opacity-95 text-white font-bold uppercase tracking-widest text-xs py-3.5 px-6 rounded-xl shadow-lg shadow-primary/15"
              >
                Close & Return To Lobby
              </button>
            </div>
          </div>

          {/* Corrections spreadsheet list */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm text-xs text-left">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-105 pb-3">Educational Corrections & Explanations</h3>

            <div className="space-y-6">
              {questions.map((q, qIdx) => {
                const userAnsIdx = selectedAnswers[q.id];
                const isCorrect = userAnsIdx === q.correctIndex;
                return (
                  <div key={q.id} className="p-5 border border-slate-150 rounded-2xl bg-slate-50/45 space-y-4">
                    <div className="flex justify-between items-start gap-4 flex-wrap border-b border-dashed border-slate-200 pb-2.5">
                      <span className="font-extrabold text-[11px] text-slate-800 uppercase">Question {qIdx + 1} Assessment</span>
                      <div>
                        {isCorrect ? (
                          <span className="bg-green-50 text-green-700 border border-green-150 px-2 py-0.5 rounded text-[9px] font-black uppercase flex items-center gap-1"><CheckCircle size={10} /> Correct</span>
                        ) : (
                          <span className="bg-rose-50 text-rose-750 border border-rose-150 px-2 py-0.5 rounded text-[9px] font-black uppercase flex items-center gap-1"><XCircle size={10} /> Incorrect</span>
                        )}
                      </div>
                    </div>

                    <p className="font-bold text-slate-800 leading-relaxed">{q.question}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed max-w-2xl font-medium pt-1.5">
                      <div className="p-3.5 bg-white border border-slate-150 rounded-xl space-y-0.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Your Selected Answer:</span>
                        <p className={isCorrect ? 'text-green-700 font-extrabold' : 'text-rose-700 font-extrabold'}>
                          {userAnsIdx !== undefined ? `${String.fromCharCode(65 + userAnsIdx)}. ${q.options[userAnsIdx]}` : 'Unanswered'}
                        </p>
                      </div>

                      <div className="p-3.5 bg-white border border-slate-150 rounded-xl space-y-0.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Correct Option Mark:</span>
                        <p className="text-green-700 font-extrabold">
                          {String.fromCharCode(65 + q.correctIndex)}. {q.options[q.correctIndex]}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50/45 border border-blue-150/50 rounded-xl text-slate-650 leading-relaxed font-semibold">
                      <span className="text-[9px] font-black text-primary uppercase block tracking-wider mb-0.5">Pedagogical Step Explanations:</span>
                      "{q.explanation}"
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
