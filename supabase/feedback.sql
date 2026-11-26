-- Pare expo: feedback terminal + phone notification.
-- Paste into Supabase > SQL Editor, put your own ntfy topic on the line marked TOPIC, and press Run.
-- Safe to run more than once.

create extension if not exists pg_net;

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

-- Push each new message to the ntfy app on Luke's phone.
create or replace function public.feedback_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  topic constant text := 'REPLACE_WITH_YOUR_TOPIC';  -- TOPIC
  recent int;
begin
  -- Spam guard: at most 30 pings per 10 minutes (every message is still saved).
  select count(*) into recent from public.feedback where created_at > now() - interval '10 minutes';
  if recent > 30 then return new; end if;

  perform net.http_post(
    url := 'https://ntfy.sh/',
    body := jsonb_build_object(
      'topic', topic,
      'title', 'New feedback' || coalesce(' from ' || nullif(new.contact, ''), ''),
      'message', left(new.message, 1500),
      'tags', jsonb_build_array('robot'),
      'priority', 4
    )
  );
  return new;
end;
$$;

drop trigger if exists feedback_notify on public.feedback;
create trigger feedback_notify after insert on public.feedback
  for each row execute function public.feedback_notify();

-- To read all feedback: Supabase > Table Editor > feedback (Export to CSV works too).
