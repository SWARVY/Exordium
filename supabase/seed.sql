-- ================================================================
-- Exordium — seed data
--
-- Run this after applying 001-schema.sql.
-- Replace placeholder values with your actual information.
-- ================================================================

-- ── owner_profile ───────────────────────────────────────────────
insert into public.owner_profile (name, bio, github_url)
values (
  'Your Name',
  'Developer & open source enthusiast.',
  'https://github.com/yourusername'
)
on conflict do nothing;

-- ── site_config ─────────────────────────────────────────────────
insert into public.site_config (key, value) values
  ('posts_subtitle',       '개발하며 배운 것들, 생각한 것들을 기록합니다.'),
  ('open_source_subtitle', '직접 만들고 관리하는 오픈소스 프로젝트들입니다.')
on conflict (key) do nothing;
