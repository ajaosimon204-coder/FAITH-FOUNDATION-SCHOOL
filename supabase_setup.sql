-- FAITH FOUNDATION ENTERPRISE PORTAL - DATABASE SETUP
-- INSTRUCTIONS: 
-- 1. Go to your Supabase Dashboard (https://supabase.com)
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Click "New Query" or open your existing Query editor
-- 4. Paste ALL the code below and click "Run"
-- 5. This script is fully idempotent (can be run multiple times safely)

-- ==========================================
-- 1. TABLES CREATION
-- ==========================================

-- A. Profile Table (public.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'staff', 'student')),
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- B. Site Content Table (public.site)
CREATE TABLE IF NOT EXISTS public.site (
  id TEXT PRIMARY KEY,
  content JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- C. Admissions Table (public.admissions)
CREATE TABLE IF NOT EXISTS public.admissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  target_class TEXT NOT NULL,
  address TEXT NOT NULL,
  previous_school TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- D. Notifications Table (public.notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- E. Messages Table (public.messages)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT NOT NULL,
  is_broadcast BOOLEAN DEFAULT false,
  target_role TEXT, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- F. Students Table (public.students - Pupil Dossiers)
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  status TEXT DEFAULT 'Enrolled',
  fees TEXT DEFAULT 'Cleared',
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  dob TEXT,
  medical_info TEXT,
  allergies TEXT,
  academic_history JSONB DEFAULT '[]'::jsonb,
  communication_logs JSONB DEFAULT '[]'::jsonb,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- G. Teachers/Staff Table (public.teachers - Staff Dossiers)
CREATE TABLE IF NOT EXISTS public.teachers (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  photo_url TEXT,
  date_of_appointment TEXT,
  salary TEXT,
  award TEXT,
  punctuality_attendance TEXT,
  regularity_attendance TEXT,
  rating TEXT,
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- H. Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  teacher_id TEXT REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- I. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- J. Fee Structures Table (public.fee_structures)
CREATE TABLE IF NOT EXISTS public.fee_structures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  target_class TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- K. Student Invoices Table (public.student_invoices)
CREATE TABLE IF NOT EXISTS public.student_invoices (
  id TEXT PRIMARY KEY,
  student_email TEXT NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'partial')),
  due_date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- L. Results / Report Cards Table (public.results)
CREATE TABLE IF NOT EXISTS public.results (
  student_email TEXT PRIMARY KEY,
  grades JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- M. Attendance Logs (public.attendance_logs)
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_email TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- N. Attendance Requests (public.attendance_requests)
CREATE TABLE IF NOT EXISTS public.attendance_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_email TEXT NOT NULL,
  student_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- O. Assignments Table (public.assignments)
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  due_date TEXT NOT NULL,
  max_points NUMERIC DEFAULT 100,
  class TEXT,
  instructions TEXT,
  submissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- P. Lecture notes / Study Materials Table (public.lecture_notes)
CREATE TABLE IF NOT EXISTS public.lecture_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  class TEXT NOT NULL,
  file_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Q. Student Achievements Table (public.student_achievements)
CREATE TABLE IF NOT EXISTS public.student_achievements (
  student_email TEXT PRIMARY KEY,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- R. Student Leaderboard (public.student_leaderboard)
CREATE TABLE IF NOT EXISTS public.student_leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  class TEXT NOT NULL,
  points INTEGER NOT NULL,
  badge TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- S. CBT Exam Settings/Questions (public.cbt_questions)
CREATE TABLE IF NOT EXISTS public.cbt_questions (
  id TEXT PRIMARY KEY, -- 'mathematics', 'physics', 'general', etc.
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration_minutes INTEGER DEFAULT 5,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- T. System Audit/Activity logs Table (public.activity_logs)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  user_email TEXT,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. ROW LEVEL SECURITY (RLS) ENABLING
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. RECURSION-PROOF RLS POLICIES Setup
-- ==========================================

-- Helper macro function to clear existing policies on tables to run setup idempotently
CREATE OR REPLACE FUNCTION public.drop_all_policies(table_name text, schema_name text DEFAULT 'public') 
RETURNS void AS $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = table_name AND schemaname = schema_name
  LOOP 
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON ' || quote_ident(schema_name) || '.' || quote_ident(table_name);
  END LOOP; 
END;
$$ LANGUAGE plpgsql;

-- Clean existing policies safely
SELECT public.drop_all_policies('users');
SELECT public.drop_all_policies('site');
SELECT public.drop_all_policies('admissions');
SELECT public.drop_all_policies('notifications');
SELECT public.drop_all_policies('messages');
SELECT public.drop_all_policies('students');
SELECT public.drop_all_policies('teachers');
SELECT public.drop_all_policies('classes');
SELECT public.drop_all_policies('subjects');
SELECT public.drop_all_policies('fee_structures');
SELECT public.drop_all_policies('student_invoices');
SELECT public.drop_all_policies('results');
SELECT public.drop_all_policies('attendance_logs');
SELECT public.drop_all_policies('attendance_requests');
SELECT public.drop_all_policies('assignments');
SELECT public.drop_all_policies('lecture_notes');
SELECT public.drop_all_policies('student_achievements');
SELECT public.drop_all_policies('student_leaderboard');
SELECT public.drop_all_policies('cbt_questions');
SELECT public.drop_all_policies('activity_logs');


-- Core Table Security Rules:
-- JWT based checks to bypass internal-table select loops (which causes infinite RLS recursion)

-- 1. Users policies
CREATE POLICY "Users view own profile" ON public.users FOR SELECT USING (
  auth.uid() = id 
  OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (
  auth.uid() = id 
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);
CREATE POLICY "Admins full management users" ON public.users FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);

-- 2. Site CMS
CREATE POLICY "Public read site content" ON public.site FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage site" ON public.site FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);

-- 3. Admissions
CREATE POLICY "Public can apply admissions" ON public.admissions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Staff can view/manage admissions" ON public.admissions FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);

-- 4. Notifications
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);
CREATE POLICY "Staff insert notifications" ON public.notifications FOR INSERT WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);
CREATE POLICY "Admins full management notifications" ON public.notifications FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);

-- 5. Broadcasts & Direct Messages
CREATE POLICY "Users view relevant messages" ON public.messages FOR SELECT USING (
  auth.uid() = sender_id 
  OR auth.uid() = receiver_id 
  OR (is_broadcast = true AND target_role IN ('all', (auth.jwt() -> 'user_metadata' ->> 'role')))
  OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);
CREATE POLICY "Users insert messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Admins all messages" ON public.messages FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);

-- 6. Students
CREATE POLICY "Anyone authenticated can view student list" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff/Admins can manage student dossiers" ON public.students FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);

-- 7. Teachers/Staff
CREATE POLICY "Anyone authenticated can view staff list" ON public.teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can update own record" ON public.teachers FOR UPDATE USING (
  LOWER(email) = LOWER(auth.jwt() ->> 'email')
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
CREATE POLICY "Admins full manage teachers" ON public.teachers FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);

-- 8. Classes & Subjects
CREATE POLICY "Read classes/subjects" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage classes/subjects" ON public.classes FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);
CREATE POLICY "Read subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage subjects" ON public.subjects FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);

-- 9. Finance & Invoices
CREATE POLICY "View own billing student" ON public.student_invoices FOR SELECT USING (
  LOWER(student_email) = LOWER(auth.jwt() ->> 'email')
  OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);
CREATE POLICY "Admins manage billing structures" ON public.fee_structures FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);
CREATE POLICY "Admins manage student invoices" ON public.student_invoices FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);
CREATE POLICY "Read fee structures" ON public.fee_structures FOR SELECT TO authenticated USING (true);

-- 10. Term Results & Grades
CREATE POLICY "Student read own report cards" ON public.results FOR SELECT USING (
  LOWER(student_email) = LOWER(auth.jwt() ->> 'email')
  OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);
CREATE POLICY "Teachers/Admins manage database results" ON public.results FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);

-- 11. Attendance
CREATE POLICY "Student read own attendance logs" ON public.attendance_logs FOR SELECT USING (
  LOWER(student_email) = LOWER(auth.jwt() ->> 'email')
  OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);
CREATE POLICY "Student submit excuse attendance" ON public.attendance_requests FOR INSERT WITH CHECK (
  LOWER(student_email) = LOWER(auth.jwt() ->> 'email')
);
CREATE POLICY "Student read own requests" ON public.attendance_requests FOR SELECT USING (
  LOWER(student_email) = LOWER(auth.jwt() ->> 'email')
  OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);
CREATE POLICY "Staff handle attendance records" ON public.attendance_logs FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);
CREATE POLICY "Staff handle attendance requests" ON public.attendance_requests FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);

-- 12. LMS study notes/Assignments
CREATE POLICY "All study courses read notes" ON public.lecture_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers upload study notes" ON public.lecture_notes FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);
CREATE POLICY "All view study assignments" ON public.assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "All interact study assignments" ON public.assignments FOR UPDATE USING (true); -- allowed to update submissions
CREATE POLICY "Teachers publish assignments" ON public.assignments FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);

-- 13. Gamification Profiles / Achievements / Leaderboards
CREATE POLICY "All read trophies score" ON public.student_achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff configure trophies" ON public.student_achievements FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
);
CREATE POLICY "All read leaderboard standings" ON public.student_leaderboard FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff configure leaderboard" ON public.student_leaderboard FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
);

-- 14. CBT Exam Questions
CREATE POLICY "All read questions during exams" ON public.cbt_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins publish cbt database" ON public.cbt_questions FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);

-- 15. Audit Security Logs
CREATE POLICY "Admins read audits" ON public.activity_logs FOR SELECT USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
);
CREATE POLICY "Anyone insert audits" ON public.activity_logs FOR INSERT WITH CHECK (true);


-- ==========================================
-- 4. AUTH TRIGGERS (Automatically sync user profiles safely)
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'), 
    CASE 
      WHEN LOWER(new.email) IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com') THEN 'admin'
      ELSE COALESCE(new.raw_user_meta_data->>'role', 'student')
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE 
      WHEN LOWER(EXCLUDED.email) IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com') THEN 'admin'
      ELSE COALESCE(EXCLUDED.role, users.role)
    END,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync user role to auth.users metadata whenever role is changed or created
CREATE OR REPLACE FUNCTION public.sync_user_role_to_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_role_change ON public.users;
CREATE TRIGGER on_user_role_change
  AFTER INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_to_metadata();


-- ==========================================
-- 5. INITIAL HOMEPAGE DATA SEEDING
-- ==========================================
INSERT INTO public.site (id, content)
VALUES ('homepage', '{
  "hero": {
    "title": "FAITH FOUNDATION",
    "description": "Nurturing the next generation of global leaders through academic excellence and unwavering faith.",
    "cta_primary": "Join Our Community",
    "cta_secondary": "Explore Campus",
    "badge": "Admission Cycle 26/27",
    "image_url": "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1200&q=80"
  },
  "philosophy": {
    "title": "EDUCATION WITHOUT BOUNDARIES.",
    "subtitle": "Built on Values, Driven by Purpose",
    "items": [
      { "title": "Academic Rigor", "desc": "Balanced curriculum following both Nigerian and international standards from Creche to SS3." },
      { "title": "Faith-Filled", "desc": "Spiritual growth is at our core. We nurture a deep relationship with God in every student." }
    ]
  },
  "stats": [
    { "label": "Graduates", "value": "1.2k+" },
    { "label": "Expert Staff", "value": "50+" },
    { "label": "Total Classes", "value": "30+" },
    { "label": "State Awards", "value": "15" }
  ],
  "gallery": [
    "https://images.unsplash.com/photo-1543269865-cbf427effbad",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7",
    "https://images.unsplash.com/photo-1571260899304-425eee4c7efc",
    "https://images.unsplash.com/photo-1516321497487-e288fb19713f",
    "https://images.unsplash.com/photo-1524178232363-1fb28f74b671",
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846"
  ],
  "cta": {
    "badge": "Admission Cycle 26/27",
    "title": "THE FUTURE",
    "highlight": "STARTS HERE."
  },
  "contact": {
    "email": "admissions@faithfoundation.edu.ng",
    "phone": "+234 803 123 4567",
    "address": "12 Foundation Road, Ibadan, Oyo State, Nigeria",
    "working_hours": "Mon - Fri: 8:00 AM - 4:00 PM"
  },
  "highlights": {
    "badge": "LATEST HIGHLIGHTS AND MOMENTS",
    "title": "CREATIVE MOMENTS PORTFOLIO"
  },
  "alumni": {
    "label": "1.2K+ Successful Graduates",
    "sublabel": "Nurturing leaders who make stellar changes around the globe.",
    "count": "+600",
    "images": [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
    ]
  }
}')
ON CONFLICT (id) DO UPDATE SET
  content = COALESCE(site.content, EXCLUDED.content);
