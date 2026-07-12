-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).

-- 1. Users table (skip if it already exists in your project).
create table if not exists public.users (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null unique,
  password text not null,
  created_at timestamptz not null default now()
);

-- 2. Sample/demo account.
-- Email:    demo@stockroom.dev
-- Password: Demo123!
-- The value below is the bcrypt hash of "Demo123!" (10 salt rounds) —
-- generated with bcryptjs so it verifies correctly against the API's
-- bcrypt.compare() call. Do not replace this with plain text.
insert into public.users (name, email, password)
values (
  'Demo User',
  'demo@stockroom.dev',
  '$2b$10$GOinF0o3qP3upSHNM8gC1.MLn8f6RpcmO00Sxorc5aXf4iTOihPve'
)
on conflict (email) do nothing;
