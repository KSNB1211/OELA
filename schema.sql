-- OELA Supabase database schema
-- Supabase SQL Editor에서 전체를 그대로 실행하세요.

create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  short_name text not null default 'OELA',
  full_name text not null default 'Our E-sport League Association',
  homepage_title text not null default 'OUR E-SPORT LEAGUE ASSOCIATION',
  current_season text not null default '2025–26',
  homepage_description text not null default 'OELA가 주관하는 대회의 공식 선수 기록과 규정을 한곳에서 확인하세요.',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.competitions (
  id text primary key,
  code text not null unique,
  name text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  competition_id text not null references public.competitions(id) on delete cascade,
  season_name text not null,
  created_at timestamptz not null default now(),
  unique (competition_id, season_name)
);

create table if not exists public.player_records (
  id uuid primary key default gen_random_uuid(),
  competition_id text not null references public.competitions(id) on delete cascade,
  season_name text not null,
  player_name text not null,
  team_name text not null,
  goals integer not null default 0 check (goals >= 0),
  assists integer not null default 0 check (assists >= 0),
  yellow_cards integer not null default 0 check (yellow_cards >= 0),
  red_cards integer not null default 0 check (red_cards >= 0),
  updated_at timestamptz not null default now(),
  unique (competition_id, season_name, player_name)
);

create table if not exists public.regulations (
  id uuid primary key default gen_random_uuid(),
  competition_id text not null references public.competitions(id) on delete cascade,
  season_name text not null,
  title text not null,
  body text not null,
  display_order integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (competition_id, season_name, title)
);

insert into public.competitions (id, code, name, display_order) values
('fpl','FPL','FC Mobile Premier League',1),
('ktl','KTL','Korea Tournament League',2),
('super','SUPER-CUP','Super-Cup',3),
('fecl','FECL','Football e-sport Champions League',4),
('fel','FEL','Football e-sport Elite League',5)
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  display_order = excluded.display_order;

insert into public.seasons (competition_id, season_name)
select id, '2025–26' from public.competitions
on conflict (competition_id, season_name) do nothing;

insert into public.player_records
  (competition_id, season_name, player_name, team_name, goals, assists, yellow_cards, red_cards)
values
('fpl','2025–26','Henry','KSNB',7,3,0,0),
('fpl','2025–26','Ødegaard','KSNB',2,5,0,0),
('fpl','2025–26','Saka','KSNB',4,4,1,0)
on conflict (competition_id, season_name, player_name) do nothing;

insert into public.regulations
  (competition_id, season_name, title, body, display_order)
values
('fpl','2025–26','제1장 총칙','제1조 목적
이 규정은 FPL의 공정하고 원활한 운영을 위하여 필요한 사항을 정함을 목적으로 한다.',1),
('fpl','2025–26','제2장 참가 자격','제4조 참가 자격
대회의 참가 자격은 OELA가 정한 공식 참가 자격 규정에 따른다.',2),
('fpl','2025–26','제3장 대회 운영','제7조 경기 운영
경기 일정과 결과는 OELA가 지정한 공식 경기 기록 시스템을 따른다.',3)
on conflict (competition_id, season_name, title) do nothing;

-- 공개 열람 정책
alter table public.site_settings enable row level security;
alter table public.competitions enable row level security;
alter table public.seasons enable row level security;
alter table public.player_records enable row level security;
alter table public.regulations enable row level security;

drop policy if exists "public read site settings" on public.site_settings;
create policy "public read site settings"
on public.site_settings for select
to anon, authenticated
using (true);

drop policy if exists "public read competitions" on public.competitions;
create policy "public read competitions"
on public.competitions for select
to anon, authenticated
using (true);

drop policy if exists "public read seasons" on public.seasons;
create policy "public read seasons"
on public.seasons for select
to anon, authenticated
using (true);

drop policy if exists "public read records" on public.player_records;
create policy "public read records"
on public.player_records for select
to anon, authenticated
using (true);

drop policy if exists "public read regulations" on public.regulations;
create policy "public read regulations"
on public.regulations for select
to anon, authenticated
using (true);

-- 관리자 쓰기 정책
-- 실제 관리자 이메일은 아래 함수의 is_admin()에 등록하세요.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from auth.users
    where id = auth.uid()
      and email in ('ADMIN_EMAIL_HERE')
  );
$$;

drop policy if exists "admin write site settings" on public.site_settings;
create policy "admin write site settings"
on public.site_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin write competitions" on public.competitions;
create policy "admin write competitions"
on public.competitions for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin write seasons" on public.seasons;
create policy "admin write seasons"
on public.seasons for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin write records" on public.player_records;
create policy "admin write records"
on public.player_records for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin write regulations" on public.regulations;
create policy "admin write regulations"
on public.regulations for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
