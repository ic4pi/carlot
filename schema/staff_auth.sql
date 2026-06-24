-- Run once in Supabase SQL Editor (Dashboard → SQL → New query)
-- Stores staff password hashes. Only the server API should access this table.

create table if not exists staff_auth (
  role text primary key check (role in ('admin', 'staff')),
  password_hash text not null,
  updated_at timestamptz default now()
);

alter table staff_auth enable row level security;

-- Block all direct client access; API uses SUPABASE_SERVICE_ROLE_KEY
-- (No policies = anon/authenticated users cannot read or write)
