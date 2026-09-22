# Agulhas MTS Commissioning Tracker

A mobile-first Next.js + Firebase app for marking each field device as installed, wired, labelled and tested. It is ready for Vercel deployment.

## Firebase setup

1. Create a Firebase project and a Firestore database.
2. In Authentication, enable **Email/Password** and create each technician as a user.
3. Register a Web App in Firebase Project Settings.
4. Copy `.env.example` to `.env.local` and paste in the six web-app configuration values.
5. Paste `firestore.rules` into Firestore Rules and publish them.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Vercel

Import the repository into Vercel and add the same six `NEXT_PUBLIC_FIREBASE_*` values under Project Settings → Environment Variables. Deploy after saving them.

## Load devices

After signing in, open the settings menu. **Load starter register** adds representative Agulhas devices. **Import CSV** accepts these headings:

```text
tag,kks,type,subsystem,location,from,to,notes
```

The document ID is derived from `tag`, so importing a corrected row updates that device without deleting its existing completion state.
