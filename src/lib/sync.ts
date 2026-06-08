import { supabase, isSupabaseConfigured } from './supabase';

// Check if running in offline sandbox mode
export function isSandbox() {
  return !!localStorage.getItem('faith_foundation_sandbox_session');
}

// ==========================================
// 1. ANNOUNCEMENTS SYNC
// ==========================================
export interface Announcement {
  id: number | string;
  title: string;
  body: string;
  date: string;
  type: string;
}

export async function syncFetchAnnouncements(): Promise<Announcement[]> {
  const localKey = 'ff_announcements';
  const localSaved = localStorage.getItem(localKey);
  const fallback = localSaved ? JSON.parse(localSaved) : [
    { id: 1, title: 'Term 1 Exam Schedules Released', body: 'All terminal examinations for the middle school commence next Wednesday.', date: 'May 20, 2026', type: 'critical' },
    { id: 2, title: 'Annual Inter-House Sports Fiesta', body: 'Parents and teachers are invited to secure our green track on Friday morning.', date: 'May 18, 2026', type: 'general' }
  ];

  if (isSandbox() || !isSupabaseConfigured) {
    return fallback;
  }

  try {
    const { data, error } = await supabase
      .from('site')
      .select('content')
      .eq('id', 'announcements')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Document doesn't exist, create it with fallback
        await supabase.from('site').upsert({ id: 'announcements', content: fallback });
        return fallback;
      }
      throw error;
    }

    if (data?.content) {
      const list = data.content as Announcement[];
      localStorage.setItem(localKey, JSON.stringify(list));
      return list;
    }
    return fallback;
  } catch (err) {
    console.warn('Sync read announcements failed, using local fallback:', err);
    return fallback;
  }
}

export async function syncSaveAnnouncements(list: Announcement[]): Promise<void> {
  const localKey = 'ff_announcements';
  localStorage.setItem(localKey, JSON.stringify(list));

  if (isSandbox() || !isSupabaseConfigured) return;

  try {
    await supabase.from('site').upsert({ id: 'announcements', content: list });
  } catch (err) {
    console.error('Sync save announcements failed:', err);
  }
}

// ==========================================
// 2. STUDENTS SYNC
// ==========================================
export interface StudentRecord {
  id: string;
  name: string;
  class: string;
  status: string;
  fees: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  dob: string;
  medicalInfo: string;
  allergies: string;
  academicHistory?: any[];
  communicationLogs?: any[];
  photoUrl?: string;
}

export async function syncFetchStudents(): Promise<StudentRecord[]> {
  const localKey = 'ff_students';
  const localSaved = localStorage.getItem(localKey);
  const fallback = localSaved ? JSON.parse(localSaved) : [
    { 
      id: 'STD-2026-001', 
      name: 'Oluwaseun Adewole', 
      class: 'SS 3', 
      status: 'Enrolled', 
      fees: 'Cleared',
      parentName: 'Mr. Adewole',
      parentPhone: '08122334455',
      parentEmail: 'adewole@gmail.com',
      dob: '2010-04-12',
      medicalInfo: 'Alineated left wrist. Clean file.',
      allergies: 'Shellfish',
      academicHistory: [
        { subject: 'Mathematics', score: 88, term: '3rd Term 25/26' },
        { subject: 'English Language', score: 92, term: '3rd Term 25/26' },
        { subject: 'Physics', score: 81, term: '3rd Term 25/26' }
      ],
      communicationLogs: [
        { date: 'May 10, 2026', message: 'Informed parent about terminal physics lab fees.', caller: 'Admin' }
      ]
    },
    { 
      id: 'STD-2026-002', 
      name: 'Chioma Nwachukwu', 
      class: 'JSS 1', 
      status: 'Enrolled', 
      fees: 'Debt',
      parentName: 'Mrs. Nwachukwu',
      parentPhone: '07033445566',
      parentEmail: 'nwachukwu.c@gmail.com',
      dob: '2014-08-05',
      medicalInfo: 'Asthmatic. Safe inhaler in physical instructor desk.',
      allergies: 'Dust, Penicillin',
      academicHistory: [
        { subject: 'Mathematics', score: 72, term: '3rd Term 25/26' },
        { subject: 'English Language', score: 85, term: '3rd Term 25/26' }
      ],
      communicationLogs: [
        { date: 'May 15, 2026', message: 'Sent SMS reminder regarding school fees balance.', caller: 'Bursar' }
      ]
    }
  ];

  if (isSandbox() || !isSupabaseConfigured) {
    return fallback;
  }

  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      const records: StudentRecord[] = data.map(d => ({
        id: d.id,
        name: d.name,
        class: d.class,
        status: d.status,
        fees: d.fees,
        parentName: d.parent_name || '',
        parentPhone: d.parent_phone || '',
        parentEmail: d.parent_email || '',
        dob: d.dob || '',
        medicalInfo: d.medical_info || '',
        allergies: d.allergies || '',
        academicHistory: d.academic_history || [],
        communicationLogs: d.communication_logs || [],
        photoUrl: d.photo_url || ''
      }));
      localStorage.setItem(localKey, JSON.stringify(records));
      return records;
    } else {
      // Seed fallback students to database if table empty
      for (const item of fallback) {
        await supabase.from('students').insert({
          id: item.id,
          name: item.name,
          class: item.class,
          status: item.status,
          fees: item.fees,
          parent_name: item.parentName,
          parent_phone: item.parentPhone,
          parent_email: item.parentEmail,
          dob: item.dob,
          medical_info: item.medicalInfo,
          allergies: item.allergies,
          academic_history: item.academicHistory,
          communication_logs: item.communicationLogs,
          photo_url: item.photoUrl || ''
        });
      }
      return fallback;
    }
  } catch (err) {
    console.warn('Sync read students failed, using fallback:', err);
    return fallback;
  }
}

export async function syncSaveStudent(student: StudentRecord): Promise<void> {
  // Update local storage
  const localKey = 'ff_students';
  const saved = localStorage.getItem(localKey);
  const list: StudentRecord[] = saved ? JSON.parse(saved) : [];
  const updatedList = list.some(s => s.id === student.id)
    ? list.map(s => s.id === student.id ? student : s)
    : [student, ...list];
  localStorage.setItem(localKey, JSON.stringify(updatedList));

  if (isSandbox() || !isSupabaseConfigured) return;

  try {
    await supabase.from('students').upsert({
      id: student.id,
      name: student.name,
      class: student.class,
      status: student.status,
      fees: student.fees,
      parent_name: student.parentName,
      parent_phone: student.parentPhone,
      parent_email: student.parentEmail,
      dob: student.dob,
      medical_info: student.medicalInfo,
      allergies: student.allergies,
      academic_history: student.academicHistory || [],
      communication_logs: student.communicationLogs || [],
      photo_url: student.photoUrl || ''
    });
  } catch (err) {
    console.error('Sync save student failed:', err);
  }
}

export async function syncSaveStudents(list: StudentRecord[]): Promise<void> {
  const localKey = 'ff_students';
  localStorage.setItem(localKey, JSON.stringify(list));

  if (isSandbox() || !isSupabaseConfigured) return;

  try {
    for (const s of list) {
      await supabase.from('students').upsert({
        id: s.id,
        name: s.name,
        class: s.class,
        status: s.status,
        fees: s.fees,
        parent_name: s.parentName,
        parent_phone: s.parentPhone,
        parent_email: s.parentEmail,
        dob: s.dob,
        medical_info: s.medicalInfo,
        allergies: s.allergies,
        academic_history: s.academicHistory || [],
        communication_logs: s.communicationLogs || [],
        photo_url: s.photoUrl || ''
      });
    }
  } catch (err) {
    console.error('Sync write student bulk failed:', err);
  }
}

export async function syncDeleteStudent(id: string): Promise<void> {
  const localKey = 'ff_students';
  const saved = localStorage.getItem(localKey);
  if (saved) {
    const list: StudentRecord[] = JSON.parse(saved);
    localStorage.setItem(localKey, JSON.stringify(list.filter(s => s.id !== id)));
  }

  if (isSandbox() || !isSupabaseConfigured) return;

  try {
    await supabase.from('students').delete().eq('id', id);
  } catch (err) {
    console.error('Delete student request failed:', err);
  }
}

// ==========================================
// 3. STAFF / TEACHERS SYNC
// ==========================================
export interface StaffRecord {
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
  assignedClass?: string;
  assignedClasses?: string[];
  assignedSubjects?: string[];
  classSubjectMappings?: { class: string; subject: string }[];
}

export async function syncFetchStaff(): Promise<StaffRecord[]> {
  const localKey = 'ff_staff';
  const localSaved = localStorage.getItem(localKey);
  const fallback = localSaved ? JSON.parse(localSaved) : [];

  if (isSandbox() || !isSupabaseConfigured) {
    return fallback;
  }

  try {
    const { data: dbTeachers, error } = await supabase.from('teachers').select('*');
    if (error) throw error;

    let assignments: Record<string, string> = {};
    try {
      const { data: siteData } = await supabase
        .from('site')
        .select('content')
        .eq('id', 'teachers_class_assignments')
        .single();
      if (siteData?.content) {
        assignments = siteData.content as Record<string, string>;
      }
    } catch (e) {
      console.warn('Could not load class assignments from site table:', e);
    }

    let richAssignments: Record<string, { classes: string[], subjects: string[] }> = {};
    try {
      const { data: richSiteData } = await supabase
        .from('site')
        .select('content')
        .eq('id', 'teachers_assignments_metadata')
        .single();
      if (richSiteData?.content) {
        richAssignments = richSiteData.content as Record<string, { classes: string[], subjects: string[] }>;
      }
    } catch (e) {
      console.warn('Could not load rich assignments:', e);
    }

    if (dbTeachers && dbTeachers.length > 0) {
      const records: StaffRecord[] = dbTeachers.map(d => {
        const metadata = richAssignments[d.id] || { classes: [], subjects: [], classSubjectMappings: [] };
        const legacyClass = assignments[d.id] || 'None';
        let finalClasses = metadata.classes || [];
        if (finalClasses.length === 0 && legacyClass && legacyClass !== 'None') {
          finalClasses = [legacyClass];
        }
        return {
          id: d.id,
          name: d.name,
          role: d.role,
          email: d.email,
          phone: d.phone || '',
          photoUrl: d.photo_url || '',
          dateOfAppointment: d.date_of_appointment || '',
          salary: d.salary || '',
          award: d.award || '',
          punctualityAttendance: d.punctuality_attendance || '',
          regularityAttendance: d.regularity_attendance || '',
          rating: d.rating || '5.0',
          review: d.review || '',
          assignedClass: legacyClass,
          assignedClasses: finalClasses,
          assignedSubjects: metadata.subjects || [],
          classSubjectMappings: (metadata as any).classSubjectMappings || []
        };
      });
      localStorage.setItem(localKey, JSON.stringify(records));
      return records;
    }
    return fallback;
  } catch (err) {
    console.warn('Sync fetch teachers failed, using fallback:', err);
    return fallback;
  }
}

export async function syncSaveStaffMember(member: StaffRecord): Promise<void> {
  const localKey = 'ff_staff';
  const saved = localStorage.getItem(localKey);
  const list: StaffRecord[] = saved ? JSON.parse(saved) : [];
  const updatedList = list.some(s => s.id === member.id)
    ? list.map(s => s.id === member.id ? member : s)
    : [...list, member];
  localStorage.setItem(localKey, JSON.stringify(updatedList));

  if (isSandbox() || !isSupabaseConfigured) return;

  try {
    await supabase.from('teachers').upsert({
      id: member.id,
      name: member.name,
      role: member.role,
      email: member.email,
      phone: member.phone,
      photo_url: member.photoUrl,
      date_of_appointment: member.dateOfAppointment,
      salary: member.salary,
      award: member.award,
      punctuality_attendance: member.punctualityAttendance,
      regularity_attendance: member.regularityAttendance,
      rating: member.rating,
      review: member.review
    });

    const assignments: Record<string, string> = {};
    const richAssignments: Record<string, { classes: string[], subjects: string[], classSubjectMappings?: any[] }> = {};
    
    updatedList.forEach(t => {
      if (t.assignedClass) {
        assignments[t.id] = t.assignedClass;
      }
      richAssignments[t.id] = {
        classes: t.assignedClasses || (t.assignedClass && t.assignedClass !== 'None' ? [t.assignedClass] : []),
        subjects: t.assignedSubjects || [],
        classSubjectMappings: t.classSubjectMappings || []
      };
    });

    await supabase.from('site').upsert({
      id: 'teachers_class_assignments',
      content: assignments
    });

    await supabase.from('site').upsert({
      id: 'teachers_assignments_metadata',
      content: richAssignments
    });
  } catch (err) {
    console.error('Sync save teacher failed:', err);
  }
}

export async function syncSaveStaffList(list: StaffRecord[]): Promise<void> {
  const localKey = 'ff_staff';
  localStorage.setItem(localKey, JSON.stringify(list));

  if (isSandbox() || !isSupabaseConfigured) return;

  try {
    for (const t of list) {
      await supabase.from('teachers').upsert({
        id: t.id,
        name: t.name,
        role: t.role,
        email: t.email,
        phone: t.phone,
        photo_url: t.photoUrl,
        date_of_appointment: t.dateOfAppointment,
        salary: t.salary,
        award: t.award,
        punctuality_attendance: t.punctualityAttendance,
        regularity_attendance: t.regularityAttendance,
        rating: t.rating,
        review: t.review
      });
    }

    const assignments: Record<string, string> = {};
    const richAssignments: Record<string, { classes: string[], subjects: string[], classSubjectMappings?: any[] }> = {};
    
    list.forEach(t => {
      if (t.assignedClass) {
        assignments[t.id] = t.assignedClass;
      }
      richAssignments[t.id] = {
        classes: t.assignedClasses || (t.assignedClass && t.assignedClass !== 'None' ? [t.assignedClass] : []),
        subjects: t.assignedSubjects || [],
        classSubjectMappings: t.classSubjectMappings || []
      };
    });

    await supabase.from('site').upsert({
      id: 'teachers_class_assignments',
      content: assignments
    });

    await supabase.from('site').upsert({
      id: 'teachers_assignments_metadata',
      content: richAssignments
    });
  } catch (err) {
    console.error('Sync save staff list failed:', err);
  }
}

// ==========================================
// 4. INVOICES SYNC
// ==========================================
export interface InvoiceRecord {
  id: string;
  studentEmail: string;
  studentName?: string;
  title: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'partial';
  dueDate: string;
}

export async function syncFetchInvoices(): Promise<InvoiceRecord[]> {
  const localKey = 'ff_all_student_invoices';
  const localSaved = localStorage.getItem(localKey);
  const fallback = localSaved ? JSON.parse(localSaved) : [];

  if (isSandbox() || !isSupabaseConfigured) {
    return fallback;
  }

  try {
    const { data, error } = await supabase.from('student_invoices').select('*');
    if (error) throw error;

    if (data && data.length > 0) {
      const records: InvoiceRecord[] = data.map(d => ({
        id: d.id,
        studentEmail: d.student_email,
        title: d.title,
        amount: Number(d.amount),
        status: d.status as 'paid' | 'unpaid' | 'partial',
        dueDate: d.due_date
      }));
      localStorage.setItem(localKey, JSON.stringify(records));
      return records;
    }
    return fallback;
  } catch (err) {
    console.warn('Sync fetch student_invoices failed:', err);
    return fallback;
  }
}

export async function syncSaveInvoices(list: InvoiceRecord[]): Promise<void> {
  const localKey = 'ff_all_student_invoices';
  localStorage.setItem(localKey, JSON.stringify(list));

  if (isSandbox() || !isSupabaseConfigured) return;

  try {
    for (const inv of list) {
      await supabase.from('student_invoices').upsert({
        id: inv.id,
        student_email: inv.studentEmail,
        title: inv.title,
        amount: inv.amount,
        status: inv.status,
        due_date: inv.dueDate
      });
    }
  } catch (err) {
    console.error('Sync save student_invoices failed:', err);
  }
}

export async function syncSaveInvoice(inv: InvoiceRecord): Promise<void> {
  const localKey = 'ff_all_student_invoices';
  const saved = localStorage.getItem(localKey);
  const list: InvoiceRecord[] = saved ? JSON.parse(saved) : [];
  const updatedList = list.some(s => s.id === inv.id)
    ? list.map(s => s.id === inv.id ? inv : s)
    : [inv, ...list];
  localStorage.setItem(localKey, JSON.stringify(updatedList));

  if (isSandbox() || !isSupabaseConfigured) return;

  try {
    await supabase.from('student_invoices').upsert({
      id: inv.id,
      student_email: inv.studentEmail,
      title: inv.title,
      amount: inv.amount,
      status: inv.status,
      due_date: inv.dueDate
    });
  } catch (err) {
    console.error('Sync save invoice singular failed:', err);
  }
}

// ==========================================
// 5. FEE STRUCTURES SYNC
// ==========================================
export interface FeeStructure {
  id: string;
  title: string;
  amount: number;
  class: string;
}

export async function syncFetchFeeStructures(): Promise<FeeStructure[]> {
  const localKey = 'ff_fee_structures';
  const localSaved = localStorage.getItem(localKey);
  const fallback = localSaved ? JSON.parse(localSaved) : [
    { id: 'FEE-001', title: 'Tuition Fees', amount: 150000, class: 'JSS 1' },
    { id: 'FEE-002', title: 'Science Lab terminal levies', amount: 25000, class: 'SS 3' }
  ];

  if (isSandbox() || !isSupabaseConfigured) {
    return fallback;
  }

  try {
    const { data, error } = await supabase.from('fee_structures').select('*');
    if (error) throw error;

    if (data && data.length > 0) {
      const records: FeeStructure[] = data.map(d => ({
        id: d.id,
        title: d.title,
        amount: Number(d.amount),
        class: d.target_class
      }));
      localStorage.setItem(localKey, JSON.stringify(records));
      return records;
    } else {
      for (const f of fallback) {
        await supabase.from('fee_structures').insert({
          id: f.id,
          title: f.title,
          amount: f.amount,
          target_class: f.class
        });
      }
      return fallback;
    }
  } catch (err) {
    console.warn('Sync fetch fee_structures failed:', err);
    return fallback;
  }
}

export async function syncSaveFeeStructures(list: FeeStructure[]): Promise<void> {
  const localKey = 'ff_fee_structures';
  localStorage.setItem(localKey, JSON.stringify(list));

  if (isSandbox() || !isSupabaseConfigured) return;

  try {
    for (const f of list) {
      await supabase.from('fee_structures').upsert({
        id: f.id,
        title: f.title,
        amount: f.amount,
        target_class: f.class
      });
    }
  } catch (err) {
    console.error('Sync save individual structures failed:', err);
  }
}

// ==========================================
// 6. ADMISSIONS SYNC
// ==========================================
export interface AdmissionApplication {
  id: string;
  studentName: string;
  parentName: string;
  email: string;
  phone: string;
  targetClass: string;
  address: string;
  previousSchool?: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  created_at?: string;
}

export async function syncFetchAdmissions(): Promise<AdmissionApplication[]> {
  const localKey = 'ff_admissions';
  const localSaved = localStorage.getItem(localKey);
  const fallback = localSaved ? JSON.parse(localSaved) : [];

  if (isSandbox() || !isSupabaseConfigured) {
    return fallback;
  }

  try {
    const { data, error } = await supabase
      .from('admissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      const records: AdmissionApplication[] = data.map(d => ({
        id: d.id,
        studentName: d.student_name,
        parentName: d.parent_name,
        email: d.email,
        phone: d.phone,
        targetClass: d.target_class,
        address: d.address,
        previousSchool: d.previous_school || '',
        status: d.status as 'pending' | 'reviewed' | 'accepted' | 'rejected',
        created_at: d.created_at
      }));
      localStorage.setItem(localKey, JSON.stringify(records));
      return records;
    }
    return fallback;
  } catch (err) {
    console.warn('Sync fetch admissions failed:', err);
    return fallback;
  }
}

export async function syncSaveAdmission(application: AdmissionApplication): Promise<void> {
  const localKey = 'ff_admissions';
  const saved = localStorage.getItem(localKey);
  const list: AdmissionApplication[] = saved ? JSON.parse(saved) : [];
  const updatedList = list.some(s => s.id === application.id)
    ? list.map(s => s.id === application.id ? application : s)
    : [application, ...list];
  localStorage.setItem(localKey, JSON.stringify(updatedList));

  if (isSandbox() || !isSupabaseConfigured) return;

  try {
    await supabase.from('admissions').upsert({
      id: application.id,
      student_name: application.studentName,
      parent_name: application.parentName,
      email: application.email,
      phone: application.phone,
      target_class: application.targetClass,
      address: application.address,
      previous_school: application.previousSchool,
      status: application.status
    });
  } catch (err) {
    console.error('Sync save admission singular failed:', err);
  }
}

export async function syncSaveAdmissions(list: AdmissionApplication[]): Promise<void> {
  const localKey = 'ff_admissions';
  localStorage.setItem(localKey, JSON.stringify(list));

  if (isSandbox() || !isSupabaseConfigured) return;

  try {
    for (const a of list) {
      await supabase.from('admissions').upsert({
        id: a.id,
        student_name: a.studentName,
        parent_name: a.parentName,
        email: a.email,
        parent_phone: a.phone,
        target_class: a.targetClass,
        address: a.address,
        previous_school: a.previousSchool || '',
        status: a.status
      } as any);
    }
  } catch (err) {
    console.error('Sync save admissions bulk failed:', err);
  }
}

// ==========================================
// 7. CBT EXAM SYNC
// ==========================================
export async function syncFetchCbtExam(subjectId: string): Promise<{ questions: any[], duration_minutes: number }> {
  const localKeyQuestions = 'ff_cbt_questions';
  const localSavedQuestions = localStorage.getItem(localKeyQuestions);
  const localSavedDuration = localStorage.getItem('ff_cbt_duration_minutes');

  const fallbackQuestions = localSavedQuestions ? JSON.parse(localSavedQuestions) : [];
  const fallbackDuration = localSavedDuration ? Number(localSavedDuration) : 5;

  if (isSandbox() || !isSupabaseConfigured) {
    return { questions: fallbackQuestions, duration_minutes: fallbackDuration };
  }

  try {
    const { data, error } = await supabase
      .from('cbt_questions')
      .select('*')
      .eq('id', subjectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Create settings row
        await supabase.from('cbt_questions').upsert({
          id: subjectId,
          questions: fallbackQuestions,
          duration_minutes: fallbackDuration
        });
        return { questions: fallbackQuestions, duration_minutes: fallbackDuration };
      }
      throw error;
    }

    if (data) {
      localStorage.setItem('ff_cbt_questions', JSON.stringify(data.questions));
      localStorage.setItem('ff_cbt_duration_minutes', data.duration_minutes.toString());
      return {
        questions: data.questions || [],
        duration_minutes: data.duration_minutes || 5
      };
    }
    return { questions: fallbackQuestions, duration_minutes: fallbackDuration };
  } catch (err) {
    console.warn('Sync fetch CBT failed, using local fallback:', err);
    return { questions: fallbackQuestions, duration_minutes: fallbackDuration };
  }
}

export async function syncSaveCbtSettings(subjectId: string, questions: any[], durationMinutes: number): Promise<void> {
  localStorage.setItem('ff_cbt_questions', JSON.stringify(questions));
  localStorage.setItem('ff_cbt_duration_minutes', durationMinutes.toString());

  if (isSandbox() || !isSupabaseConfigured) return;

  try {
    await supabase.from('cbt_questions').upsert({
      id: subjectId,
      questions,
      duration_minutes: durationMinutes
    });
  } catch (err) {
    console.error('Sync save CBT settings failed:', err);
  }
}

export async function syncSaveCustomCbtExam(key: string, questions: any[], durationMinutes: number): Promise<void> {
  localStorage.setItem(key, JSON.stringify(questions));
  localStorage.setItem(`${key}_duration`, durationMinutes.toString());

  if (isSandbox() || !isSupabaseConfigured) return;

  try {
    await supabase.from('cbt_questions').upsert({
      id: key,
      questions,
      duration_minutes: durationMinutes
    });
  } catch (err) {
    console.error('Sync save custom CBT settings failed:', err);
  }
}

export async function syncFetchAllCbtExams(): Promise<void> {
  if (isSandbox() || !isSupabaseConfigured) return;

  try {
    const { data, error } = await supabase
      .from('cbt_questions')
      .select('*');

    if (error) throw error;

    if (data && data.length > 0) {
      data.forEach((row: any) => {
        if (row.id && row.questions) {
          localStorage.setItem(row.id, JSON.stringify(row.questions));
          if (row.duration_minutes) {
            localStorage.setItem(`${row.id}_duration`, row.duration_minutes.toString());
          }
        }
      });
    }
  } catch (err) {
    console.warn('Sync fetch all CBT exams failed:', err);
  }
}

// ==========================================
// 8. LMS FILES / NOTES SYNC
// ==========================================
export interface LectureNote {
  id: string;
  title: string;
  subject: string;
  class: string;
  fileUrl: string;
  desc?: string;
  dateAdded?: string;
}

export async function syncFetchLectureNotes(): Promise<LectureNote[]> {
  const localKey = 'ff_lecture_notes';
  const saved = localStorage.getItem(localKey);
  const fallback = saved ? JSON.parse(saved) : [];

  if (isSandbox() || !isSupabaseConfigured) return fallback;

  try {
    const { data, error } = await supabase.from('lecture_notes').select('*');
    if (error) throw error;
    if (data && data.length > 0) {
      const notes: LectureNote[] = data.map(d => ({
        id: d.id,
        title: d.title,
        subject: d.subject,
        class: d.class,
        fileUrl: d.file_url,
        desc: d.description || '',
        dateAdded: new Date(d.created_at).toLocaleDateString()
      }));
      localStorage.setItem(localKey, JSON.stringify(notes));
      return notes;
    }
    return fallback;
  } catch (err) {
    console.warn('Sync fetch notes failed:', err);
    return fallback;
  }
}

export async function syncSaveLectureNote(note: LectureNote): Promise<void> {
  const localKey = 'ff_lecture_notes';
  const saved = localStorage.getItem(localKey);
  const list: LectureNote[] = saved ? JSON.parse(saved) : [];
  const updatedList = list.some(s => s.id === note.id)
    ? list.map(s => s.id === note.id ? note : s)
    : [note, ...list];
  localStorage.setItem(localKey, JSON.stringify(updatedList));

  if (isSandbox() || !isSupabaseConfigured) return;

  try {
    await supabase.from('lecture_notes').upsert({
      id: note.id,
      title: note.title,
      subject: note.subject,
      class: note.class,
      file_url: note.fileUrl,
      description: note.desc
    });
  } catch (err) {
    console.error('Sync save notes failed:', err);
  }
}

// ==========================================
// 8. REPORT CARDS SYNC
// ==========================================
export async function syncFetchReportCardsMap(): Promise<Record<string, any>> {
  const localKey = 'ff_student_report_cards_map';
  const localSaved = localStorage.getItem(localKey);
  const fallback = localSaved ? JSON.parse(localSaved) : {};

  if (isSandbox() || !isSupabaseConfigured) {
    return fallback;
  }

  try {
    const { data, error } = await supabase
      .from('site')
      .select('content')
      .eq('id', 'student_report_cards')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        await supabase.from('site').upsert({ id: 'student_report_cards', content: fallback });
        return fallback;
      }
      throw error;
    }

    if (data?.content) {
      const map = data.content as Record<string, any>;
      localStorage.setItem(localKey, JSON.stringify(map));
      return map;
    }
    return fallback;
  } catch (err) {
    console.warn('Sync fetch report cards map failed, using local fallback:', err);
    return fallback;
  }
}

export async function syncSaveReportCardsMap(map: Record<string, any>): Promise<void> {
  const localKey = 'ff_student_report_cards_map';
  localStorage.setItem(localKey, JSON.stringify(map));

  if (isSandbox() || !isSupabaseConfigured) return;

  try {
    await supabase.from('site').upsert({ id: 'student_report_cards', content: map });
  } catch (err) {
    console.error('Sync save report cards map failed:', err);
  }
}

// ==========================================
// 9. CLOUD FILES & DOCUMENTS SYNC
// ==========================================
export interface CloudFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string; // base64 encoded string or raw asset URL
  uploadedAt: string;
  uploadedBy: string;
}

export async function syncFetchCloudFiles(): Promise<CloudFile[]> {
  const localKey = 'ff_cloud_locker_files';
  const saved = localStorage.getItem(localKey);
  const fallback = saved ? JSON.parse(saved) : [];

  if (isSandbox() || !isSupabaseConfigured) return fallback;

  try {
    const { data, error } = await supabase
      .from('site')
      .select('content')
      .eq('id', 'cloud_locker_files')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Document doesn't exist yet, insert empty fallback
        await supabase.from('site').upsert({ id: 'cloud_locker_files', content: fallback });
        return fallback;
      }
      throw error;
    }

    if (data?.content) {
      const list = data.content as CloudFile[];
      localStorage.setItem(localKey, JSON.stringify(list));
      return list;
    }
    return fallback;
  } catch (err) {
    console.warn('Sync fetch cloud files failed, using local fallback:', err);
    return fallback;
  }
}

export async function syncSaveCloudFiles(list: CloudFile[]): Promise<void> {
  const localKey = 'ff_cloud_locker_files';
  localStorage.setItem(localKey, JSON.stringify(list));

  if (isSandbox() || !isSupabaseConfigured) return;

  try {
    await supabase.from('site').upsert({ id: 'cloud_locker_files', content: list });
  } catch (err) {
    console.error('Sync save cloud files failed:', err);
  }
}

// ==========================================
// 11. STAFF RATINGS SYNC
// ==========================================
export interface StaffDailyRating {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  punctuality: number;
  regularity: number;
  teachingAbility: number;
  dressing: number;
  speaking: number;
  attitude: number;
  leadership: number;
  remarks?: string;
  ratedBy?: string;
  createdAt?: string;
}

export async function syncFetchStaffRatings(): Promise<StaffDailyRating[]> {
  const localKey = 'ff_staff_daily_ratings';
  const saved = localStorage.getItem(localKey);
  const fallback = saved ? JSON.parse(saved) : [];

  if (isSandbox() || !isSupabaseConfigured) {
    return fallback;
  }

  try {
    const { data, error } = await supabase
      .from('site')
      .select('content')
      .eq('id', 'staff_daily_ratings')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        await supabase.from('site').upsert({ id: 'staff_daily_ratings', content: fallback });
        return fallback;
      }
      throw error;
    }

    if (data?.content) {
      const list = data.content as StaffDailyRating[];
      localStorage.setItem(localKey, JSON.stringify(list));
      return list;
    }
  } catch (err) {
    console.error('Sync fetch staff ratings failed, returning local state:', err);
  }
  return fallback;
}

export async function syncSaveStaffRatings(list: StaffDailyRating[]): Promise<void> {
  const localKey = 'ff_staff_daily_ratings';
  localStorage.setItem(localKey, JSON.stringify(list));

  if (isSandbox() || !isSupabaseConfigured) return;

  try {
    await supabase.from('site').upsert({ id: 'staff_daily_ratings', content: list });
  } catch (err) {
    console.error('Sync save staff ratings failed:', err);
  }
}

// ==========================================
// 10. RE-USABLE DB BROADCAST MECHANISM
// ==========================================
export async function logSystemActivity(userEmail: string | undefined, action: string, details: string): Promise<void> {
  if (isSandbox() || !isSupabaseConfigured) return;
  try {
    const sessionUser = (await supabase.auth.getUser()).data.user;
    await supabase.from('activity_logs').insert({
      user_id: sessionUser?.id,
      user_email: userEmail || sessionUser?.email,
      action,
      details
    });
  } catch (e) {
    // silently fail
  }
}
