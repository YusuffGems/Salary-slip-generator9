-- ============================================================
-- Salary Slip Generator — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL editor.
-- (If you use `prisma db push`, you don't need to run this file —
--  it's provided as a reference / manual-setup alternative.)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- ENUM TYPES ----------
do $$ begin
  create type payroll_status as enum ('GENERATED', 'PARTIALLY_SENT', 'SENT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type email_status as enum ('PENDING', 'SENT', 'FAILED');
exception when duplicate_object then null; end $$;

-- ---------- EMPLOYEES ----------
create table if not exists employees (
  id                text primary key default gen_random_uuid()::text,
  employee_code     text unique not null,
  name              text not null,
  email             text not null,
  phone             text,
  department        text,
  designation       text,
  date_of_joining   timestamptz,
  bank_name         text,
  account_number    text,
  ifsc_code         text,
  pan_number        text,
  uan_number        text,

  basic_salary      numeric(12,2) not null default 0,
  hra               numeric(12,2) not null default 0,
  medical_allowance numeric(12,2) not null default 0,
  travel_allowance  numeric(12,2) not null default 0,
  special_allowance numeric(12,2) not null default 0,
  bonus             numeric(12,2) not null default 0,

  pf                numeric(12,2) not null default 0,
  esi               numeric(12,2) not null default 0,
  professional_tax  numeric(12,2) not null default 0,
  other_deduction   numeric(12,2) not null default 0,

  is_active         boolean not null default true,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_employees_name on employees (name);
create index if not exists idx_employees_department on employees (department);

-- ---------- PAYROLL ----------
create table if not exists payroll (
  id               text primary key default gen_random_uuid()::text,
  month            int not null check (month between 1 and 12),
  year             int not null,
  employee_count   int not null default 0,
  total_gross      numeric(14,2) not null default 0,
  total_deduction  numeric(14,2) not null default 0,
  total_net        numeric(14,2) not null default 0,
  status           payroll_status not null default 'GENERATED',

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  unique (month, year)
);

-- ---------- SALARY SLIPS ----------
create table if not exists salary_slips (
  id                text primary key default gen_random_uuid()::text,
  payroll_id        text not null references payroll(id) on delete cascade,
  employee_id       text not null references employees(id) on delete cascade,

  basic_salary      numeric(12,2) not null,
  hra               numeric(12,2) not null,
  medical_allowance numeric(12,2) not null,
  travel_allowance  numeric(12,2) not null,
  special_allowance numeric(12,2) not null,
  bonus             numeric(12,2) not null,
  gross_salary      numeric(12,2) not null,

  pf                numeric(12,2) not null,
  esi               numeric(12,2) not null,
  professional_tax  numeric(12,2) not null,
  other_deduction   numeric(12,2) not null,
  total_deduction   numeric(12,2) not null,

  net_salary        numeric(12,2) not null,
  pdf_url           text,

  created_at        timestamptz not null default now(),

  unique (payroll_id, employee_id)
);

create index if not exists idx_salary_slips_employee on salary_slips (employee_id);

-- ---------- EMAIL LOGS ----------
create table if not exists email_logs (
  id              text primary key default gen_random_uuid()::text,
  salary_slip_id  text not null references salary_slips(id) on delete cascade,
  employee_id     text not null references employees(id) on delete cascade,

  email           text not null,
  payroll_month   text not null,
  status          email_status not null default 'PENDING',
  error_message   text,
  sent_at         timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_email_logs_employee on email_logs (employee_id);
create index if not exists idx_email_logs_status on email_logs (status);

-- ---------- COMPANY SETTINGS (single row) ----------
create table if not exists company_settings (
  id              text primary key default 'singleton',
  company_name    text not null default '',
  logo_url        text,
  address         text,
  phone           text,
  email           text,
  gst             text,
  pan             text,
  website         text,

  prepared_by_name  text,
  prepared_by_title text,
  verified_by_name  text,
  verified_by_title text,

  smtp_host       text,
  smtp_port       int,
  smtp_email      text,
  smtp_password   text,
  smtp_security   text,

  updated_at      timestamptz not null default now()
);

insert into company_settings (id, company_name)
values ('singleton', 'Your Company Name')
on conflict (id) do nothing;

-- ---------- updated_at triggers ----------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_employees_updated_at on employees;
create trigger trg_employees_updated_at before update on employees
  for each row execute function set_updated_at();

drop trigger if exists trg_payroll_updated_at on payroll;
create trigger trg_payroll_updated_at before update on payroll
  for each row execute function set_updated_at();

drop trigger if exists trg_email_logs_updated_at on email_logs;
create trigger trg_email_logs_updated_at before update on email_logs
  for each row execute function set_updated_at();

drop trigger if exists trg_company_settings_updated_at on company_settings;
create trigger trg_company_settings_updated_at before update on company_settings
  for each row execute function set_updated_at();