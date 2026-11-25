-- Pare expo: live vote. Paste this whole file into Supabase > SQL Editor and press Run.

create table if not exists public.votes (
  id bigint generated always as identity primary key,
  persona text not null check (persona in ('robin', 'darcy', 'rumi')),
  voter text not null unique check (char_length(voter) between 8 and 64),
  created_at timestamptz not null default now()
);

alter table public.votes enable row level security;

-- Visitors can add a vote, but can't read, change or delete anyone's vote.
drop policy if exists "anyone can vote" on public.votes;
create policy "anyone can vote" on public.votes
  for insert to anon with check (true);

-- Totals only, never individual rows.
create or replace function public.vote_counts()
returns table (persona text, votes bigint)
language sql
security definer
set search_path = public
as $$
  select persona, count(*)::bigint from public.votes group by persona;
$$;

revoke all on function public.vote_counts() from public;
grant execute on function public.vote_counts() to anon;

-- To reset the vote before the expo starts, run:
--   truncate public.votes;
