-- FAITH FOUNDATION ENTERPRISE PORTAL - DATABASE SETUP
-- INSTRUCTIONS: 
-- 1. Go to your Supabase Dashboard (https://supabase.com)
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Click "New Query" Or open your existing Query editor
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
  recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
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

-- ==========================================
-- 2. ROW LEVEL SECURITY (RLS) ENABLING
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. CLEAN & SETUP RLS POLICIES (RECURSION-PROOF)
-- ==========================================

-- Dynamically drop ALL existing policies on public.users to clear any hidden recursive ones leftover from old setups
DO $$ 
DECLARE 
  pol RECORD;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'users' AND schemaname = 'public'
  LOOP 
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.users';
  END LOOP; 
END $$;

-- Users
CREATE POLICY "Users can view own profile" ON public.users 
  FOR SELECT USING (
    auth.uid() = id 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
    OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
  );

CREATE POLICY "Users can update own profile" ON public.users 
  FOR UPDATE USING (
    auth.uid() = id 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
  );

CREATE POLICY "Admins can manage all profiles" ON public.users 
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
  );

-- Site
DROP POLICY IF EXISTS "Public read site content" ON public.site;
DROP POLICY IF EXISTS "Admins can manage site content" ON public.site;

CREATE POLICY "Public read site content" ON public.site 
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage site content" ON public.site 
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
  );

-- Admissions
DROP POLICY IF EXISTS "Public can submit applications" ON public.admissions;
DROP POLICY IF EXISTS "Admins can manage applications" ON public.admissions;
DROP POLICY IF EXISTS "Admins can view applications" ON public.admissions;

CREATE POLICY "Public can submit applications" ON public.admissions 
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Admins can manage applications" ON public.admissions 
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
    OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
  );

-- Notifications
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update read status" ON public.notifications;
DROP POLICY IF EXISTS "Admins/Staff can send notifications" ON public.notifications;

CREATE POLICY "Users manage own notifications" ON public.notifications 
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users update read status" ON public.notifications 
  FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "Admins/Staff can send notifications" ON public.notifications 
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'staff')
    OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
  );

-- Messages
DROP POLICY IF EXISTS "Users can view relevant messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;

CREATE POLICY "Users can view relevant messages" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id 
    OR auth.uid() = receiver_id 
    OR (is_broadcast = true AND target_role IN ('all', (auth.jwt() -> 'user_metadata' ->> 'role')))
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') IN ('faithfoundation480@gmail.com', 'ajaosimon3@gmail.com')
  );

CREATE POLICY "Users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );


-- ==========================================
-- 4. AUTH TRIGGER (Automatically syncs profiles safely)
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
    "cta_secondary": "Explore Campus"
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
  }
}')
ON CONFLICT (id) DO NOTHING;
