# Sherivs auth email templates (Supabase)

These are branded, Gmail-safe HTML templates for every Supabase Auth email. Each one uses tables, inline styles, a 600px max width, a button that also works in Outlook (VML), hidden preheader text, a plain-link fallback under the button, and light/dark mode support. They use a system font stack, so no web fonts are needed.

## Where each one goes
Supabase Dashboard → project **nwrflbpbhyiqdptmlccm** → **Authentication → Emails → Templates**.
For each tab, paste the **Subject** and replace the whole **Message body** (the "Source" view) with the file's contents, then **Save**.

| Supabase template tab | File | Subject |
|---|---|---|
| Confirm signup | `confirm-signup.html` | Confirm your email for Sherivs |
| Invite user | `invite-user.html` | You've been invited to join Sherivs |
| Magic link | `magic-link.html` | Your Sherivs sign-in link |
| Change email address | `change-email.html` | Confirm your new email address for Sherivs |
| Reset password | `reset-password.html` | Reset your Sherivs password |
| Reauthentication | `reauthentication.html` | Your Sherivs verification code |

Variables used: `{{ .ConfirmationURL }}` (every link email), `{{ .Email }}`, `{{ .NewEmail }}` (change email), `{{ .Token }}` (reauthentication). Do not change the `{{ ... }}` parts.

## Before pasting
1. **Logo:** the templates load `https://app.sherivs.com/email/sherivs-logo.png` (96×96 transparent PNG of the official ribbon "S", shown at 48×48 for sharp 2× screens; 512px master and the original are in `public/brand/`). The file is in `public/email/` and goes live once this PR is merged and deployed. Open that URL to check it returns the logo before you paste the templates.
2. **Expiry wording:** the emails say links expire in **1 hour**. This matches Supabase's default (Authentication → Providers/Settings → Email → *Email OTP Expiration* = 3600 seconds). If you change that setting, change the wording too.
3. **Delivery:** the built-in Supabase mailer only sends to members of your Supabase organization. Real users need custom SMTP (Resend). See `docs/ops/AUTH-SECURITY-SETUP.md`, step 6.
4. **Test:** after saving, trigger each email to a Gmail address (sign-up, "Forgotten password?", etc.) and check it in the Gmail app on Android and iOS, in light and dark mode.

## Notes
- Gmail removes `<style>` blocks in some views. Everything important is inline; the `<style>` block only adds mobile padding and dark-mode polish where supported.
- Gmail's own dark mode can recolour the email automatically. The colours are chosen so it stays readable when it does.
- Previews: `docs/ops/email-templates/previews/*.png` (390px wide, light mode, plus `reset-password-dark.png`).

## Brand palette (sampled from the official logo)
| Role | Hex | Notes |
|---|---|---|
| Primary / button | `#184efd` | Logo royal blue; white text contrast 5.9:1 (WCAG AA) |
| Links / dark text accent | `#0d37ca` | Logo deep blue; 8.7:1 on white |
| Gradient start | `#24bffd` | Logo cyan |
| Gradient end | `#a872fc` | Logo purple |
| Dark-mode links | `#7dd3fc` | Light cyan for dark backgrounds |

The 6px bar at the top of the card is a cyan→blue→purple `linear-gradient`. Clients that drop gradients (Outlook, some Gmail views) fall back to solid `#184efd`.
