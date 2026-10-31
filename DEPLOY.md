# CarPort — production deployment

One server with Docker runs the whole stack: `mongo`, `api` (NestJS GraphQL + WebSocket), `batch` (scheduled
jobs) and `web` (Next.js). nginx in front terminates HTTPS. The database setup (managed MongoDB, replica set,
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
        proxy_read_timeout 75s;
    }
}

server { listen 80; server_name carport.uz www.carport.uz api.carport.uz; return 301 https://$host$request_uri; }
```

Change the compose port mappings to `127.0.0.1:3000:3000` and `127.0.0.1:3007:3007` so only nginx reaches them.

## 5. Monitoring

- `GET https://api.carport.uz/health` — 200 while the database answers, 503 otherwise. Point an uptime monitor
  (UptimeRobot, Better Stack) at it.
- `docker compose logs -f api web` — the API logs a warning for every unexpected GraphQL error.
- Sentry receives server and browser errors when the DSNs are set.

## 6. Updates and rollback

```bash
git pull && docker compose up -d --build     # zero data loss: data lives in the mongo-data and uploads volumes
docker compose logs -f --tail=100 api
git checkout <previous-tag> && docker compose up -d --build   # rollback
```

Tag every release (`git tag v1.0.0 && git push --tags`) so a rollback has a target.

## 7. Before the public launch

- [ ] Terms of Use, Public Offer and Privacy Policy reviewed by a lawyer (`nestar-next-develop/libs/legal.ts`);
      company name, INN and address set (`NEXT_PUBLIC_LEGAL_*`).
- [ ] The server is in Uzbekistan: the law on personal data requires data of Uzbek citizens to be stored there
      (the Privacy Policy says so). Local providers: UzCloud, Uztelecom, Beeline Cloud.
- [ ] Support phone and email are real (`NEXT_PUBLIC_SUPPORT_*`, admin **Site settings**).
- [ ] Import tariff checked against the customs committee rates.
- [ ] SMS (Eskiz) and SMTP deliver codes to a real phone and mailbox.
- [ ] HTTPS everywhere; `https://carport.uz/robots.txt` and `/sitemap.xml` open; sitemap submitted to Google and Yandex.
- [ ] Database: managed MongoDB or replica set with daily backups (separate task).
