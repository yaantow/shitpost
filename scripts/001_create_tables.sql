-- Create profiles table for user data
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  twitter_username text,
  twitter_access_token text,
  twitter_refresh_token text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tweets table for storing tweet content and scheduling
create table if not exists public.tweets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  thread_order integer default 1,
  thread_id uuid references public.tweets(id) on delete cascade,
  scheduled_for timestamp with time zone,
  posted_at timestamp with time zone,
  status text default 'draft' check (status in ('draft', 'scheduled', 'posted', 'failed')),
  twitter_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.tweets enable row level security;

-- Profiles policies
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- Tweets policies
create policy "tweets_select_own"
  on public.tweets for select
  using (auth.uid() = user_id);

create policy "tweets_insert_own"
  on public.tweets for insert
  with check (auth.uid() = user_id);

create policy "tweets_update_own"
  on public.tweets for update
  using (auth.uid() = user_id);

create policy "tweets_delete_own"
  on public.tweets for delete
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists tweets_user_id_idx on public.tweets(user_id);
create index if not exists tweets_scheduled_for_idx on public.tweets(scheduled_for);
create index if not exists tweets_status_idx on public.tweets(status);
create index if not exists tweets_thread_id_idx on public.tweets(thread_id);
