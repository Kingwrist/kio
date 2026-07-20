create table if not exists public.route_cache (
  route_id text primary key,
  route_name text not null,
  status text not null check (status in ('groen', 'oranje', 'rood', 'onbekend')),
  delay_minutes integer,
  travel_time_minutes integer,
  free_flow_minutes integer,
  average_speed integer,
  updated_at timestamptz not null default now()
);

alter table public.route_cache enable row level security;

-- De app leest en schrijft uitsluitend server-side met SUPABASE_SECRET_KEY.
-- Er is daarom bewust geen publieke insert/update-policy nodig.
create policy "Public may read route cache"
on public.route_cache
for select
to anon, authenticated
using (true);

create index if not exists route_cache_updated_at_idx
on public.route_cache (updated_at desc);
