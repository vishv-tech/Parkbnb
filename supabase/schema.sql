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

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  contact_number text not null,
  password_hash text not null,
  user_type user_type not null,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  payment_status payment_status not null default 'PENDING',
  booking_status booking_status not null default 'ACTIVE',
  exact_location_unlocked boolean not null default false,
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users(email);
create index if not exists parking_listings_owner_idx on public.parking_listings(owner_id);
create index if not exists parking_listings_search_idx on public.parking_listings(listing_status, availability_status);
create index if not exists bookings_owner_idx on public.bookings(owner_id);
create index if not exists bookings_seeker_idx on public.bookings(seeker_id);
create index if not exists bookings_listing_idx on public.bookings(parking_listing_id);

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

alter table public.users enable row level security;
alter table public.parking_listings enable row level security;
alter table public.seeker_profiles enable row level security;
alter table public.bookings enable row level security;

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
