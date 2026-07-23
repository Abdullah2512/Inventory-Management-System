-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).

create table if not exists public.users (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null unique,
  password text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id bigint generated always as identity primary key,
  name text not null,
  category text not null,
  price numeric not null default 0 check (price >= 0),
  quantity integer not null default 0 check (quantity >= 0),
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.products
  add column if not exists image_url text;

insert into public.users (name, email, password)
values (
  'Demo User',
  'demo@stockroom.dev',
  '$2b$10$GOinF0o3qP3upSHNM8gC1.MLn8f6RpcmO00Sxorc5aXf4iTOihPve'
)
on conflict (email) do nothing;
