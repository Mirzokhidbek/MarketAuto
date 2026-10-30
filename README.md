# CarPort

Used-car marketplace: sellers and dealers list cars, buyers search, compare, save searches, like and chat
with sellers. Admins and moderators review listings and reports.

| Part | Folder | Stack |
|---|---|---|
| API | `apps/nestar-api` | NestJS 12, GraphQL (Apollo), MongoDB (Mongoose), WebSocket chat |
| Batch jobs | `apps/nestar-batch` | NestJS: top listings/agents, cleanup of unused uploads |
| Website + admin panel | `nestar-next-develop` | Next.js 15 (pages router), Apollo Client, MUI, i18n (uz / ru / en) |

## Requirements

- **Node.js 24.9 or newer** (`.nvmrc`). NestJS 12 is ESM-only; the unit tests need Node 24's VM modules API.
- MongoDB 7 (local, Docker or Atlas).

## Run locally

```bash
cp .env.example .env              # set SECRET_TOKEN and MONGO_DEV at least
npm ci
npm run start:dev                 # API  -> http://localhost:3007/graphql
npm run start:dev:batch           # batch jobs (optional)

cd nestar-next-develop
npm ci --legacy-peer-deps         # @toast-ui/react-editor still declares React <= 17
npm run dev                       # site -> http://localhost:3000, admin -> /admin
```

Without SMS provider keys the verification code is printed in the API log and returned as `devCode`
(development only). Everything in one go: `cp .env.example .env && docker compose up -d --build`.

## Checks (the same ones CI runs)

```bash
npm run typecheck && npm run lint:check && npm run test:unit
npx nest build nestar-api && node dist/apps/nestar-api/main &   # needs MongoDB
MONGO_URL=mongodb://localhost:27017/<db> npm run test:api       # end-to-end API checks

cd nestar-next-develop && npm run typecheck && npm run build
```

## How the API is organised

```
apps/nestar-api/src
├── components/<feature>/   resolver (GraphQL in/out) -> service (rules, database) per feature:
│                           member, auth, verification (SMS), property, board-article, comment, like,
│                           follow, view, message, notification, report, saved-search, notice,
│                           dashboard, admin-log, setting, exchange (USD/UZS), storage (images)
├── libs/dto, libs/enums    GraphQL types and inputs, validated with class-validator
├── libs/env.ts             every setting (`settings.*`) + startup checks (assertEnv)
├── schemas/                Mongoose models
└── socket/                 WebSocket channel for live chat messages
```

## Security model (short)

- **Sessions:** 1-hour JWT access token + 30-day refresh token in an httpOnly cookie, rotated on use and
  stored hashed (revocable). Status and role are re-read from the database on every request.
- **Who is calling:** `AuthGuard` (login required), `RolesGuard` + `@Roles()` / `@SuperAdminOnly()`,
  `WithoutGuard` (login optional). The verified member is stored on the request (`req.authMember`) and read
  with `@AuthMember()`. It is never taken from the request body.
- **Abuse limits:** login, SMS, code checks, sign-ups, messages, reports and uploads are rate limited
  (`libs/rate-limiter.ts`, in memory; move to Redis before running several API instances).
- **Uploads:** images are re-encoded to WebP. The stored name starts with the uploader's id
  (`uploads/property/<memberId>_<uuid>.webp`), and listings, avatars, article covers and chat photos accept
  only the author's own uploads.
- **Headers:** the API and the site send `nosniff`, `X-Frame-Options: DENY` and a referrer policy; the site also
  sends HSTS, `Permissions-Policy` and a CSP with `frame-ancestors`, `object-src` and `base-uri` rules.

Settings are documented in `.env.example`.
