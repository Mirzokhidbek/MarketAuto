# CarPort API for mobile apps (iOS / Android / Flutter / React Native)

The website and the mobile apps use the same API. Nothing is web-only: every screen of the site is built from
the GraphQL operations below.

| | |
|---|---|
| GraphQL | `POST https://api.carport.uz/graphql` (JSON body `{ "query", "variables" }`) |
| Live events | `wss://api.carport.uz` (WebSocket) |
| Images | `https://api.carport.uz/<path>` for stored paths such as `uploads/property/…webp`; full `https://` URLs (S3) as they are |
| Health | `GET https://api.carport.uz/health` → `{"status":"ok"}` |

The schema is the source of truth. In development (`NODE_ENV` ≠ production) the API serves GraphiQL and
introspection at `/graphql`; generate types from it (e.g. `graphql-codegen`, Apollo iOS/Kotlin). Production
turns introspection off, so commit the generated schema with the app.

## 1. Headers

| Header | When |
|---|---|
| `Content-Type: application/json` | every request |
| `X-Client: mobile` | **every request from the app.** Tokens then travel in the response body and headers, never in cookies |
| `Authorization: Bearer <accessToken>` | logged-in requests |
| `X-Refresh-Token: <refreshToken>` | `refreshSession`, `logout`, `getMySessions`, `logoutOtherSessions` |
| `X-Request-Id: <uuid>` | optional; every answer carries one. Show it in error reports: support finds the request in the logs by it |

One request may hold at most 15 root fields and 400 selected fields, nested at most 10 levels; split bigger
screens into several queries.

## 2. Sign-up and login

Codes are 6 digits, valid 5 minutes, 5 attempts; requests are rate limited (HTTP 429 → message
`Too many attempts. Please try again later.`). In development the result carries `devCode`.

```graphql
# phone (SMS) or email code — purpose: SIGNUP | RESET_PASSWORD | LOGIN (phone only) | VERIFY_EMAIL (email only)
mutation { requestPhoneCode(input: { phone: "998901234567", purpose: SIGNUP }) { sent expiresIn devCode } }
mutation { requestEmailCode(input: { email: "ali@mail.uz", purpose: SIGNUP }) { sent expiresIn devCode } }

mutation ($i: MemberInput!)      { signup(input: $i)          { _id memberNick accessToken refreshToken } }
mutation ($i: EmailSignupInput!) { signupWithEmail(input: $i) { _id memberNick accessToken refreshToken } }

# memberNick takes a nickname, a phone or an email
mutation { login(input: { memberNick: "ali@mail.uz", memberPassword: "Mashina2026" }) { _id accessToken refreshToken } }
mutation { loginWithCode(input: { phone: "998901234567", code: "123456" }) { accessToken refreshToken } }
mutation { resetPassword(input: { email: "ali@mail.uz", code: "123456", newPassword: "Yangi2026parol" }) { accessToken refreshToken } }
```

New passwords: 8–64 characters, letters and digits, not a common password, not containing the nickname or the
email name. The server answers `Password must be 8-64 characters…` otherwise.

## 3. Tokens

- `accessToken` — JWT, **15 minutes**. Keep it in memory. It carries only `_id`, nick, role and avatar; load the
  profile with `getMe`.
- `refreshToken` — **30 days**, one use. Store it in the Keychain (iOS) / EncryptedSharedPreferences or
  Keystore (Android), never in plain storage.

```graphql
# header X-Refresh-Token: <refreshToken>
mutation { refreshSession { accessToken refreshToken } }
```

Every refresh returns a **new** refresh token; save it before using the access token. The old one stops
working. If an old refresh token is used again later, the server treats it as stolen and ends every session of
the account (`Your session was used from another device. Please log in again.`). So refresh from one place in
the app at a time (a mutex / single in-flight request), and on any `UNAUTHENTICATED` answer from
`refreshSession` go to the login screen.

Recommended flow: refresh when the access token has < 60 s left (read `exp` from the JWT) or after an
`UNAUTHENTICATED` error, then retry the request once.

```graphql
mutation { logout }                 # with X-Refresh-Token
query { getMySessions { _id userAgent startedAt lastActiveAt current } }
mutation { revokeMySession(sessionId: "…") }
mutation { logoutOtherSessions }
```

Send a descriptive `User-Agent` (`CarPort-iOS/1.2.0 (iPhone 15; iOS 18.1)`): it is shown in Profile → Devices
and decides the "login from a new device" email.

## 4. Main screens

| Screen | Operations |
|---|---|
| Home / search | `getProperties(input: { page, limit ≤ 100, sort, direction, search: { … } })`, `getCarModels(brand)` |
| Car page | `getProperty(propertyId)`, `getPriceEstimate`, `getImportCost(propertyId)`, `likeTargetProperty` |
| Import cost | `getImportCost` → `items[]` (SHIPPING, DUTY, EXCISE, VAT, UTILIZATION, CLEARANCE), `totalUsd`, `totalUzs`, `comparison`, `warnings[]`; refresh every 60 s while visible |
| Currency | `getExchangeRate { usdToUzs updatedAt source }` — prices are stored in USD |
| Profile | `getMe`, `updateMember`, `changePassword`, `changePhone`, `changeEmail` |
| My cars | `createProperty` (needs a confirmed phone), `updateProperty`, `getAgentProperties` |
| Messages | `getConversations`, `getMessages`, `sendMessage`, `getUnreadMessagesCount` |
| Notifications | `getNotifications(input: { page, limit, unreadOnly, category })`, `markNotificationsRead(ids)`, `removeNotifications` |
| Support | `getNotices`, `createInquiry`, `getMyInquiries` |

Exact arguments and fields: the GraphQL schema.

## 5. Uploading photos

[GraphQL multipart request](https://github.com/jaydenseric/graphql-multipart-request-spec), the same as the site:

```
POST /graphql  (multipart/form-data, with Authorization and X-Client headers)
operations = {"query":"mutation($files:[Upload!]!,$target:String!){imagesUploader(files:$files,target:$target)}","variables":{"files":[null,null],"target":"property"}}
map        = {"0":["variables.files.0"],"1":["variables.files.1"]}
0, 1       = the image files (jpeg, png, webp, heic; ≤ 15 MB each, ≤ 10 per request)
```

`target`: `property`, `member`, `article` or `message`. The answer is the list of stored paths; put them in
`propertyImages` / `memberImage`. Only paths you uploaded yourself are accepted. Limit: 100 photos per hour.

## 6. Live events (WebSocket)

```
connect wss://api.carport.uz
send    {"event":"auth","data":{"token":"<accessToken>"}}     ← within 10 s, as the first frame
receive {"event":"privateMessage","conversationId":"…","message":{…}}
receive {"event":"notification","notification":{"_id":"…","notificationType":"LIKE"}}
```

Close codes: `4001` the access token expired (refresh, reconnect), `4401` rejected or the session was ended
(do not retry in a loop; log in again). Reconnect with a growing delay (1 s, 2 s, 4 s … 30 s). When the app comes
to the foreground, reconnect and re-fetch the unread counts. For notifications while the app is closed, add
push (FCM / APNs) — not in the API yet.

## 7. Errors and languages

Errors come as GraphQL `errors[0].message` with an English sentence (e.g. `Wrong login or password!`) and
`extensions.code`. The app translates them the way the site does: the keys and Uzbek/Russian texts are in
`nestar-next-develop/public/locales/{uz,ru,en}/common.json`. Validation errors carry the first failed rule.

## 8. Web app (PWA)

The site itself installs as an app: Android Chrome offers "Install", iOS Safari "Add to Home Screen". It opens
full screen with the CarPort icon, keeps public pages and assets for poor connections, and shows an offline
page without a network (`public/sw.js`, `public/site.webmanifest`).
