import React, { useState, useEffect } from 'react';
import { PublicNavbar } from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { 
  selectRandomQuestions, 
  getDivisionTimeLimitMinutes, 
  getSchoolDivision,
  CBTQuestion,
  CBT_CLASSES
} from '../lib/cbtQuestionBank';
import { 
  CheckCircle, ArrowRight, ArrowLeft, User, Mail, Phone, MapPin, Loader2, Info, 
  Upload, Sparkles, AlertCircle, FileText, Calendar, BookOpen, Clock, Heart, 
  HelpCircle, Eye, ShieldCheck, Download, Printer, CreditCard, Lock, Check,
  Search, RefreshCw, Layers, Award, FileSpreadsheet, UserCheck, Milestone
} from 'lucide-react';

// Interfaces for our comprehensive data models
interface ApplicationData {
  id: string; // E.g., ADM-2026-NUR-3829
  // Step 1: Application Type
  admissionType: 'Nursery' | 'Primary' | 'Junior Secondary' | 'Senior Secondary' | 'Transfer Student';
  academicSession: string; // E.g., 2026/2027
  intendedTerm: string; // E.g., First Term
  intendedClass: string; 

  // Step 2: Personal Info
  surname: string;
  firstName: string;
  middleName: string;
  gender: 'Male' | 'Female' | '';
  dob: string;
  age: number;
  stateOfOrigin: string;
  lga: string;
  nationality: string;
  religion: string;
  address: string;
  city: string;
  state: string;
  country: string;
  passportPhoto: string; // Object URL or Base64

  // Step 3: Parents
  fatherName: string;
  fatherOccupation: string;
  fatherEmployer: string;
  fatherPhone: string;
  fatherWhatsapp: string;
  fatherEmail: string;

  motherName: string;
  motherOccupation: string;
  motherEmployer: string;
  motherPhone: string;
  motherWhatsapp: string;
  motherEmail: string;

  guardianName: string;
  guardianRelationship: string;
  guardianOccupation: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianAddress: string;

  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;

  // Step 4: Academic History
  prevSchoolName: string;
  prevSchoolAddress: string;
  prevClassCompleted: string;
  prevSession: string;
  reasonForLeaving: string;
  prevResultsSummary: string;
  prevPosition: string;
  areasOfStrength: string;
  areasOfSupport: string;
  transferReason: string;
  transcriptFile: string;

  // Step 5: Health
  bloodGroup: string;
  genotype: string;
  allergies: string;
  medicalConditions: string;
  physicalDisabilities: string;
  specialNeeds: string;
  medications: string;
  doctorName: string;
  doctorPhone: string;
  hospitalName: string;

  // Step 6: Behaviour
  hasBeenSuspended: 'Yes' | 'No' | '';
  hasBeenExpelled: 'Yes' | 'No' | '';
  hasReceivedDiscipline: 'Yes' | 'No' | '';
  disciplinaryDetails: string;

  // Step 7: Documents
  docBirthCert: string;
  docPassport: string;
  docPrevResult: string;
  docTestimonial: string;
  docTransferLetter: string;
  docMedicalReport: string;
  docParentId: string;
  docUtilityBill: string;

  // Step 8: Academic Examination CBT
  cbtScore: number | null;
  cbtMathScore?: number | null;
  cbtEnglScore?: number | null;
  tabSwitchesCount?: number | null;
  cbtTaken: boolean;
  cbtAnswers: Record<string, string>;
  examDate: string; // Scheduled by admin
  interviewDate: string; // Scheduled by admin

  // Step 9: Declaration
  parentSignatureName: string;
  declarationDate: string;
  agreedToTerms: boolean;

  // Global Controls
  status: 'Submitted' | 'Under Review' | 'Awaiting Documents' | 'Examination Scheduled' | 'Interview Scheduled' | 'Approved' | 'Admitted' | 'Rejected';
  feesPaid: boolean;
  feesAmountPaid: number;
  adminMessage?: string;
  createdAt: string;

  // DB Alignment properties
  student_name?: string;
  target_class?: string;
  parent_name?: string;
  email?: string;
}

// Initial structure for empty forms
const initialFormData: ApplicationData = {
  id: '',
  admissionType: 'Junior Secondary',
  academicSession: '2026/2027',
  intendedTerm: 'First Term',
  intendedClass: 'JSS 1',
  surname: '',
  firstName: '',
  middleName: '',
  gender: '',
  dob: '',
  age: 0,
  stateOfOrigin: '',
  lga: '',
  nationality: 'Nigerian',
  religion: '',
  address: '',
  city: 'Ibadan',
  state: 'Oyo State',
  country: 'Nigeria',
  passportPhoto: '',

  fatherName: '',
  fatherOccupation: '',
  fatherEmployer: '',
  fatherPhone: '',
  fatherWhatsapp: '',
  fatherEmail: '',
  motherName: '',
  motherOccupation: '',
  motherEmployer: '',
  motherPhone: '',
  motherWhatsapp: '',
  motherEmail: '',
  guardianName: '',
  guardianRelationship: '',
  guardianOccupation: '',
  guardianPhone: '',
  guardianEmail: '',
  guardianAddress: '',
  emergencyName: '',
  emergencyRelationship: '',
  emergencyPhone: '',

  prevSchoolName: '',
  prevSchoolAddress: '',
  prevClassCompleted: '',
  prevSession: '',
  reasonForLeaving: '',
  prevResultsSummary: '',
  prevPosition: '',
  areasOfStrength: '',
  areasOfSupport: '',
  transferReason: '',
  transcriptFile: '',

  bloodGroup: '',
  genotype: '',
  allergies: '',
  medicalConditions: '',
  physicalDisabilities: '',
  specialNeeds: '',
  medications: '',
  doctorName: '',
  doctorPhone: '',
  hospitalName: '',

  hasBeenSuspended: '',
  hasBeenExpelled: '',
  hasReceivedDiscipline: '',
  disciplinaryDetails: '',

  docBirthCert: '',
  docPassport: '',
  docPrevResult: '',
  docTestimonial: '',
  docTransferLetter: '',
  docMedicalReport: '',
  docParentId: '',
  docUtilityBill: '',

  cbtScore: null,
  cbtMathScore: null,
  cbtEnglScore: null,
  tabSwitchesCount: 0,
  cbtTaken: false,
  cbtAnswers: {},
  examDate: 'Awaiting Schedule',
  interviewDate: 'Awaiting Schedule',

  parentSignatureName: '',
  declarationDate: new Date().toISOString().split('T')[0],
  agreedToTerms: false,

  status: 'Submitted',
  feesPaid: false,
  feesAmountPaid: 0,
  createdAt: ''
};

// Simple standard CBT Questions for admission test
const CBT_QUESTIONS = [
  {
    id: 1,
    question: "Which word starts with the same consonant sound as 'Chair'?",
    options: ["Character", "Chef", "Chemistry", "Cherry"],
    correct: "Cherry"
  },
  {
    id: 2,
    question: "Solve for x:  3x - 7 = 14",
    options: ["x = 5", "x = 7", "x = 6", "x = -7"],
    correct: "x = 7"
  },
  {
    id: 3,
    question: "Faith Foundation School prioritizes three major pillars. What are they?",
    options: ["Knowledge, Wisdom & Beauty", "Academic Excellence, Moral Fortitude & Spiritual Growth", "Sports, Science & Leadership", "Technology, Reading & Art"],
    correct: "Academic Excellence, Moral Fortitude & Spiritual Growth"
  },
  {
    id: 4,
    question: "Select the sentence with correct grammatical structure:",
    options: [
      "The students wented to the laboratory yesterday.", 
      "The principal has already spoke to the parents.", 
      "Every candidate is expected to present their examination slip.", 
      "They was planning to construct a new sports center."
    ],
    correct: "Every candidate is expected to present their examination slip."
  },
  {
    id: 5,
    question: "If a student scoring 80% on 3 subjects wants an average of 85% across 4 subjects, what must they score in the 4th subject?",
    options: ["85%", "90%", "100%", "95%"],
    correct: "100%"
  }
];

export default function Admissions() {
  const [viewMode, setViewMode] = useState<'landing' | 'apply' | 'dashboard'>('landing');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<ApplicationData>(initialFormData);
  
  // States for document uploads alerts/visualizer
  const [fileLogs, setFileLogs] = useState<Record<string, string>>({});
  
  // Tracking Portal credentials for login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [activePortalApplication, setActivePortalApplication] = useState<ApplicationData | null>(null);
  const [loginError, setLoginError] = useState('');
  const [commsTab, setCommsTab] = useState<'email' | 'sms'>('email');
  
  // Local notification flags after submission
  const [submissionFeedback, setSubmissionFeedback] = useState<{appNum: string} | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);

  // States for the CBT examination simulator
  const [cbtStep, setCbtStep] = useState<'rules' | 'active' | 'results'>('rules');
  const [currentCbtQuestionIndex, setCurrentCbtQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [cbtTempAnswers, setCbtTempAnswers] = useState<Record<string, string>>({});
  const [cbtQuestions, setCbtQuestions] = useState<CBTQuestion[]>([]);
  const [cbtDurationMinutes, setCbtDurationMinutes] = useState<number>(30);
  const [cbtSecondsLeft, setCbtSecondsLeft] = useState<number>(0);
  const [cbtTabSwitches, setCbtTabSwitches] = useState<number>(0);
  
  // Online verification status
  const [showStatusAlert, setShowStatusAlert] = useState<string | null>(null);

  // Auto-fill Age based on DOB
  useEffect(() => {
    if (formData.dob) {
      const birthYear = new Date(formData.dob).getFullYear();
      const currentYear = new Date().getFullYear();
      const calculatedAge = currentYear - birthYear;
      if (calculatedAge > 0 && calculatedAge < 100) {
        setFormData(prev => ({ ...prev, age: calculatedAge }));
      }
    }
  }, [formData.dob]);

  // Load existing draft if any exists
  useEffect(() => {
    const savedDraft = localStorage.getItem('ff_admission_draft');
    if (savedDraft) {
      try {
        setFormData(JSON.parse(savedDraft));
      } catch (e) {
        console.warn('Unable to hydrate active draft', e);
      }
    }
  }, []);

  // Core CBT Grading Engine (Marks Math out of 50, English out of 50, Total 100)
  const calculateCbtScores = (answersMap: Record<string, string>, questionList: CBTQuestion[]) => {
    let mathCorrect = 0;
    let mathCount = 0;
    let englCorrect = 0;
    let englCount = 0;

    questionList.forEach(q => {
      const studentAns = answersMap[q.id] || '';
      if (q.subject === 'Mathematics') {
        mathCount++;
        if (q.type === 'Matching') {
          if (q.matchingPairs && q.matchingPairs.length > 0) {
            let matchesCorrect = 0;
            q.matchingPairs.forEach(p => {
              const pairStr = `${p.left}=>${p.right}`;
              if (studentAns.includes(pairStr)) {
                matchesCorrect++;
              }
            });
            mathCorrect += (matchesCorrect / q.matchingPairs.length);
          } else if (studentAns === q.correct) {
            mathCorrect++;
          }
        } else {
          if (studentAns.trim().toLowerCase() === q.correct.trim().toLowerCase()) {
            mathCorrect++;
          }
        }
      } else {
        englCount++;
        if (q.type === 'Matching') {
          if (q.matchingPairs && q.matchingPairs.length > 0) {
            let matchesCorrect = 0;
            q.matchingPairs.forEach(p => {
              const pairStr = `${p.left}=>${p.right}`;
              if (studentAns.includes(pairStr)) {
                matchesCorrect++;
              }
            });
            englCorrect += (matchesCorrect / q.matchingPairs.length);
          } else if (studentAns === q.correct) {
            englCorrect++;
          }
        } else {
          if (studentAns.trim().toLowerCase() === q.correct.trim().toLowerCase()) {
            englCorrect++;
          }
        }
      }
    });

    const mathScore = mathCount > 0 ? (mathCorrect / mathCount) * 50 : 0;
    const englScore = englCount > 0 ? (englCorrect / englCount) * 50 : 0;
    const rawTotal = mathScore + englScore;
    const cbtScore = Math.min(100, Math.max(0, Math.round(rawTotal)));

    return {
      cbtMathScore: Math.round(mathScore * 10) / 10,
      cbtEnglScore: Math.round(englScore * 10) / 10,
      cbtScore: cbtScore
    };
  };

  // Sync CBT duration limits from candidate intended Class level
  useEffect(() => {
    if (cbtStep === 'rules') {
      const cls = formData.intendedClass || 'Primary 6';
      const limit = getDivisionTimeLimitMinutes(cls);
      setCbtDurationMinutes(limit);
    }
  }, [cbtStep, formData.intendedClass]);

  // Tab switching security warnings listener
  useEffect(() => {
    if (cbtStep !== 'active') return;

    const handleFocusLoss = () => {
      setCbtTabSwitches(prev => {
        const nextCount = prev + 1;
        if (nextCount >= 3) {
          alert("Security Violation: You have switched tabs or exited the exam window 3 times. Your exam is being automatically submitted now.");
          handleAutoSubmitCbt(nextCount);
          return nextCount;
        } else {
          alert(`SECURITY WARNING #${nextCount}: Tab switching or window defocusing detected. Your activity is being logged. The exam will automatically submit after 3 window defocus notifications.`);
          return nextCount;
        }
      });
    };

    window.addEventListener('blur', handleFocusLoss);
    return () => {
      window.removeEventListener('blur', handleFocusLoss);
    };
  }, [cbtStep, cbtQuestions, cbtTempAnswers, currentCbtQuestionIndex, selectedAnswer]);

  // Handle active countdown ticking
  useEffect(() => {
    if (cbtStep !== 'active') return;

    const tick = setInterval(() => {
      setCbtSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(tick);
          setTimeout(() => {
            handleAutoSubmitCbt();
          }, 10);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [cbtStep, cbtQuestions, cbtTempAnswers, currentCbtQuestionIndex, selectedAnswer]);

  const handleAutoSubmitCbt = (forcedTabSwitches?: number) => {
    const finalAnswers = { ...cbtTempAnswers };
    const activeQ = cbtQuestions[currentCbtQuestionIndex];
    if (activeQ && selectedAnswer) {
      finalAnswers[activeQ.id] = selectedAnswer;
    }

    const switches = forcedTabSwitches !== undefined ? forcedTabSwitches : cbtTabSwitches;
    const scores = calculateCbtScores(finalAnswers, cbtQuestions);

    const updatedData = {
      cbtTaken: true,
      cbtScore: scores.cbtScore,
      cbtMathScore: scores.cbtMathScore,
      cbtEnglScore: scores.cbtEnglScore,
      tabSwitchesCount: switches,
      cbtAnswers: finalAnswers
    };

    setFormData(prev => ({
      ...prev,
      ...updatedData
    }));

    if (activePortalApplication) {
      const updatedApp = {
        ...activePortalApplication,
        ...updatedData
      };
      setActivePortalApplication(updatedApp);
      const allAppListStr = localStorage.getItem('ff_admissions');
      if (allAppListStr) {
        try {
          const list = JSON.parse(allAppListStr);
          const idx = list.findIndex((a: any) => a.id === activePortalApplication.id);
          if (idx !== -1) {
            list[idx] = updatedApp;
            localStorage.setItem('ff_admissions', JSON.stringify(list));
          }
        } catch (e) {
          console.warn(e);
        }
      }
    }

    setCbtStep('results');
    setShowStatusAlert('CBT Exam finished! Performance scores have been logged into your application profile.');
    setTimeout(() => setShowStatusAlert(null), 5000);
  };

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Save Progress draft function
  const saveProgressDraft = (verbose: boolean = false) => {
    setSavingDraft(true);
    localStorage.setItem('ff_admission_draft', JSON.stringify(formData));
    setTimeout(() => {
      setSavingDraft(false);
      if (verbose) {
        setShowStatusAlert('Draft saved successfully! You can resume anytime using this browser.');
      }
    }, 600);
  };

  // Automated step validator
  const validateStep = (step: number): boolean => {
    setValidationError('');
    switch (step) {
      case 1:
        if (!formData.intendedClass) {
          setValidationError('Please select your Intended Class');
          return false;
        }
        return true;
      case 2:
        if (!formData.surname || !formData.firstName) {
          setValidationError('Please enter Applicant Surname and First Name.');
          return false;
        }
        if (!formData.gender) {
          setValidationError('Please specify Applicant Gender.');
          return false;
        }
        if (!formData.dob) {
          setValidationError('Please select Applicant Date of Birth.');
          return false;
        }
        return true;
      case 3:
        if (!formData.fatherName && !formData.motherName && !formData.guardianName) {
          setValidationError('Please provide name for at least Father, Mother or Guardian.');
          return false;
        }
        if (!formData.emergencyName || !formData.emergencyPhone) {
          setValidationError('Emergency Contact Full Name and Phone are required.');
          return false;
        }
        return true;
      case 4:
        if (!formData.prevSchoolName) {
          setValidationError('Previous School name is required. Enter "None" if first-time schooling.');
          return false;
        }
        return true;
      case 5:
        if (!formData.bloodGroup || !formData.genotype) {
          setValidationError('Please declare Blood Group and Genotype for student health logs.');
          return false;
        }
        return true;
      case 6:
        if (!formData.hasBeenSuspended || !formData.hasBeenExpelled) {
          setValidationError('Please complete the behavioral questions.');
          return false;
        }
        return true;
      case 7:
        // Basic simulations
        if (!fileLogs['Passport Photograph'] && !formData.passportPhoto) {
          setValidationError('Please upload a Passport Photograph before proceeding.');
          return false;
        }
        return true;
      case 9:
        if (!formData.parentSignatureName) {
          setValidationError('Signature name sign-off is required.');
          return false;
        }
        if (!formData.agreedToTerms) {
          setValidationError('You must check the agreement box to verify authenticity.');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      saveProgressDraft();
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  // Mock document file uploader helper
  const handleFileUpload = (docName: string, fileType: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    // Accept images for passport photo, and standard documents / images for other fields
    input.accept = docName === 'Passport Photograph' ? 'image/*' : '.pdf,.png,.jpg,.jpeg';
    
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        // Create local object URL for previewing and caching
        const localFileUrl = URL.createObjectURL(file);
        
        setFileLogs(prev => ({ ...prev, [docName]: file.name }));
        
        setFormData(prev => {
          const updated = { ...prev };
          if (docName === 'Birth Certificate') updated.docBirthCert = localFileUrl;
          if (docName === 'Passport Photograph') {
            updated.docPassport = localFileUrl;
            updated.passportPhoto = localFileUrl; // Store the chosen photo object url for instantaneous rendering!
          }
          if (docName === 'Previous School Result') updated.docPrevResult = localFileUrl;
          if (docName === 'Testimonial') updated.docTestimonial = localFileUrl;
          if (docName === 'Transfer Letter') updated.docTransferLetter = localFileUrl;
          if (docName === 'Medical Report') updated.docMedicalReport = localFileUrl;
          if (docName === 'Parent ID') updated.docParentId = localFileUrl;
          if (docName === 'Utility Bill') updated.docUtilityBill = localFileUrl;
          return updated;
        });

        setShowStatusAlert(`${docName} ("${file.name}") uploaded and validated successfully!`);
        setTimeout(() => setShowStatusAlert(null), 3500);
      }
    };
    
    input.click();
  };

  // Submission handler
  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      // 1. Generate Application Number
      const prefix = formData.admissionType.toUpperCase().slice(0, 3);
      const randNo = Math.floor(1000 + Math.random() * 9000);
      const appNumber = `ADM-2026-${prefix}-${randNo}`;

      const finalRecord: ApplicationData = {
        ...formData,
        id: appNumber,
        status: 'Submitted',
        createdAt: new Date().toISOString()
      };

      // 2. Persist to localStorage admissions stream
      const currentLocal = JSON.parse(localStorage.getItem('ff_admissions') || '[]');
      localStorage.setItem('ff_admissions', JSON.stringify([...currentLocal, finalRecord]));

      // 3. Keep standard fallback for Supabase
      try {
        const payload = {
          id: appNumber, // If uuid constraint isn't strict, but if strict fallback is local storage which matches Admin Dashboard perfectly anyway
          student_name: `${formData.firstName} ${formData.surname}`,
          parent_name: formData.fatherName || formData.motherName || formData.guardianName || 'Parent',
          email: formData.fatherEmail || formData.motherEmail || formData.guardianEmail,
          phone: formData.fatherPhone || formData.motherPhone || formData.guardianPhone,
          target_class: formData.intendedClass,
          address: formData.address,
          previous_school: formData.prevSchoolName,
          status: 'pending',
          created_at: new Date().toISOString()
        };

        const { error: submitError } = await supabase
          .from('admissions')
          .insert(payload);
        
        if (submitError) console.warn('Supabase admissions bypassed', submitError);
      } catch (dbErr) {
        console.warn('Real-time sync bypassed', dbErr);
      }

      // 4. Remove active local draft
      localStorage.removeItem('ff_admission_draft');

      // 5. Present printable app details
      setSubmissionFeedback({ appNum: appNumber });
      setFormData(finalRecord);
      setViewMode('landing');
      setShowStatusAlert(`Application successfully locked! Check email & SMS simulation for ID: ${appNumber}`);
    } catch (err) {
      console.warn('Handling submit exceptions', err);
    } finally {
      setLoading(false);
    }
  };

  // CBT actions
  const startCbtExam = () => {
    const classLevel = formData.intendedClass || activePortalApplication?.intendedClass || 'Primary 6';
    const candidateId = formData.id || activePortalApplication?.id || 'CANDIDATE_' + Math.floor(Math.random() * 8999 + 1000);
    
    // 1. Fetch academic class level questions
    const { mathQs, englQs } = selectRandomQuestions(classLevel, candidateId);
    
    // 2. Blend and shuffle the 40 questions (20 math, 20 English)
    const combined = [...mathQs, ...englQs];
    const shuffleSeed = `COMBINED_SHUFFLE_${candidateId}_${classLevel}`;
    
    // Stable pseudo-random seed generator
    let h = 1779033703 ^ shuffleSeed.length;
    for (let i = 0; i < shuffleSeed.length; i++) {
      h = Math.imul(h ^ shuffleSeed.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    const randValForShuffle = () => {
      h = (h + 0x7ED55D16) + (h << 12);
      h = (h ^ 0xc55261a1) ^ (h >>> 19);
      h = (h + 0x165667b1) + (h << 5);
      h = (h + 0xd3a2646c) ^ (h << 9);
      h = (h + 0xfd7046c5) + (h << 3);
      h = (h ^ 0xb55a4f09) ^ (h >>> 16);
      return (h >>> 0) / 4294967296;
    };
    
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(randValForShuffle() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    // 3. Set division-specific time limits
    const limitMins = getDivisionTimeLimitMinutes(classLevel);

    setCbtQuestions(combined);
    setCbtDurationMinutes(limitMins);
    setCbtSecondsLeft(limitMins * 60);
    setCbtStep('active');
    setCurrentCbtQuestionIndex(0);
    setCbtTempAnswers({});
    setSelectedAnswer('');
    setCbtTabSwitches(0);
  };

  const handleCbtAnswerSelect = (option: string) => {
    setSelectedAnswer(option);
    
    // Dynamic real-time save to prevent lost inputs on click
    if (cbtQuestions.length > 0) {
      const qId = cbtQuestions[currentCbtQuestionIndex].id;
      const updatedAnswers = { ...cbtTempAnswers, [qId]: option };
      setCbtTempAnswers(updatedAnswers);
      const draftKey = `ff_cbt_autosave_${formData.id || activePortalApplication?.id || 'draft'}`;
      localStorage.setItem(draftKey, JSON.stringify(updatedAnswers));
    }
  };

  const handleNextCbtQuestion = () => {
    if (cbtQuestions.length === 0) return;

    const qId = cbtQuestions[currentCbtQuestionIndex].id;
    const updatedAnswers = { ...cbtTempAnswers, [qId]: selectedAnswer };
    setCbtTempAnswers(updatedAnswers);
    
    // Write auto-saves to LocalStorage
    const draftKey = `ff_cbt_autosave_${formData.id || activePortalApplication?.id || 'draft'}`;
    localStorage.setItem(draftKey, JSON.stringify(updatedAnswers));

    setSelectedAnswer('');

    if (currentCbtQuestionIndex < cbtQuestions.length - 1) {
      setCurrentCbtQuestionIndex(prev => prev + 1);
      // Hydrate with previously saved answer if exists
      const nextQId = cbtQuestions[currentCbtQuestionIndex + 1].id;
      if (updatedAnswers[nextQId]) {
        setSelectedAnswer(updatedAnswers[nextQId]);
      }
    } else {
      // Calculate Scores
      const scores = calculateCbtScores(updatedAnswers, cbtQuestions);

      const updatedData = {
        cbtTaken: true,
        cbtScore: scores.cbtScore,
        cbtMathScore: scores.cbtMathScore,
        cbtEnglScore: scores.cbtEnglScore,
        tabSwitchesCount: cbtTabSwitches,
        cbtAnswers: updatedAnswers
      };

      setFormData(prev => ({
        ...prev,
        ...updatedData
      }));

      if (activePortalApplication) {
        const updatedApp = {
          ...activePortalApplication,
          ...updatedData
        };
        setActivePortalApplication(updatedApp);
        const allAppListStr = localStorage.getItem('ff_admissions');
        if (allAppListStr) {
          try {
            const list = JSON.parse(allAppListStr);
            const idx = list.findIndex((a: any) => a.id === activePortalApplication.id);
            if (idx !== -1) {
              list[idx] = updatedApp;
              localStorage.setItem('ff_admissions', JSON.stringify(list));
            }
          } catch (e) {
            console.warn(e);
          }
        }
      }

      setCbtStep('results');
    }
  };

  // Portal credentials tracker fetch
  const handlePortalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (!loginEmail || !loginPhone) {
      setLoginError('Please enter both Email and Phone number to locate your record');
      return;
    }

    const currentLocal = JSON.parse(localStorage.getItem('ff_admissions') || '[]');
    const match = currentLocal.find((adm: any) => {
      const emailMatch = adm.email?.toLowerCase() === loginEmail.toLowerCase() || 
                         adm.fatherEmail?.toLowerCase() === loginEmail.toLowerCase() ||
                         adm.motherEmail?.toLowerCase() === loginEmail.toLowerCase();
      const phoneMatch = adm.phone === loginPhone || 
                         adm.fatherPhone === loginPhone ||
                         adm.motherPhone === loginPhone;
      return emailMatch && phoneMatch;
    });

    if (match) {
      setActivePortalApplication(match);
      setShowStatusAlert('Welcome back! Loaded active candidate dashboard pipeline.');
    } else {
      setLoginError('No matching application found. Check your credential pairing or submit a new inquiry.');
    }
  };

  const handleAcceptAdmissionOffer = () => {
    if (activePortalApplication) {
      const updated = {
        ...activePortalApplication,
        status: 'Admitted' as const
      };
      setActivePortalApplication(updated);
      
      const currentLocal = JSON.parse(localStorage.getItem('ff_admissions') || '[]');
      const updatedLocal = currentLocal.map((adm: any) => adm.id === updated.id ? updated : adm);
      localStorage.setItem('ff_admissions', JSON.stringify(updatedLocal));
      
      setShowStatusAlert('Congratulations! You have accepted our admission offer. Proceed to pay entry fees.');
    }
  };

  const handlePayEntryFees = () => {
    if (activePortalApplication) {
      const updated = {
        ...activePortalApplication,
        feesPaid: true,
        feesAmountPaid: 45000,
        status: 'Admitted' as const
      };
      setActivePortalApplication(updated);
      
      const currentLocal = JSON.parse(localStorage.getItem('ff_admissions') || '[]');
      const updatedLocal = currentLocal.map((adm: any) => adm.id === updated.id ? updated : adm);
      localStorage.setItem('ff_admissions', JSON.stringify(updatedLocal));
      
      setShowStatusAlert('Fee payment processed successfully! Download your entrance receipt.');
    }
  };

  const handleUploadAdditionalDoc = (label: string) => {
    if (activePortalApplication) {
      const fieldId = label === 'Medical Report' ? 'docMedicalReport' : 'docUtilityBill';
      const fileUrl = `https://scholar-files.faithfoundation.edu/files/dashboard-upload-${Date.now()}.pdf`;
      
      const updated = {
        ...activePortalApplication,
        [fieldId]: fileUrl
      };
      
      setActivePortalApplication(updated);
      const currentLocal = JSON.parse(localStorage.getItem('ff_admissions') || '[]');
      const updatedLocal = currentLocal.map((adm: any) => adm.id === updated.id ? updated : adm);
      localStorage.setItem('ff_admissions', JSON.stringify(updatedLocal));
      
      setShowStatusAlert(`Supplementary file '${label}' linked to candidate profile.`);
    }
  };

  const printReceipt = (id: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
      <head>
        <title>Admissions Invoice - ${id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; background: white; }
          .card { max-width: 650px; margin: 0 auto; border: 2px solid #f1f5f9; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
          .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 800; color: #1e3a8a; letter-spacing: -1px; }
          .sub { font-[10px]; text-transform: uppercase; letter-spacing: 2px; color: #f59e0b; margin-top: 5px; }
          .title { font-size: 18px; font-weight: bold; margin: 30px 0 10px 0; text-align: center; background: #f8fafc; padding: 10px; border-radius: 8px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; font-size: 14px; }
          .label { color: #64748b; font-weight: bold; }
          .value { color: #0f172a; font-weight: bold; text-align: right; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; pt-20px; }
          .stamp { border: 2px dashed #059669; color: #059669; font-weight: black; display: inline-block; padding: 5px 15px; text-transform: uppercase; border-radius: 6px; font-size: 14px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">FAITH FOUNDATION SCHOOLS</div>
            <div class="sub">Academic Excellence & Moral Fortitude</div>
            <p style="font-size: 12px; color: #64748b; margin-top: 5px;">Ibadan Campus, Oyo State, Nigeria</p>
          </div>
          <div class="title">OFFICIAL ADMISSION APPLICATION RECEIPT</div>
          
          <div style="text-align: center;">
            <span class="stamp">Verified &amp; Submitted</span>
          </div>

          <div class="grid">
            <div class="label">Application Reference ID:</div>
            <div class="value">${id}</div>

            <div class="label">Date of Filing:</div>
            <div class="value">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>

            <div class="label">Applicant Name Address:</div>
            <div class="value">${formData.surname ? `${formData.firstName} ${formData.surname}` : 'Student Candidate'}</div>

            <div class="label">Assigned Intended Program:</div>
            <div class="value">${formData.admissionType} Portal</div>

            <div class="label">Intended Entrance Grade:</div>
            <div class="value">${formData.intendedClass} (${formData.academicSession})</div>

            <div class="label">Declared Guardian/Sponsor:</div>
            <div class="value">${formData.fatherName || formData.motherName || formData.guardianName || 'Noted'}</div>

            <div class="label">CBT Evaluation Status:</div>
            <div class="value">${formData.cbtTaken ? `Completed (Score: ${formData.cbtScore}%)` : 'Not Taken / Pending'}</div>
          </div>

          <div class="footer">
            <p>This document constitutes an electronic confirmation of portal creation. Official reviews process within 7 academic days. Candidates are recommended to take printouts along on CBT Interview Dates.</p>
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printAdmissionLetter = (app: ApplicationData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
      <head>
        <title>Official Admission Letter - Faith Foundation Schools</title>
        <style>
          body { font-family: 'Georgia', serif; padding: 50px; color: #1e293b; background: white; line-height: 1.6; }
          .letter { max-width: 750px; margin: 0 auto; border: 12px double #1e3a8a; padding: 40px; border-radius: 4px; position: relative; }
          .crest { text-align: center; border-bottom: 2px solid #b45309; padding-bottom: 15px; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: Arial, sans-serif; font-weight: 900; color: #1e3a8a; letter-spacing: -1px; }
          .motto { font-size: 12px; font-style: italic; color: #b45309; text-transform: uppercase; font-family: sans-serif; letter-spacing: 1px; }
          .date { text-align: right; margin-bottom: 30px; font-family: sans-serif; font-size: 14px; }
          .salutation { font-weight: bold; margin-bottom: 20px; }
          .body { font-size: 15px; margin-bottom: 40px; text-align: justify; }
          .signature-section { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; font-family: sans-serif; }
          .sign-box { text-align: center; }
          .seal { border: 3px double #b45309; padding: 10px; color: #b45309; font-weight: bold; text-transform: uppercase; font-family: sans-serif; font-size: 12px; transform: rotate(-5deg); display: inline-block; }
          .metadata { font-size: 12px; color: #64748b; font-family: sans-serif; margin-top: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="letter">
          <div class="crest">
            <div class="logo">FAITH FOUNDATION SCHOOLS</div>
            <div class="motto">Building Academic Excellence & Moral Fortitude</div>
            <p style="font-family: sans-serif; font-size: 12px; color: #64748b; margin-top: 5px;">Ibadan Campus, Oyo State, Nigeria</p>
          </div>

          <div class="date">Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>

          <p style="font-family: sans-serif; font-size: 14px; margin-bottom: 5px;"><strong>Ref No:</strong> ${app.id}</p>
          <p style="font-family: sans-serif; font-size: 14px; margin-bottom: 30px;"><strong>Candidate Name:</strong> ${app.student_name || `${app.firstName} ${app.surname}`}</p>

          <div class="salutation">Dear Mr. &amp; Mrs. ${app.parent_name || app.fatherName || 'Parent/Guardian'},</div>

          <div class="body">
            We are writing to convey the official decision of the Faith Foundation School Admissions Board regarding your application for admission for the <strong>${app.academicSession || '2026/2027'}</strong> Academic session.
            <br/><br/>
            Following careful analysis of your candidate's academic profiles, credentials, outstanding recommendations, and performance on our Computer Based Assessment (CBT), we are delighted to offer <strong>${app.student_name || `${app.firstName} ${app.surname}`}</strong> provisional admission into **${app.target_class || app.intendedClass}** of Faith Foundation Schools.
            <br/><br/>
            Our institution stands as an elite environment built upon three primary pillars: intellectual capability, robust high-ethics character formulation, and sound values development. We are convinced your ward will experience phenomenal growth and excel inside our multi-disciplinary learning ecosystem.
            <br/><br/>
            Please note that this offer of admission is subject to the validation and settlement of our primary entrance fees on the candidate dashboard portal. Classes resume in accordance with the official school calendar.
            <br/><br/>
            Once again, congratulations. We look forward to welcoming you into our school family.
          </div>

          <div class="signature-section">
            <div class="sign-box">
              <div class="seal">OFFICIAL BOARD<br/>APPROVED SEAL</div>
            </div>
            <div class="sign-box" style="text-align: right;">
              <p style="font-family: cursive, sans-serif; font-size: 16px; color: #1e3a8a; margin-bottom: 2px;">Olasubomi F.</p>
              <div style="border-top: 1px solid #94a3b8; width: 180px; margin-top: 5px; padding-top: 5px;">
                <strong>Director of Admissions</strong><br/>
                Faith Foundation Board of Regents
              </div>
            </div>
          </div>

          <div class="metadata">
            Faith Foundation Schools | Registered Ministry of Education, Ibadan Oyo State
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <PublicNavbar />

      {/* Top Notification Toast */}
      <AnimatePresence>
        {showStatusAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-semibold text-xs px-6 py-4 rounded-2xl shadow-xl z-50 flex items-center gap-3 border border-slate-800"
          >
            <Sparkles className="text-amber-400 shrink-0" size={16} />
            <span>{showStatusAlert}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portal Hero header */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-primary/5 via-transparent to-transparent border-b border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] -z-10" />
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/5 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-primary/5">
            <Milestone size={14} className="text-[#eab308]" />
            Online Admissions Workspace
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-primary leading-tight max-w-4xl mx-auto">
            Enroll Your Ward in Nigeria's Elite Learning Family
          </h1>
          <p className="text-gray-500 text-sm max-w-2xl mx-auto font-medium mt-6 leading-relaxed">
            Experience our safe, digital, mobile-friendly admission workflow. Follow progress, save inquiries, take entrance testing online, and acquire immediate admission status reviews.
          </p>

          {/* Selector Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-full max-w-lg mx-auto border border-slate-200/50 mt-10">
            <button
              onClick={() => { setViewMode('landing'); setSubmissionFeedback(null); }}
              className={`flex-1 py-3 px-5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                viewMode === 'landing' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.03]' 
                  : 'text-gray-500 hover:text-primary'
              }`}
            >
              Overview &amp; Pathways
            </button>
            <button
              onClick={() => { setViewMode('apply'); setSubmissionFeedback(null); }}
              className={`flex-1 py-3 px-5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                viewMode === 'apply' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.03]' 
                  : 'text-gray-500 hover:text-primary'
              }`}
            >
              Fill Admission Form
            </button>
            <button
              onClick={() => { setViewMode('dashboard'); setSubmissionFeedback(null); }}
              className={`flex-1 py-3 px-5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                viewMode === 'dashboard' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.03]' 
                  : 'text-gray-500 hover:text-primary'
              }`}
            >
              Applicant Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Main Panel views layout */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* VIEW 1: LANDING OVERVIEW */}
        {viewMode === 'landing' && !submissionFeedback && (
          <div className="space-y-16">
            
            {/* Quick Pathways grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: 'Nursery Pathway', color: 'border-yellow-250', bg: 'bg-yellow-50/40', desc: 'Pre-school early years learning for Creche & Kindergarten with high sensory intelligence equipment.' },
                { title: 'Primary Pathway', color: 'border-blue-250', bg: 'bg-blue-50/40', desc: 'Primary Basics syllabus establishing firm numeric proficiency, digital computing, and moral values.' },
                { title: 'College Pathways', color: 'border-emerald-250', bg: 'bg-emerald-50/40', desc: 'Junior Secondary (JSS) & Senior Secondary (SS) courses focusing on WAEC, NECO, and JAMB success.' },
                { title: 'Transfer Program', color: 'border-slate-250', bg: 'bg-slate-50/40', desc: 'Seamless direct entry for transfer candidates with complete transcript assessments.' },
              ].map((pathway, idx) => (
                <div key={idx} className={`border border-slate-150 p-6 rounded-3xl ${pathway.bg} flex flex-col justify-between group hover:border-primary duration-300 transition-all shadow-sm`}>
                  <div>
                    <h3 className="font-extrabold text-primary text-sm uppercase tracking-wide">{pathway.title}</h3>
                    <p className="text-gray-500 text-xs mt-3 leading-relaxed font-semibold">{pathway.desc}</p>
                  </div>
                  <button 
                    onClick={() => setViewMode('apply')}
                    className="flex items-center gap-1.5 text-xs text-primary font-black mt-6 hover:text-amber-500 transition-colors uppercase tracking-wider"
                  >
                    Start Pathway <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Steps explanation banner */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden p-8 lg:p-12">
              <div className="grid lg:grid-cols-5 gap-12 items-center">
                <div className="lg:col-span-2 space-y-4">
                  <span className="text-[10px] bg-amber-100 text-amber-700 font-bold uppercase tracking-wider px-3 py-1 rounded-full">Easy 10-Step Enrollment</span>
                  <h3 className="text-2xl md:text-3xl font-display font-black text-primary leading-tight">Digital Enrollment Timeline</h3>
                  <p className="text-gray-400 text-xs font-semibold leading-relaxed">
                    Faith Foundation streamline admissions to eliminate paperwork bottlenecking. Secure progress, take CBT testing, verify health criteria, upload certificates, and pay directly online.
                  </p>
                  <div className="pt-2">
                    <button 
                      onClick={() => setViewMode('apply')}
                      className="px-6 py-3.5 bg-primary hover:bg-opacity-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
                    >
                      Fill Online Form <ArrowRight size={16} />
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-3 grid sm:grid-cols-2 gap-6">
                  {[
                    { s: 'Step 1-3', t: 'Identities & Parenting', d: 'Choose study category, intake session, and sponsor emails/phones for status dispatching.' },
                    { s: 'Step 4-6', t: 'Academic & Health', d: 'Declare core historical grades, physical health, allergies, and behavioral files.' },
                    { s: 'Step 7-8', t: 'Doc Upload & CBT Exam', d: 'Simulate document attachments, verify criteria, and answer the online candidate test.' },
                    { s: 'Step 9-10', t: 'Declaration & Summary', d: 'Legally verify declarations by custom parent signatures, review fields, and lock submission.' }
                  ].map((axis, i) => (
                    <div key={i} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all">
                      <div className="text-xs font-black text-[#eab308] tracking-widest uppercase">{axis.s}</div>
                      <h4 className="font-extrabold text-primary text-sm mt-1 uppercase">{axis.t}</h4>
                      <p className="text-gray-500 text-xs mt-2 leading-relaxed font-semibold">{axis.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Call to actions footer */}
            <div className="border border-slate-150 rounded-[32px] p-8 bg-[#1e293b] text-white flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h4 className="font-display font-bold text-lg">Already filed an admission inquiry with us?</h4>
                <p className="text-slate-400 text-xs mt-1">Track your schedules, take CBT tests, download letters of offer, and settle administrative fees securely.</p>
              </div>
              <button 
                onClick={() => setViewMode('dashboard')}
                className="px-6 py-3 bg-amber-500 text-white hover:bg-amber-600 rounded-xl font-bold text-xs uppercase tracking-widest transition-transform hover:scale-105 shrink-0"
              >
                Go to Candidate Dashboard
              </button>
            </div>
          </div>
        )}

        {/* RECENT SUBMISSION COMPLETED SCREEN */}
        {submissionFeedback && (
          <div className="max-w-2xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[40px] border border-slate-150 p-8 lg:p-12 text-center shadow-2xl space-y-8"
            >
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto animate-bounce border border-emerald-100">
                <Check size={36} />
              </div>

              <div>
                <span className="text-[10px] uppercase font-black tracking-widest bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full">
                  Submission Transmitted Successfully
                </span>
                <h2 className="text-3xl font-display font-black text-primary mt-4">
                  Application Logged In!
                </h2>
                <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto mt-2 leading-relaxed">
                  We have fully generated candidate pipeline registers. A confirmation correspondence has been dispatched via SMS and simulated email loops.
                </p>
              </div>

              {/* Printable receipt card */}
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl text-left space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
                  <span className="text-xs text-slate-400 font-semibold">APPLICATION ID:</span>
                  <span className="text-sm font-mono font-black text-primary">{submissionFeedback.appNum}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-semibold">CANDIDATE NAME:</span>
                  <span className="text-xs font-bold text-slate-700 uppercase">{formData.firstName} {formData.surname}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-semibold">CLASS APPLIED FOR:</span>
                  <span className="text-xs font-bold text-slate-700">{formData.intendedClass}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-semibold">EXAM SCORE:</span>
                  <span className="text-xs font-bold text-emerald-600">{formData.cbtTaken ? `${formData.cbtScore}%` : 'CBT Not Taken'}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => printReceipt(submissionFeedback.appNum)}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 hover:text-primary rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 duration-300 cursor-pointer"
                >
                  <Printer size={16} /> Print Official Receipt
                </button>
                <button 
                  onClick={() => {
                    setLoginEmail(formData.fatherEmail || formData.motherEmail || formData.guardianEmail || '');
                    setLoginPhone(formData.fatherPhone || formData.motherPhone || formData.guardianPhone || '');
                    setActivePortalApplication(formData);
                    setViewMode('dashboard');
                    setSubmissionFeedback(null);
                  }}
                  className="flex-1 py-4 bg-primary text-white hover:bg-opacity-95 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 duration-300 shadow-xl shadow-primary/10 cursor-pointer"
                >
                  Go to Candidate Dashboard <ArrowRight size={16} />
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setFormData(initialFormData);
                    setSubmissionFeedback(null);
                    setViewMode('apply');
                    setCurrentStep(1);
                  }}
                  className="text-xs text-slate-400 hover:text-primary font-bold transition-all uppercase tracking-wider"
                >
                  Reset &amp; Start Another Application
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* VIEW 2: 10-STEP COMPREHENSIVE ADMISSION FORM */}
        {viewMode === 'apply' && !submissionFeedback && (
          <div className="max-w-4xl mx-auto">
            
            {/* Step header progress tracker */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    Securing Admission Form
                  </span>
                  <h2 className="text-xl font-display font-black text-primary uppercase tracking-tight mt-0.5">
                    Step {currentStep} of 10: {
                      currentStep === 1 ? 'Academic Program Selection' :
                      currentStep === 2 ? 'Applicant Personal Data' :
                      currentStep === 3 ? 'Parent & Guardian Information' :
                      currentStep === 4 ? 'Academic History' :
                      currentStep === 5 ? 'Health Information' :
                      currentStep === 6 ? 'Behavioral Declarations' :
                      currentStep === 7 ? 'Certificates & Documents' :
                      currentStep === 8 ? 'Entrance CBT Assessment' :
                      currentStep === 9 ? 'Submission Declaration' :
                      'Review Applications Log'
                    }
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => saveProgressDraft(true)}
                    disabled={savingDraft}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    {savingDraft ? <Loader2 className="animate-spin text-primary" size={13} /> : <RefreshCw size={12} />}
                    Save Draft
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: `${(currentStep / 10) * 100}%` }}
                  transition={{ duration: 0.4 }}
                  className="bg-primary h-full rounded-full"
                />
              </div>

              {/* Step indicator pills list */}
              <div className="hidden md:flex justify-between items-center mt-3 gap-1">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <span 
                    key={idx} 
                    className={`h-1.5 flex-1 rounded-full ${
                      idx + 1 === currentStep ? 'bg-[#eab308]' : 
                      idx + 1 < currentStep ? 'bg-primary' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Form Validation alerts */}
            {validationError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{validationError}</span>
              </div>
            )}

            {/* STEP WRAPPER DISPLAY */}
            <div className="bg-white rounded-[40px] border border-slate-150 p-6 md:p-10 shadow-sm min-h-[400px] flex flex-col justify-between">
              <div>
                {/* STEP 1: APPLICATION TYPE */}
                {currentStep === 1 && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-black text-primary">SELECT ENROLLMENT PATHWAY:</h3>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">Declare your intended structural educational entry class and target term frames.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Pathway Classification</label>
                        <select
                          value={formData.admissionType}
                          onChange={(e) => setFormData({ ...formData, admissionType: e.target.value as any })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all appearance-none cursor-pointer"
                        >
                          <option>Nursery Admission</option>
                          <option>Primary Admission</option>
                          <option>Junior Secondary Admission</option>
                          <option>Senior Secondary Admission</option>
                          <option>Transfer Student Admission</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Academic Session</label>
                        <select
                          value={formData.academicSession}
                          onChange={(e) => setFormData({ ...formData, academicSession: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all appearance-none cursor-pointer"
                        >
                          <option>2026/2027</option>
                          <option>2027/2028</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Academic Term Intake</label>
                        <select
                          value={formData.intendedTerm}
                          onChange={(e) => setFormData({ ...formData, intendedTerm: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all appearance-none cursor-pointer"
                        >
                          <option>First Term (High intake)</option>
                          <option>Second Term</option>
                          <option>Third Term</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Intended Class</label>
                        <select
                          value={formData.intendedClass}
                          onChange={(e) => setFormData({ ...formData, intendedClass: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all appearance-none cursor-pointer"
                        >
                          {formData.admissionType.includes('Nursery') && (
                            <>
                              <option>Creche</option>
                              <option>Nursery 1</option>
                              <option>Nursery 2</option>
                            </>
                          )}
                          {formData.admissionType.includes('Primary') && (
                            <>
                              <option>Basic 1</option>
                              <option>Basic 2</option>
                              <option>Basic 3</option>
                              <option>Basic 4</option>
                              <option>Basic 5</option>
                            </>
                          )}
                          {formData.admissionType.includes('Junior') && (
                            <>
                              <option>JSS 1</option>
                              <option>JSS 2</option>
                            </>
                          )}
                          {formData.admissionType.includes('Senior') && (
                            <>
                              <option>SS 1</option>
                              <option>SS 2</option>
                            </>
                          )}
                          {formData.admissionType.includes('Transfer') && (
                            <>
                              <option>Basic 4 (Transfer)</option>
                              <option>JSS 2 (Transfer)</option>
                              <option>SS 2 (Transfer)</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: APPLICANT PERSONAL INFORMATION */}
                {currentStep === 2 && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-black text-primary">APPLICANT PERSONAL DATA:</h3>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">Provide formal student files as they appear on official state certificates.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Surname *</label>
                        <input
                          type="text"
                          required
                          value={formData.surname}
                          onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-primary transition-all"
                          placeholder="Surname"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">First Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-primary transition-all"
                          placeholder="First Name"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Middle name</label>
                        <input
                          type="text"
                          value={formData.middleName}
                          onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-primary transition-all"
                          placeholder="Middle Name"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Gender *</label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Date of Birth *</label>
                        <input
                          type="date"
                          required
                          value={formData.dob}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-primary transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase ml-1 mb-2">Calculated Age</label>
                        <input
                          type="number"
                          readOnly
                          value={formData.age || ''}
                          className="w-full px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-650 outline-none"
                          placeholder="Years"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">State of Origin</label>
                        <input
                          type="text"
                          value={formData.stateOfOrigin}
                          onChange={(e) => setFormData({ ...formData, stateOfOrigin: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-primary transition-all"
                          placeholder="E.g. Oyo State"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">L.G.A</label>
                        <input
                          type="text"
                          value={formData.lga}
                          onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-primary transition-all"
                          placeholder="E.g. Ibadan North"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Religion</label>
                        <input
                          type="text"
                          value={formData.religion}
                          onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-primary transition-all"
                          placeholder="E.g. Christian"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Country</label>
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-primary transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Residential Address *</label>
                        <input
                          type="text"
                          required
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-primary transition-all"
                          placeholder="E.g. Bodija Phase 2, Ibadan"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: PARENT/GUARDIAN INFORMATION */}
                {currentStep === 3 && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-black text-primary">PARENT / FAMILY SPONSOR INFO:</h3>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">Enter reliable email and WhatsApp vectors. These receive electronic receipts under review actions.</p>
                    </div>

                    {/* Husband/Father */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-extrabold text-blue-800 uppercase tracking-wider bg-blue-50/60 p-2 rounded-lg inline-block">A. Father's Details</h4>
                      <div className="grid md:grid-cols-3 gap-6">
                        <input
                          type="text"
                          value={formData.fatherName}
                          onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          placeholder="Father's Full Name"
                        />
                        <input
                          type="text"
                          value={formData.fatherOccupation}
                          onChange={(e) => setFormData({ ...formData, fatherOccupation: e.target.value })}
                          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          placeholder="Occupation/Profession"
                        />
                        <input
                          type="text"
                          value={formData.fatherEmployer}
                          onChange={(e) => setFormData({ ...formData, fatherEmployer: e.target.value })}
                          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          placeholder="Employer / Organization"
                        />
                        <input
                          type="tel"
                          value={formData.fatherPhone}
                          onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          placeholder="Phone Number (Call/SMS)"
                        />
                        <input
                          type="tel"
                          value={formData.fatherWhatsapp}
                          onChange={(e) => setFormData({ ...formData, fatherWhatsapp: e.target.value })}
                          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          placeholder="WhatsApp Contact"
                        />
                        <input
                          type="email"
                          value={formData.fatherEmail}
                          onChange={(e) => setFormData({ ...formData, fatherEmail: e.target.value })}
                          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          placeholder="Secure Email Address"
                        />
                      </div>
                    </div>

                    {/* Mother */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-extrabold text-[#b45309] uppercase tracking-wider bg-amber-50/60 p-2 rounded-lg inline-block">B. Mother's Details</h4>
                      <div className="grid md:grid-cols-3 gap-6">
                        <input
                          type="text"
                          value={formData.motherName}
                          onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          placeholder="Mother's Full Name"
                        />
                        <input
                          type="text"
                          value={formData.motherOccupation}
                          onChange={(e) => setFormData({ ...formData, motherOccupation: e.target.value })}
                          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          placeholder="Occupation/Profession"
                        />
                        <input
                          type="text"
                          value={formData.motherEmployer}
                          onChange={(e) => setFormData({ ...formData, motherEmployer: e.target.value })}
                          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          placeholder="Employer"
                        />
                        <input
                          type="tel"
                          value={formData.motherPhone}
                          onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          placeholder="Phone Number"
                        />
                        <input
                          type="tel"
                          value={formData.motherWhatsapp}
                          onChange={(e) => setFormData({ ...formData, motherWhatsapp: e.target.value })}
                          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          placeholder="WhatsApp Contact"
                        />
                        <input
                          type="email"
                          value={formData.motherEmail}
                          onChange={(e) => setFormData({ ...formData, motherEmail: e.target.value })}
                          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          placeholder="Email Address"
                        />
                      </div>
                    </div>

                    {/* Emergency Contacts */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-extrabold text-rose-800 uppercase tracking-wider bg-rose-50/60 p-2 rounded-lg inline-block">C. Emergency Contacts *</h4>
                      <div className="grid md:grid-cols-3 gap-6">
                        <input
                          required
                          type="text"
                          value={formData.emergencyName}
                          onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          placeholder="Emergency Sponsor Full Name *"
                        />
                        <input
                          required
                          type="text"
                          value={formData.emergencyRelationship}
                          onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          placeholder="Relationship (e.g. Brother) *"
                        />
                        <input
                          required
                          type="tel"
                          value={formData.emergencyPhone}
                          onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          placeholder="Emergency Phone Number *"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: ACADEMIC HISTORY */}
                {currentStep === 4 && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-black text-primary">CANDIDATE ACADEMIC RECORD:</h3>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">Declare standard institutional history to facilitate curriculum streaming.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Current/Previous School *</label>
                        <input
                          type="text"
                          required
                          value={formData.prevSchoolName}
                          onChange={(e) => setFormData({ ...formData, prevSchoolName: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white"
                          placeholder="School Name"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Previous Class Completed</label>
                        <input
                          type="text"
                          value={formData.prevClassCompleted}
                          onChange={(e) => setFormData({ ...formData, prevClassCompleted: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white"
                          placeholder="E.g. Primary 5, JSS 1"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Last Academic Session</label>
                        <input
                          type="text"
                          value={formData.prevSession}
                          onChange={(e) => setFormData({ ...formData, prevSession: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white"
                          placeholder="E.g. 2024/2025"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Reason for Leaving</label>
                        <input
                          type="text"
                          value={formData.reasonForLeaving}
                          onChange={(e) => setFormData({ ...formData, reasonForLeaving: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white"
                          placeholder="E.g. Relocation to Ibadan"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Performance Strengths</label>
                        <textarea
                          rows={2}
                          value={formData.areasOfStrength}
                          onChange={(e) => setFormData({ ...formData, areasOfStrength: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          placeholder="What subjects/activities does applicant excel in? (E.g. Mathematics, Fine Arts)"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Areas Requiring Support</label>
                        <textarea
                          rows={2}
                          value={formData.areasOfSupport}
                          onChange={(e) => setFormData({ ...formData, areasOfSupport: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          placeholder="Any subjects or skills where candidate requires supplementary coaching?"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: HEALTH INFORMATION */}
                {currentStep === 5 && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-black text-primary">CANDIDATE MEDICAL PROFILE:</h3>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">Declare critical medical metrics to direct health service responders in emergency situations.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Blood Group *</label>
                        <select
                          required
                          value={formData.bloodGroup}
                          onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold"
                        >
                          <option value="">Select Group</option>
                          <option>A+</option>
                          <option>A-</option>
                          <option>B+</option>
                          <option>B-</option>
                          <option>AB+</option>
                          <option>AB-</option>
                          <option>O+</option>
                          <option>O-</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Genotype *</label>
                        <select
                          required
                          value={formData.genotype}
                          onChange={(e) => setFormData({ ...formData, genotype: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold"
                        >
                          <option value="">Select Genotype</option>
                          <option>AA</option>
                          <option>AS</option>
                          <option>AC</option>
                          <option>SS</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Known Allergies</label>
                        <input
                          type="text"
                          value={formData.allergies}
                          onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold"
                          placeholder="E.g. Peanuts, Penicillin, None"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2 font-mono">Special Educational Needs</label>
                        <input
                          type="text"
                          value={formData.specialNeeds}
                          onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold"
                          placeholder="E.g. Dyslexia accommodation, ADHD tracking..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Routine Medications</label>
                        <input
                          type="text"
                          value={formData.medications}
                          onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold"
                          placeholder="Medications candidate takes regularly"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6: BEHAVIOURAL INFORMATION */}
                {currentStep === 6 && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-black text-primary">BEHAVIORAL STANDARDS DECLARATION:</h3>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">Sustain high campus discipline records. Honest declarations avoid retroactive enrollment rejection risks.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-slate-50 border border-slate-100 rounded-2xl gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase">A. School Suspension</h4>
                          <p className="text-[11px] text-slate-400 mt-1 font-medium">Has candidate ever been suspended from school activities?</p>
                        </div>
                        <div className="flex gap-4">
                          {['Yes', 'No'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setFormData({ ...formData, hasBeenSuspended: opt as any })}
                              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                                formData.hasBeenSuspended === opt 
                                  ? 'bg-primary text-white shadow-md' 
                                  : 'bg-white border text-slate-600'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-slate-50 border border-slate-100 rounded-2xl gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase">B. Student Expulsion</h4>
                          <p className="text-[11px] text-slate-400 mt-1 font-medium">Has candidate ever been expelled from any school?</p>
                        </div>
                        <div className="flex gap-4">
                          {['Yes', 'No'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setFormData({ ...formData, hasBeenExpelled: opt as any })}
                              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                                formData.hasBeenExpelled === opt 
                                  ? 'bg-primary text-white shadow-md' 
                                  : 'bg-white border text-slate-600'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-slate-50 border border-slate-100 rounded-2xl gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase">C. Prior Disciplinary Actions</h4>
                          <p className="text-[11px] text-slate-400 mt-1 font-medium">Has applicant faced other written administrative actions or counseling?</p>
                        </div>
                        <div className="flex gap-4">
                          {['Yes', 'No'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setFormData({ ...formData, hasReceivedDiscipline: opt as any })}
                              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                                formData.hasReceivedDiscipline === opt 
                                  ? 'bg-primary text-white shadow-md' 
                                  : 'bg-white border text-slate-600'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Expansion details if Yes */}
                      {(formData.hasBeenSuspended === 'Yes' || formData.hasBeenExpelled === 'Yes' || formData.hasReceivedDiscipline === 'Yes') && (
                        <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 space-y-3">
                          <label className="block text-xs font-black text-[#b45309] uppercase">Disciplinary Details Clarification</label>
                          <textarea
                            rows={3}
                            value={formData.disciplinaryDetails}
                            onChange={(e) => setFormData({ ...formData, disciplinaryDetails: e.target.value })}
                            className="w-full p-4 bg-white border border-amber-200 rounded-xl text-xs font-semibold outline-none"
                            placeholder="Kindly explain occurrences, remedial lessons, and administrative remarks if applicable."
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 7: DOCUMENT UPLOADS */}
                {currentStep === 7 && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-black text-primary">CANDIDATE CERTIFICATE ATTACHMENTS:</h3>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">Attach documents verifying applicant records. Uploading your Passport Photograph is mandatory; other certificates are optional and can be submitted now or during physical screening.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {[
                        { label: 'Birth Certificate', desc: 'Optional. Birth certificate verifying biological records.', ext: 'pdf' },
                        { label: 'Passport Photograph', desc: 'Mandatory / Required. High resolution formal portrait.', ext: 'png' },
                        { label: 'Previous School Result', desc: 'Optional. Academic report card verifying baseline criteria.', ext: 'pdf' },
                        { label: 'Testimonial', desc: 'Optional. Head teacher ethical recommendation or reference.', ext: 'pdf' },
                        { label: 'Medical Report', desc: 'Optional. Signed physician summary detailing basic vaccine stats.', ext: 'pdf' },
                        { label: 'Utility Bill', desc: 'Optional. Utility statement confirming target residency vectors.', ext: 'pdf' }
                      ].map((item, id) => (
                        <div key={id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center group hover:border-slate-350 transition-all">
                          <div className="min-w-0 pr-4">
                            <h4 className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-1.5">
                              {item.label}
                              {item.label === 'Passport Photograph' ? (
                                <span className="text-[8px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-black uppercase">Mandatory</span>
                              ) : (
                                <span className="text-[8px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-black uppercase font-mono">Optional</span>
                              )}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-1 leading-normal font-semibold max-w-[200px]">{item.desc}</p>
                            {fileLogs[item.label] ? (
                              <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block">
                                Saved: {fileLogs[item.label].slice(0, 18)}...
                              </span>
                            ) : (
                              <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-50 px-2 py-0.5 rounded mt-2 inline-block">
                                Awaiting Upload
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleFileUpload(item.label, item.ext)}
                            className="bg-white border border-slate-200 shadow-sm hover:border-primary duration-300 transition-all p-3.5 rounded-xl text-primary flex items-center justify-center cursor-pointer"
                          >
                            <Upload size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 8: ADMISSION TEST ONLINE CBT */}
                {currentStep === 8 && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-black text-primary">ENTRANCE EVALUATION ASSESSMENT (CBT):</h3>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">Integrate high-accuracy entrance grading parameters. You may take this brief baseline assessment instantly.</p>
                    </div>

                    {cbtStep === 'rules' && (
                      <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 md:p-12 text-center space-y-6">
                        <div className="w-16 h-16 bg-white rounded-2xl border border-slate-150 flex items-center justify-center text-slate-400 mx-auto">
                          <BookOpen size={30} className="text-[#eab308]" />
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-xl font-extrabold text-[#111827] uppercase tracking-wide">Entrance Examination (CBT CBT)</h4>
                          <p className="text-xs text-slate-500 max-w-md mx-auto leading-normal font-semibold">
                            - This test measures essential comprehension logic, arithmetic aptitude, and general cognitive coefficients.<br/>
                            - Contains <strong className="text-primary font-black">{cbtQuestions.length || CBT_QUESTIONS.length} custom-structured questions</strong>.<br/>
                            - Timer duration is strictly capped at <strong className="text-[#b45309] font-black">{cbtDurationMinutes} Minutes ({cbtDurationMinutes * 60} Seconds)</strong>.<br/>
                            - Timer starts immediately on simulator activation and will auto-submit when the clock expires.<br/>
                            - Score aggregates will be logged on your candidate inquiry profile folder instantly.
                          </p>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={startCbtExam}
                            className="px-8 py-4 bg-primary hover:bg-opacity-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
                          >
                            Launch Active CBT Simulator
                          </button>
                        </div>
                      </div>
                    )}

                    {cbtStep === 'active' && (() => {
                      const activeQ = cbtQuestions[currentCbtQuestionIndex];
                      if (!activeQ) return null;

                      // Helper to extract dropdown matching value
                      const getMatchingValueForLeftItem = (left: string) => {
                        if (!selectedAnswer) return "";
                        const pairs = selectedAnswer.split(" | ");
                        const match = pairs.find(p => p.startsWith(`${left}=>`));
                        if (match) {
                          return match.split("=>")[1] || "";
                        }
                        return "";
                      };

                      // Helper to process row pairings changes
                      const handleMatchingSelect = (left: string, right: string) => {
                        const leftItems = activeQ.matchingPairs?.map(p => p.left) || [];
                        const pairs = leftItems.map(item => {
                          const val = item === left ? right : getMatchingValueForLeftItem(item);
                          return `${item}=>${val}`;
                        });
                        const newAnswerString = pairs.join(" | ");
                        handleCbtAnswerSelect(newAnswerString);
                      };

                      return (
                        <div className="bg-white rounded-[32px] border border-slate-200 p-6 md:p-10 space-y-8 shadow-md relative overflow-hidden animate-in zoom-in-95 duration-200">
                          {/* Progressive indicator bar at the top */}
                          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
                            <div 
                              className="h-full bg-amber-500 transition-all duration-300"
                              style={{ width: `${((currentCbtQuestionIndex + 1) / cbtQuestions.length) * 100}%` }}
                            />
                          </div>

                          {/* Header indicators */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 font-mono text-[10px] text-slate-450 font-bold gap-3">
                            <div className="flex items-center gap-2">
                              <span className="uppercase tracking-widest text-[#111827] bg-slate-100 px-3 py-1 rounded-full text-[9px]">
                                Question {currentCbtQuestionIndex + 1} of {cbtQuestions.length}
                              </span>
                              <span className="uppercase text-[9px] bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full border border-sky-100">
                                Subject: {activeQ.subject}
                              </span>
                              <span className="uppercase text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                {activeQ.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-rose-500 font-bold">
                                Security warnings used: {cbtTabSwitches} / 3
                              </span>
                              <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-black tracking-wide ${cbtSecondsLeft < 120 ? 'bg-rose-50 text-rose-600 animate-pulse border border-rose-150' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                <Clock size={14} className={cbtSecondsLeft < 120 ? "animate-bounce" : "animate-spin"} /> Timer: {formatCountdown(cbtSecondsLeft)}
                              </span>
                            </div>
                          </div>

                          {/* Dual panel layout for Reading Comprehension or standard full width */}
                          <div className={activeQ.passage ? "grid lg:grid-cols-2 gap-8 items-stretch" : "space-y-6"}>
                            
                            {/* COMPREHENSION PASSAGE COLUMN */}
                            {activeQ.passage && (
                              <div className="p-5 bg-amber-50/40 border border-amber-150 rounded-2xl flex flex-col justify-start max-h-[350px] overflow-y-auto shadow-inner">
                                <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest mb-3 flex items-center gap-1">
                                  📖 READING COMPREHENSION PASSAGE
                                </span>
                                <p className="text-xs leading-relaxed font-serif text-slate-700 whitespace-pre-line antialiased">
                                  {activeQ.passage}
                                </p>
                              </div>
                            )}

                            {/* QUESTION BOARD PANEL */}
                            <div className="space-y-6 flex flex-col justify-center">
                              {/* Picture illustration renderer for Nursery and Primary */}
                              {activeQ.pictureSvgCode && (
                                <div className="flex flex-col items-center gap-2 py-3 bg-slate-50 border border-dashed rounded-2xl mb-2">
                                  <span className="text-[8px] font-mono font-black uppercase text-slate-400 tracking-widest">Question Graphic Illustration</span>
                                  <div dangerouslySetInnerHTML={{ __html: activeQ.pictureSvgCode }} className="p-2.5 bg-white border rounded-xl shadow-sm" />
                                </div>
                              )}

                              {/* Question sentence */}
                              {activeQ.type === "FillBlank" ? (
                                <h4 className="text-sm md:text-xl font-black text-[#111827] leading-relaxed uppercase select-none">
                                  {activeQ.question.split("_______")[0]}
                                  <span className="inline-block px-3 py-1 mx-1.5 border-b-2 border-amber-500 bg-amber-50 text-amber-950 font-black rounded-lg min-w-[120px] text-center text-xs md:text-sm shadow-inner">
                                    {selectedAnswer || "_______"}
                                  </span>
                                  {activeQ.question.split("_______")[1]}
                                </h4>
                              ) : (
                                <h4 className="text-sm md:text-xl font-black text-[#111827] leading-relaxed uppercase select-none">
                                  {activeQ.question}
                                </h4>
                              )}

                              {/* ANSWERS INPUT AND SELECTION BLOCK */}
                              {activeQ.type === "Matching" && activeQ.matchingPairs ? (
                                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-4">
                                  <div className="grid grid-cols-2 text-[9px] font-black uppercase text-slate-400 pb-2 border-b">
                                    <span>Left Column</span>
                                    <span>Right Assignment Selector</span>
                                  </div>
                                  <div className="space-y-3">
                                    {activeQ.matchingPairs.map((pair, pIdx) => {
                                      const rowValue = getMatchingValueForLeftItem(pair.left);
                                      return (
                                        <div key={pIdx} className="grid grid-cols-2 gap-4 items-center">
                                          <span className="text-xs font-bold text-slate-700">{pair.left}</span>
                                          <select
                                            value={rowValue}
                                            onChange={(e) => handleMatchingSelect(pair.left, e.target.value)}
                                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-amber-500 outline-none w-full"
                                          >
                                            <option value="">-- Choose Match --</option>
                                            {activeQ.options.map((opt, oIdx) => (
                                              <option key={oIdx} value={opt}>{opt}</option>
                                            ))}
                                          </select>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-semibold italic">Complete matching rows to automatically construct answer parameters.</p>
                                </div>
                              ) : (
                                <div className="grid gap-3.5 mt-4">
                                  {activeQ.options.map((opt, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => handleCbtAnswerSelect(opt)}
                                      className={`w-full p-4 rounded-xl text-left border cursor-pointer duration-200 flex items-center justify-between group ${
                                        selectedAnswer === opt 
                                          ? 'bg-amber-50/90 text-amber-950 border-amber-400 font-extrabold translate-x-1 shadow-sm' 
                                          : 'bg-white text-slate-650 hover:bg-slate-50 border-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-center">
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg font-mono font-black text-[10px] mr-3 shadow-sm uppercase ${selectedAnswer === opt ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-100 border text-slate-400'}`}>
                                          {String.fromCharCode(65 + i)}
                                        </span>
                                        <span className="text-xs font-bold">{opt}</span>
                                      </div>
                                      {selectedAnswer === opt && (
                                        <Check size={14} className="text-amber-600 animate-pulse" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Navigation Buttons Row */}
                          <div className="flex justify-between items-center pt-6 border-t border-slate-150">
                            <span className="text-[10px] uppercase font-mono font-extrabold text-slate-400">
                              Stable Auto-saving Active
                            </span>
                            <button
                              type="button"
                              disabled={!selectedAnswer}
                              onClick={handleNextCbtQuestion}
                              className="px-8 py-3.5 bg-primary text-white rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-lg hover:bg-opacity-95 duration-200 transition-all hover:scale-[1.01]"
                            >
                              {currentCbtQuestionIndex === cbtQuestions.length - 1 ? 'Calculate Score' : 'Next Question'}
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {cbtStep === 'results' && (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-[32px] p-8 md:p-12 text-center space-y-6 shadow-sm animate-in fade-in duration-300">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto animate-pulse border border-emerald-100">
                          <Award size={30} />
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Entrance Exam Grade Report Card</h4>
                          <h3 className="text-2xl font-black text-slate-800 uppercase">Aptitude CBT Score Aggregated</h3>
                        </div>

                        {/* Bento Tally Grid of Results */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto">
                          <div className="p-4 bg-white border rounded-2xl shadow-sm text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Mathematics</span>
                            <p className="text-xl font-black text-primary mt-1">{formData.cbtMathScore ?? 0} / 50</p>
                            <span className="text-[9px] text-slate-400 font-semibold italic">50 Marks Max</span>
                          </div>
                          
                          <div className="p-4 bg-white border rounded-2xl shadow-sm text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">English Language</span>
                            <p className="text-xl font-black text-primary mt-1">{formData.cbtEnglScore ?? 0} / 50</p>
                            <span className="text-[9px] text-slate-400 font-semibold italic">50 Marks Max</span>
                          </div>

                          <div className="p-4 bg-white border rounded-2xl shadow-sm text-center col-span-2 md:col-span-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Score</span>
                            <p className="text-xl font-black text-[#eab308] mt-1">{formData.cbtScore ?? 0}%</p>
                            <span className="text-[9px] text-slate-400 font-semibold italic">Passing: 50%</span>
                          </div>
                        </div>

                        {/* Pass/Fail Status Notification Header */}
                        <div className="max-w-md mx-auto p-4 rounded-2xl border flex items-center gap-3 justify-center bg-white text-left">
                          <div className={`p-2.5 rounded-xl ${((formData.cbtScore ?? 0) >= 50) ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-650'}`}>
                            <CheckCircle size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800 uppercase">
                              Status: {((formData.cbtScore ?? 0) >= 50) ? 'PASSED ENTRANCE EXAM' : 'UNDER MINIMUM THRESHOLD'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {((formData.cbtScore ?? 0) >= 50) 
                                ? 'Congratulations! Your score meets the academic requirements of Faith Foundation Schools.' 
                                : 'Your CBT score is below the regular 50% passing coefficient. This file will trigger further manual review by the Admission Board.'}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-normal font-semibold">
                          Excellent validation coefficients! Score metrics are logged on your candidate folder profile structure and integrated into review decision files.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 9: DECLARATION */}
                {currentStep === 9 && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-black text-primary">PARENT/GUARDIAN COVENANT:</h3>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">Legally execute declarations regarding profile validation coordinates.</p>
                    </div>

                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                      <p className="text-xs text-slate-500 font-medium italic leading-relaxed">
                        "I certify that all information provided in this admission inquiry is structured in complete honesty, and valid certificates match criteria correctly. I fully understand that providing fake document attachments or false fields logs may trigger immediate rejection or retroactive cancellation of admission vectors at any time on Faith Foundation Schools campus."
                      </p>

                      <div className="flex items-start gap-3 pt-3 border-t border-slate-200/50">
                        <input
                          type="checkbox"
                          id="agree"
                          checked={formData.agreedToTerms}
                          onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                          className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                        />
                        <label htmlFor="agree" className="text-xs text-slate-600 font-bold ml-1 cursor-pointer">
                          I agree entirely to the Parent/Guardian covenant checklist.
                        </label>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Electronic Signature (Type Full Name) *</label>
                        <input
                          type="text"
                          required
                          value={formData.parentSignatureName}
                          onChange={(e) => setFormData({ ...formData, parentSignatureName: e.target.value })}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-primary transition-all pb font-serif italic text-lg"
                          placeholder="Your Full Name"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-primary uppercase ml-1 mb-2">Date *</label>
                        <input
                          type="date"
                          readOnly
                          value={formData.declarationDate}
                          className="w-full px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 10: COMPLETE SUMMARY & REVIEW SCREEN */}
                {currentStep === 10 && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-black text-primary">COMPLETE INQUIRY REPORT SUMMARY:</h3>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">Review your files thoroughly before cementing locking submission parameters.</p>
                    </div>

                    <div className="space-y-6 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin">
                      {/* Section 1 */}
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-extrabold text-primary uppercase">1. Pathway Program</h4>
                          <button onClick={() => setCurrentStep(1)} className="text-xs font-bold text-amber-600 hover:underline">Edit</button>
                        </div>
                        <div className="grid sm:grid-cols-2 text-xs font-semibold text-slate-600 gap-2">
                          <p>Pathway Class: <span className="font-bold text-slate-800">{formData.admissionType}</span></p>
                          <p>Grade Intended: <span className="font-bold text-slate-800">{formData.intendedClass}</span></p>
                          <p>Target Intake: <span className="font-bold text-slate-800">{formData.academicSession} ({formData.intendedTerm})</span></p>
                        </div>
                      </div>

                      {/* Section 2 */}
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-extrabold text-primary uppercase">2. Applicant Demographics</h4>
                          <button onClick={() => setCurrentStep(2)} className="text-xs font-bold text-amber-600 hover:underline">Edit</button>
                        </div>
                        <div className="grid sm:grid-cols-2 text-xs font-semibold text-slate-600 gap-2">
                          <p>Applicant Name: <span className="font-bold text-slate-800 uppercase">{formData.surname}, {formData.firstName} {formData.middleName}</span></p>
                          <p>Gender: <span className="font-bold text-slate-800">{formData.gender}</span></p>
                          <p>DOB / Age: <span className="font-bold text-slate-800">{formData.dob} ({formData.age} yrs)</span></p>
                          <p>State &amp; LGA: <span className="font-bold text-slate-800">{formData.stateOfOrigin} / {formData.lga}</span></p>
                        </div>
                      </div>

                      {/* Section 3 */}
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-extrabold text-primary uppercase">3. Parent Particulars</h4>
                          <button onClick={() => setCurrentStep(3)} className="text-xs font-bold text-amber-600 hover:underline">Edit</button>
                        </div>
                        <div className="grid sm:grid-cols-2 text-xs font-semibold text-slate-600 gap-2">
                          {formData.fatherName && <p>Father Phone: <span className="font-bold text-slate-800">{formData.fatherPhone} ({formData.fatherName})</span></p>}
                          {formData.motherName && <p>Mother Phone: <span className="font-bold text-slate-800">{formData.motherPhone} ({formData.motherName})</span></p>}
                          <p>Emergency Contact: <span className="font-bold text-slate-800">{formData.emergencyName} ({formData.emergencyPhone})</span></p>
                        </div>
                      </div>

                      {/* Section 4 */}
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-extrabold text-primary uppercase">4. Pre-School &amp; Medical Check</h4>
                          <button onClick={() => setCurrentStep(4)} className="text-xs font-bold text-amber-600 hover:underline">Edit</button>
                        </div>
                        <div className="grid sm:grid-cols-2 text-xs font-semibold text-slate-600 gap-2">
                          <p>Previous School: <span className="font-bold text-slate-800">{formData.prevSchoolName}</span></p>
                          <p>Allergies Check: <span className="font-bold text-slate-800">{formData.allergies || 'None'}</span></p>
                          <p>Disciplinary Action: <span className="font-bold text-slate-800">{formData.hasBeenSuspended === 'Yes' ? 'Yes, Logged' : 'None'}</span></p>
                        </div>
                      </div>

                      {/* CBT Exam */}
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-extrabold text-primary uppercase font-mono">5. CBT Baseline Grade Evaluation</h4>
                          <button onClick={() => setCurrentStep(8)} className="text-xs font-bold text-amber-600 hover:underline">Retake</button>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{formData.cbtTaken ? `Grading Assessment Secure Result Tally: ${formData.cbtScore}%` : 'Not Taken yet.'}</p>
                        </div>
                      </div>

                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-extrabold text-primary uppercase">6. Signed Legal Agreement</h4>
                        </div>
                        <p className="text-xs font-semibold text-slate-600">Electronic Signer: <span className="font-bold text-slate-800 italic uppercase">{formData.parentSignatureName}</span> on <span className="font-bold text-slate-800">{formData.declarationDate}</span></p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Back & Forth controls layout */}
              <div className="flex justify-between items-center pt-8 border-t border-slate-100 mt-10 gap-4">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={16} /> Previous Section
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 10 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-3.5 bg-primary text-white hover:bg-opacity-95 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleFinalSubmit}
                    className="px-8 py-4 bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={18} />}
                    Submit Final Application
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: CANDIDATE DASHBOARD (TRACK APPLICATION STATUS) */}
        {viewMode === 'dashboard' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
            
            {/* PORTAL SESSION ACCESS TRACKING FORM EXCLUDING IF ACTIVE SELECTED */}
            {!activePortalApplication ? (
              <div className="max-w-md mx-auto bg-white border border-slate-150 p-8 rounded-[40px] shadow-lg text-center space-y-6">
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
                  <Lock size={28} className="text-[#eab308]" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-primary">Candidate Pathway Access</h3>
                  <p className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed">
                    Enter email and phone coordinates submitted inside the inquiry form to track your candidate folder status.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-lg">
                    {loginError}
                  </div>
                )}

                <form onSubmit={handlePortalLogin} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white"
                      placeholder="Enter Father/Mother Email Address"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      required
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white"
                      placeholder="Enter Parent Contact Phone Number"
                    />
                  </div>
                  <button className="w-full py-4 bg-primary text-white hover:bg-opacity-95 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-primary/10">
                    Locate Registration File
                  </button>
                </form>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">Haven't started an application yet?</p>
                  <button 
                    onClick={() => setViewMode('apply')}
                    className="text-xs text-[#eab308] font-bold hover:underline mt-2 uppercase tracking-wide"
                  >
                    Start Pathway Registration
                  </button>
                </div>
              </div>
            ) : (
              // ACTIVE CANDIDATE WORKSPACE DASHBOARD
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-150 p-6 rounded-3xl gap-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-50 border border-slate-150 rounded-2xl overflow-hidden flex items-center justify-center shrink-0">
                      {activePortalApplication.passportPhoto ? (
                        <img src={activePortalApplication.passportPhoto} className="w-full h-full object-cover" alt="Student Passport" />
                      ) : (
                        <User size={24} className="text-slate-400" />
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] bg-amber-50 text-amber-700 font-extrabold px-2.5 py-1 rounded uppercase tracking-wider">
                        Intended Class: {activePortalApplication.target_class || activePortalApplication.intendedClass}
                      </span>
                      <h3 className="text-lg font-black text-primary uppercase mt-1">
                        {activePortalApplication.student_name || `${activePortalApplication.firstName} ${activePortalApplication.surname}`}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Ref ID: {activePortalApplication.id}</p>
                    </div>
                  </div>

                  <div className="border border-slate-150 p-3 bg-slate-50/50 rounded-2xl text-right sm:text-right">
                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">Application Status:</span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 text-amber-600 rounded-full text-[10px] font-black uppercase mt-1 border border-yellow-200">
                      {activePortalApplication.status}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-start">
                  
                  {/* LEFT DETAILS COLUMN */}
                  <div className="md:col-span-2 space-y-6">
                    
                    {/* Status instructions banner */}
                    <div className="bg-white border border-slate-150 p-6 rounded-3xl space-y-4 shadow-sm">
                      <h4 className="text-xs font-black text-primary uppercase pb-2 border-b border-slate-100">Registration Status Checklist</h4>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        {[
                          { title: 'Inquiry Form Submitted', desc: 'Candidate demographic baseline filed.', comp: true },
                          { title: 'CBT Aptitude Exam', desc: `Grading secure: ${activePortalApplication.cbtScore ? `${activePortalApplication.cbtScore}%` : 'Pending (Take Test Below)'}`, comp: !!activePortalApplication.cbtTaken },
                          { title: 'Credentials Review', desc: 'School board validation of certificates.', comp: activePortalApplication.status !== 'Submitted' && activePortalApplication.status !== 'Awaiting Documents' },
                          { title: 'Admission Decision', desc: 'Formal approval or letters assignment.', comp: activePortalApplication.status === 'Approved' || activePortalApplication.status === 'Admitted' }
                        ].map((chk, i) => (
                          <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-3 font-semibold text-xs text-slate-500">
                            <div>
                              <p className="font-bold text-slate-800 uppercase text-[10px]">{chk.title}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">{chk.desc}</p>
                            </div>
                            <span>
                              {chk.comp ? (
                                <span className="w-5 h-5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center text-[9px] font-black">✓</span>
                              ) : (
                                <span className="w-5 h-5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full flex items-center justify-center text-[9px] font-black">◌</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Admin custom diagnostic review alerts */}
                      {activePortalApplication.adminMessage && (
                        <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 text-xs rounded-xl font-medium mt-4">
                          <strong>Admissions Board Instruction:</strong> {activePortalApplication.adminMessage}
                        </div>
                      )}
                    </div>

                    {/* Entrance details schedule, Interview directions */}
                    {(activePortalApplication.status === 'Examination Scheduled' || activePortalApplication.status === 'Interview Scheduled' || activePortalApplication.status === 'Approved' || activePortalApplication.status === 'Admitted') && (
                      <div className="bg-white border border-slate-150 p-6 rounded-3xl space-y-4 shadow-sm">
                        <h4 className="text-xs font-black text-primary uppercase pb-2 border-b border-slate-100">Entrance Schedules &amp; Instructions</h4>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1">
                            <span className="text-[9px] text-indigo-400 font-extrabold uppercase">Assigned CBT Interview Date:</span>
                            <p className="text-sm font-black text-indigo-900">{activePortalApplication.examDate || 'June 18, 2026'}</p>
                            <p className="text-[10px] text-indigo-500 font-semibold leading-normal mt-1">Report to Ibadan campus central computing lab with a copy of the official confirmation receipt.</p>
                          </div>

                          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1">
                            <span className="text-[9px] text-emerald-400 font-extrabold uppercase font-mono">Assigned Parent Oral Panel:</span>
                            <p className="text-sm font-black text-emerald-950">{activePortalApplication.interviewDate || 'June 18, 2026'}</p>
                            <p className="text-[10px] text-emerald-500 font-semibold leading-normal mt-1">Oral interview panels explore early home development criteria and school mutual guidelines.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ACTION PANEL FOR PROVISIONAL ADMISSION ACCEPTANCE */}
                    {(activePortalApplication.status === 'Approved' || activePortalApplication.status === 'Admitted') && (
                      <div className="bg-white border border-amber-200/60 p-6 rounded-3xl space-y-6 shadow-sm">
                        <div>
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                            Provisional Admittance Offer Active
                          </span>
                          <h4 className="text-xl font-display font-black text-primary uppercase mt-3">Congratulations, Your Ward is Appointed!</h4>
                          <p className="text-xs text-slate-500 mt-2 font-semibold leading-relaxed">
                            School Board has officially verified documents entries and CBT scores! Downward letter options are unlocked below. Pay school basic entrance fees to clear class registry records.
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 border-t border-slate-100">
                          <div>
                            <p className="text-[9px] text-slate-400 font-black uppercase">FEE ITEMIZATION (FIRST TERM ENTRY):</p>
                            <p className="text-lg font-black text-primary">₦45,000.00 <span className="text-xs text-slate-400 font-medium font-sans">Full Tuition &amp; Uniform</span></p>
                          </div>

                          <div className="flex gap-2">
                            {activePortalApplication.status === 'Approved' ? (
                              <button 
                                onClick={handleAcceptAdmissionOffer}
                                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
                              >
                                Accept Admission Offer
                              </button>
                            ) : !activePortalApplication.feesPaid ? (
                              <button 
                                onClick={handlePayEntryFees}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                              >
                                <CreditCard size={14} /> Settle Admission Fees
                              </button>
                            ) : (
                              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 uppercase tracking-widest flex items-center gap-1">
                                <Check size={14} /> Settlement Complete
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Backup option to take CBT if not taken */}
                    {!activePortalApplication.cbtTaken && (
                      <div className="bg-slate-50 border border-slate-200/50 p-6 rounded-3xl space-y-4 text-center">
                        <div>
                          <h4 className="text-xs font-black text-primary uppercase">CBT Baseline Performance Grade Missing</h4>
                          <p className="text-[11px] text-slate-400 mt-1 font-semibold">Your portal record lists no CBT assessment scores. Kindly complete the baseline diagnostic exam instantly to facilitate review scheduling.</p>
                        </div>
                        <button 
                          onClick={() => { setFormData(activePortalApplication); setCurrentStep(8); setViewMode('apply'); }}
                          className="px-5 py-2.5 bg-primary text-white hover:bg-opacity-95 text-xs font-extrabold rounded-xl uppercase tracking-wider transition-all"
                        >
                          Complete Entrance CBT Test Now
                        </button>
                      </div>
                    )}

                    {/* VIRTUAL MESSAGING LOG OUTBOX SIMULATION */}
                    <div className="bg-white border border-slate-150 p-6 rounded-[32px] shadow-sm space-y-6 mt-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                          <h4 className="text-xs font-black text-primary uppercase tracking-wider">📩 Simulated Communications Centre</h4>
                          <p className="text-[10px] text-slate-400 mt-1 leading-normal font-semibold">
                            Faith Foundation simulated notification dispatch logs. Check which addresses receive applicant dispatches.
                          </p>
                        </div>
                        
                        <div className="flex bg-slate-105 rounded-xl p-1 border font-mono text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => setCommsTab('email')}
                            className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all duration-200 ${commsTab === 'email' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                          >
                            Emails
                          </button>
                          <button
                            type="button"
                            onClick={() => setCommsTab('sms')}
                            className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all duration-250 ${commsTab === 'sms' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                          >
                            SMS Texts
                          </button>
                        </div>
                      </div>

                      {/* Display active recipient addresses */}
                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-[11px] font-semibold text-slate-500 space-y-2">
                        {commsTab === 'email' ? (
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                            <span>Primary Receiving Mailbox:</span>
                            <span className="font-bold text-[#111827] bg-white border px-2.5 py-1 rounded-lg">
                              {activePortalApplication.email || activePortalApplication.fatherEmail || activePortalApplication.motherEmail || activePortalApplication.guardianEmail || 'No Email Enforced'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                            <span>Primary SMS Contact Phone:</span>
                            <span className="font-bold font-mono text-[#111827] bg-white border px-2.5 py-1 rounded-lg">
                              {activePortalApplication.fatherPhone || activePortalApplication.motherPhone || activePortalApplication.guardianPhone || 'No Phone Enforced'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Generated logs */}
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                        {commsTab === 'email' ? (() => {
                          const emails = [];
                          
                          // 1. Registered Invitation email
                          emails.push({
                            subject: "Inquiry Form Successfully Registered & Locked",
                            sender: "Faith Foundation Schools Admissions Board <admissions@faithfoundation.edu>",
                            date: new Date(activePortalApplication.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                            body: `Dear Parent/Guardian,\n\nWe have successfully received and locked your candidate registration form for ${activePortalApplication.student_name || 'your ward'}. Your application has been logged under ID: ${activePortalApplication.id}.\n\nCredentials validation is currently on-going. Please use this email address to log back into the admissions inquiry portal.\n\nWarm regards,\nOffice of Admissions`
                          });

                          // 2. CBT Exam
                          if (activePortalApplication.status === 'Examination Scheduled' || activePortalApplication.status === 'Interview Scheduled' || activePortalApplication.status === 'Approved' || activePortalApplication.status === 'Admitted') {
                            emails.push({
                              subject: "Entrance CBT Examination Scheduled - Invitation",
                              sender: "Faith Foundation Schools CBT Portal <cbt@faithfoundation.edu>",
                              date: "Dispatched",
                              body: `Dear Sponsor,\n\nYour ward ${activePortalApplication.student_name} is scheduled to sit for the baseline Entrance CBT Examination.\n\nDate: ${activePortalApplication.examDate || 'June 18, 2026'}\nTime: 9:00 AM sharp\nVenue: Main Computing Center, Ibadan campus.\n\nKindly download your admission slip from the portal and present it on candidate arrival.`
                            });
                          }

                          // 3. Interview
                          if (activePortalApplication.status === 'Interview Scheduled' || activePortalApplication.status === 'Approved' || activePortalApplication.status === 'Admitted') {
                            emails.push({
                              subject: "Parent/Sponsor Oral Interview Schedule",
                              sender: "Faith Foundation Schools Registry <registry@faithfoundation.edu>",
                              date: "Dispatched",
                              body: `Dear Sponsor,\n\nThe admissions committee has scheduled you and your ward ${activePortalApplication.student_name} for the physical Parent Oral Interview.\n\nDate: ${activePortalApplication.interviewDate || 'June 18, 2026'}\nTime: 11:30 AM\nVenue: Secretariat Boardroom, Faith Foundation Administration block.\n\nWe look forward to meeting you.\nAdmissions Registry Office`
                            });
                          }

                          // 4. Offer approved
                          if (activePortalApplication.status === 'Approved' || activePortalApplication.status === 'Admitted') {
                            emails.push({
                              subject: "Provisional Letter of Admission Offered",
                              sender: "Faith Foundation Schools Registrar <registrar@faithfoundation.edu>",
                              date: "Dispatched",
                              body: `Dear Parent,\n\nWe are overjoyed to offer ${activePortalApplication.student_name} provisional admission into Faith Foundation Schools!\n\nThis decision represents our board's great trust in your candidate's academic and moral indices.\n\nKindly log into the portal to download your Provisional Admission Letter and settle the Term 1 basic fees (₦45,000.00) to claim their slot.\n\nSincerely,\nDirector of Admissions`
                            });
                          }

                          // 5. Final Completed enrollment
                          if (activePortalApplication.status === 'Admitted' && activePortalApplication.feesPaid) {
                            emails.push({
                              subject: "Official Enrollment Confirmed - Welcome!",
                              sender: "Faith Foundation Schools Bursary <bursary@faithfoundation.edu>",
                              date: "Finalized",
                              body: `Dear Parent,\n\nWe have received and logged your payment of ₦45,000.00 for the First Term enrollment of ${activePortalApplication.student_name}.\n\nRegistration is now complete and finalized! Keep your downloadable payment receipt secure.\n\nWelcome to Faith Foundation Schools — we are ready to cultivate greatness together!\n\nWarm greetings,\nAdministrative Bursary Office`
                            });
                          }

                          return emails.reverse().map((m, i) => (
                            <div key={i} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:border-slate-150 transition-all space-y-2">
                              <div className="flex justify-between items-start text-[10px] font-bold text-slate-400 font-mono">
                                <span>FROM: {m.sender}</span>
                                <span>{m.date}</span>
                              </div>
                              <h5 className="text-[12px] font-bold text-[#111827]">{m.subject}</h5>
                              <p className="text-[11px] text-slate-500 font-medium whitespace-pre-wrap leading-relaxed border-t border-slate-50 pt-2 font-sans">
                                {m.body}
                              </p>
                            </div>
                          ));
                        })() : (() => {
                          const smsList = [];
                          
                          smsList.push({
                            sender: "FF_ADMISSIONS",
                            date: new Date(activePortalApplication.createdAt || Date.now()).toLocaleDateString(),
                            body: `Faith Foundation Schools: Inquiry file for ${activePortalApplication.student_name || 'your ward'} received. ID: ${activePortalApplication.id}. Keep this safe for portal access!`
                          });

                          if (activePortalApplication.status === 'Examination Scheduled' || activePortalApplication.status === 'Interview Scheduled' || activePortalApplication.status === 'Approved' || activePortalApplication.status === 'Admitted') {
                            smsList.push({
                              sender: "FF_ADMISSIONS",
                              date: "Dispatched",
                              body: `FF_ADMISSIONS: Entrance CBT for ${activePortalApplication.student_name} scheduled on ${activePortalApplication.examDate || 'June 18, 2026'} at 9:00 AM. Print slip from portal.`
                            });
                          }

                          if (activePortalApplication.status === 'Interview Scheduled' || activePortalApplication.status === 'Approved' || activePortalApplication.status === 'Admitted') {
                            smsList.push({
                              sender: "FF_ADMISSIONS",
                              date: "Dispatched",
                              body: `FF_ADMISSIONS: Sponsor panel oral interview for ${activePortalApplication.student_name} is set for ${activePortalApplication.interviewDate || 'June 18, 2026'}. See you there!`
                            });
                          }

                          if (activePortalApplication.status === 'Approved' || activePortalApplication.status === 'Admitted') {
                            smsList.push({
                              sender: "FF_ADMISSIONS",
                              date: "Dispatched",
                              body: `FF_ADMISSIONS: Congratulations! ${activePortalApplication.student_name} has been offered provisional admission. Please clear fees on portal to secure.`
                            });
                          }

                          if (activePortalApplication.status === 'Admitted' && activePortalApplication.feesPaid) {
                            smsList.push({
                              sender: "FF_ADMISSIONS",
                              date: "Finalized",
                              body: `FF_ADMISSIONS: First Term fee payment (₦45,000.00) verified! Enrollment for ${activePortalApplication.student_name} is complete. Welcome to the family!`
                            });
                          }

                          return smsList.reverse().map((s, i) => (
                            <div key={i} className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-1">
                              <div className="flex justify-between items-center text-[9px] font-black text-indigo-500 font-mono uppercase">
                                <span>SENDER: {s.sender}</span>
                                <span>{s.date}</span>
                              </div>
                              <p className="text-[11px] text-indigo-950 font-semibold leading-relaxed font-mono">
                                {s.body}
                              </p>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT UTILITIES OR PRINTERS COLUMN */}
                  <div className="space-y-6">
                    
                    {/* Documents attachment status for missing items */}
                    <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-4">
                      <h4 className="text-xs font-black text-primary uppercase pb-2 border-b border-slate-100">Portal Attachments</h4>
                      
                      <div className="space-y-2">
                        {[
                          { label: 'Medical Report', field: 'docMedicalReport' },
                          { label: 'Utility Bill', field: 'docUtilityBill' }
                        ].map((mFile, k) => (
                          <div key={k} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-[11px] font-semibold text-slate-500">
                            <span>{mFile.label}</span>
                            {activePortalApplication[mFile.field as keyof ApplicationData] ? (
                              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[9px] font-black">Linked</span>
                            ) : (
                              <button 
                                onClick={() => handleUploadAdditionalDoc(mFile.label)}
                                className="text-white bg-primary hover:bg-opacity-90 px-3 py-1 rounded-lg text-[9px] font-bold"
                              >
                                Upload Doc
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Official framed downloadable files list */}
                    <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-4">
                      <h4 className="text-xs font-black text-primary uppercase pb-2 border-b border-slate-100">Downloads &amp; Letters</h4>
                      
                      <div className="grid gap-2">
                        <button 
                          onClick={() => printReceipt(activePortalApplication.id)}
                          className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:text-primary transition-all flex items-center justify-center gap-2 border border-slate-150 cursor-pointer text-center"
                        >
                          <Printer size={14} /> Print Application Receipt
                        </button>

                        {(activePortalApplication.status === 'Approved' || activePortalApplication.status === 'Admitted') && (
                          <button 
                            onClick={() => printAdmissionLetter(activePortalApplication)}
                            className="w-full py-3.5 bg-amber-500 text-white hover:bg-amber-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 text-center"
                          >
                            <FileStyleIcon size={14} /> Print Admission Letter
                          </button>
                        )}

                        {activePortalApplication.feesPaid && (
                          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-150 text-center space-y-1">
                            <span className="text-[10px] text-emerald-600 font-black block uppercase tracking-widest">Fees Receipt Active</span>
                            <button
                              onClick={() => {
                                const pWin = window.open('', '_blank');
                                if (pWin) {
                                  pWin.document.write(`
                                    <html>
                                    <head>
                                      <title>Admissions Fees Invoice</title>
                                      <style>
                                        body { font-family: sans-serif; padding: 40px; color: #1e293b; text-align: center; }
                                        .box { border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; max-width: 480px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
                                        .stamp { border: 2px solid #10b981; color: #10b981; padding: 10px; border-radius: 8px; display: inline-block; font-weight: bold; margin-top: 15px; }
                                      </style>
                                    </head>
                                    <body>
                                      <div class="box">
                                        <h3>FAITH FOUNDATION SCHOOLS</h3>
                                        <p>Admission Tuition & Uniform Payment Confirmation</p>
                                        <hr/>
                                        <p>Candidate ID: ${activePortalApplication.id}</p>
                                        <p>Amount Settled: ₦45,000.00</p>
                                        <p>Sponsor Email: ${activePortalApplication.email || activePortalApplication.fatherEmail}</p>
                                        <div class="stamp">OFFICIAL FEES PAID STATE</div>
                                      </div>
                                      <script>window.print();</script>
                                    </body>
                                    </html>
                                  `);
                                  pWin.document.close();
                                }
                              }}
                              className="text-[10px] font-bold text-emerald-800 underline block mt-2 hover:text-emerald-950 mx-auto"
                            >
                              Print Entrance Fees Certificate
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 text-center">
                      <button
                        onClick={() => {
                          setActivePortalApplication(null);
                          setLoginEmail('');
                          setLoginPhone('');
                        }}
                        className="text-xs text-slate-400 hover:text-red-500 font-bold transition-all uppercase tracking-wider"
                      >
                        Disconnect Portal Access Session
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Minimal placeholder component to protect SVG typings inside compiler
function FileStyleIcon({ size, className }: { size?: number, className?: string }) {
  return <FileText size={size || 16} className={className} />;
}
