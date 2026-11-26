-- Pare expo: optional backup copy of every feedback message.
-- Paste into Supabase > SQL Editor and press Run.
-- Safe to run more than once.

create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  message text not null check (char_length(message) between 1 and 1500),
  contact text check (char_length(contact) <= 200),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Visitors can send feedback, but can't read, change or delete anyone's.
drop policy if exists "anyone can send feedback" on public.feedback;
create policy "anyone can send feedback" on public.feedback
  for insert to anon with check (true);
grant insert on public.feedback to anon;

-- Phone pings are sent by the website itself (ntfy), so no trigger is needed here.
-- Remove the old trigger if an earlier version of this file added it:
drop trigger if exists feedback_notify on public.feedback;
drop function if exists public.feedback_notify();

-- To read all feedback: Supabase > Table Editor > feedback (Export to CSV works too).
