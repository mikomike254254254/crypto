# Wallex Online

Wallex is an Expo crypto wallet app for `wallex.online`. It includes the landing page, RXP wallet, card-buy flow, KYC submission flow, admin command center, Supabase schema, and an Android WebView app shell.

## Current Code Structure

```text
app/
  (tabs)/                 Main wallet tabs: home, assets, activity, profile, notifications
  onboarding.tsx          Landing page, signup, Google button, password setup, avatar setup
  send.tsx                Internal RXP wallet transfers
  receive.tsx             RXP receive address and QR-style view
  buy.tsx                 RXP card checkout flow
  kyc.tsx                 KYC form and Supabase submission metadata
  admin.tsx               Admin dashboard for rewards, KYC, bans, notifications, transactions
  webview-app.tsx         Android/iOS WebView app shell with 5-second loaded popup
api/
  admin.js                Server-side admin actions using Supabase service role
  payflee-checkout.js     Server-side card checkout handoff
  crypto-prices.js        FreeCryptoAPI/fallback market data
constants/
  brand.ts                Wallex logo, email, domain, RXP rate, bonus, images
  crypto.ts               Initial wallet assets and activity
context/
  UserContext.tsx         Profile, generated RXP wallet, KYC status, security settings
lib/
  auth.ts                 Supabase email/password and Google signup helpers
  kyc.ts                  Supabase KYC submission helper
  supabase.ts             Supabase client and optional RXP sync
  wallet.ts               `rxp_...` wallet address generator/validator
supabase/
  schema.sql              Tables, triggers, RLS policies, signup bonus, KYC queue
```

## Google Signup Setup

Create a Google OAuth client in Google Cloud Console:

1. Go to Google Cloud Console, create or select a project.
2. Configure the OAuth consent screen for Wallex.
3. Create OAuth Client ID, application type: `Web application`.
4. Copy the `Client ID` and `Client Secret`.
5. In Supabase Dashboard, open Authentication > Providers > Google, enable it, and paste the Client ID and Client Secret.

### Authorized JavaScript Origins

Add these exact origins to Google:

```text
http://localhost:3000
http://127.0.0.1:3000
https://wallex.online
https://www.wallex.online
https://wallex-static-a8c933e333b342e083ff8.vercel.app
https://crypto-main-psi.vercel.app
```

Add any new Vercel production/preview origin you actually use. Google does not accept wildcard origins.

### Authorized Redirect URIs

For this Supabase project, add:

```text
https://nzzstvvbrcdhuiqppdpv.supabase.co/auth/v1/callback
```

If you run Supabase locally with the CLI, also add:

```text
http://127.0.0.1:54321/auth/v1/callback
```

Do not put the Google Client Secret in React Native, Expo public env vars, GitHub, or frontend code. Keep it only inside Supabase Auth provider settings.

## Supabase Redirect URL Setup

In Supabase Dashboard > Authentication > URL Configuration:

Site URL for local testing:

```text
http://localhost:3000
```

When the domain is live, change Site URL to:

```text
https://wallex.online
```

Additional Redirect URLs:

```text
http://localhost:3000/**
http://127.0.0.1:3000/**
https://wallex.online/**
https://www.wallex.online/**
https://wallex-static-a8c933e333b342e083ff8.vercel.app/**
https://crypto-main-psi.vercel.app/**
https://*-mikomike280s-projects.vercel.app/**
```

Then run `supabase/schema.sql` in the Supabase SQL editor. That creates:

- `users`
- `balances`
- `transactions`
- `kyc_submissions`
- `banned_wallets`
- `notifications`
- `mpesa_withdraws`
- automatic `$15` signup bonus as `10.79 RXP`
- RLS policies for user-owned data

## Local Development

```bash
npm install
npm run build:web
npx serve@14 dist -l 3000 --single
```

Open:

```text
http://localhost:3000
http://localhost:3000/admin
```

## Android APK WebView App

The WebView app route is `app/webview-app.tsx`.

Rules implemented:

- App name: `Wallex Online`
- Website URL: `EXPO_PUBLIC_WALLEX_WEBSITE_URL` or `https://wallex.online`
- Current logo used for icon and splash
- 5-second popup after website load
- Android back button navigates WebView history
- No unnecessary permissions

Build a downloadable APK:

```bash
npm install
npx eas login
npx eas build -p android --profile preview
```

For Play Store later:

```bash
npx eas build -p android --profile production
```
