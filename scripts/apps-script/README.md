# Faculty portal — Google Sheets/Apps Script setup

The faculty portal (`/staff`) has no database of its own — it reads and
writes to the same Google Sheet the Apply form already logs to, through the
same Apps Script Web App. This is a one-time setup.

## 1. Add sheet tabs

In the Google Sheet, add tabs (bottom-left "+") for whichever content types
you're managing through the portal. Row 1 of each must be exactly these
header names (order doesn't matter, spelling does — the script reads by
header name):

| Tab | Headers (row 1) |
| --- | --- |
| `Faculty` | `email`, `password_hash`, `name` |
| `Events` | `id`, `title`, `description`, `date`, `time`, `location`, `category`, `image`, `capacity`, `published`, `pinned`, `createdBy`, `createdAt` |
| `Announcements` | `id`, `title`, `body`, `published`, `pinned`, `createdBy`, `createdAt` |
| `Gallery` | `id`, `title`, `description`, `image`, `category`, `date`, `createdBy`, `createdAt` |
| `Projects` | `id`, `title`, `description`, `team`, `technologies`, `image`, `iconKey`, `featured`, `link`, `createdBy`, `createdAt` |
| `Achievements` | `id`, `title`, `placement`, `institution`, `description`, `image`, `createdBy`, `createdAt` |
| `Registrations` | `id`, `eventId`, `eventTitle`, `eventDate`, `name`, `email`, `phone`, `college`, `year`, `registeredAt` — **created automatically** the first time someone registers for an event; nothing to set up by hand |
| `TeamMembers` | `id`, `name`, `role`, `bio`, `image`, `expertise`, `contact`, `createdBy`, `createdAt` |
| `Programs` | `id`, `title`, `description`, `duration`, `level`, `topics`, `image`, `createdBy`, `createdAt` |
| `Facilities` | `id`, `title`, `description`, `image`, `createdBy`, `createdAt` |

**`TeamMembers` is not the same as `Faculty`** — `Faculty` holds admin portal
*login* credentials; `TeamMembers` is the public "Meet the Team" roster
content. Don't merge these.

If you already have an `Events` tab from an earlier setup, add the two new
`published` and `pinned` columns to it — existing rows with those columns
blank are treated as published and unpinned, so nothing already there
disappears.

`team`, `technologies`, `topics`, and `expertise` are comma-separated text
in a single cell (e.g. `Swift, SwiftUI, Xcode`), not separate columns.

Your existing `Applications` tab needs 12 new columns added, for up to 3
projects an applicant can showcase: `project1Description`,
`project1SourceLink`, `project1LiveLink`, `project1Screenshot`,
`project2Description`, `project2SourceLink`, `project2LiveLink`,
`project2Screenshot`, `project3Description`, `project3SourceLink`,
`project3LiveLink`, `project3Screenshot` — plus `id` and `status` if it
doesn't already have them. `project{n}Screenshot` is a Drive link, filled in
automatically the same way Gallery uploads work — nothing to set up beyond
adding the column. Its other columns should already be `name`, `email`,
`phone`, `year`, `skills` (whatever the Apply form has been sending) — a
`submittedAt` column is used if present, but not required.

## 2. Create a Drive folder for gallery uploads

Create a folder in Google Drive (e.g. "Apple Centre Gallery"). Open it, copy
the folder ID out of the URL (`drive.google.com/drive/folders/<THIS PART>`).

## 3. Update the script

Open the Sheet's Apps Script editor (Extensions → Apps Script), replace
everything with the contents of `Code.gs` in this folder, then fill in:

- `SECRET` — must match `GOOGLE_APPS_SCRIPT_SECRET` in `.env.local` exactly (this should already be set from the Apply form setup — reuse the same value).
- `GALLERY_FOLDER_ID` — the folder ID from step 2.

## 4. Redeploy

Deploy → Manage deployments → click the pencil (edit) on the existing
deployment → Version: "New version" → Deploy. This keeps the same `/exec`
URL, so `GOOGLE_APPS_SCRIPT_URL` in `.env.local` doesn't need to change.

(If you use "New deployment" instead, you'll get a different URL and need
to update `.env.local` accordingly — "Manage deployments → Edit" is the one
that preserves the URL.)

## 5. Create the first faculty account

From the project root:

```bash
node scripts/hash-password.mjs "the-password-you-want"
```

Paste the printed hash into the `Faculty` tab's `password_hash` column,
alongside the faculty member's `email` and `name` in the same row. That's
their login for `/staff/login` — there's no self-serve signup.

## 6. Add `SESSION_SECRET`

In `.env.local`, add a long random string:

```
SESSION_SECRET=<paste a long random string here>
```

This signs the faculty login session — treat it like a password. A quick way
to generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

## Done

`/staff/login` should now work with the account from step 5. Content added
through the portal (events, announcements, gallery photos) appears on the
public site within about a minute (the relevant pages revalidate on a
60-second interval).

## Direct Sheets access (recommended: makes every save and load fast)

The Apps Script web app is slow — 3 to 40 seconds a call, and it occasionally
loses its reply. Reading and writing the sheet through Google's own Sheets API
instead takes a fraction of a second and doesn't lose replies. Once the two
settings below exist, the site does that automatically. **Photo uploads still go
through the Apps Script** (a service account has no Drive storage of its own),
so keep this script deployed exactly as before.

If the settings are missing, or Google refuses the account, the site quietly
falls back to the Apps Script, so this can't break anything.

1. Open <https://console.cloud.google.com/>, create a project (any name).
2. **APIs & Services → Library →** search **Google Sheets API → Enable**.
3. **IAM & Admin → Service Accounts → Create service account** (any name, no
   roles needed). Open it, **Keys → Add key → Create new key → JSON**. A `.json`
   file downloads: that is the key. Keep it private.
4. Open your Google Sheet → **Share** → paste the service account's email
   (`…@….iam.gserviceaccount.com`, also inside the key file as `client_email`)
   → set it to **Editor** → uncheck "Notify" → Share.
5. Add two settings, to `.env.local` **and** to Vercel (Project → Settings →
   Environment Variables), then redeploy:

   ```
   GOOGLE_SHEET_ID=<the long id in your sheet's address: docs.google.com/spreadsheets/d/THIS_PART/edit>
   GOOGLE_SERVICE_ACCOUNT_JSON=<the whole contents of the key file>
   ```

   In Vercel paste the file's contents as they are. In `.env.local` it must be
   one line inside **single** quotes: run
   `node -e "console.log(JSON.stringify(require('./key.json')))"` and wrap the
   output in `'…'`.
6. Check it: `node scripts/check-google-sheets.mjs`. It signs in, checks every
   tab and column, and proves write access using a scratch tab that it deletes
   again.

Saves also refresh the public pages straight away now, rather than within a minute.
