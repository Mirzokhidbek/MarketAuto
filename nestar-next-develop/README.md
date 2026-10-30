# MarketAuto — website and admin panel

Next.js 15 (pages router) app for the MarketAuto API. See the main [README](../README.md) for the whole project.

```bash
npm ci --legacy-peer-deps   # @toast-ui/react-editor still declares React <= 17
npm run dev                 # http://localhost:3000, admin panel at /admin
npm run typecheck
npm run build
```

API addresses are read at build time from `REACT_APP_API_URL`, `REACT_APP_API_GRAPHQL_URL` and `REACT_APP_API_WS`
(see `docker-compose.yml`). Translations live in `public/locales/{uz,ru,en}/common.json`.

| Folder | What is there |
|---|---|
| `pages/` | routes; `pages/_admin` is the admin panel (`/admin` redirects there) |
| `libs/components/` | UI by area: `car`, `mypage`, `community`, `admin`, `layout`, `ui`, ... |
| `libs/auth/` | login, sessions and token refresh |
| `libs/upload.ts` | image uploads (GraphQL multipart) |
| `apollo/` | Apollo client, reactive store, queries and mutations |
