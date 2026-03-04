# Walk-through Audio and LiDAR

## Is the microphone active when LiDAR is active?

**On iPhone/iPad, the microphone is not turned off by the system when LiDAR/ARKit is running.** So technically **audio can be recorded at the same time** as a LiDAR scan—**if** the app requests microphone permission and actually records.

**In the current JaniBear Scan app:**

- Only **camera** permission is requested (`NSCameraUsageDescription` in Info.plist).
- There is **no microphone permission** and **no audio recording** in the LiDAR capture flow.
- So today: **audio is not recorded during LiDAR** in the app.

So: hardware allows both; the app simply doesn’t use the mic yet.

---

## Option 1: Record with iPhone Memos, then LiDAR (recommended for now)

Your workaround is solid and needs no app changes:

1. **During the walk-through:** Record the conversation in **Voice Memos** (or another recorder). Focus on the customer; you’re not holding the phone for LiDAR yet.
2. **After the walk-through (or in a second pass):** Use the same device to run **JaniBear Scan** and do the LiDAR capture. You can do this before leaving the site so geometry is from the same visit.
3. **Back in the office (or later):**  
   - Export/share the memo (e.g. m4a) and get text: either use a **transcription service** (e.g. Whisper, Rev, or Memos’ own transcription if available on your iOS version), or use JaniBear’s flow once we support it (see below).  
   - Put the **transcript** into the walk-through (e.g. paste into a “Notes” field, or upload audio and use **Transcribe**).  
   - Run **Extract scope** and **Pain points** on that transcript so you get structured scope + customer concerns without touching the LiDAR flow.

**Why this works:** You get clean voice capture during the conversation, accurate LiDAR when you’re free to move the device, and AI (scope + pain points) on the same transcript. No need for the app to record audio during LiDAR right away.

---

## Option 2: Add in-app audio recording (future)

If you want **one app** to do both:

1. **Microphone permission**  
   - Add `NSMicrophoneUsageDescription` to `apps/janibear-scan/ios/JaniBearScan/Info.plist`.  
   - Example: “JaniBear Scan can record the walk-through conversation so we can extract customer needs and scope.”

2. **When to record**  
   - **Option A:** “Record audio” as a **separate step** in the app (e.g. “Start voice memo” before or after LiDAR, or on a different screen). Simpler and avoids dealing with AR + audio session at the same time.  
   - **Option B:** Start an **AVAudioRecorder** (or equivalent) in the background when the user taps “Start scan,” so recording runs **while** RoomPlan is active. iOS allows this; you’d just need to start the audio session and write to a file, then stop when the scan ends. More integrated, but more to implement and test.

3. **Upload and transcribe**  
   - Upload the recorded file to your walk-through media (or a dedicated path), then call your backend **Transcribe** API (`walkthrough_id` + `audio_storage_path`) so you get a `walkthrough_transcripts` row.  
   - After that, **Extract scope** and **Pain points** work the same as with the Memos workflow.

4. **Transcribe API**  
   - `POST /api/transcribe` and `transcribeAudio()` in `src/lib/ai/index.ts` are currently **stubs**. To make “upload audio → AI scribe” work end-to-end, implement `transcribeAudio(storagePath)` with **OpenAI Whisper** (or another provider): download the file from storage, send to Whisper, return `{ text, segments }` and keep the existing insert into `walkthrough_transcripts`.

---

## Summary

| Question | Answer |
|----------|--------|
| Is the microphone active when LiDAR is active (on device)? | **Yes** — iOS allows it. |
| Does JaniBear Scan record audio during LiDAR today? | **No** — no mic permission or recording in the app. |
| Can I record the walk-through for customer problems? | **Yes** — use **Voice Memos** (or similar), then transcribe and run **Pain points** (and Extract scope) on the transcript. Do LiDAR in a separate pass (e.g. before leaving). |
| Can we add in-app recording later? | **Yes** — add mic permission, then either a separate “record audio” step or background recording while LiDAR runs; upload and call Transcribe, then scope + pain points as today. |

Your “Memos → AI scribe → circle back with LiDAR” flow is a good way to capture customer problems without waiting for in-app audio.
