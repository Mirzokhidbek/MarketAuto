# Seed data

`data.json` — test data for the database, `uploads/` — the pictures it points to.

| Collection | Count | Contents |
|---|---|---|
| `members` | 19 | 1 admin, 6 dealers (`AGENT`), 12 buyers/sellers (1 of them blocked) |
| `properties` | 64 | 52 active, the rest pending / sold / rejected; 2/3 in Uzbekistan, 1/3 abroad (Korea, China, ...) |
| `boardArticles` | 8 | news, tips, service, free talk |

Every car has 3 pictures (side, back, interior), every member an avatar, every article a cover:
219 WebP files named like real uploads (`uploads/property/<sellerId>_<uuid>.webp`), so the API's
"only your own pictures" check accepts them.

## Test accounts

All accounts share the password `carport123` (stored only as a bcrypt hash in `data.json`).
Log in with the nick: `admin` (super admin), `autoleader`, `koreacars`, `chinaev`, `samavto`,
`premiumuz`, `fergonaavto` (dealers), or any user nick from `data.json`.

## Format

MongoDB Extended JSON: ids are `{"$oid": "..."}`, dates `{"$date": "..."}`. Read it with
`EJSON.parse` (the `bson` package) to get real `ObjectId` / `Date` values. `_info` is metadata, not a collection.

## Regenerate

```bash
node seed/generate.mjs
```

The output is deterministic: the same ids, data and pictures every time.

## Loading into MongoDB (later)

1. Copy `seed/uploads/*` into the API's `uploads/` folder (or to S3 when `S3_BUCKET` is set).
2. Insert `members`, `properties` and `boardArticles` from `data.json` into the collections of the same name.
