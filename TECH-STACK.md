# Centre for Apple Technologies website — complete tech stack

Everything the site is built with, and where each piece is used. Versions are from `package.json`.

---

## 1. Core framework

| Technology | Version | What it does here |
|---|---|---|
| **Next.js** (App Router, Turbopack) | 16.2.11 | The whole site: pages, API routes, middleware ("proxy"), image optimisation, font loading, static pre-rendering. Note: this is a newer Next.js than most documentation describes (see `AGENTS.md`). |
| **React** / **React DOM** | 19.2.4 | UI components (Server Components for data pages, Client Components for interactivity). |
| **TypeScript** | ^5 | Type safety across the entire codebase (`strict` mode, `@/` path alias to `src/`). |
| **Node.js** | 20 locally (Vercel picks its own supported version) | Server runtime for API routes. |

### How the app is organised (`src/`)
- `src/app/(site)/` — the **public website**: home, programs, projects, events, gallery, faculty, achievements, apply, 404. Shares one layout (header, floating dock, footer, smooth scroll, custom cursor).
- `src/app/staff/` — the **Faculty Portal** (login + `(portal)` group: events, announcements, gallery, programs, projects, facilities, achievements, team, applications, registrations). Own minimal layout with the side panel.
- `src/app/embed/[section]/` — three tiny pages (About / Facilities / Projects) that are shown **inside the iMac scroll windows** on the home page. They deliberately skip the site chrome so they're cheap to load.
- `src/app/api/` — server endpoints: `apply`, `events/register`, `staff/*` (CRUD for every portal section, `upload`, `login`, `logout`, `google/start`, `google/callback`).
- `src/proxy.ts` — Next.js middleware that blocks every `/staff/*` URL unless a valid session cookie is present.
- `src/lib/` — server/shared logic (Sheets client, auth, sessions, mail, photo storage, search, merge helpers).
- `src/components/` — `sections/` (page sections), `patterns/` (animation & layout effects), `ui/` (buttons, cards, dialogs…), `staff/` (portal screens), `nav/`, `footer/`, `core/`.

---

## 2. Styling & design system

| Technology | Where / why |
|---|---|
| **Tailwind CSS v4** (`tailwindcss`, `@tailwindcss/postcss`) | All layout and styling via utility classes; theme tokens (colours, radii, fonts) defined in `src/app/globals.css` with `@theme inline`. |
| **Custom CSS in `globals.css`** | Things utilities can't express: the iMac window effect (`.imac-*`), background wave/aurora layers, the animated CTA button, reduced-motion fallbacks, `dvh` phone sizing. |
| **shadcn/ui** (`shadcn` CLI + `components.json`, style "base-nova") | Generator/baseline for UI primitives; `shadcn/tailwind.css` is imported in `globals.css`. Components live in `src/components/ui/`. |
| **@base-ui/react** | Unstyled accessible primitives behind `ui/button.tsx` and `ui/select.tsx`. |
| **class-variance-authority** (CVA) | Variant definitions for buttons, badges, the custom cursor, motion links, stateful button. |
| **clsx** + **tailwind-merge** | The `cn()` helper in `src/lib/utils.ts` — merges class names without Tailwind conflicts. |
| **tw-animate-css** | Ready-made enter/exit animation utilities (dialogs, popovers). |
| **lucide-react** | All icons (pages, footer, dock, portal nav, tools marquee). Generic icons are used on purpose rather than Apple's trademarked ones. |
| **Fonts via `next/font/google`** | **Plus Jakarta Sans** (headings), **Manrope** (body/UI), **IBM Plex Mono** (small uppercase section labels). Self-hosted by Next at build time. |
| **sonner** | Toast notifications (mounted in the root layout; used throughout the staff portal and forms). |

---

## 3. Animation & interaction

| Technology | Where / why |
|---|---|
| **motion** (Framer Motion v12, `motion/react`) | Almost every animation: opening reveal, fade-ins, text effects/morphing, flip words, header hide-on-scroll, floating dock, custom cursor, events calendar, expanding search, horizontal-scroll carousel, 3D marquee, testimonials, and — most importantly — the **iMac scroll windows** (shell width/height/radius/bezel all driven by scroll progress through motion values). |
| **Lenis** (`lenis/react`) | Smooth scrolling for desktop (`smooth-scroll.tsx`), anchor jumps from the floating dock, gallery lightbox scroll lock/restore, and the desktop wheel hand-off out of the iMac windows. Phones keep native touch scrolling. |
| **Custom scroll hooks** (`src/hooks/use-scroll-progress.ts`) | Light replacement for `useScroll`: measures once, then turns `window.scrollY` into progress values without forcing layout every frame (this fixed choppy scrolling). |
| **Pure-CSS effects** | `wave-field`, `glass-orb-field`, `imac-marquee-field`, `embed-backdrop`: drifting gradient/orb backgrounds with no JS animation loop. |
| **Web Audio API** | `src/lib/key-sound.ts` synthesises the click of the on-page Magic Keyboard in the browser — no audio files. |
| **IntersectionObserver / ResizeObserver** | Loading each iMac window's embedded page early, and measuring its height on phones. |
| **Browser Canvas API** | `src/lib/image-compress.ts` and `prepare-photos.ts` shrink and re-encode photos to JPEG **in the browser** before upload. |

### The iMac scroll windows (special case)
`src/components/patterns/imac-scroll-windows.tsx` + `.imac-*` CSS. Three sticky "runways"; each iMac grows into a full-screen browser window showing an `/embed/<section>` page in an **iframe**. On desktop the page scrolls inside the frame and hands control back to Lenis at its edges. On touch screens the frame is made as tall as its page and slid up by the page's own native scroll (extra runway), loaded early via IntersectionObserver, with `dvh` units so the browser toolbar doesn't hide the bottom.

---

## 4. Data layer (no traditional database)

The site's "database" is a **Google Spreadsheet** that coordinators can edit directly.

| Piece | Details |
|---|---|
| **Google Sheets API (direct, service account)** — `src/lib/google-sheets.ts`, `google-auth.ts` | Primary backend. A Google **service account** signs a JWT (via `jose`), exchanges it for an access token, and calls the Sheets REST API. Tabs: `Events`, `Announcements`, `Gallery`, `Albums`, `Projects`, `Achievements`, `TeamMembers`, `Programs`, `Facilities`, `Faculty`, `Applications`, `Registrations`. Includes retries, serial write queues, and idempotent writes. Env: `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEET_ID`. |
| **Google Apps Script web app** — `scripts/apps-script/Code.gs`, `src/lib/apps-script.ts` | The original backend, kept as an automatic **fallback** (same actions and JSON shape, so the rest of the code can't tell which answered). Also handles Drive uploads for PDFs/other files. Env: `GOOGLE_APPS_SCRIPT_URL`, `GOOGLE_APPS_SCRIPT_SECRET`. Note: its `Code.gs` doesn't yet know the `techComfort` / `resumeUrl` application columns. |
| **Next.js caching** (`unstable_cache`, `revalidateTag`, `export const revalidate = 60`) | Public pages are pre-built and refreshed every 60 s, so visitors never wait on Google; staff writes invalidate the cache tags. |
| **merge-*.ts helpers** | Combine live sheet rows with built-in default content (events, projects, team, gallery, facilities, programs, achievements) so pages are never empty. |
| **Search** (`search-index.ts`, `search.ts`, `expanding-search.tsx`) | Site-wide search index built server-side in the layout from the live sheet data + static pages; searched in the browser. |

---

## 5. File & photo storage

| Technology | Where / why |
|---|---|
| **Vercel Blob** (`@vercel/blob`) | JPEG photos uploaded by staff (gallery, events, projects, team…) and applicants. Saved in well under a second. `src/lib/photo-storage.ts`. Env: `BLOB_STORE_ID` or `BLOB_READ_WRITE_TOKEN`. |
| **Google Drive** (through Apps Script) | PDFs (applicant résumés) and any photo Blob can't take. Résumé links are normalised to `drive.google.com/file/d/<id>/view`. |
| **next/image** | Optimised delivery; remote patterns allow `images.unsplash.com` and `plus.unsplash.com`. Local images in `public/`. |

---

## 6. Authentication & security

| Piece | Details |
|---|---|
| **Email + password login** — `api/staff/login`, **bcryptjs** | Faculty rows in the sheet hold a bcrypt hash (`scripts/hash-password.mjs` generates one). Constant-time-style compare against a dummy hash so unknown emails take as long as wrong passwords. |
| **Google sign-in (OAuth 2.0 authorization-code flow)** — `src/lib/google-oauth.ts`, `api/staff/google/{start,callback}` | "Continue with Google" with **state + nonce + PKCE**; the ID token is verified with `jose`. Google only proves the email; it must already be in the Faculty sheet. Env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Consent screen is External, in Testing mode (staff must be listed as Test users). |
| **Sessions** — `jose` (JWT, HS256) | Signed `staff_session` cookie, 7 days, verified at the edge in `proxy.ts`. Env: `SESSION_SECRET`. |
| **Route protection** | `proxy.ts` matcher `/staff/:path*` redirects unauthenticated users to `/staff/login`; the portal layout also checks the session server-side. |
| **Other** | `referrer: no-referrer` (stops Google photo hotlink 429s), `robots: noindex` on embed pages, HTML-escaping of anything put into emails. |

---

## 7. Email

| Technology | Where / why |
|---|---|
| **Nodemailer** (`src/lib/mailer.ts`) over SMTP | Sends: new application → staff notification, application decision → applicant, event registration confirmations. Env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `NOTIFY_EMAIL_TO`. |

---

## 8. Forms, dates & utilities

| Technology | Where / why |
|---|---|
| **date-fns** | Date maths and formatting in the events calendar. |
| **Native `fetch` + FormData / base64 JSON** | All form submissions (apply form, event registration, staff CRUD, uploads). |
| **Custom form UI** | `password-input`, `password-strength-meter`, `tag-input`, `radio-card`, `stateful-button`, `status-steps`, `confirm-dialog`, `modal` — hand-built in `src/components/ui` and `staff`. |

---

## 9. Hosting, deployment & tooling

| Piece | Details |
|---|---|
| **Vercel** | Hosting (production at `apple-centre-website.vercel.app`), serverless functions (60 s max for sheet-heavy routes), Blob storage, env vars (Production). Project linked locally via the Vercel CLI (`.vercel/`, git-ignored). |
| **GitHub** | Source repo `AdityaParthasarathy/Apple-Centre-Website`; every push to `main` auto-deploys to production. |
| **ESLint 9** + `eslint-config-next` | Linting (`npm run lint`). |
| **npm** | Package manager (`package-lock.json`). |
| **Scripts** | `scripts/check-google-sheets.mjs` (verifies the Sheets connection), `scripts/hash-password.mjs` (makes bcrypt hashes for faculty). |
| **Google Cloud** | Project "apple-centre-website": the service account for Sheets, and the OAuth client "Apple Centre Portal" (redirect URIs for localhost:3000 and the Vercel domain). |

---

## 10. Environment variables (names only)

`GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEET_ID`, `GOOGLE_APPS_SCRIPT_URL`, `GOOGLE_APPS_SCRIPT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `NOTIFY_EMAIL_TO`, `NEXT_PUBLIC_SITE_URL`, `BLOB_STORE_ID` / `BLOB_READ_WRITE_TOKEN` (added by Vercel), optional `GOOGLE_SHEETS_API_URL`.

---

## 11. Request flow in one paragraph

A visitor loads a **pre-built Next.js page** from Vercel (data refreshed from **Google Sheets** every minute), styled with **Tailwind**, animated by **motion** and **Lenis**. When they apply or register, the browser compresses any photo (**Canvas**), posts to a **Next.js API route**, which writes a row to **Google Sheets** (service account), stores résumés in **Drive** and photos in **Vercel Blob**, and emails staff and applicants through **Nodemailer/SMTP**. Staff sign in with **bcrypt password or Google OAuth**, get a **jose-signed JWT cookie**, and the **proxy middleware** gates the portal where every change is written back to the same spreadsheet and the public pages refresh.
