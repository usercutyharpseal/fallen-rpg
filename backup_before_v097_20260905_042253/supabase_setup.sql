-- 몰락자 v0.9 영구 랭킹 테이블
-- Supabase Dashboard > SQL Editor 에서 한 번만 실행하세요.

create table if not exists public.fallen_scores (
  player_id text primary key,
  nickname text not null default '익명',
  class_name text not null default '?',
  ending text not null default 'BAD END',
  score bigint not null default 0,
  kills integer not null default 0,
  gold integer not null default 0,
  progress integer not null default 0,
  stats jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists fallen_scores_score_idx
  on public.fallen_scores (score desc, updated_at asc);

alter table public.fallen_scores enable row level security;

-- 클라이언트에서 직접 읽거나 쓰지 않습니다.
-- 게임 서버의 service_role 키만 사용하므로 별도 public policy는 만들지 않습니다.
