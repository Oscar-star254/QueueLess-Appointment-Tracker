# FundiFind

A mobile-first directory of plumbers and electricians in Kenya. Currency: KES. Primary colour: forest green. Work is deliberately staged; **only Stage 1 is implemented**. Do not deploy this foundation as a finished directory.

## Two entry points

- **Repository root:** the existing React/Vite Figma Make design preview. The host already runs it; do not start another preview server inside Figma Make. The overview, revenue chart, and recent-listing table show explicitly labelled illustrative data. Preview forms never create accounts or pretend to authenticate.
- **`next-app/`:** the actual Next.js App Router application, Prisma/PostgreSQL database, NextAuth credentials authentication, account endpoints, and role boundaries. Its authenticated overview uses real aggregate database counts, not sample revenue. The two applications share `src/fundi/` and `src/index.css`.

The original queue-app files are retained, but no longer mounted. They are not part of FundiFind.

## Stage 1 scope

Implemented: full relational schema and SQL migrations; Kenyan phone normalization; seed data; provider registration with consent; bcrypt password hashing (cost 12); credentials login/logout; email verification; single-use password reset with session revocation; authenticated phone verification using a development SMS stub; durable database-backed rate limits; same-origin JSON mutation protection; NextAuth CSRF protection; middleware and authoritative server-side roles; authenticated CLI role assignment with audit logs; accessible, responsive foundation interface.

Not implemented yet: public directory/search (Stage 2), listing CRUD/uploads (Stage 3), checkout/payment adapters (Stage 4), admin CRUD/moderation/TOTP/impersonation (Stage 5), and scheduled notifications/SEO/policies/deployment polish (Stage 6). Fields for these features exist in the schema; fields do not imply implemented functionality. TOTP-enabled accounts fail closed until Stage 5 implements challenge verification. No real M-Pesa calls are made.

## Prerequisites

Node.js 22, pnpm 10, PostgreSQL 17 (local installation, Docker, Neon, or Supabase). The Next.js app must have access to both its directory and the shared source files in the repository root.

### Local installation (outside the managed Figma preview)

From the repository root:

```sh
pnpm install --frozen-lockfile
cd next-app
pnpm install --frozen-lockfile
cp .env.example .env
```

Edit `.env`:

1. Set `DATABASE_URL` and `DIRECT_URL`. For Neon/Supabase, runtime may use a pooled URL; use a direct PostgreSQL URL for migrations. Use TLS for remote database connections.
2. Set `NEXTAUTH_URL=http://localhost:3000` and generate `NEXTAUTH_SECRET` using `openssl rand -base64 32`. Use at least 32 characters; keep it stable across instances.
3. Choose your `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PHONE`, and a unique `SEED_ADMIN_PASSWORD` of 12–72 UTF-8 bytes. Do not reuse another password.
4. Leave `EMAIL_TRANSPORT=console` and `SMS_PROVIDER=stub` for local development. Local verification links/codes are printed only to the Next.js terminal. These are sensitive; never publish terminal logs.

Optional local database, from `next-app/` (requires a running Docker daemon):

```sh
docker compose up -d db
```

The compose file binds PostgreSQL only to localhost. Its password is development-only. It matches the example database URLs; use managed credentials or a strong password on any deployed system.

Apply the shipped migrations, generate the client, seed, and run:

```sh
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

`db:migrate` uses `prisma migrate dev`, including its shadow-database requirements. If using a restricted hosted database, apply the shipped migrations with `pnpm db:deploy` instead. Future schema changes should be authored against a development database, not production. Explicit `db:generate` is required because pnpm may block Prisma's installation hooks.

Open `http://localhost:3000/login` or `/register`. Admin login uses **your configured `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`**. There is no hardcoded admin password. The example admin email is `admin@example.com`; use an email you control if testing real delivery.

Seeding is transactional and repeatable. It creates a Super Admin, all 47 counties in official code order, Nairobi City and six areas, two categories/four subcategories, three plans, two add-ons, 20 sample providers/listings, active demonstration subscriptions, settings, and communication templates. Existing data and passwords are not overwritten. Sample provider passwords are random and undisclosed: create your own provider account to test login. Samples are not endorsements of real businesses. Sample subscriptions have no payments and therefore do not invent revenue. Never seed these illustrative records into a public production directory.

### Email and phone verification

- Register, then follow the email-verification link printed to your development Next.js terminal. The confirmation page uses an explicit POST button, preventing email link scanners from consuming tokens.
- You may sign in before verification to finish account setup; future listing/payment actions must require verified contact details.
- Open account Settings → Verify phone. Request a code and use the six-digit code from the local SMS stub. Codes expire after 10 minutes; five verification attempts per 15 minutes are allowed. Resending invalidates prior codes.
- Email verification expires in 24 hours; password-reset links in 30 minutes. Tokens are SHA-256 hashed; low-entropy OTPs use secret-key HMAC, not an unsalted hash. Token consumption is atomic and replay-protected.
- For actual email delivery, set `EMAIL_TRANSPORT=smtp`, `SMTP_HOST`, `SMTP_PORT`, optional `SMTP_USER`/`SMTP_PASSWORD`, `SMTP_SECURE`, and an authorized `EMAIL_FROM`. SMTP 465 usually uses `SMTP_SECURE=true`; 587 uses STARTTLS.
- Delivery requests are persisted in `Delivery`; failed requests remain retryable, but a delivery retry worker is scheduled for Stage 6. Until then, use resend verification/reset to request a fresh link. Do not interpret a generic request-accepted response as proof of SMTP delivery.
- The SMS stub intentionally refuses production phone verification. Africa's Talking must be wired before releasing phone verification. No production OTP is ever returned to the client or printed by the stub.

## Roles and protected routes

| Role | Permissions established in Stage 1 |
| --- | --- |
| Provider | Own workspace/account; own listing aggregate counts |
| Moderator | Workspace and moderation boundary |
| Finance | Workspace and finance boundary |
| Admin | Provider management, moderation, and finance boundaries |
| Super Admin | All boundaries, including site settings |

- `/dashboard`: all authenticated roles.
- `/admin`: staff only; providers are denied.
- `/admin/providers` and `GET /api/admin/providers`: Admin/Super Admin only.
- `/admin/moderation`: Moderator/Admin/Super Admin.
- `/admin/finance`: Finance/Admin/Super Admin.
- `/admin/settings` and `GET /api/admin/settings`: Super Admin only.
- `GET /api/workspace`: authenticated, bounded aggregate information.

The admin pages establish permission boundaries, not the Stage 5 management tools. Middleware checks the JWT, while every protected page/API re-reads the user from PostgreSQL. Suspension and `sessionVersion` changes invalidate access immediately. A role embedded in an old JWT never grants access on its own.

For provisioning test staff before the admin account tools exist, register a provider, then use the authenticated CLI from `next-app/`. In a Bash terminal:

```sh
export ROLE_ADMIN_EMAIL='your-super-admin-email@example.com'
read -rsp 'Super Admin password: ' ROLE_ADMIN_PASSWORD; echo
export ROLE_ADMIN_PASSWORD
pnpm role:set staff@example.com MODERATOR
unset ROLE_ADMIN_PASSWORD ROLE_ADMIN_EMAIL
```

Accepted roles: `PROVIDER`, `ADMIN`, `SUPER_ADMIN`, `MODERATOR`, `FINANCE`. This authenticates a current Super Admin, preserves the last active Super Admin, records an audit event, and revokes the target's existing sessions. Never pass a password as a CLI argument. This is not a public role-elevation endpoint.

## Run Stage 1 checks

From `next-app/`:

```sh
pnpm db:validate
pnpm db:generate
pnpm typecheck
pnpm test
pnpm build
```

The default test suite includes five unit tests covering normalized Kenyan numbers, malformed numbers, bcrypt byte boundaries, consent/honeypot/role injection, and permissions. Its database integration test is **skipped by default**.

To run the opt-in integration test, point `.env` at a **disposable, migrated test database**, not production, then:

```sh
pnpm db:deploy
RUN_DB_TESTS=1 pnpm test:db
```

This test exercises actual registration, hashed passwords, provider-only role assignment, consent storage, concurrent token replay, email verification, password reset/session revocation, atomic rate limiting, and cross-origin rejection. It deletes its test user/outbox records afterward; temporary rate-limit records may remain. The database test does not start a web server or test browser cookies/middleware: use the manual checklist below for those.

The root preview can be built with `pnpm build` from the repository root. It is not a replacement for the Next.js build.

## Stage 1 manual acceptance checklist

- [ ] Unauthenticated `/dashboard` and `/admin` redirect to login; APIs return 401 rather than private data.
- [ ] Register a new provider using `07XXXXXXXX`; inspect PostgreSQL and confirm `2547XXXXXXXX`, `PROVIDER`, a bcrypt hash, and consent timestamp/version.
- [ ] Repeat with `01XXXXXXXX` and `+2547XXXXXXXX`; invalid length/country numbers are rejected.
- [ ] Registration with no consent, a filled honeypot, an HTML name, or an injected `role` fails validation.
- [ ] Open the verification link, click confirmation, and confirm `emailVerified`; reuse or expire the link and confirm rejection.
- [ ] Sign in with correct credentials; incorrect credentials return a generic message. Nine attempts against the same email within 15 minutes are blocked.
- [ ] In account Settings, request an SMS stub OTP; wrong, expired, and previously consumed codes fail; the right code verifies the phone.
- [ ] Request password reset for both a known and an unknown email; both receive the same generic response.
- [ ] Reset the password; verify the old password fails, the new one succeeds, and prior sessions lose access. Reusing the reset link fails.
- [ ] Sign out; confirm protected pages no longer render for that browser.
- [ ] A provider cannot access `/admin` or staff APIs. A Moderator cannot access finance/settings. Finance cannot access provider-management/settings. An Admin cannot access Super Admin settings.
- [ ] Use `role:set` to change a test user's role; old sessions are revoked and an audit event is present. Sign in again to receive the new role.
- [ ] Set a test user's `suspendedAt` in a disposable database; its active browser session immediately loses protected access.
- [ ] Cross-origin JSON POSTs to account endpoints return 403; oversized requests return 413.
- [ ] At 390px width, test navigation, form labels, keyboard focus, modal Escape, error notices, and table horizontal scrolling.

The database-backed checklist has not been run in the managed environment: no PostgreSQL service or usable Docker daemon was available. Schema/client generation, type checking, production builds, and unit checks do not establish database or delivery connectivity.

## Structure

```text
.
├── src/
│   ├── App.tsx                    # Design-preview entry
│   ├── index.css                  # Shared fonts and theme tokens
│   └── fundi/
│       ├── Workspace.tsx          # Stage 1 shell; explicit preview mode
│       ├── AuthPanel.tsx          # Account forms used by Next.js
│       ├── RevenueChart.tsx       # Lazy-loaded illustrative chart
│       └── ui.tsx                 # Local UI primitives
├── next-app/
│   ├── app/                       # App Router pages and API handlers
│   │   ├── api/account/[action]/route.ts
│   │   ├── api/auth/[...nextauth]/route.ts
│   │   ├── api/admin/{providers,settings}/route.ts
│   │   ├── api/workspace/route.ts
│   │   ├── admin/                 # Staff permission boundaries
│   │   ├── dashboard/
│   │   ├── login/                 # Also register, forgot/reset, verify
│   │   └── layout.tsx
│   ├── components/                # Authentication/boundary compositions
│   ├── lib/                       # Auth, roles, validation, DB, security, delivery
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/            # Initial schema + SQL data constraints
│   ├── scripts/set-role.ts
│   ├── tests/                     # Unit + opt-in database integration
│   ├── types/next-auth.d.ts
│   ├── middleware.ts
│   ├── .env.example
│   ├── compose.yaml
│   └── package.json
└── README.md
```

The database includes every requested model plus Area, AddonPurchase, ReminderDelivery (unique reminder delivery identity), Delivery (outbox), and RateLimit. Unique keys enforce one review per user/listing, one activation subscription per payment, unique checkout/receipt/idempotency identifiers, and single-use token identities. Additional SQL constraints enforce normalized phones, rating/price/coordinate bounds, product selection, and sensible subscription dates. These constraints must be deployed with the migrations, not `prisma db push` alone.

## Vercel deployment flow (Stage 1 foundation only)

Deploy the **Next.js application**, not the root Vite preview. This flow does not advance to Stage 2 or make the directory production-ready. Keep this deployment restricted to acceptance testers until the remaining stages and launch-security work are complete.

### 1. Create the project and database

1. Connect this repository to Vercel using your Git provider. In the new project settings, choose **Root Directory: `next-app`**, **Framework Preset: Next.js**, and **Node.js: 22.x**.
2. Enable **Include source files outside of the Root Directory in the Build Step**. The app imports `../src/fundi/` and `../src/index.css`; do not deploy a copy of `next-app/` without those files.
3. `next-app/vercel.json` configures the install and build commands. Installation uses both lockfiles; `pnpm build:vercel` generates Prisma Client before the Next.js build. Leave Output Directory at the Next.js default; do not select the Vite `dist` directory or use a static export.
4. Provision PostgreSQL using Neon or Supabase. Use a **pooled** runtime connection compatible with Prisma and a **direct** migration connection, with TLS. Keep the database in a region near your Vercel functions and enable backups. Follow your provider's Prisma pooling instructions and connection limits.
5. Enable the deployment protection available for your Vercel plan. Never connect an untrusted pull request or public preview to the production database or production secrets.

### 2. Configure Vercel environment variables

Set these in **Project Settings → Environment Variables** for the intended deployment environment, then redeploy after any changes. Do not prefix secrets with `NEXT_PUBLIC_` or paste credentials into this repository.

| Variable | Value / purpose |
| --- | --- |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1`, so Vercel uses the `pnpm@10.34.3` package-manager pin. |
| `DATABASE_URL` | Your provider's pooled PostgreSQL runtime URL. |
| `DIRECT_URL` | Direct PostgreSQL connection used by Prisma migrations. |
| `NEXTAUTH_URL` | Exact canonical HTTPS app URL, such as your assigned `https://your-project.vercel.app` domain. Update this if you add a custom domain. |
| `NEXTAUTH_SECRET` | A unique stable secret generated with `openssl rand -base64 32`. Use a different secret for previews. |
| `EMAIL_TRANSPORT` | `smtp`; console delivery is disabled in production. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Your SMTP host, usually port `587` with `false` (STARTTLS), or `465` with `true` (implicit TLS). |
| `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` | Mail-provider credentials and a verified sender. Test email verification and password reset on the deployed app. |
| `TRUST_PROXY` | Keep `false` unless you have verified that the trusted edge overwrites the client-IP header and blocks direct-origin access. |
| `PAYMENT_PROVIDER` | `mock`; payment adapters are not implemented in Stage 1. |

Do not override `NODE_ENV` in Vercel; Next.js uses production mode on deployed builds. `SMS_PROVIDER=stub` is **not** a working Vercel SMS integration: production refuses to log OTP codes, leaving delivery pending/failed. Real phone verification is blocked until the SMS adapter is implemented. No cron route, M-Pesa callback, or upload integration is deployed in this stage.

**Preview deployments:** use a separate disposable database (or isolated database branch), SMTP sandbox, and secret. Configure a stable preview/branch domain and set Preview `NEXTAUTH_URL` to that exact URL; access the preview through that domain. The application's same-origin check intentionally rejects account mutations from a different generated deployment URL. If you cannot provide an isolated database and matching URL, disable automatic previews rather than sharing production credentials.

### 3. Apply migrations and bootstrap the admin

Run from a trusted workstation or protected release job. Install dependencies as described above first. These commands require Vercel account access; they are **not** run automatically during a build.

```sh
cd next-app
pnpm dlx vercel link
pnpm dlx vercel env pull .env.production.local --environment=production
pnpm db:generate
pnpm release:production db:deploy
```

Confirm `vercel link` points to the correct project and environment before pulling secrets or migrating. The environment file is Git-ignored and contains live credentials: protect it, never print it, and remove it when finished. The release wrapper uses Node.js 22's `loadEnvFile` before invoking the package script, so production connection values take precedence over Prisma's optional development `.env`. It requires both database URLs and forces production mode. Use a clean release shell: already-exported environment variables take precedence over the file. Never use `db:migrate` (`migrate dev`) or `db push` against the deployed database.

For first-time bootstrap, temporarily add your chosen `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, normalized Kenyan `SEED_ADMIN_PHONE`, and a unique `SEED_ADMIN_PASSWORD` (12–72 UTF-8 bytes) to that protected file, then run:

```sh
pnpm release:production db:seed:production
```

This command forces production mode and seeds the Super Admin, counties, categories, locations, plans, add-ons, settings, and templates **without creating sample providers/listings**. It does not overwrite existing records, elevate an existing non-admin account, or remove demo records previously inserted by a development seed. Use a fresh production database; do not run the normal development `db:seed` there. Remove the bootstrap credentials after use; the deployed app does not need `SEED_ADMIN_*` variables.

### 4. Deploy and verify

After the database is migrated and environment variables are ready, trigger the Vercel deployment/redeployment from the dashboard. For subsequent releases, your configured production branch triggers deployments through Vercel's Git integration. No credentials are needed in GitHub Actions and no additional deployment server is required.

For releases containing new migrations, review and back up the database, apply backwards-compatible migrations as a controlled step **before** deploying code that requires them, and coordinate deployment timing. Do not run migrations or seeds in preview builds. Rollbacks in Vercel restore application code, **not** database schema or data; retain compatibility with the previous app version and plan database recovery separately.

Before inviting testers, complete the Stage 1 manual acceptance checklist above on the deployed domain: redirects and server-side permissions, registration, email verification, credential login/logout, single-use password reset/session revocation, and responsive navigation. Verify SMTP actually delivers messages; a successful build or registration response does not prove delivery. Phone OTP acceptance remains blocked pending the production SMS adapter. Check Vercel function logs for concrete failures without exposing tokens or delivery bodies. Add your custom domain, update `NEXTAUTH_URL`, redeploy, and repeat account-flow checks on that canonical domain.

### Current deployment limits

The repository includes the Vercel configuration and build flow, but no live Vercel project/domain has been linked or published by this agent. Migrations, bootstrap, and deployed account-flow acceptance still require your database and platform access. Figma Make publishing remains the separate static Vite preview; its `.figma/make/` scripts are unchanged.

Before a public release: implement all remaining stages, real SMS delivery, email retry/retention, monitoring, policy/consent pages and data-subject handling, upload processing, TOTP, and deployment/cron instructions. Database-backed rate limits work across instances. Without a verified trusted proxy, edge limits are shared; per-email/per-user limits still apply. Rate-limit responses fail closed if PostgreSQL is unavailable. Future cron cleanup must remove expired tokens, limiter rows, and old sensitive outbox payloads according to a documented retention policy. The current CSP permits framework inline scripts; nonce-based tightening belongs in the launch-security pass. No Lighthouse score is claimed.

## Later-stage acceptance path

This is the required full-flow test plan, **not yet executable or passed**:

1. Register → verify email/phone → sign in (Stage 1).
2. Create a draft listing with validated uploads and location (Stage 3).
3. Choose a plan → mock payment → verify server-computed KES amount (Stage 4).
4. Use a phone ending in `0` to test payment failure; another number succeeds after the mock delay. Repeat callbacks and confirm exactly one subscription activation (Stage 4).
5. Admin approves → listing becomes live (Stage 5).
6. Visitor searches → finds listing → reveals phone → verify lead event and no phone in initial HTML (Stages 2/3).
7. Verified user posts one review → moderator approves → provider replies once (Stage 5).
8. Simulate subscription expiry → scheduler marks EXPIRED → sends 7/3/1-day reminders once each (Stage 6).
9. Renew → payment succeeds → expiry extends exactly once → receipt, notification, and analytics reflect the change (Stages 4/6).

### Real STK push and cron

Do not set `PAYMENT_PROVIDER=mpesa` yet: the payment interface/adapters, callback, polling, and scheduler are intentionally scheduled for Stage 4/6. At Stage 4 the guide will cover Daraja OAuth, timestamp/password generation, STK request payloads, callback verification/idempotency, sandbox testing, and the provider switch. At Stage 6 the guide will include the exact authenticated scheduler route, schedule, deployment steps, and full release checklist. The `.env.example` already lists the future M-Pesa secrets, but they are unused in Stage 1.

**Stop after Stage 1. Say “continue” to begin Stage 2.**
