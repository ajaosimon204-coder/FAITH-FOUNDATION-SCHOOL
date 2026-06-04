# Faith Foundation Schools ERP - Documentation

## 🏗 System Architecture
The application is a Full-Stack React (Vite) application leveraging Supabase for all backend services.

- **Frontend:** React with Tailwind CSS for styling and Motion for animations.
- **Database:** PostgreSQL (via Supabase) for transactional data (students, results, payments).
- **Authentication:** Supabase Auth with Role-Based Access Control (RBAC).
- **Real-time:** Supabase Realtime for notifications and live updates.

## 📁 Folder Structure
- `src/lib/supabase.ts`: Supabase SDK initialization.
- `src/contexts/AuthContext.tsx`: Real-time auth and profile management.
- `src/components/`: Shared UI components (Navbar, Sidebar, DashboardLayout).
- `src/pages/`: Public landing pages.
- `src/pages/dashboard/`: Role-specific portals.

## 🗄 Database Schema (Supabase)
- `users`: `{ id, full_name, email, role (admin|staff|student), updated_at }`
- `notifications`: `{ id, recipient_id, title, message, type, read, created_at }`
- `admissions`: `{ id, student_name, parent_name, email, phone, target_class, status, created_at }`
- `site`: `{ id, content, updated_at }` (CMS for homepage)

## ⚙️ Backend Logic
- **Security Rules:** Implemented using PostgreSQL Row Level Security (RLS).
- **Admin Setup:** Admins can manage the school via the Admin Dashboard.
- **Role Guards:** The `PrivateRoute` and `DashboardRedirect` in `App.tsx` ensure users only see their designated interfaces.

## 🚀 Deployment Guide
1. **Supabase Config:**
   - Create a project at [supabase.com](https://supabase.com).
   - Run the provided SQL script in the SQL Editor to set up tables and RLS.
   - Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the application environment.
3. **Environment:** Ensure `GEMINI_API_KEY` is set in Secrets if AI features are added later.
