
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('child', 'therapist');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============ CHILDREN PROFILES ============
CREATE TABLE public.children_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  age INTEGER,
  guardian_name TEXT,
  guardian_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.children_profiles TO authenticated;
GRANT ALL ON public.children_profiles TO service_role;

ALTER TABLE public.children_profiles ENABLE ROW LEVEL SECURITY;

-- ============ THERAPIST PROFILES ============
CREATE TABLE public.therapist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty TEXT,
  professional_registration TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.therapist_profiles TO authenticated;
GRANT ALL ON public.therapist_profiles TO service_role;

ALTER TABLE public.therapist_profiles ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES: profiles ============
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Therapists view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'therapist'));
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============ POLICIES: user_roles ============
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Therapists view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'therapist'));

-- ============ POLICIES: children_profiles ============
CREATE POLICY "Child views own data" ON public.children_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Therapists view children" ON public.children_profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'therapist'));
CREATE POLICY "Child inserts own data" ON public.children_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Child updates own data" ON public.children_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============ POLICIES: therapist_profiles ============
CREATE POLICY "Therapist views own data" ON public.therapist_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Therapist inserts own data" ON public.therapist_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Therapist updates own data" ON public.therapist_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============ TRIGGERS ============
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_children_profiles_updated_at BEFORE UPDATE ON public.children_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_therapist_profiles_updated_at BEFORE UPDATE ON public.therapist_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + role on signup from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
  _name TEXT;
BEGIN
  _name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'child');

  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, _name, NEW.email);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  IF _role = 'child' THEN
    INSERT INTO public.children_profiles (user_id, age, guardian_name, guardian_email)
    VALUES (
      NEW.id,
      NULLIF(NEW.raw_user_meta_data->>'age','')::INTEGER,
      NEW.raw_user_meta_data->>'guardian_name',
      NEW.raw_user_meta_data->>'guardian_email'
    );
  ELSE
    INSERT INTO public.therapist_profiles (user_id, specialty, professional_registration)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'specialty',
      NEW.raw_user_meta_data->>'professional_registration'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ Link existing data tables to authenticated users ============
ALTER TABLE public.child_profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.activity_progress ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.session_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Tighten RLS on existing tables: drop old public policies, replace with auth-based
DROP POLICY IF EXISTS "Public read child_profiles" ON public.child_profiles;
DROP POLICY IF EXISTS "Public insert child_profiles" ON public.child_profiles;
DROP POLICY IF EXISTS "Public update child_profiles" ON public.child_profiles;
DROP POLICY IF EXISTS "Public delete child_profiles" ON public.child_profiles;

CREATE POLICY "Own or therapist read child_profiles" ON public.child_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'therapist'));
CREATE POLICY "Insert own child_profiles" ON public.child_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own child_profiles" ON public.child_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read activity_progress" ON public.activity_progress;
DROP POLICY IF EXISTS "Public insert activity_progress" ON public.activity_progress;
DROP POLICY IF EXISTS "Public update activity_progress" ON public.activity_progress;
DROP POLICY IF EXISTS "Public delete activity_progress" ON public.activity_progress;

CREATE POLICY "Own or therapist read activity_progress" ON public.activity_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'therapist'));
CREATE POLICY "Insert own activity_progress" ON public.activity_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read session_logs" ON public.session_logs;
DROP POLICY IF EXISTS "Public insert session_logs" ON public.session_logs;
DROP POLICY IF EXISTS "Public update session_logs" ON public.session_logs;
DROP POLICY IF EXISTS "Public delete session_logs" ON public.session_logs;

CREATE POLICY "Own or therapist read session_logs" ON public.session_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'therapist'));
CREATE POLICY "Insert own session_logs" ON public.session_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Public insert chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Public update chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Public delete chat_messages" ON public.chat_messages;

CREATE POLICY "Own or therapist read chat_messages" ON public.chat_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'therapist'));
CREATE POLICY "Insert own chat_messages" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
