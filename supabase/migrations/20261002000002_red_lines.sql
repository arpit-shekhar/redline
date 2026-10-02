-- Red lines and leverage: one row per signed-in person.
--
-- A red line is a rule the person sets in advance about what they will not
-- accept. The row holds the eight default clause types as the person set
-- them (switched on or off, and the severity their flags start from), the
-- red lines they wrote in their own words, and their leverage: whether they
-- can walk away from deals like this (ADR 0005 keeps leverage with the red
-- lines). Every save replaces the whole row.
--
-- Row level security (rules the database checks on every row) is on: a
-- signed-in person can read, add, change and delete only the row whose
-- user_id is their own id. Visitors who are not signed in can do nothing
-- with this table.

create table public.red_lines (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  -- The eight defaults, each as {"clauseType", "severity", "enabled"}.
  defaults jsonb not null default '[]'::jsonb
    check (jsonb_typeof(defaults) = 'array'),
  -- The person's own red lines, each as {"id", "words", "severity"}.
  own jsonb not null default '[]'::jsonb
    check (jsonb_typeof(own) = 'array' and jsonb_array_length(own) <= 20),
  -- Null until the person answers the leverage question.
  leverage text
    check (leverage in ('can-walk-away', 'cannot-walk-away')),
  updated_at timestamptz not null default now()
);

comment on table public.red_lines is
  'Each person''s red lines and leverage. One row per person, replaced whole on every save.';

alter table public.red_lines enable row level security;

create policy "People can read their own red lines"
  on public.red_lines for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "People can add their own red lines"
  on public.red_lines for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- A save replaces the row. The person must own it before and after.
create policy "People can change their own red lines"
  on public.red_lines for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "People can delete their own red lines"
  on public.red_lines for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Supabase grants every table to both roles by default. Visitors who are not
-- signed in get no access at all, and signed-in people get only the four
-- actions the rules above cover.
revoke all on table public.red_lines from anon;
revoke all on table public.red_lines from authenticated;
grant select, insert, update, delete on table public.red_lines to authenticated;
