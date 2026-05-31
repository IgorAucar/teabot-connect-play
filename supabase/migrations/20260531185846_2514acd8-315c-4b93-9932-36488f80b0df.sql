
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL,
  therapist_id UUID NOT NULL,
  title TEXT NOT NULL,
  report_content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapists view all reports"
  ON public.reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'therapist'));

CREATE POLICY "Child views own reports"
  ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = child_id);

CREATE POLICY "Therapists insert reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'therapist') AND auth.uid() = therapist_id);

CREATE POLICY "Therapists update own reports"
  ON public.reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'therapist') AND auth.uid() = therapist_id);

CREATE POLICY "Therapists delete own reports"
  ON public.reports FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'therapist') AND auth.uid() = therapist_id);

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_reports_child_id ON public.reports(child_id);
CREATE INDEX idx_reports_therapist_id ON public.reports(therapist_id);
