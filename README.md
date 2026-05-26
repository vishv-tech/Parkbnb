# Park2bnb

Park2bnb is an MVP for an "Airbnb for Car Parking" marketplace. Owners can list empty parking spots, seekers can find nearby vacant spots, book a duration, pay through Razorpay or the mock payment fallback, and unlock the exact location only after payment.

## Tech Stack

- Next.js App Router
- React
- Tailwind CSS
- Next.js API routes
- Supabase Postgres through REST
- Supabase Storage for parking images
- Google Maps JavaScript/embed integration
- Razorpay checkout with mock payment fallback
- Local JSON database fallback for development without Supabase keys

## Main Flows

- Owner: signup/login -> owner dashboard -> list parking spot -> upload image -> set price/location -> manage live, vacant, occupied, taken down, edit, delete.
- Seeker: signup/login -> vehicle details -> location permission -> nearby sorted listings -> hidden exact details -> booking -> payment -> exact location unlock.
- Admin: env-protected login -> users, listings, bookings, payment status, listing status, block users, approve/reject/delete listings.

## Setup

1. Install Node.js 20+ and npm.
2. Install dependencies:

```bash
npm install
```

3. Create your environment file:

```bash
cp .env.example .env.local
```

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

4. For quick local testing, you can leave Supabase, Google Maps, and Razorpay placeholders as-is. The app will use `.data/park2bnb.json`, local image uploads, coordinate inputs, and mock payments.

5. For Supabase production-style setup:

- Create a Supabase project.
- Run `supabase/schema.sql` in the Supabase SQL editor.
- Optionally run `supabase/seed.sql` for sample users/listings/bookings.
- Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`.
- Keep the service role key server-side only.

6. Add optional integrations:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for map pin selection and embedded exact location.
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` for real payments.
- Set `NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS=false` when real Razorpay checkout is ready.

7. Start development:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Local Seed Data

For local JSON fallback, copy `sample-data/local-db.json` to `.data/park2bnb.json` after the app has created the `.data` folder, or create the folder manually.

Sample login password for seeded owner and seeker accounts:

```text
password123
```

Admin defaults for local development:

```text
admin@park2bnb.local
admin123
```

If you copy `.env.example`, use the value you set in `ADMIN_PASSWORD` instead. Change `ADMIN_EMAIL` and `ADMIN_PASSWORD` before sharing or deploying.

## Important Security Notes

- Passwords are hashed with Node `crypto.scrypt`.
- Auth sessions are signed HTTP-only cookies.
- Exact latitude, longitude, floor, gate, directions, and owner contact are hidden from seekers until `paymentStatus=PAID` and `exactLocationUnlocked=true`.
- Only owners can edit/delete their own listings.
- Only seekers who own a booking can pay/view it.
- Admin routes require the admin session cookie.
- Supabase service role key is used only in server API routes.

## Useful Routes

- `/` landing page
- `/signup`
- `/login`
- `/owner/dashboard`
- `/owner/list`
- `/seeker/profile`
- `/seeker/location`
- `/seeker/results`
- `/parking/[id]`
- `/payment/[id]`
- `/booking/[id]/confirmed`
- `/my-bookings`
- `/admin/login`
- `/admin`

## Database Files

- `supabase/schema.sql` creates tables, enums, indexes, triggers, and storage bucket setup.
- `supabase/seed.sql` inserts sample users, listings, seeker profile, and booking.
- `sample-data/local-db.json` mirrors the same sample data for the local JSON fallback.
