# PCG Screening — Admin User Guide

Welcome to the PCG Screening admin dashboard. This guide walks you through everything you need to manage clients, candidates, billing, and settings.

---

## Logging In

1. Go to your admin login page.
2. Enter your email and password.
3. Click **Log In**.

If you forget your password, contact your account administrator.

---

## Dashboard

The dashboard gives you a quick snapshot of activity:

- **Total Candidates** — all candidates across every client
- **In Progress** — screenings currently being processed
- **Completed** — finished screenings
- **Recent Activity** — the latest candidate submissions and status changes

Use this page to get a feel for what needs attention today.

---

## Clients

### Viewing Clients

Click **Clients** in the sidebar to see all registered companies. Each card shows the company name, contact info, and number of candidates.

### Adding a New Client

1. Click **New Client** in the top right.
2. Fill in the company details:
   - Company name
   - Contact person (first and last name)
   - Email, phone, website (optional)
   - Address, city, state, zip
3. Set up their **screening packages** — give each one a name, price, and optional description.
4. Choose a **billing type**:
   - **Candidate Pay** — the candidate pays at the time of screening
   - **Employer Pay** — the company is invoiced (Net 30)
5. Click **Create Client**.

### Editing Client Settings

1. Go to **Clients** and click on a company.
2. Select the **Settings** tab.
3. From here you can update:
   - **Company Info** — name, contact, email, phone, website, address
   - **Billing Type** — switch between Candidate Pay and Employer Pay
   - **Packages** — add, remove, or edit screening packages
   - **Notification Preferences** — control which emails get sent (see Notifications section below)
4. Click **Save Changes** when done.

---

## Candidates

### Viewing All Candidates

Click **Candidates** in the sidebar to see every candidate across all clients. The list shows:

- Candidate name
- Company they belong to
- Package selected
- Current status
- Payment status
- Report status (Sent / Pending / —)

Use the search bar and filters to narrow results.

### Candidate Detail

Click on any candidate to see their full record:

- **Personal info** — name, email, phone, date of birth, SSN (if provided)
- **Screening components** — what checks are included
- **Status timeline** — every status change with timestamps
- **Documents** — consent forms, uploads from the candidate
- **Search jurisdictions** — counties and states to search

### Updating Status

1. Open the candidate detail page.
2. Use the **Status** dropdown to change their status:
   - **Submitted** — initial state when a candidate is invited
   - **In Progress** — screening has started
   - **Completed** — screening is finished
3. Add optional notes explaining the change.
4. Click **Update Status**.

Status changes automatically send notification emails based on the client's preferences.

### Internal Notes

Use the **Internal Notes** section at the bottom of the candidate detail page to leave private notes. These are only visible to PCG admin staff — clients and candidates never see them.

### Uploading a Report

1. On the candidate detail page, find the **Report** section.
2. Click **Upload Report** and select the file (PDF recommended).
3. After uploading, click **Mark Report as Sent** to record when and who delivered it.

The sent status appears in the candidate list so you can quickly see which reports still need to be delivered.

### Editing Screening Components

Click the edit icon next to the screening components to add or remove individual checks for a candidate. This is useful when a client requests changes after submission.

### Editing Jurisdictions

Click **Edit** next to jurisdictions to add or update the counties and states being searched.

---

## Billing

Click **Billing** in the sidebar to see a monthly breakdown of all screening activity.

- **Total Revenue** — sum of all screening charges for the month
- **Collected** — payments already received
- **Outstanding (Net 30)** — amounts owed by Employer Pay clients

Below the summary, each client is listed with their individual candidate line items, showing package, price, and payment status.

Use the left/right arrows to navigate between months.

---

## Users (Admin Staff)

Click **Users** in the sidebar to manage PCG admin accounts.

- **Add** new admin users with name, email, and role
- **Edit** existing users
- Roles:
  - **Owner** — full access to everything
  - **Admin** — full access to manage clients, candidates, and billing

---

## Documents

Click **Documents** to view and manage uploaded files — consent forms, ID documents, and other candidate-submitted paperwork.

---

## Notifications

Each client has their own notification preferences. You configure these in the client's **Settings** tab under **Notification Preferences**.

There are three audiences:

### PCG Admin Notifications
Emails sent to accounts@pcgscreening.com:
- New order received
- No response after 48 hours
- Payment received
- Consent form signed
- Drug test results received
- Report completed

### Client (Employer) Notifications
Emails sent to the company's contact:
- Order received confirmation
- Status updates
- Consent form signed
- Drug test results received
- Report completed

### Candidate Notifications
Emails sent to the candidate:
- Intake link (screening invitation)
- Payment confirmation
- Consent request
- Order received
- Status updates

Toggle each event on or off per client. Events marked as required (like intake link and report completed) are on by default.

---

## Settings

Click **Settings** in the sidebar for general admin settings. Notification preferences are now managed per-client (see above).

---

## Logging Out

Click **Log Out** at the bottom of the sidebar.

---

## Need Help?

- Email: accounts@pcgscreening.com
- Phone: 770-716-1278
