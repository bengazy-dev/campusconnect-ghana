-- CampusConnect Ghana — InsForge Postgres schema
-- Apply via InsForge SQL editor or: insforge db query (when connected)
-- Requires auth.users (built-in).

-- Profiles: one row per auth user; drives roles and student matching.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'organizer')),
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  institution TEXT,
  course TEXT,
  year TEXT,
  campus TEXT,
  interests TEXT[] DEFAULT '{}',
  goals TEXT,
  preferred_formats TEXT[] DEFAULT '{}',
  org_display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  fields_display TEXT,
  organization TEXT NOT NULL,
  description TEXT NOT NULL,
  eligibility TEXT,
  url TEXT,
  deadline DATE,
  location TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  eligible_years TEXT[],
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saved_events (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_saved_events_user ON public.saved_events(user_id);

-- updated_at triggers
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

DROP TRIGGER IF EXISTS events_updated_at ON public.events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS events_select_auth ON public.events;
CREATE POLICY events_select_auth ON public.events
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS events_insert_organizer ON public.events;
CREATE POLICY events_insert_organizer ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'organizer'
    )
  );

DROP POLICY IF EXISTS events_update_own ON public.events;
CREATE POLICY events_update_own ON public.events
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS events_delete_own ON public.events;
CREATE POLICY events_delete_own ON public.events
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS saved_select_own ON public.saved_events;
CREATE POLICY saved_select_own ON public.saved_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS saved_insert_own ON public.saved_events;
CREATE POLICY saved_insert_own ON public.saved_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS saved_delete_own ON public.saved_events;
CREATE POLICY saved_delete_own ON public.saved_events
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Grants (adjust if your project uses different role names)
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.events TO authenticated;
GRANT ALL ON public.saved_events TO authenticated;

-- Seed events (platform listings; created_by NULL — not editable by organizers via RLS)
INSERT INTO public.events (
  id, title, category, fields_display, organization, description, eligibility, url, deadline, location, tags, eligible_years, created_by
) VALUES
(
  'e1000000-0000-4000-8000-000000000001',
  'Google Developer Summit',
  'workshop',
  'Tech, Engineering',
  'Google',
  'Full-day summit covering cloud, Android, and web tooling with hands-on codelabs.',
  'Open to tertiary students in tech and engineering programmes.',
  'https://example.com/google-dev-summit',
  '2026-04-15',
  'Accra + livestream',
  ARRAY['tech','engineering']::TEXT[],
  NULL,
  NULL
),
(
  'e1000000-0000-4000-8000-000000000002',
  'Ashesi Entrepreneurship Bootcamp',
  'workshop',
  'Business, Tech, Social Impact',
  'Ashesi University',
  'Intensive week building ventures from problem to pitch with mentors.',
  'Years 2–4 undergraduates; interest in startups or social impact.',
  'https://example.com/ashesi-bootcamp',
  '2026-05-01',
  'Berekuso',
  ARRAY['business','tech','policy']::TEXT[],
  ARRAY['2','3','4']::TEXT[],
  NULL
),
(
  'e1000000-0000-4000-8000-000000000003',
  'MasterCard Foundation Scholarship',
  'scholarship',
  'All',
  'MasterCard Foundation',
  'Comprehensive scholarship for academically talented students with financial need.',
  'Ghanaian tertiary students; strong academic record and leadership.',
  'https://example.com/mcf-scholarship',
  '2026-03-30',
  'National',
  ARRAY[]::TEXT[],
  ARRAY['1','2','3','4','pg']::TEXT[],
  NULL
),
(
  'e1000000-0000-4000-8000-000000000004',
  'Ghana Health Hackathon',
  'competition',
  'Tech, Health, Engineering',
  'Ghana Health Tech Coalition',
  '48-hour build focused on digital tools for primary care access.',
  'Cross-disciplinary teams; at least one developer or engineering student.',
  'https://example.com/health-hack',
  '2026-04-08',
  'Hybrid · Accra',
  ARRAY['tech','health','engineering']::TEXT[],
  NULL,
  NULL
),
(
  'e1000000-0000-4000-8000-000000000005',
  'Deloitte Graduate Internship',
  'internship',
  'Business, Finance, Law',
  'Deloitte Ghana',
  'Structured internship across audit, tax, and consulting streams.',
  'Penultimate or final year; business, finance, accounting, or law.',
  'https://example.com/deloitte-intern',
  '2026-03-22',
  'Accra',
  ARRAY['business','law']::TEXT[],
  ARRAY['3','4','pg']::TEXT[],
  NULL
),
(
  'e1000000-0000-4000-8000-000000000006',
  'KNUST Engineering Career Fair',
  'networking',
  'Engineering, Tech',
  'KNUST Career Services',
  'Meet employers hiring engineers and technologists for graduate roles.',
  'Year 3+, final year, and postgraduate engineering and tech students.',
  'https://example.com/knust-fair',
  '2026-04-20',
  'Kumasi',
  ARRAY['engineering','tech']::TEXT[],
  ARRAY['3','4','pg']::TEXT[],
  NULL
),
(
  'e1000000-0000-4000-8000-000000000007',
  'Legal Aid Pro Bono Workshop',
  'seminar',
  'Law, Social Impact',
  'Ghana Legal Aid',
  'Training on community legal education and clinic procedures.',
  'Law students year 2+ with interest in access to justice.',
  'https://example.com/legal-aid-workshop',
  '2026-04-12',
  'Accra',
  ARRAY['law','policy']::TEXT[],
  ARRAY['2','3','4']::TEXT[],
  NULL
),
(
  'e1000000-0000-4000-8000-000000000008',
  'African Leadership Fellowship',
  'scholarship',
  'All',
  'African Leadership Institute',
  'Fellowship for final-year and postgraduate students demonstrating leadership.',
  'Final-year undergraduate or postgraduate; essay and references required.',
  'https://example.com/al-fellowship',
  '2026-05-15',
  'Pan-African',
  ARRAY[]::TEXT[],
  ARRAY['4','pg']::TEXT[],
  NULL
),
(
  'e1000000-0000-4000-8000-000000000009',
  'UI/UX Design Masterclass',
  'workshop',
  'Tech, Arts',
  'Design Ghana Collective',
  'From research to high-fidelity prototypes in Figma.',
  'Any tertiary student; laptop required.',
  'https://example.com/uiux-masterclass',
  '2026-04-05',
  'Remote',
  ARRAY['tech','creative']::TEXT[],
  NULL,
  NULL
),
(
  'e1000000-0000-4000-8000-000000000010',
  'Hult Prize Competition',
  'competition',
  'Business, Social Impact',
  'Hult Prize Foundation',
  'Campus round leading to regional finals for social enterprise ideas.',
  'Teams of 3–5 students from any discipline.',
  'https://example.com/hult-prize',
  '2026-03-28',
  'Your campus',
  ARRAY['business','policy']::TEXT[],
  NULL,
  NULL
),
(
  'e1000000-0000-4000-8000-000000000011',
  'Data Science for Social Good',
  'seminar',
  'Tech, Social Impact',
  'DS4SG Ghana',
  'Seminar series on ethical AI and civic data projects.',
  'Students with basic stats or programming; any year.',
  'https://example.com/ds4sg',
  '2026-04-18',
  'Hybrid',
  ARRAY['tech','policy']::TEXT[],
  NULL,
  NULL
),
(
  'e1000000-0000-4000-8000-000000000012',
  'Standard Chartered Women in Tech',
  'internship',
  'Tech, Finance, Engineering',
  'Standard Chartered',
  'Internship track for women pursuing careers in technology and finance.',
  'Women in STEM or finance programmes; year 2+ preferred.',
  'https://example.com/sc-women-tech',
  '2026-04-01',
  'Accra',
  ARRAY['tech','business','engineering']::TEXT[],
  ARRAY['2','3','4','pg']::TEXT[],
  NULL
)
ON CONFLICT (id) DO NOTHING;
