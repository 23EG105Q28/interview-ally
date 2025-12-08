-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'candidate');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'candidate',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Role check function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Interview results table
CREATE TABLE public.interview_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL DEFAULT 'video',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  question_count INTEGER NOT NULL DEFAULT 0,
  transcript JSONB,
  summary TEXT,
  strengths JSONB,
  improvements JSONB,
  overall_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.interview_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own results" ON public.interview_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own results" ON public.interview_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all results" ON public.interview_results FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Reading test results table
CREATE TABLE public.reading_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  passage_text TEXT NOT NULL,
  spoken_transcript TEXT,
  accuracy_percentage DECIMAL(5,2),
  pronunciation_score DECIMAL(5,2),
  fluency_score DECIMAL(5,2),
  clarity_score DECIMAL(5,2),
  overall_score DECIMAL(5,2),
  word_errors JSONB,
  scroll_speed TEXT,
  duration_seconds INTEGER,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reading_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reading results" ON public.reading_test_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reading results" ON public.reading_test_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all reading results" ON public.reading_test_results FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'candidate');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();