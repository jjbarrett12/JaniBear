# How to Get LiDAR Working — Super Simple Steps

Plain words, step by step. No jargon.

---

## A few words so nothing sounds like gibberish

- **Cloud** = the internet place where your app saves stuff (like scan files) so it’s not only on one phone.
- **Database** = where the app keeps lists of things (e.g. “this scan belongs to this walkthrough, it was uploaded at this time”). JaniBear uses something called **Supabase** for this.
- **“Storage” or “bucket”** = the spot in the cloud where **files** (like the room scan file) are stored. Think of it like a folder that the app is allowed to put files into.
- **Migrations / 025 and 027** = just **two setup scripts** (two files in your project). They have boring number names (025, 027). You don’t need to remember the numbers. What they *do* is: **script 1** creates the place where scan files go and the rules for who can see them; **script 2** adds some fields so the app can later save “carpet,” “tile,” etc. Someone has to run these two scripts **once** so the app has a place to put scans. If you didn’t set up the database yourself, that “someone” might be a developer — you can just ask them to “run the migrations” or “set up the walkthrough-scans storage.”

---

## What we’re trying to do

We want the JaniBear app to **scan a room with the phone’s LiDAR** (the thing that measures the room in 3D), **save that scan**, and **upload it** to the cloud so we can use it for bids and reports. These steps get us there.

---

## Step 1: Make sure the app has a place to put scans (one-time)

**In normal words:** The app needs a “drawer” in the cloud where it can save scan files. Right now that drawer might not exist yet. Someone has to run two setup scripts **once** to create it.

**Do you have to do this?**  
- If **you** set up JaniBear’s database (Supabase) and you’re comfortable with it: yes, you run the two scripts once.  
- If **someone else** (a developer, a teammate) set up the database: you can ask them to “create the walkthrough-scans storage and run the latest migrations.” They’ll know what that means.  
- Not sure? You can **skip to Step 2 and 3** and try scanning. If later, when you upload, the app says something like “bucket not found” or “forbidden,” then Step 1 wasn’t done yet — come back and have someone run those two scripts.

**If you’re the one running the scripts:**

- **Option A — You use the Supabase website:**  
  1. Go to [supabase.com](https://supabase.com) and open your JaniBear project.  
  2. Click **SQL Editor**.  
  3. Open the first file from your computer: **`supabase/migrations/025_walkthrough_scans_bucket_and_status.sql`** (in your JaniBear folder). Copy all the text from that file, paste it into the SQL Editor, and click **Run**.  
  4. Then open the second file: **`supabase/migrations/027_scope_surface_audit_fields.sql`**. Copy all its text, paste into the SQL Editor, and click **Run** again.

- **Option B — You use the Supabase app from the command line:**  
  Open a terminal, go to your JaniBear project folder, and run: **`supabase db push`**. That runs all pending setup scripts, including these two.

**Done when:** No error messages. The app now has a place to store scan files and the extra fields for floor types.

---

## Step 2: Get the app ready on your phone (or tablet)

**What this means:** The LiDAR scan part only works on **Apple** phones or tablets that have LiDAR (like iPhone 12 Pro or newer, or some iPads). It won’t work on Android or on the computer’s “fake phone” (simulator) for scanning.

**What you do:**

1. Use a **Mac** with **Xcode** installed.
2. Plug in your **iPhone or iPad** that has LiDAR (or use one that does).
3. Open the **JaniBear Scan** app project in Xcode:  
   - Go to the folder: `apps/janibear-scan/ios`  
   - Open **JaniBearScan.xcodeproj**
4. In Xcode, add the **ARKit** capability to the app (so it’s allowed to use the camera and LiDAR).
5. Pick your real phone/tablet as the device to run on (not “Simulator”).
6. Click **Run** so the app installs on your device.

**Why:** LiDAR is a real sensor; the simulator doesn’t have it. So we need a real Apple device and Xcode to build and run.

**Done when:** The JaniBear Scan app runs on your device from Xcode.

---

## Step 3: Make the “scan” button actually use LiDAR

**What this means:** Right now, when you tap “Start scan,” the app only pretends to scan (it makes a fake file). We need to change the **iPhone/iPad code** so it really opens Apple’s RoomPlan, scans the room, and saves a real scan file.

**What you do:**

1. On your Mac, open the file:  
   **`apps/janibear-scan/ios/JaniBearScan/RoomPlanCaptureModule.swift`**
2. Read the guide:  
   **`apps/janibear-scan/ios/JaniBearScan/LIDAR_IOS_IMPLEMENTATION.md`**  
   It tells you exactly what to change.
3. In short you need to:  
   - Use Apple’s **RoomPlan** (the official way to scan a room with LiDAR).  
   - Show the scanning screen to the user.  
   - When they finish, save the scan as a file (like `roomplan.usdz`) in a folder.  
   - Tell the rest of the app: “Here’s the folder path and the file path.”
4. If you’re not sure how to do the RoomPlan part in Swift, use the **skeleton code** in that same guide and then look up “RoomPlan RoomCaptureView export USDZ” in Apple’s documentation or a tutorial.

**Why:** The app already knows how to upload files and save them in the cloud. It just needs the **real** file from a real scan. This step creates that real file.

**Done when:** You tap “Start scan” in the app, the RoomPlan screen appears, you scan a room, finish, and the app says something like “Scan saved” and later uploads a real `roomplan.usdz` file (not a tiny placeholder).

---

## Step 4: Check that “capture → upload” works

**What this means:** We want to see that: you scan → the app saves the file → when you’re online, the app sends that file to the cloud and the database row gets updated.

**What you do:**

1. In the app, **log in** (same account you use for the website).
2. **Pick a walkthrough** (or create one on the website first if the list is empty).
3. Tap **Start scan** and do a real scan (after Step 3), then finish.
4. Make sure the phone has **internet** (Wi‑Fi or cellular).
5. Wait a bit or open the “pending uploads” screen if there is one.
6. Then check:  
   - In **Supabase** → **Table Editor** → open the **walkthrough_scans** table. You should see a new row with your scan.  
   - In **Supabase** → **Storage** → open the **walkthrough-scans** bucket. You should see a path like `org/.../walkthroughs/.../scans/.../roomplan.usdz`.

**Why:** So we know the full path works: phone scan → file on phone → file in cloud → row in database.

**Done when:** You see the new row and the `roomplan.usdz` file in storage.

---

## Step 5: (Optional) Make the computer do something with the scan

**What this means:** After a scan is uploaded, we can have a **small program** (on your server or in Supabase) run that “looks at” the scan and fills in things like room area. For the first version you can skip this and do it later.

**What you do:**

- Add a **trigger**: when a new file appears in the walkthrough-scans bucket (or when a new row appears in `walkthrough_scans`), run a function.  
- That function can call the “processScan” code in your project (in `src/lib/prop/`). Right now that code is a stub (it doesn’t really measure the room yet), but it can still write something to the database so the rest of the app knows “we have a scan.”

**Done when:** You’re ready to add this later, or you’ve added a simple trigger that runs your processing code when a scan is uploaded.

---

## Step 6: (Later) “We detected carpet” screen

**What this means:** After we have a scan (and maybe some “processing”), we can show a nice screen that says something like “We detected: Carpet — tap to confirm or change.” That’s in the **LIDAR_SURFACE_UX.md** and **surfaceCopy.ts** files. You do this after the scan and upload are working.

---

## Quick list (like a checklist)

1. **One-time setup:** Run the two setup scripts so the app has a place in the cloud to save scans. (If someone else manages the database, ask them to do it.)  
2. Open the app in Xcode on a Mac and run it on a real LiDAR device.  
3. Change the Swift code so “Start scan” uses real RoomPlan and saves a real scan file.  
4. Test: scan a room → go online → check that the scan shows up in Supabase (table + file).  
5. (Optional) Later: have the server “process” each new scan.  
6. (Later) Add the “We detected: Carpet” confirmation screen.

If you get stuck, say which step you’re on and what you see (or what error you get), and we can do that step together in even smaller steps.
