-- Adds mobile (Expo) push support alongside the existing web-push subscriptions.
-- Run this once against the Supabase project used by both web/ and expo-app/.

alter table public.push_subscriptions
  add column if not exists platform text not null default 'web';

-- Replace whatever unique constraint currently exists on (user_id) alone
-- with one on (user_id, platform), so a user can have both a browser
-- subscription and an Expo push token at the same time.
do $$
declare
  existing_constraint text;
begin
  select con.conname into existing_constraint
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'push_subscriptions'
    and con.contype = 'u'
    and con.conkey = (
      select array_agg(attnum order by attnum)
      from pg_attribute
      where attrelid = rel.oid and attname = 'user_id'
    )
  limit 1;

  if existing_constraint is not null then
    execute format('alter table public.push_subscriptions drop constraint %I', existing_constraint);
  end if;
end $$;

alter table public.push_subscriptions
  add constraint push_subscriptions_user_id_platform_key unique (user_id, platform);
