# MedSentry — Auth Model Update v1: Email/Password + Google Sign-In

> This document **supersedes** the authentication approach implied in `plan.md` §2 and §6
> (email/OTP passwordless sign-in). Everything else in `plan.md` is unchanged — `profiles`,
> RLS policies, and every downstream feature that reads `auth.uid()` work identically regardless
> of which sign-in method produced the session. Only the sign-in UI and the Supabase Auth call
> pattern change.

---

## 1. What's changing
- **Removed:** `signInWithOtp` + 6-digit code entry flow (`SignInScreen`'s passcode request,
  `OTPVerifyScreen` entirely).
- **Added:** Email + password sign-in and sign-up, and Google Sign-In as a one-tap alternative.
- **Unchanged:** `profiles` table, the upsert-on-first-login logic, RLS policies, session handling
  in `RootNavigator` (still branches on session presence the same way).

## 2. Why this doesn't require a schema change
Supabase's `auth.users` table (which `profiles.id` references) is identical regardless of sign-in
method — email/password and Google OAuth both produce a normal Supabase session with a `user.id`.
The existing `AuthContext` profile-upsert-on-first-login logic keeps working unmodified; only the
*screens and the specific `supabase.auth.*` method calls* change.

## 3. New sign-in flows
1. **Email/Password**
   - Sign Up: `supabase.auth.signUp({ email, password })`
   - Sign In: `supabase.auth.signInWithPassword({ email, password })`
   - Email confirmation: still routes through the existing Resend SMTP setup, but uses Supabase's
     default "Confirm signup" template (a click-through link), not the OTP code — no template
     changes needed for this flow specifically.
2. **Google Sign-In**
   - Native sign-in via `@react-native-google-signin/google-signin`, producing a Google ID token
   - Exchanged for a Supabase session via `supabase.auth.signInWithIdToken({ provider: 'google',
     token: idToken })`

## 4. Required external configuration (manual, dashboard-side — see companion setup steps)
- A Google Cloud OAuth consent screen + two OAuth client IDs (Web + Android)
- Google provider enabled in Supabase Auth with the Web client ID/secret
- `@react-native-google-signin/google-signin` added as an Expo config plugin in `app.json`,
  configured with the Web client ID

## 5. Open decision for later (not blocking this change)
A "Forgot password" flow isn't described in `plan.md` and wasn't part of this request — flagging
it as a reasonable future addition rather than assuming it should be built now. Confirm before
Antigravity adds it.
