# Agulhas MTS Commissioning Tracker

A mobile-first Next.js + Firebase app for marking each field device as installed, wired, labelled and tested. It is ready for Vercel deployment.

## Firebase setup

1. Create a Firebase project and a Firestore database.
2. In Authentication, enable **Email/Password** and create each technician as a user.
3. Register a Web App in Firebase Project Settings.
4. The supplied Agulhas Firebase web configuration is already connected. Environment variables remain available if the project is changed later.
5. Paste `firestore.rules` into Firestore Rules and publish them.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Vercel

Import the repository into Vercel and deploy. The Firebase web configuration is already included; Vercel environment variables are optional overrides.

## Load devices

After signing in, open the settings menu. **Load starter register** adds representative Agulhas devices. **Import CSV** accepts these headings:

```text
tag,kks,type,subsystem,location,from,to,notes
```

The document ID is derived from `tag`, so importing a corrected row updates that device without deleting its existing completion state.
