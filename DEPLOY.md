# CarPort — production deployment

One server with Docker runs the whole stack: `mongo`, `redis` (shared rate limits, cache and live events),
`api` (NestJS GraphQL + WebSocket), `batch` (scheduled jobs) and `web` (Next.js). nginx in front terminates HTTPS. The database setup (managed MongoDB, replica set,
backups) is decided separately; until then the `mongo` container with its `mongo-data` volume is used.

```
browser / mobile app ──https──► nginx ──► web :3000   (carport.uz)
                                     └──► api :3007   (api.carport.uz: /graphql, WebSocket, /uploads, /health)
```

## 1. Server

- Ubuntu 22.04+ (or any Linux with Docker 24+ and the compose plugin), 2 vCPU / 4 GB RAM is enough to start.
- Open ports 80 and 443 only. Ports 3000/3007 stay on localhost (nginx proxies to them); MongoDB is never
  published.
- DNS: `carport.uz` and `www.carport.uz` → server IP, `api.carport.uz` → server IP.

## 2. Settings (`.env` next to `docker-compose.yml`)

`cp .env.example .env` and fill in. The API refuses to start with an unsafe setup (see `assertEnv`) and lists
the optional services that are off.

| Setting | Required | Value |
|---|---|---|
| `SECRET_TOKEN` | yes | random, 32+ characters: `openssl rand -hex 32` |
| `CORS_ORIGINS` | yes | `https://carport.uz,https://www.carport.uz` |
| `TRUST_PROXY` | yes behind nginx | `1` (rate limits see the real client IP) |
| `COOKIE_SAMESITE` | | `lax` when site and API share the domain (`carport.uz` + `api.carport.uz`) |
| `PUBLIC_API_URL` / `PUBLIC_WS_URL` | yes | `https://api.carport.uz` / `wss://api.carport.uz` |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://carport.uz` (sitemap, robots.txt, share previews) |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `MAIL_FROM` | for email sign-up | any SMTP (Gmail app password, Yandex, SendGrid, Amazon SES) |
| `ESKIZ_EMAIL` `ESKIZ_PASSWORD` `ESKIZ_FROM` | for SMS codes | https://eskiz.uz (Uzbek numbers); `TWILIO_*` for other countries |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | recommended | error reports from the API / the browser |
| `REDIS_URL` | set by compose | `redis://redis:6379`; needed for more than one API instance (see §6) |
| `METRICS_TOKEN` | recommended | random string; turns on `GET /metrics` for Prometheus (§5) |
| `LOG_FORMAT` | | `json` (default in production) or `text` |
| `SLOW_REQUEST_MS` / `SLOW_QUERY_MS` | | warn about requests / database commands slower than this (500 / 200) |
| `S3_*` | optional | photos in S3-compatible storage instead of the `uploads` volume |
| `NEXT_PUBLIC_SUPPORT_PHONE` / `NEXT_PUBLIC_SUPPORT_EMAIL` | yes | contacts in the footer and the legal pages |
| `NEXT_PUBLIC_LEGAL_NAME` / `_INN` / `_ADDRESS` | yes | company name, INN (STIR) and address in the Public Offer |

Without SMTP or SMS keys the codes are only written to the API log: sign-up with that channel does not work.
`ADMIN_2FA=off` is refused in production.

## 3. Start

```bash
git clone https://github.com/Mirzokhidbek/MarketAuto.git carport && cd carport
cp .env.example .env && nano .env
docker compose up -d --build
docker compose ps              # mongo, api and web become "healthy"
curl -s localhost:3007/health  # {"status":"ok","database":"up",...}
```

First admin (sign-up never creates admins; the password is read from the environment, not the command line):

```bash
docker compose exec -e ADMIN_PASSWORD='a-long-password-2026' api \
  node scripts/create-admin.mjs --nick boss --phone 998901234567 --role SUPER
```

Admin logins are confirmed with an SMS code to that phone. Then open `https://carport.uz/admin`, check
**System → Import tariff** against the official rates and save it, and fill in **Site settings**.

## 4. nginx + HTTPS

```nginx
# /etc/nginx/sites-available/carport  (certificates: sudo certbot --nginx -d carport.uz -d www.carport.uz -d api.carport.uz)
server {
    listen 443 ssl http2;
    server_name carport.uz www.carport.uz;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name api.carport.uz;
    client_max_body_size 160m;          # up to 10 photos of 15 MB in one upload
    location / {
        proxy_pass http://127.0.0.1:3007;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;      # WebSocket (live messages and notifications)
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-Id $request_id;   # one id in the nginx log and the API log
        proxy_read_timeout 75s;
    }
}

server { listen 80; server_name carport.uz www.carport.uz api.carport.uz; return 301 https://$host$request_uri; }
```

Change the compose port mappings to `127.0.0.1:3000:3000` and `127.0.0.1:3007:3007` so only nginx reaches them.

## 5. Monitoring

- `GET https://api.carport.uz/health` — 200 while the database answers, 503 otherwise
  (`{"status":"ok","database":"up","redis":"up"}`; Redis down is reported but not unhealthy: the API then works
  from memory). Point an uptime monitor (UptimeRobot, Better Stack) at it.
- Sentry receives server and browser errors when the DSNs are set.

### Logs

One JSON object per line. Every line written while serving a request carries its `requestId` (also sent back as the
`X-Request-Id` response header: ask users and the mobile app to quote it) and `route` (the GraphQL operation):

```json
{"level":"log","context":"HTTP","message":"POST getProperties 200 87ms","requestId":"7d5a…","route":"getProperties"}
{"level":"warn","context":"HTTP","message":"slow request: POST login 200 551ms","requestId":"824…","route":"login"}
{"level":"warn","context":"Database","message":"slow query: aggregate properties 312ms pipeline $match,$sort,$skip"}
```

Variables (passwords, codes, phones) are never logged; slow queries show field names, not values.
`docker compose logs -f api | grep slow` lists what to optimize. For search and retention, ship the container
logs to Loki + Grafana, Better Stack or CloudWatch.

### Metrics (Prometheus + Grafana)

`GET /metrics` with `Authorization: Bearer $METRICS_TOKEN` (404 without the setting). Scrape it every 15 s:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: carport-api
    scheme: https
    authorization: { credentials: '<METRICS_TOKEN>' }
    static_configs: [{ targets: ['api.carport.uz'] }]
```

| Metric | Shows |
|---|---|
| `http_request_duration_seconds{route,status}` | time per GraphQL operation (`getProperties`, `login`, …) |
| `graphql_errors_total{route,code}` | errors per operation |
| `db_command_duration_seconds{collection,command}` | MongoDB time per collection |
| `rate_limit_blocked_total{limiter}` | refused logins, SMS codes, uploads… (a spike = an attack) |
| `cache_lookups_total{cache,result}` | cache hit rate |
| `websocket_connections` | open live connections |
| `process_*`, `nodejs_eventloop_lag_*` | memory, CPU, event loop lag |

Useful queries (Grafana panels / alerts):

```promql
# p95 per operation, last 5 minutes
histogram_quantile(0.95, sum by (le, route) (rate(http_request_duration_seconds_bucket[5m])))
# slowest collections
histogram_quantile(0.95, sum by (le, collection) (rate(db_command_duration_seconds_bucket[5m])))
# error rate
sum(rate(graphql_errors_total{code="INTERNAL_SERVER_ERROR"}[5m]))
```

Alert on: p95 of `getProperties` > 500 ms, any `INTERNAL_SERVER_ERROR`, event loop lag > 200 ms, `/health` down.

### Load test

`e2e/load-test.mjs` measures requests per second and p50/p95/p99 of the public operations (read-only). Run it
against a staging copy with production-sized data, from another machine:

```bash
API_URL=https://staging-api.carport.uz/graphql CONCURRENCY=50 SECONDS=30 node e2e/load-test.mjs
```

Reference (one API instance and MongoDB on one 4-core test machine, 18 000 active cars, 20 visitors at once):

| Operation | before | after this release |
|---|---|---|
| `getProperties` newest | 51 req/s, p50 401 ms | 186 req/s, p50 101 ms |
| `getProperties` cheapest | 42 req/s, p50 501 ms | 219 req/s, p50 87 ms |
| `getProperties` brand filter | 54 req/s, p50 384 ms | 169 req/s, p50 112 ms |
| `getCarModels` | 162 req/s, p50 129 ms | 1 616 req/s, p50 12 ms (cached) |
| `getSiteSettings` | 941 req/s | 1 611 req/s (cached) |
| `getProperty` / `getImportCost` | 575 / 391 req/s | 524 / 428 req/s |
| `getProperties` text search | 72 req/s, p50 289 ms | 62 req/s, p50 333 ms (unchanged, see below) |

Text search matches any part of the title, which no MongoDB index can serve: every active car is checked. When
it becomes the slowest operation, move it to Atlas Search (or a separate search index); the rest of the list
query already uses indexes.

## 6. More than one API instance

Everything shared lives in MongoDB and Redis, so the API scales by running more copies behind nginx:

```bash
docker compose up -d --scale api=3
```

Copies cannot share the host port `3007`: replace the `api` service's `ports` with `expose: ['3007']`, and put
nginx in the compose network (`proxy_pass http://api:3007;` — Docker spreads the connections over the copies), or
run each copy on its own machine and list them in an nginx `upstream` block.

- Rate limits, cache and WebSocket events go through Redis (`REDIS_URL`): a message sent through one instance
  reaches the receiver's socket on another, and a blocked member is disconnected everywhere.
- Without Redis, or while it is down, each instance limits and caches on its own; nothing breaks.
- Uploaded photos must be on S3 (`S3_*`) when instances run on different machines (the `uploads` volume is local).
- Run one `batch` instance only (scheduled jobs).

## 7. Updates and rollback

```bash
git pull && docker compose up -d --build     # zero data loss: data lives in the mongo-data and uploads volumes
docker compose logs -f --tail=100 api
git checkout <previous-tag> && docker compose up -d --build   # rollback
```

Tag every release (`git tag v1.0.0 && git push --tags`) so a rollback has a target.

## 8. Before the public launch

- [ ] Terms of Use, Public Offer and Privacy Policy reviewed by a lawyer (`nestar-next-develop/libs/legal.ts`);
      company name, INN and address set (`NEXT_PUBLIC_LEGAL_*`).
- [ ] The server is in Uzbekistan: the law on personal data requires data of Uzbek citizens to be stored there
      (the Privacy Policy says so). Local providers: UzCloud, Uztelecom, Beeline Cloud.
- [ ] Support phone and email are real (`NEXT_PUBLIC_SUPPORT_*`, admin **Site settings**).
- [ ] Import tariff checked against the customs committee rates.
- [ ] SMS (Eskiz) and SMTP deliver codes to a real phone and mailbox.
- [ ] HTTPS everywhere; `https://carport.uz/robots.txt` and `/sitemap.xml` open; sitemap submitted to Google and Yandex.
- [ ] Database: managed MongoDB or replica set with daily backups (separate task).
- [ ] `METRICS_TOKEN` set, Prometheus/Grafana (or Grafana Cloud) scraping `/metrics`, alerts from §5 on.
- [ ] Load test on staging with production-sized data (§5).
