# Email to Gwen — Phase 1 API Keys & Info Needed

**To:** gwen@pcgscreening.com
**Subject:** PCG Phase 1 is underway — a few keys & details I need from you

---

Hi Gwen,

Thanks for the detailed list — I'm already building against it. Below is the short version of what's shipping and the handful of things I need from you so nothing stalls.

## What I'm building right now (no action needed)

- **Staff management page** so you can add Justin (and any future team members) yourself — no more SQL.
- **Password reset flow** for employers — "Forgot password?" link on the login page, reset email, new-password screen.
- **Logo fixes** across the admin panel and all transactional emails (there were still a few places pointing at the old `.com` domain).
- **First/Last Name split** on the client onboarding form.
- **"How did you hear about us?"** field on the self-pay flow (tracked per candidate so you can see it in the admin panel).
- **Component form cleanup** (License, MVR, Drug Test, etc. — tightening up the toggles to match the look you flagged).
- **Sales-driven landing page restructure** with dedicated industry sections (Logistics, Healthcare, Home Health, General Hiring, High-Risk/Executive, Add-Ons) and the three CTAs: *Run Your First Screen*, *Build Your Package*, *Schedule a Setup Call*.
- **FAQ page** (structure is ready — I just need your questions, see below).

## What I need from you

### 1. Dropbox Sign (HelloSign) — for FCRA consent e-signatures

You mentioned HelloSign or a native build. I'm going with **Dropbox Sign** (it's the same product — HelloSign was rebranded). The current consent flow already captures a canvas signature + FCRA checkboxes, so if these keys aren't ready I'll keep that working as the fallback — no deadline pressure.

Please send:

- **`DROPBOX_SIGN_API_KEY`** — from your Dropbox Sign dashboard → Settings → API
- **`DROPBOX_SIGN_CLIENT_ID`** — also in Settings → API (create an "App" if one doesn't exist)
- **`DROPBOX_SIGN_TEMPLATE_ID`** — the ID of your FCRA disclosure template. If you don't have one yet, upload your FCRA disclosure PDF as a **Template** in Dropbox Sign and send me the resulting template ID.

If you don't have a Dropbox Sign account yet, the free plan supports up to 3 signature requests/month (good for testing), or Essentials at ~$20/mo handles unlimited.

### 2. Calendly — for the "Schedule a Setup Call" CTA

Just send me the **public Calendly URL** for whichever event you want prospects to land on (e.g., `https://calendly.com/gwen-pcg/setup-call`). I'll wire it into all the CTAs.

### 3. QuickBooks Online — for net-30 invoice sync (Phase 1D, lower priority)

This one's slightly longer — it requires an OAuth setup on the QuickBooks Developer side. When you're ready:

- Create a developer account at `developer.intuit.com`
- Create an app, get the **Client ID** and **Client Secret**
- Send both to me and I'll handle the OAuth connect flow from the admin side so you just click "Connect QuickBooks" once.

No rush on this — it's in Phase 1D, after everything above is shipped.

### 4. FAQ content

I'll stand up the FAQ page structure with placeholder questions, but I need the real ones from you. Ten to fifteen Q&A pairs is a good target. Things prospects commonly ask — turnaround time, what's included in each package, compliance, international screening, etc.

### 5. Industry page copy (optional but recommended)

For each industry page, a short paragraph in your voice beats anything I'd write. If you can send me **2–3 sentences per industry** describing the pain point and why PCG is the right fit, I'll drop them in verbatim. Industries:

- Logistics
- Healthcare
- Home Health
- General Hiring
- High-Risk / Executive

If you don't have time for this, no problem — I'll draft copy based on what's already on the site and you can edit it after.

## Security note

Please send keys/secrets through **1Password, Bitwarden, or a password-protected note** — *not* plain email or Slack. If that's a pain, I can set up a one-time-link service you paste into, just let me know.

## Timeline

Phase 1A (staff page, password reset, logo fixes, name split) ships today/tomorrow and needs **nothing from you**. Phase 1B (referral tracking, Dropbox Sign, form cleanup) ships as soon as those keys land. Phase 1C (marketing pages) ships in parallel — I'll use placeholder copy until yours arrives.

Let me know if any of this is unclear or you want to reprioritize.

Thanks,
Martin
