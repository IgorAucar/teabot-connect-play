
-- Função utilitária de timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Perfis das crianças (identificadas por device_id no MVP)
CREATE TABLE public.child_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Amiguinho',
  avatar TEXT,
  total_stars INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.child_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read child_profiles" ON public.child_profiles FOR SELECT USING (true);
CREATE POLICY "Public insert child_profiles" ON public.child_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update child_profiles" ON public.child_profiles FOR UPDATE USING (true);
CREATE POLICY "Public delete child_profiles" ON public.child_profiles FOR DELETE USING (true);

CREATE TRIGGER update_child_profiles_updated_at
BEFORE UPDATE ON public.child_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Progresso por atividade
CREATE TABLE public.activity_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  activity_title TEXT NOT NULL,
  stars INTEGER NOT NULL DEFAULT 1,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_progress_device ON public.activity_progress(device_id);
CREATE INDEX idx_activity_progress_activity ON public.activity_progress(activity_id);

ALTER TABLE public.activity_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read activity_progress" ON public.activity_progress FOR SELECT USING (true);
CREATE POLICY "Public insert activity_progress" ON public.activity_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update activity_progress" ON public.activity_progress FOR UPDATE USING (true);
CREATE POLICY "Public delete activity_progress" ON public.activity_progress FOR DELETE USING (true);

-- Logs de sessões
CREATE TABLE public.session_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  activity_title TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_logs_device ON public.session_logs(device_id);

ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read session_logs" ON public.session_logs FOR SELECT USING (true);
CREATE POLICY "Public insert session_logs" ON public.session_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update session_logs" ON public.session_logs FOR UPDATE USING (true);
CREATE POLICY "Public delete session_logs" ON public.session_logs FOR DELETE USING (true);

-- Mensagens do chat
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_device_activity ON public.chat_messages(device_id, activity_id);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read chat_messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Public insert chat_messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update chat_messages" ON public.chat_messages FOR UPDATE USING (true);
CREATE POLICY "Public delete chat_messages" ON public.chat_messages FOR DELETE USING (true);
