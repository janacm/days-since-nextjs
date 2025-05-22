# Days Since Mobile

This directory contains a React Native version of the Days Since app built with Expo. It reuses the same backend as the web app and fetches data from the existing API routes deployed on Vercel.

## Development

1. Install dependencies with `pnpm install` inside this `mobile` directory.
2. Copy `.env.example` from the root and set `EXPO_PUBLIC_API_URL` to your deployed backend URL.
3. Run `pnpm start` to launch Expo.

The screens roughly mirror the functionality of the web application: login, signup, dashboard with events list, add/edit events and an admin screen for sending test emails.
