-- Run this in the Supabase SQL editor (Dashboard -> SQL editor -> New query).
-- Creates a `posts` table with row-level security: anyone signed in can read,
-- users can only insert as themselves, and only delete/update their own posts.

create table if not exists public.posts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    author_email text,
    content text not null check (char_length(content) between 1 and 280),
    created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);

alter table public.posts enable row level security;

drop policy if exists "posts are readable by authenticated users" on public.posts;
create policy "posts are readable by authenticated users"
    on public.posts for select
    to authenticated
    using (true);

drop policy if exists "users can insert their own posts" on public.posts;
create policy "users can insert their own posts"
    on public.posts for insert
    to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "users can update their own posts" on public.posts;
create policy "users can update their own posts"
    on public.posts for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "users can delete their own posts" on public.posts;
create policy "users can delete their own posts"
    on public.posts for delete
    to authenticated
    using (auth.uid() = user_id);
