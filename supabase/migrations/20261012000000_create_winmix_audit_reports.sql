create table if not exists public.winmix_audit_reports (
  report_key text primary key check (report_key = 'latest'),
  report jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.winmix_audit_reports enable row level security;

drop policy if exists "public can read latest audit" on public.winmix_audit_reports;
create policy "public can read latest audit"
  on public.winmix_audit_reports for select
  to anon, authenticated
  using (report_key = 'latest');

drop policy if exists "public can save latest audit" on public.winmix_audit_reports;
create policy "public can save latest audit"
  on public.winmix_audit_reports for insert
  to anon, authenticated
  with check (report_key = 'latest');

drop policy if exists "public can update latest audit" on public.winmix_audit_reports;
create policy "public can update latest audit"
  on public.winmix_audit_reports for update
  to anon, authenticated
  using (report_key = 'latest')
  with check (report_key = 'latest');

grant select, insert, update on public.winmix_audit_reports to anon, authenticated;

create index if not exists winmix_audit_reports_updated_at_idx
  on public.winmix_audit_reports (updated_at desc);

comment on table public.winmix_audit_reports is 'The latest complete historical audit report used to hydrate the read-only UI.';
