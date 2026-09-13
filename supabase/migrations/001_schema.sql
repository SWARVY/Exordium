-- ================================================================
-- Exordium — complete schema
--
-- Setup checklist (run once after applying this migration):
--   1. Supabase Dashboard → Authentication → Users → [your account]
--      → Edit → app_metadata → add {"role": "owner"} → Save
--   2. Run seed.sql to insert the initial owner profile
-- ================================================================

-- UUID helper
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────────
-- Helper: is_owner()
--   Returns true when the caller's JWT carries app_metadata.role = 'owner'
-- ────────────────────────────────────────────────────────────────
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'owner'
$$;

-- ================================================================
-- Tables
-- ================================================================

-- ── owner_profile ───────────────────────────────────────────────
create table if not exists public.owner_profile (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  bio         text not null default '',
  avatar_url  text,
  github_url  text,
  twitter_url text,
  website_url text,
  skills      text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── posts ───────────────────────────────────────────────────────
create table if not exists public.posts (
  id           uuid primary key default uuid_generate_v4(),
  slug         text not null unique,
  title        text not null,
  description  text not null default '',
  content      text not null default '',
  cover_image  text,
  tags         text[] not null default '{}',
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists posts_published_at_idx on public.posts (published_at desc);
create index if not exists posts_slug_idx         on public.posts (slug);

-- ── comments (max 1-depth reply) ────────────────────────────────
create table if not exists public.comments (
  id                uuid primary key default uuid_generate_v4(),
  post_id           uuid not null references public.posts    (id) on delete cascade,
  parent_id         uuid          references public.comments (id) on delete cascade,
  author_id         uuid not null references auth.users      (id) on delete cascade,
  author_name       text not null,
  author_avatar_url text,
  content           text not null check (char_length(content) between 1 and 1000),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists comments_post_id_idx   on public.comments (post_id);
create index if not exists comments_parent_id_idx on public.comments (parent_id);

-- Enforce max 1-depth (check constraints cannot use subqueries)
create or replace function public.check_comment_depth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.parent_id is not null then
    if (select parent_id from public.comments where id = new.parent_id) is not null then
      raise exception 'Comments can only be 1 level deep';
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_comment_depth
  before insert on public.comments
  for each row execute function public.check_comment_depth();

-- ── open_source ─────────────────────────────────────────────────
create table if not exists public.open_source (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text not null,
  repo_url    text not null,
  language    text,
  "order"     integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists open_source_order_idx on public.open_source ("order");

-- ── post_reactions ──────────────────────────────────────────────
create table if not exists public.post_reactions (
  id         uuid primary key default uuid_generate_v4(),
  post_id    uuid not null references public.posts     (id) on delete cascade,
  user_id    uuid not null references auth.users       (id) on delete cascade,
  emoji      text not null check (emoji in ('👍', '❤️', '🔥', '💡', '😮')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id, emoji)
);

create index if not exists post_reactions_post_id_idx on public.post_reactions (post_id);

-- ── comment_reactions ───────────────────────────────────────────
create table if not exists public.comment_reactions (
  id         uuid primary key default uuid_generate_v4(),
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id    uuid not null references auth.users      (id) on delete cascade,
  emoji      text not null check (emoji in ('👍', '❤️', '🔥', '💡', '😮')),
  created_at timestamptz not null default now(),
  unique (comment_id, user_id, emoji)
);

create index if not exists comment_reactions_comment_id_idx on public.comment_reactions (comment_id);

-- ── site_config ─────────────────────────────────────────────────
create table if not exists public.site_config (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

-- ================================================================
-- Row Level Security
-- ================================================================

alter table public.owner_profile    enable row level security;
alter table public.posts            enable row level security;
alter table public.comments         enable row level security;
alter table public.open_source      enable row level security;
alter table public.post_reactions   enable row level security;
alter table public.comment_reactions enable row level security;
alter table public.site_config      enable row level security;

-- ── owner_profile ───────────────────────────────────────────────
create policy "owner_profile: public read"
  on public.owner_profile for select
  using (true);

create policy "owner_profile: owner update"
  on public.owner_profile for update
  using (public.is_owner());

-- ── posts ───────────────────────────────────────────────────────
-- Visitors see published posts; owner sees all (including drafts)
create policy "posts: public read"
  on public.posts for select
  using (published_at is not null or public.is_owner());

create policy "posts: owner insert"
  on public.posts for insert
  with check (public.is_owner());

create policy "posts: owner update"
  on public.posts for update
  using (public.is_owner());

create policy "posts: owner delete"
  on public.posts for delete
  using (public.is_owner());

-- ── comments ────────────────────────────────────────────────────
create policy "comments: public read"
  on public.comments for select
  using (true);

create policy "comments: authenticated insert"
  on public.comments for insert
  with check (auth.uid() = author_id);

-- Authors can delete their own; owner can delete any
create policy "comments: author or owner delete"
  on public.comments for delete
  using (auth.uid() = author_id or public.is_owner());

-- ── open_source ─────────────────────────────────────────────────
create policy "open_source: public read"
  on public.open_source for select
  using (true);

create policy "open_source: owner insert"
  on public.open_source for insert
  with check (public.is_owner());

create policy "open_source: owner update"
  on public.open_source for update
  using (public.is_owner());

create policy "open_source: owner delete"
  on public.open_source for delete
  using (public.is_owner());

-- ── post_reactions ──────────────────────────────────────────────
create policy "post_reactions: public read"
  on public.post_reactions for select
  using (true);

create policy "post_reactions: authenticated insert"
  on public.post_reactions for insert
  with check (auth.uid() = user_id);

create policy "post_reactions: own delete"
  on public.post_reactions for delete
  using (auth.uid() = user_id);

-- ── comment_reactions ───────────────────────────────────────────
create policy "comment_reactions: public read"
  on public.comment_reactions for select
  using (true);

create policy "comment_reactions: authenticated insert"
  on public.comment_reactions for insert
  with check (auth.uid() = user_id);

create policy "comment_reactions: own delete"
  on public.comment_reactions for delete
  using (auth.uid() = user_id);

-- ── site_config ─────────────────────────────────────────────────
create policy "site_config: public read"
  on public.site_config for select
  using (true);

create policy "site_config: owner update"
  on public.site_config for update
  using (public.is_owner());

-- ================================================================
-- Storage buckets
-- ================================================================

-- ── avatars ─────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars: owner insert"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and public.is_owner());

create policy "avatars: owner update"
  on storage.objects for update
  using (bucket_id = 'avatars' and public.is_owner());

create policy "avatars: owner delete"
  on storage.objects for delete
  using (bucket_id = 'avatars' and public.is_owner());

-- ── post-images ─────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "post-images: public read"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "post-images: owner insert"
  on storage.objects for insert
  with check (bucket_id = 'post-images' and public.is_owner());

create policy "post-images: owner delete"
  on storage.objects for delete
  using (bucket_id = 'post-images' and public.is_owner());
