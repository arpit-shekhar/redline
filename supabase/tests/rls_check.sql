-- Access rules check. Run this in the Supabase SQL editor after applying
-- every file in supabase/migrations/. It changes nothing.
--
-- Row level security (RLS) is a switch on each table that makes the
-- database check a rule for every row a person reads, adds, changes or
-- deletes. Redline relies on it so that each person sees only their own
-- documents, red lines and leverage.
--
-- The result has one row per table in the public schema. Every column should
-- read true, except anyone_signed_out_can_read, which should read false. The
-- last column says "ok" or names the first problem it found.

with tables as (
  select c.relname as table_name, c.relrowsecurity as rls_on
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p')
),
rules as (
  select tablename, cmd, coalesce(qual, '') || ' ' || coalesce(with_check, '') as condition
  from pg_policies
  where schemaname = 'public'
),
checked as (
  select
    t.table_name,
    t.rls_on,
    exists (select 1 from rules r where r.tablename = t.table_name and r.cmd in ('SELECT', 'ALL')) as has_read_rule,
    exists (select 1 from rules r where r.tablename = t.table_name and r.cmd in ('INSERT', 'ALL')) as has_add_rule,
    exists (select 1 from rules r where r.tablename = t.table_name and r.cmd in ('UPDATE', 'ALL')) as has_change_rule,
    exists (select 1 from rules r where r.tablename = t.table_name and r.cmd in ('DELETE', 'ALL')) as has_delete_rule,
    -- Each rule compares the signed-in person's id with the row's user_id.
    not exists (
      select 1 from rules r
      where r.tablename = t.table_name
        and not (r.condition like '%auth.uid()%' and r.condition like '%user_id%')
    ) as every_rule_checks_owner,
    has_table_privilege('anon', format('public.%I', t.table_name), 'select') as anyone_signed_out_can_read
  from tables t
)
select
  *,
  case
    when not rls_on then 'RLS is off'
    when not has_read_rule then 'no rule for reading'
    when not has_add_rule then 'no rule for adding'
    when not has_change_rule then 'no rule for changing'
    when not has_delete_rule then 'no rule for deleting'
    when not every_rule_checks_owner then 'a rule does not check the owner'
    when anyone_signed_out_can_read then 'signed-out visitors can read it'
    else 'ok'
  end as verdict
from checked
order by table_name;
