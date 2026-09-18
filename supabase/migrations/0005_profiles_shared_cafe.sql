-- ============================================================
-- 0005_profiles_shared_cafe.sql — members can see names/emails of people in the same café
-- ============================================================
create or replace function public.shares_cafe_with(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.cafe_members mine
    join public.cafe_members theirs on theirs.cafe_id = mine.cafe_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = p_user
  )
$$;
revoke execute on function public.shares_cafe_with(uuid) from public, anon;
grant execute on function public.shares_cafe_with(uuid) to authenticated;

drop policy profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_staff() or public.shares_cafe_with(id));
