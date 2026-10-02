-- Fills the one gap found when the access rules were reviewed for ticket 09.
--
-- Every table should have a rule for each of the four actions (read, add,
-- change, delete) that limits it to the signed-in person's own rows.
-- public.red_lines already has all four. public.documents had no rule for
-- changing a row, because Redline never changes a saved document: it adds one
-- or deletes it.
--
-- This adds that rule, limited to the person's own rows. It does not let
-- anyone change a document. The first migration took the right to change
-- rows in this table away from everyone, and this file leaves that alone.
-- The rule is here so that if that right is ever given back, a person can
-- still change only their own documents, and cannot move a document into
-- someone else's library.

create policy "People can change only their own documents"
  on public.documents for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
