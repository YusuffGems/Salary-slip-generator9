# Salary Slip Generator (Personal / Single-User)

A premium, no-login salary slip generator and payroll email automation tool built with
Next.js 15, Prisma + Supabase (Postgres), React-PDF, and Nodemailer.

There is **no authentication** — the app opens straight to the dashboard, as requested.
Anyone with the deployed URL can use it, so keep the URL private or put it behind a
platform-level password (e.g. Vercel password protection) if that matters to you.

## 1. Install dependencies

```bash
npm install
```

## 2. Set up Supabase

1. Create a free project at https://supabase.com.
2. Go to **Project Settings → Database** and copy the connection strings
   (pooled `DATABASE_URL` on port 6543, and `DIRECT_URL` on port 5432).
3. Go to **Project Settings → API** and copy the `Project URL` and `anon public` key.
4. Create two Storage buckets (Storage → New bucket), both **public**:
   - `salary-slips`
   - `company-assets`

## 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

## 4. Push the database schema

Prisma will create all tables (employees, payroll, salary_slips, email_logs,
company_settings) directly from `prisma/schema.prisma`:

```bash
npx prisma generate
npx prisma db push
```

Alternatively, run `supabase/schema.sql` directly in the Supabase SQL editor if you
prefer raw SQL / want to review it first — it produces the same schema.

## 5. Run locally

```bash
npm run dev
```

Visit http://localhost:3000 — it opens directly to the Dashboard.

## 6. Configure company + SMTP settings

Go to **Settings** in the app and fill in:
- Company name, logo, address, GST/PAN, website
- SMTP host/port/email/password (for Gmail: use an **App Password**, not your normal
  password — requires 2-Step Verification to be enabled on the Google account)

## 7. Typical workflow

1. **Employees** → Add each employee with salary components and bank details.
2. **Payroll** → Pick a month/year → **Generate Payroll** (calculates every employee's
   gross/deductions/net and snapshots it; blocked if that month was already generated).
3. **Preview Payslips** to sanity-check numbers, or download individual PDFs.
4. **Send Payslips** → live progress screen shows each employee being emailed, with a
   running success/fail count and a final report.
5. **Download All PDFs** → zips every payslip for that month.
6. **Email History** → see every send attempt, resend a single failed one, or
   re-download any PDF.

## 8. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

In the Vercel dashboard, add all the same environment variables from `.env`
under **Project → Settings → Environment Variables**, then redeploy.

Because Supabase's free tier Postgres is directly reachable, no extra database
hosting is needed — Vercel's serverless functions connect straight to it via
`DATABASE_URL` (pooled connection, required for serverless).

## Notes & things you'll likely want to adjust

- **PDF branding**: colors/layout live in `src/lib/pdf.tsx` — tweak `StyleSheet.create()`
  there for a different look.
- **Currency**: currently formatted as INR (`src/lib/salary.ts` → `formatCurrency`).
  Change the `currency` param if you need a different currency.
- **Duplicate payroll protection**: enforced both at the DB level (`@@unique([month, year])`)
  and checked before generation.
- **Soft-delete**: removing an employee sets `isActive = false` rather than hard-deleting,
  so historical payslips/emails stay intact.
- **Email sending is sequential** (one at a time) in `src/app/api/payroll/send/route.ts`
  so the progress screen can report per-employee status — fine for typical small/medium
  team sizes. For very large teams you may want to batch it and add a small delay to
  stay within your SMTP provider's rate limits.
