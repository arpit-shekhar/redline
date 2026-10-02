-- The library: documents a signed-in person has had analysed.
--
-- Each row holds the exact text that was analysed and the analysis Redline
-- returned for it, as JSON. Deleting a row removes both. Rows are never
-- edited, so there is no update rule.
--
-- Row level security (rules the database checks on every row) is on: a
-- signed-in person can read, add and delete only rows whose user_id is their
-- own id. Visitors who are not signed in can do nothing with this table.

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  document_type text not null
    check (document_type in ('contract', 'lease', 'freelance-agreement', 'terms-of-service')),
  -- The first line of the text, cut short, so the library list can show it
  -- without reading the whole text.
  opening text not null default '',
  text text not null,
  analysis jsonb not null
    check (analysis ->> 'outcome' in ('flagged', 'clean', 'withheld')),
  analysed_at timestamptz not null default now()
);

comment on table public.documents is
  'Analysed documents in each person''s library. Text and analysis are removed together when a row is deleted.';

-- The library lists one person's documents, newest first.
create index documents_user_id_analysed_at_idx
  on public.documents (user_id, analysed_at desc);

alter table public.documents enable row level security;

create policy "People can read their own documents"
  on public.documents for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "People can add documents to their own library"
  on public.documents for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "People can delete their own documents"
  on public.documents for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Supabase grants every table to both roles by default. Visitors who are not
-- signed in get no access at all, and signed-in people get only the three
-- actions the rules above cover.
revoke all on table public.documents from anon;
revoke all on table public.documents from authenticated;
grant select, insert, delete on table public.documents to authenticated;
