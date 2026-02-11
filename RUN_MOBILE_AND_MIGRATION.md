# Run JaniBear Scan + migration

## 1. Apply the walkthrough-scans migration

The app needs the `walkthrough-scans` bucket and `walkthrough_scans.status` constraint.

**Option A — Supabase linked (CLI)**

```bash
cd "c:\Users\jjbarrett\OneDrive - Bear Facility Supply\Desktop\JaniBear"
npx supabase link   # if not already linked (project ref + DB password)
npx supabase db push
```

**Option B — Supabase Dashboard**

1. Open your project in [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**.
2. Open `supabase/migrations/025_walkthrough_scans_bucket_and_status.sql` in this repo.
3. Copy its contents and run the script in the SQL Editor.

## 2. Configure and run the mobile app

**Env**

```bash
cd apps\janibear-scan
copy .env.example .env
```

Edit `.env` and set:

- `SUPABASE_URL` — e.g. `https://xxxx.supabase.co`
- `SUPABASE_ANON_KEY` — your project’s anon (public) key from Supabase → Settings → API.

**Install and run (iOS on Mac)**

```bash
cd apps\janibear-scan
npm install
cd ios
pod install
cd ..
npm run ios
```

On **Windows**, build and run iOS from a Mac (or use a cloud Mac/CI). Android: `npm run android` (no LiDAR; app will show “LiDAR only on iOS”).

**First run**

1. Sign in with the same email/password you use for the JaniBear web app.
2. Pick a walkthrough from the list.
3. Tap **Start scan**. The stub creates a placeholder file and queues it; when online, it will upload to the `walkthrough-scans` bucket.

Real RoomPlan capture: replace the stub in `ios/JaniBearScan/RoomPlanCaptureModule.swift` (see `MOBILE_LIDAR_ARCHITECTURE.md`).
