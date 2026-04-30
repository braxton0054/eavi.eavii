-- AI Memory System Tables for EduCore AI

-- User Registry - tracks AI users and their profiles
CREATE TABLE IF NOT EXISTS public.ai_user_registry (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, -- References auth.users.id
  user_role text NOT NULL CHECK (user_role = ANY (ARRAY['admin'::text, 'lecturer'::text, 'student'::text])),
  campus text CHECK (campus = ANY (ARRAY['main'::text, 'west'::text])),
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_user_registry_pkey PRIMARY KEY (id),
  CONSTRAINT ai_user_registry_user_id_unique UNIQUE (user_id)
);

-- Long Term Memory - stores persistent facts about users and system
CREATE TABLE IF NOT EXISTS public.ai_long_term_memory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, -- References auth.users.id
  memory_type text NOT NULL CHECK (memory_type = ANY (ARRAY['user_fact'::text, 'system_fact'::text, 'preference'::text])),
  key text NOT NULL,
  value text NOT NULL,
  importance integer DEFAULT 1 CHECK (importance >= 1 AND importance <= 5),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_long_term_memory_pkey PRIMARY KEY (id),
  CONSTRAINT ai_long_term_memory_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Chat History - stores recent conversation context
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, -- References auth.users.id
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
  content text NOT NULL,
  is_diagnostic boolean DEFAULT false,
  data_type text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_chat_history_pkey PRIMARY KEY (id),
  CONSTRAINT ai_chat_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- System Logs - stores system events and errors for debugging
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  log_level text NOT NULL CHECK (log_level = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'debug'::text])),
  component text NOT NULL,
  message text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  user_id uuid, -- Optional: which user triggered this
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT system_logs_pkey PRIMARY KEY (id)
);

-- Issue Memory - stores past system problems and solutions
CREATE TABLE IF NOT EXISTS public.ai_issue_memory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  issue_type text NOT NULL,
  issue_description text NOT NULL,
  root_cause text,
  solution text,
  resolved boolean DEFAULT false,
  occurrence_count integer DEFAULT 1,
  last_occurred timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_issue_memory_pkey PRIMARY KEY (id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_user_registry_user_id ON public.ai_user_registry(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_long_term_memory_user_id ON public.ai_long_term_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_long_term_memory_type ON public.ai_long_term_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id ON public.ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_created_at ON public.ai_chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_issue_memory_type ON public.ai_issue_memory(issue_type);
CREATE INDEX IF NOT EXISTS idx_ai_issue_memory_resolved ON public.ai_issue_memory(resolved);

-- Enable RLS (Row Level Security)
ALTER TABLE public.ai_user_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_long_term_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own data
CREATE POLICY "Users can view own registry" ON public.ai_user_registry
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own memory" ON public.ai_long_term_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own chat history" ON public.ai_chat_history
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert/update (for the API)
CREATE POLICY "Service can manage registry" ON public.ai_user_registry
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service can manage memory" ON public.ai_long_term_memory
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service can manage chat history" ON public.ai_chat_history
  FOR ALL USING (auth.role() = 'service_role');

-- System logs and issue memory are readable by authenticated users
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_issue_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view system logs" ON public.system_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can view issue memory" ON public.ai_issue_memory
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service can manage system logs" ON public.system_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service can manage issue memory" ON public.ai_issue_memory
  FOR ALL USING (auth.role() = 'service_role');
