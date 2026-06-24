# Creator Card Microservice — Solution

A REST API for publishing shareable creator profile cards (links + service rates),
built on the provided R17 Node.js backend template. Three endpoints, MongoDB
persistence, no auth, no URL versioning.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/creator-cards` | Create a card (HTTP 200 on success) |
| `GET` | `/creator-cards/:slug` | Public retrieval by slug (respects draft/private rules) |
| `DELETE` | `/creator-cards/:slug` | Delete a card, returns the deleted card |

All responses follow the template envelope: `{ status, message, data }` on success
and `{ status, message, code }` on error.

## Where the code lives (follows the template's layered architecture)

```
endpoints/creator-cards/
  create.js              POST   /creator-cards
  retrieve.js            GET    /creator-cards/:slug
  delete.js              DELETE /creator-cards/:slug
services/creator-card/
  create-creator-card.js     validation + business rules + slug resolution
  retrieve-creator-card.js   ordered access control (NF01 → NF02 → AC03 → AC04)
  delete-creator-card.js     soft delete + deleted-card response
  utils/
    generate-slug.js         title → slug (string ops only, no regex)
    random-alphanumeric.js   slug suffixes
    serialize-card.js        _id → id mapping, access_code omission, deleted normalisation
    validate-card-fields.js  field checks the VSL validator can't express
    throw-business-error.js  maps domain codes → message + HTTP status
models/creator-card.js       Mongoose model (ULID _id, unique slug, paranoid soft-delete)
repository/creator-card/      repository-factory binding
messages/creator-card.js      human-readable error messages
```

`endpoints/creator-cards/` is registered in `app.js` → `ENDPOINT_CONFIGS`.

## Validation strategy

- **Field-level** validation (types, required, lengths, enums) uses the template's
  **VSL validator** and returns **HTTP 400** — see the `*Spec` blocks in each service.
- Field rules VSL can't express (slug/access_code character sets, link URL prefix,
  integer rate amounts) live in `utils/validate-card-fields.js` and also return **400**.
- **Business rules** (slug uniqueness, conditional `access_code`, retrieval access
  control) are thrown via the template's `throwAppError` utility with the custom
  domain codes below.

### Custom error codes

| Code | HTTP | When |
|------|------|------|
| `SL02` | 400 | Slug already taken (client-provided slug is never silently modified) |
| `AC01` | 400 | `access_code` missing on a private card |
| `AC05` | 400 | `access_code` set on a public card |
| `NF01` | 404 | Card not found (also: deleted cards) |
| `NF02` | 404 | Card exists but is a draft |
| `AC03` | 403 | Private card, no access code supplied |
| `AC04` | 403 | Private card, wrong access code |

## Notable implementation details

- **`_id` → `id`:** documents store `_id` (ULID) per MongoDB convention; the
  serializer always exposes it as `id` and never leaks `_id`.
- **`access_code`:** returned in create/delete responses (the creator needs it),
  **never** in the public retrieval response.
- **Slug auto-generation:** lowercase → whitespace to hyphens → strip invalid chars,
  using string operations only (no regex). A random 6-char suffix is appended when
  the base is shorter than 5 chars or already taken.
- **Soft delete:** the model is `paranoid`, so delete sets a `deleted` timestamp and
  mangles the unique slug — deleted cards return `NF01` on retrieval and their slug
  is freed for reuse.
- **Timestamps** are Unix epoch milliseconds; `deleted` is `null` until deleted.

### Minimal core touch-ups

The template's error responses did not emit a `code` field and mapped only a fixed
set of HTTP statuses. Two small, backward-compatible additions make the framework
emit the documented `code` and allow an explicit status per error:

- `core/errors/app-error.js` — passes through an optional `httpStatusCode`.
- `core/express/server.js` — uses that status and includes `code: error.errorCode`
  in error responses (matching the error shape documented in the template README).

## Configuration — what you need to set

The service reads configuration from environment variables (loaded via `dotenv`
from a `.env` file locally, or set in the platform dashboard when deployed).

### Required

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `MONGODB_URI` | **Yes** | `mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/creator_cards` | MongoDB connection string. Use a MongoDB Atlas free-tier cluster for the deployed instance. The DB name (`/creator_cards`) is created automatically. |
| `PORT` | **Yes** (auto on most PaaS) | `3000` | Port the server binds to. Heroku/Render **inject this automatically** — do not hardcode it there. Set it only for local runs. |

That is the entire required set for this assessment. **No auth, no Redis, no email,
no AWS** is needed — those template features are unused by the Creator Card service.

### Optional / unused (leave blank)

The template's `.env.example` lists many more keys (`JWT_*`, `HASH_SALT_ROUNDS`,
`RESEND_*`, `REDIS_URL`, `QUEUE_NAME`, `AWS_*`, `USE_SECRETS_MANAGER`, …). None are
required here:

- The job **queue** is a no-op unless both `REDIS_URL` and `QUEUE_NAME` are set, so
  leaving them blank is safe (no Redis required).
- `USE_SECRETS_MANAGER` must stay unset/empty (otherwise `bootstrap.js` tries to
  load AWS Secrets Manager).
- `USE_MOCK_MODEL` must stay unset/empty in normal runs (it swaps the real DB for
  in-memory stubs — only used by the template's test harness).

A minimal local `.env`:

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/creator_cards
```

## Running locally

```bash
npm install
cp .env.example .env        # then set at least PORT and MONGODB_URI
node bootstrap.js           # or: node app.js
```

Requires a reachable MongoDB (MongoDB Atlas, or local/Docker:
`docker run -d -p 27017:27017 mongo:7`).

## Deploying (MongoDB Atlas + Render/Heroku)

### 1. MongoDB Atlas (free tier)
1. Create a free **M0 cluster** at <https://www.mongodb.com/atlas>.
2. **Database Access** → add a database user (username + password).
3. **Network Access** → allow `0.0.0.0/0` (so the PaaS can connect).
4. **Connect → Drivers** → copy the connection string and put your password in it.
   This is your `MONGODB_URI`.

### 2. Deploy to Render (or Heroku)
- **Build command:** `npm install`
- **Start command:** `node bootstrap.js` (the `Procfile` already declares
  `web: node bootstrap.js` for Heroku).
- **Environment variables to set in the dashboard:** `MONGODB_URI` (from step 1).
  `PORT` is injected by the platform automatically.
- After the first deploy, the unique index on `slug` is created automatically on
  first write.

### 3. Verify the live service
```bash
BASE=https://<your-app>.onrender.com
curl -X POST $BASE/creator-cards -H 'Content-Type: application/json' \
  -d '{"title":"George Cooks","slug":"george-cooks","creator_reference":"crt_8f2k1m9x4p7w3q5z","status":"published"}'
curl $BASE/creator-cards/george-cooks
```

Endpoints live at the **root** of the base URL — `POST {BASE}/creator-cards`,
`GET {BASE}/creator-cards/:slug`, `DELETE {BASE}/creator-cards/:slug` — with **no
`/v1` or `/api` versioning**.

## Submission (manual steps)

1. Push this repository to a **public GitHub repo**.
2. Submit via the assessment Google Form:
   - the public GitHub repo link, and
   - the deployed **BASE URL only** — e.g. `https://<your-app>.onrender.com` —
     **no path, no versioning** (the graders append `/creator-cards` themselves).
