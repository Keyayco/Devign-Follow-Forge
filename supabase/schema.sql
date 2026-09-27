-- Contractor Lead-to-Cash Supabase setup
-- Run in Supabase SQL editor for a standalone repo, or compare with src/db/schema.ts when using App Builder push.

create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  name text not null,
  logo_path text,
  phone text,
  whatsapp text,
  email text,
  address text,
  service_area text,
  services text,
  hours text,
  description text,
  vat_rate numeric not null default 15,
  default_terms text,
  public_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null, phone text, whatsapp text, email text, address text, notes text,
  photo_paths jsonb not null default '[]'::jsonb, archived boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null, customer_name text not null,
  phone text, whatsapp text, email text, job_type text, description text, location text,
  estimated_value numeric default 0, source text, notes text, photo_paths jsonb not null default '[]'::jsonb,
  status text not null default 'New', archived boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null, lead_id uuid references public.leads(id) on delete set null,
  quote_number text not null, issue_date date not null default current_date, expiry_date date,
  description text, discount numeric not null default 0, vat_enabled boolean not null default false,
  vat_rate numeric not null default 15, deposit numeric not null default 0, notes text, terms text,
  status text not null default 'Draft', subtotal numeric not null default 0, vat_amount numeric not null default 0,
  total numeric not null default 0, balance numeric not null default 0, archived boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade, description text not null,
  quantity numeric not null default 1, unit_price numeric not null default 0, sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete cascade, customer_id uuid references public.customers(id) on delete set null,
  due_date date not null, status text not null default 'Follow-up Due', result text not null default 'Waiting', notes text,
  archived boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete set null, customer_id uuid references public.customers(id) on delete set null,
  address text, description text not null, job_date date, job_time time, worker text, notes text,
  photo_paths jsonb not null default '[]'::jsonb, status text not null default 'Booked', archived boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null, quote_id uuid references public.quotes(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null, amount numeric not null default 0,
  deposit numeric not null default 0, amount_paid numeric not null default 0, balance numeric not null default 0,
  status text not null default 'Unpaid', payment_date date, method text, payment_link text, notes text,
  archived boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  type text not null, title text not null default '', body text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (business_id, type)
);
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  entity_type text not null, entity_id uuid, action text not null, note text, created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists businesses_owner_idx on public.businesses(owner_id);
create index if not exists business_members_user_idx on public.business_members(user_id);
create index if not exists customers_business_idx on public.customers(business_id);
create index if not exists leads_business_status_idx on public.leads(business_id,status);
create index if not exists quotes_business_status_idx on public.quotes(business_id,status);
create index if not exists quote_items_quote_idx on public.quote_items(quote_id);
create index if not exists followups_business_due_idx on public.follow_ups(business_id,due_date);
create index if not exists jobs_business_date_idx on public.jobs(business_id,job_date);
create index if not exists payments_business_status_idx on public.payments(business_id,status);
create index if not exists activity_business_entity_idx on public.activity_logs(business_id,entity_type,entity_id);

create or replace function public.is_business_member(p_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.business_members bm where bm.business_id = p_business_id and bm.user_id = auth.uid())
$$;

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.customers enable row level security;
alter table public.leads enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.follow_ups enable row level security;
alter table public.jobs enable row level security;
alter table public.payments enable row level security;
alter table public.message_templates enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists businesses_member_select on public.businesses;
create policy businesses_member_select on public.businesses for select using (public_enabled = true or public.is_business_member(id) or owner_id = auth.uid());
drop policy if exists businesses_owner_insert on public.businesses;
create policy businesses_owner_insert on public.businesses for insert with check (owner_id = auth.uid());
drop policy if exists businesses_member_update on public.businesses;
create policy businesses_member_update on public.businesses for update using (public.is_business_member(id) or owner_id = auth.uid()) with check (public.is_business_member(id) or owner_id = auth.uid());

drop policy if exists members_self_select on public.business_members;
create policy members_self_select on public.business_members for select using (user_id = auth.uid() or public.is_business_member(business_id));
drop policy if exists members_owner_insert on public.business_members;
create policy members_owner_insert on public.business_members for insert with check (user_id = auth.uid() or public.is_business_member(business_id));

do $$ declare t text; begin
  foreach t in array array['customers','leads','quotes','quote_items','follow_ups','jobs','payments','message_templates','activity_logs'] loop
    execute format('drop policy if exists %I_member_all on public.%I', t, t);
    execute format('create policy %I_member_all on public.%I for all using (public.is_business_member(business_id)) with check (public.is_business_member(business_id))', t, t);
  end loop;
end $$;

insert into storage.buckets (id, name, public) values ('business-files', 'business-files', false) on conflict (id) do nothing;

drop policy if exists business_files_member_read on storage.objects;
create policy business_files_member_read on storage.objects for select using (
  bucket_id = 'business-files' and public.is_business_member((storage.foldername(name))[1]::uuid)
);
drop policy if exists business_files_member_write on storage.objects;
create policy business_files_member_write on storage.objects for insert with check (
  bucket_id = 'business-files' and public.is_business_member((storage.foldername(name))[1]::uuid)
);
drop policy if exists business_files_member_update on storage.objects;
create policy business_files_member_update on storage.objects for update using (
  bucket_id = 'business-files' and public.is_business_member((storage.foldername(name))[1]::uuid)
) with check (bucket_id = 'business-files' and public.is_business_member((storage.foldername(name))[1]::uuid));
