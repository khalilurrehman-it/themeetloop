# MeetLoop

**Meetings that remember what your team forgets.**

MeetLoop captures a live, speaker-attributed meeting transcript, turns it into
evidence-backed actionable outcomes, and keeps an auditable memory of what was
decided and committed — so the next meeting starts where the last one ended.

Built for multilingual teams: English, Urdu, Roman Urdu, and English–Urdu
code-switched conversation are preserved in the language they were spoken.

---

## The loop

```
  Google Meet captions          Reliable delivery              Reviewable outcomes
  ────────────────────          ─────────────────              ───────────────────
  Chrome extension    ──────▶   Sequenced batches   ──────▶    Summary, decisions,
  observes captions             buffered locally,              actions, commitments,
  as they appear                acknowledged by the            blockers, questions —
                                server before they             each linked to the exact
                                leave the device               transcript line that
                                                               produced it
                                        │
                                        ▼
                                 Meeting memory
                                 Every outcome keeps its origin, evidence,
                                 and review history. Nothing is rewritten
                                 silently.
```

Three principles the code holds to:

1. **A caption is not lost.** Captions are buffered on the device and only
   dropped once the server acknowledges the sequence number.
2. **AI proposes, people confirm.** Every generated outcome enters a review
   queue. Model output is strictly parsed and every cited evidence identifier
   is verified against the meeting's own transcript before it is stored.
3. **The record is auditable.** Corrections are kept alongside the original;
   the transcript stays available as the source of truth.

---

## Repository layout

```
themeetloop/
├── themeetloop_nextjs/              Web application (Next.js 16, React 19)
├── themeetloop_backend/             API and processing worker (Express 5, PostgreSQL)
└── themeetloop_chrome_extension/    Google Meet caption capture (Manifest V3)
```

A pnpm workspace. Each application deploys independently and shares one
canonical API contract.

---

## Requirements

| Tool       | Version                                            |
| ---------- | -------------------------------------------------- |
| Node.js    | 20 or newer                                        |
| pnpm       | 10.33.2 (`corepack enable` picks this up)          |
| PostgreSQL | 14 or newer, reachable from the backend            |
| Chrome     | Any Manifest V3 capable version, for the extension |

You will also need:

- An **Anthropic API key** for actionable-notes generation. Without one the
  backend falls back to a deterministic provider, so the app still runs.
- A **Resend API key** for verification and password-reset email. Without one,
  those emails simply fail to send; the rest of the app is unaffected.

---

## Getting started

### 1. Install

```bash
pnpm install
```

### 2. Configure environment

Copy each template and fill in real values. Neither `.env` file is tracked by
git.

```bash
cp themeetloop_backend/.env.example themeetloop_backend/.env
cp themeetloop_nextjs/.env.example  themeetloop_nextjs/.env.local
```

**`themeetloop_backend/.env`**

| Variable             | Purpose                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `PORT`               | API port. Defaults to `8000`.                                    |
| `DATABASE_URL`       | PostgreSQL connection string.                                    |
| `BETTER_AUTH_SECRET` | Session signing secret. **At least 32 random characters.**       |
| `BETTER_AUTH_URL`    | Public URL of the backend, e.g. `http://localhost:8000`.         |
| `FRONTEND_URL`       | The single origin allowed by CORS, e.g. `http://localhost:3000`. |
| `RESEND_API_KEY`     | Resend key for authentication email.                             |
| `RESEND_FROM_EMAIL`  | A sender address on a domain verified with Resend.               |
| `RESEND_FROM_NAME`   | Display name on outgoing email.                                  |
| `ANTHROPIC_API_KEY`  | Key used to generate actionable notes.                           |
| `ANTHROPIC_MODEL`    | Model id. Defaults to `claude-haiku-4-5`.                        |

**`themeetloop_nextjs/.env.local`**

| Variable                           | Purpose                      |
| ---------------------------------- | ---------------------------- |
| `NEXT_PUBLIC_BACKEND_API_BASE_URL` | Base URL of the backend API. |

### 3. Create the database schema

```bash
createdb meetloop                                   # if it does not exist yet
pnpm --filter themeetloop_backend auth:migrate      # Better Auth tables
pnpm --filter themeetloop_backend database:migrate  # MeetLoop tables
```

### 4. Run

```bash
pnpm dev
```

This starts the backend on `http://localhost:8000` and the web application on
`http://localhost:3000` together.

### 5. Load the Chrome extension

```bash
pnpm --filter themeetloop_chrome_extension build
```

Then in Chrome: **Extensions → Manage extensions → Developer mode → Load
unpacked**, and select `themeetloop_chrome_extension/`.

> The compiled `dist/` folder is not committed, so this build step is required
> after a fresh clone — `manifest.json` points at it.

> The manifest currently grants host access to `http://localhost:3000` only.
> Add your deployed origin to `host_permissions` and `content_scripts.matches`
> before using the extension against production.

---

## Trying the full loop

You do not need a real Google Meet call to see MeetLoop work end to end.

1. Register an account and sign in.
2. Open **Live meeting** and start a meeting.
3. Use the **demo caption input** in the right-hand panel to add a few lines of
   conversation — include a decision, a task with an owner, and an open
   question.
4. Press **End meeting**. Buffered captions are delivered, then the meeting is
   finalized.
5. You land on the meeting page while the background worker generates notes.
   It refreshes on its own.
6. Review each outcome — accept, correct, or remove it — and follow the
   **evidence** links to jump to the exact transcript line behind it.

With the extension installed and captions enabled in Google Meet, steps 2–4
happen automatically.

---

## Applications

### Web application — `themeetloop_nextjs`

Next.js 16 App Router, React 19, TypeScript strict mode, Tailwind CSS 4, and
shadcn components built on Base UI primitives.

- **Landing** — the capture → outcomes → memory story.
- **Authentication** — login, register, forgot password, reset password.
- **Dashboard** — review backlog, capture metrics, recent meetings, and a live
  panel when a capture is running.
- **Live meeting** — connection state, buffered count, ordered transcript, and
  a confirmed end-meeting flow.
- **Meetings** — searchable, status-filtered archive.
- **Meeting detail** — processing state, the review queue with confidence,
  owner, due date and review status, and the full source transcript.
- **Settings** — account, automatic capture toggle, and on-device data control.

Route files are composition boundaries: metadata plus an imported view. Feature
code lives under `src/modules/<feature>/{views,components,hooks,services,validations,types}`.

Every data region implements loading, empty, error-with-retry, and success
states. A failed background refresh keeps the last good data on screen rather
than blanking the page.

```bash
pnpm --filter themeetloop_nextjs dev      # development server
pnpm --filter themeetloop_nextjs build    # production build
pnpm --filter themeetloop_nextjs lint     # eslint
```

### Backend — `themeetloop_backend`

Express 5, PostgreSQL, and Better Auth.

| Method  | Route                                                        | Purpose                       |
| ------- | ------------------------------------------------------------ | ----------------------------- |
| `POST`  | `/api/v1/meetings`                                           | Create a meeting and session  |
| `GET`   | `/api/v1/meetings`                                           | List meetings                 |
| `GET`   | `/api/v1/meetings/:meetingId`                                | Meeting detail                |
| `GET`   | `/api/v1/meetings/:meetingId/transcript`                     | Ordered transcript            |
| `POST`  | `/api/v1/meetings/:meetingId/transcript-batches`             | Ingest a batch of captions    |
| `POST`  | `/api/v1/meetings/:meetingId/finalize`                       | End capture, queue processing |
| `GET`   | `/api/v1/meetings/:meetingId/actionable-notes`               | Generated outcomes            |
| `PATCH` | `/api/v1/meetings/:meetingId/actionable-notes/items/:itemId` | Accept, correct, or remove    |
| `POST`  | `/api/v1/meetings/:meetingId/actionable-notes/review`        | Complete the review           |
| `POST`  | `/api/v1/meetings/:meetingId/retry-processing`               | Retry a failed generation     |

Responses use one envelope: `{ success, data, meta.requestId }` on success and
`{ success: false, error: { code, message } }` on failure.

A background worker claims processing jobs with `FOR UPDATE SKIP LOCKED`,
applies bounded exponential backoff, and marks a job failed after repeated
attempts — without ever discarding the transcript.

```bash
pnpm --filter themeetloop_backend dev
pnpm --filter themeetloop_backend test
pnpm --filter themeetloop_backend typecheck
```

### Chrome extension — `themeetloop_chrome_extension`

Manifest V3. A content script observes Google Meet caption mutations and
debounces each caption element until its text settles, so partial utterances
are not sent as separate chunks. The background service worker owns caption
sequence numbering — persisted per capture session — so numbering survives a
Meet tab reload and cannot collide with chunks already stored. Captions
observed before a capture session is registered are buffered and replayed.

An on-page indicator shows capture state, so participants can see when MeetLoop
is active.

---

## Security and privacy

- **Authorization is not authentication.** Every meeting query is scoped
  through `workspace_members` and keyed on the server-resolved session user. A
  client-supplied user identifier is never trusted.
- **AI output is untrusted.** Generated notes are strictly parsed against a
  schema, and every cited evidence identifier is verified against that
  meeting's own transcript chunks before storage. Unverifiable evidence is
  rejected rather than displayed.
- **Transcripts do not outlive the session.** Locally buffered captions are
  cleared from the browser on logout, and can be cleared manually from
  Settings.
- **Secrets stay out of the repository.** `.env` files are ignored; only
  `.env.example` templates are tracked.
- **Logs are safe by construction.** Structured logs carry event names,
  correlation identifiers and bounded metadata — never transcripts,
  credentials, or raw errors.
- Rate limiting, Helmet, a single trusted CORS origin, and a request body limit
  are applied at the HTTP boundary.

**Recording consent:** automatic capture starts on its own once captions are
detected. Tell participants the meeting is being captured, and obtain consent
wherever your organization or local law requires it.

---

## Workspace commands

```bash
pnpm dev            # backend + web application together
pnpm build          # build all three applications
pnpm format         # format with Prettier
pnpm format:check   # verify formatting
```

---

## Current scope

**Included:** Google Meet caption capture, reliable delivery with sequencing and
local buffering, live transcript, post-meeting actionable notes with transcript
evidence, cross-meeting commitment state, authentication, and workspace
grouping with tenant isolation.

**Not yet included:** Zoom and Teams, public sharing, PDF export, analytics,
general AI chat, broad semantic search, billing, and task-manager integrations.
