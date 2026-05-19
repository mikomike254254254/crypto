# Wallex Online

Wallex is an Expo crypto wallet app for `wallex.online`. It includes the landing page, XRP wallet, card-buy flow, KYC submission flow, operations dashboard, Supabase schema, and an Android WebView app shell.

## Current Code Structure

```text
app/
  (tabs)/                 Main wallet tabs: home, assets, activity, profile, notifications
  onboarding.tsx          Landing page, signup, Google button, password setup, avatar setup
  send.tsx                XRP wallet transfers
  receive.tsx             XRP receive address and QR-style view
  buy.tsx                 XRP card checkout flow
  kyc.tsx                 KYC form and Supabase submission metadata
  admin.tsx               Operations dashboard for balances, KYC, bans, notifications, transactions
  webview-app.tsx         Android/iOS WebView app shell with 5-second loaded popup
api/
  admin-login.js          Admin login endpoint; returns a server token only after password login
  admin.js                Server-side operations actions using Supabase service role
  payflee-checkout.js     Server-side card checkout handoff
  crypto-prices.js        FreeCryptoAPI/fallback market data
constants/
  brand.ts                Wallex logo, email, domain, XRP rate, bonus, images
  crypto.ts               Initial wallet assets and activity
context/
  UserContext.tsx         Profile, generated Ripple-style wallet, KYC status, security settings
lib/
  auth.ts                 Supabase email/password and Google signup helpers
  kyc.ts                  Supabase KYC submission helper
  supabase.ts             Supabase client and optional wallet sync
  wallet.ts               Ripple-style wallet address generator/validator
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
https://crypto-main-bice.vercel.app
https://crypto-main-2xhn1k5x7-edipay.vercel.app
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
https://crypto-main-bice.vercel.app/**
https://crypto-main-2xhn1k5x7-edipay.vercel.app/**
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
- automatic `$15` signup bonus as `10.79 XRP`
- RLS policies for user-owned data

## Admin, Email, and Payments

Add these server-only environment variables in Vercel. Do not put them in Expo public variables:

```text
ADMIN_EMAIL=admin@wallex.online
ADMIN_PASSWORD=your-private-admin-password
ADMIN_API_TOKEN=your-long-random-server-token
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=optional-for-kyc-emails
EMAIL_FROM=Wallex <support@wallex.online>
EMAIL_WEBHOOK_URL=optional-email-provider-webhook
PAYFLEE_SECRET_KEY=your-payflee-secret-key
PAYFLEE_PUBLIC_KEY=your-payflee-public-key
PAYFLEE_PAYMENT_LINK_URL=your-hosted-payflee-link
PAYFLEE_API_URL=optional-direct-payflee-api-url
```

The public app never shows an admin token. Admin users sign in at `/admin`, and server actions use the token behind that login. KYC approve/reject writes a notification and can send email when `RESEND_API_KEY` or `EMAIL_WEBHOOK_URL` is configured.

For card payment, `PAYFLEE_PAYMENT_LINK_URL` is the easiest live setup. If it is empty, the app still opens a Payflee handoff page so the button works during local/static testing.

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
