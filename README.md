# Drive My Truck

Marketplace connecting UK HGV drivers looking for ad-hoc work with transport companies that need a driver — **drivemytruck.co.uk**.

Market analysis & plan (Polish): [`docs/analiza-rynku.md`](docs/analiza-rynku.md)

## What's in v1 (MVP)

- **Accounts** for drivers and companies (email + password), plus an admin role.
- **Driver profile**: licence classes (C+E / C / C1), skills (ADR, HIAB…), home postcode & travel radius, own rate (per shift / per hour), bio.
- **Documents & verification**: licence (DVLA check code), CPC/DQC, tacho card, right to work, ADR. No photo uploads — admins verify against gov.uk services. All required documents verified ⇒ ✓ Verified badge.
- **Availability**: "Available today" toggle + 4-week calendar (day / night / any).
- **Jobs**: companies post a job (class, postcode, date/time, duration, pay, job & vehicle type, requirements). Drivers see jobs they're qualified for within their radius.
- **Booking**: driver says "I'm available" → company books them; or company invites a suggested driver → driver accepts. Contact details are only shared after booking.
- **Two-way reviews** after the job is marked completed — blind (shown once both sides review, or after 14 days).
- **Admin panel**: verify documents & companies, suspend users, hide reviews.
- Mobile-first, installable as an app (PWA manifest).

## Tech

Next.js 15 (App Router, server actions) · TypeScript · Tailwind CSS 4 · Prisma 6 · PostgreSQL · postcodes.io for UK postcode lookup.

## Run locally

```bash
cp .env.example .env        # fill in DATABASE_URL, DATABASE_URL_UNPOOLED, SESSION_SECRET
npm install
npx prisma migrate dev
npm run db:seed             # demo data, password for all demo users: password123
npm run dev
```

Demo logins: `alex@drivemytruck.test` (driver), `midlands@drivemytruck.test` (company), `admin@drivemytruck.test` (admin).

## Deploy (Vercel + Neon, free tiers)

1. Import this GitHub repo in Vercel.
2. In the Vercel project → **Storage** → add **Neon Postgres** (sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED`).
3. Add env vars: `SESSION_SECRET` (random 48+ chars) and `ADMIN_EMAIL` (the email that becomes admin on sign-up).
4. Deploy — the build runs `prisma migrate deploy` automatically.
5. Add the domain `drivemytruck.co.uk` in Vercel → Domains and set the DNS records it shows in Namecheap (Advanced DNS).

## Next steps (v2 ideas)

Email/SMS/push notifications · map view · automatic driver matching · in-app chat · payments & invoicing (Stripe Connect) · automated DVLA checks · native apps.
