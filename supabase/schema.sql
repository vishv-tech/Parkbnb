create extension if not exists "pgcrypto";

do $$
begin
  create type user_type as enum ('OWNER', 'SEEKER');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type availability_status as enum ('VACANT', 'OCCUPIED');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type listing_status as enum ('LIVE', 'TAKEN_DOWN');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type availability_type as enum ('ALWAYS', 'DAILY', 'ONE_TIME');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type payment_status as enum ('PENDING', 'PAID', 'FAILED');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type booking_status as enum ('ACTIVE', 'COMPLETED', 'CANCELLED');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type issue_report_status as enum ('PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type notification_type as enum ('OVERSTAY_WARNING');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type payout_status as enum ('PENDING', 'PAID');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  contact_number text not null,
  password_hash text not null,
  user_type user_type not null,
  upi_id text,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users
  add column if not exists upi_id text;

create table if not exists public.parking_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  owner_full_name text not null,
  owner_contact_number text not null,
  building_address text not null,
  parking_address_details text not null,
  parking_floor text not null,
  parking_directions text not null,
  image_url text not null,
  latitude double precision not null,
  longitude double precision not null,
  price_one_hour numeric(10, 2) not null check (price_one_hour >= 0),
  price_twenty_four_hours numeric(10, 2) not null check (price_twenty_four_hours >= 0),
  custom_duration_label text not null,
  custom_duration_price numeric(10, 2) not null check (custom_duration_price >= 0),
  availability_status availability_status not null default 'VACANT',
  listing_status listing_status not null default 'LIVE',
  availability_type availability_type not null default 'ALWAYS',
  available_days text[] not null default '{}',
  daily_start_time time,
  daily_end_time time,
  one_time_start_date date,
  one_time_start_time time,
  one_time_end_date date,
  one_time_end_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.parking_listings
  add column if not exists availability_type availability_type not null default 'ALWAYS',
  add column if not exists available_days text[] not null default '{}',
  add column if not exists daily_start_time time,
  add column if not exists daily_end_time time,
  add column if not exists one_time_start_date date,
  add column if not exists one_time_start_time time,
  add column if not exists one_time_end_date date,
  add column if not exists one_time_end_time time;

create table if not exists public.seeker_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  name text not null,
  contact_number text not null,
  car_model text not null,
  car_number text not null,
  current_latitude double precision,
  current_longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  seeker_id uuid not null references public.seeker_profiles(id) on delete cascade,
  owner_id uuid not null references public.users(id) on delete cascade,
  parking_listing_id uuid not null references public.parking_listings(id) on delete cascade,
  seeker_name text not null,
  seeker_contact text not null,
  car_model text not null,
  car_number text not null,
  selected_duration text not null,
  selected_price numeric(10, 2) not null check (selected_price >= 0),
  platform_fee_amount numeric(10, 2) not null default 0 check (platform_fee_amount >= 0),
  total_amount numeric(10, 2) not null default 0 check (total_amount >= 0),
  booking_start_time timestamptz,
  booking_end_time timestamptz,
  payment_status payment_status not null default 'PENDING',
  booking_status booking_status not null default 'ACTIVE',
  exact_location_unlocked boolean not null default false,
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookings
  add column if not exists platform_fee_amount numeric(10, 2) not null default 0 check (platform_fee_amount >= 0),
  add column if not exists total_amount numeric(10, 2) not null default 0 check (total_amount >= 0),
  add column if not exists booking_start_time timestamptz,
  add column if not exists booking_end_time timestamptz;

create table if not exists public.issue_reports (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  listing_id uuid not null references public.parking_listings(id) on delete cascade,
  owner_id uuid not null references public.users(id) on delete cascade,
  seeker_id uuid not null references public.seeker_profiles(id) on delete cascade,
  issue_type text not null,
  message text not null default '',
  status issue_report_status not null default 'PENDING',
  owner_name text not null,
  owner_contact text not null,
  seeker_name text not null,
  seeker_contact text not null,
  car_model text not null,
  car_number text not null,
  listing_address text not null,
  booking_start_time timestamptz,
  booking_end_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  type notification_type not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.owner_monthly_earnings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  month integer not null check (month between 1 and 12),
  year integer not null check (year >= 2000),
  total_earning numeric(10, 2) not null default 0 check (total_earning >= 0),
  gross_booking_amount numeric(10, 2) not null default 0 check (gross_booking_amount >= 0),
  platform_fee_amount numeric(10, 2) not null default 0 check (platform_fee_amount >= 0),
  paid_booking_count integer not null default 0 check (paid_booking_count >= 0),
  upi_id text,
  payout_status payout_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, month, year)
);

create index if not exists users_email_idx on public.users(email);
create index if not exists parking_listings_owner_idx on public.parking_listings(owner_id);
create index if not exists parking_listings_search_idx on public.parking_listings(listing_status, availability_status);
create index if not exists bookings_owner_idx on public.bookings(owner_id);
create index if not exists bookings_seeker_idx on public.bookings(seeker_id);
create index if not exists bookings_listing_idx on public.bookings(parking_listing_id);
create index if not exists bookings_expiry_idx on public.bookings(booking_status, booking_end_time);
create index if not exists issue_reports_status_idx on public.issue_reports(status);
create index if not exists issue_reports_booking_idx on public.issue_reports(booking_id);
create index if not exists notifications_user_idx on public.notifications(user_id, is_read);
create index if not exists owner_monthly_earnings_owner_idx on public.owner_monthly_earnings(owner_id, year, month);
create index if not exists owner_monthly_earnings_payout_idx on public.owner_monthly_earnings(payout_status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_parking_listings_updated_at on public.parking_listings;
create trigger set_parking_listings_updated_at
before update on public.parking_listings
for each row execute function public.set_updated_at();

drop trigger if exists set_seeker_profiles_updated_at on public.seeker_profiles;
create trigger set_seeker_profiles_updated_at
before update on public.seeker_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_bookings_updated_at on public.bookings;
create trigger set_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

drop trigger if exists set_issue_reports_updated_at on public.issue_reports;
create trigger set_issue_reports_updated_at
before update on public.issue_reports
for each row execute function public.set_updated_at();

drop trigger if exists set_owner_monthly_earnings_updated_at on public.owner_monthly_earnings;
create trigger set_owner_monthly_earnings_updated_at
before update on public.owner_monthly_earnings
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.parking_listings enable row level security;
alter table public.seeker_profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.issue_reports enable row level security;
alter table public.notifications enable row level security;
alter table public.owner_monthly_earnings enable row level security;

insert into storage.buckets (id, name, public)
values ('parking-images', 'parking-images', true)
on conflict (id) do nothing;

do $$
begin
  create policy "Public parking image read"
  on storage.objects for select
  using (bucket_id = 'parking-images');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Service role parking image write"
  on storage.objects for all
  using (bucket_id = 'parking-images' and auth.role() = 'service_role')
  with check (bucket_id = 'parking-images' and auth.role() = 'service_role');
exception
  when duplicate_object then null;
end $$;
