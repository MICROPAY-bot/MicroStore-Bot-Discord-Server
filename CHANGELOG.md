# CHANGELOG.md

## v0.9.0 - Sprint 8 (Discord OAuth2 + Cyberpunk Dashboard) — Phase 2 Complete

### Major Changes

- **Discord OAuth2 login — New**:
  - `src/dashboard/discordOAuth.js` — authorize URL, code exchange, fetch user + guilds,
    permission check (Manage Server / Administrator bit).
  - `src/dashboard/session.js` — dependency-free signed-cookie session store (HMAC-SHA256,
    in-memory). No new npm package needed.
  - `src/dashboard/authRoutes.js` — `GET /auth/login`, `GET /auth/callback`, `GET /auth/me`,
    `POST /auth/logout`. CSRF-protected via short-lived `state` tokens.
  - `dashboardApi.js` now requires a valid session (replaces the old DISCORD_TOKEN bearer
    check), plus a `router.param('guildId', ...)` guard so a logged-in user can only ever
    read/write guilds where they have Manage Server permission AND the bot is installed.
  - New env vars: `APP_BASE_URL` (for building the OAuth2 redirect URI).

- **Cyberpunk dashboard frontend — New** (`public/`):
  - `index.html` — terminal-styled login screen ("MICROSTORE_OS"), Discord login button.
  - `dashboard.html` + `js/app.js` — single-page app shell: sidebar nav, guild switcher,
    user chip. Sections: Analytics, Products, Orders, Payments, Settings, YouTube,
    Logs & Transcripts, Backups — all backed by the existing/extended dashboard API.
  - `css/theme.css` — design tokens (void/panel surfaces, cyan/magenta/amber neon accents,
    Orbitron/Rajdhani/Share Tech Mono type system) and the page's signature element: a
    HUD corner-bracket frame around every panel, plus an ambient scanline sweep
    (respects `prefers-reduced-motion`).
  - New API endpoint `GET /guilds/:guildId/meta` — live channel/role lists from the bot
    client, used to populate Settings/YouTube form dropdowns.
  - Settings UI now covers all fields the `/setup-*` commands support (previously the API
    only handled 3 of them).

### Bug fix
- Dashboard's product-create endpoint sent snake_case `delivery_content`, but
  `productRepo.add()` expects camelCase `deliveryContent` — delivery content from the
  dashboard was silently saved as empty. Fixed in `dashboardApi.js`. Also fixed the
  product-type dropdown, which previously sent `general/joki/vip` — values that don't
  match what `ProductService` actually checks (`general/joki_quest/auto_quest_vip/web_panel`).

### Phase 2 status
**✅ 100% DONE** — Dashboard, Discord OAuth2, Product Manager, Settings are all implemented.
**All three ROADMAP phases (MVP, Phase 2, Phase 3) are now complete.**

## v0.8.0 - Sprint 7 (Analytics + Backup) — Phase 3 Complete

### Major Changes

- **Analytics — New**:
  - `AnalyticsService` with guild-scoped aggregate queries: total revenue, approved payment count,
    total orders, unique buyers, average order value, orders-by-status breakdown, top 5 products
    by revenue, ticket counts by type/status, daily revenue timeline, and recent sales feed.
  - New command `/analytics` (admin only) — shows a summary embed in Discord.
  - New dashboard endpoints:
    - `GET /api/dashboard/guilds/:guildId/analytics` — full summary
    - `GET /api/dashboard/guilds/:guildId/analytics/timeline?days=30` — daily revenue chart data
    - `GET /api/dashboard/guilds/:guildId/analytics/recent-sales?limit=10` — recent sales feed

- **Backup System — New**:
  - `BackupService` using better-sqlite3's online/hot `db.backup()` API (safe to run on a live,
    WAL-mode database — does not require stopping the bot).
  - Automatic scheduled backup every 24h (configurable), with auto-prune keeping the last 14
    backups by default, started from the `ready` event alongside YouTube polling.
  - New commands:
    - `/backup-create` (admin only) — creates a backup now, attaches the `.db` file in Discord
      if under 8MB, otherwise points to the file on disk / dashboard download.
    - `/backup-list` (admin only) — lists stored backups with size and timestamp.
  - New dashboard endpoints:
    - `GET /api/dashboard/backups` — list all backups
    - `POST /api/dashboard/backups` — trigger a new backup on demand
    - `GET /api/dashboard/backups/:filename/download` — download a specific backup file
  - Backups are stored in `uploads/backups/` (same ephemeral-on-Railway caveat as the main DB —
    see KNOWN_ISSUES.md; a Railway Volume is required for backups to actually persist).
  - Backup covers the **entire** shared database file (all guilds), since MICROSTORE uses a
    single SQLite file for every guild it serves — there is no per-guild backup/restore.

### Phase 3 status
**✅ 100% DONE** — YouTube Update (Sprint 6), Analytics, and Backup are all implemented.

## v0.7.0 - Sprint 6 (YouTube Monitor)

### Major Changes

- **YouTube Monitor — Complete Implementation**:
  - Monitor YouTube channels for new videos, send notifications to Discord automatically.
  - Uses RSS feed (no API key required; polling-based).
  - Parses YouTube RSS XML to extract video metadata (title, ID, published date).
  - Avoids duplicate notifications — tracks notified videos in `youtube_videos` table.
  - Polls every 10 minutes (configurable via `YouTubeService.startPolling(client, minutes)`).
  - New commands:
    - `/youtube-add [channel_id] [name] [notify_channel]` — add YouTube channel to monitor
    - `/youtube-remove [monitor_id]` — remove monitoring
    - `/youtube-list` — list all monitored channels with last check time
  - Notifications sent as embeds to configured Discord channel (title, link, timestamp, channel name).
  - New `youtube_channels` and `youtube_videos` tables.
  - New `youtubeChannelRepo` and `youtubeVideoRepo` repositories.
  - New `YouTubeService` with RSS parsing and polling logic.
  - YouTube polling starts automatically on bot `ready` event.
  - Dashboard API endpoints:
    - `GET /api/dashboard/guilds/:guildId/youtube/channels` — list monitored channels
    - `POST /api/dashboard/guilds/:guildId/youtube/channels` — add new monitoring
    - `DELETE /api/dashboard/youtube/channels/:channelId` — remove monitoring
    - `GET /api/dashboard/guilds/:guildId/youtube/videos` — list notified videos

### Infrastructure
- `YouTubeService.startPolling()` called from `ready` event, ensures polling begins once client is authenticated.
- YouTube channel ID format validated (UC + 22 alphanumeric chars).

## v0.6.0 - Sprint 5 (Ticket Transcript Export)

### Major Changes

- **Ticket Transcript Export — Complete Implementation**:
  - `TranscriptService` now properly fetches entire message history from ticket channel (paginated, handles 100+ messages).
  - Formats messages with timestamp, author, content, embeds, attachments, components.
  - Saves transcript as `.txt` file to `uploads/transcripts/`.
  - Records stored in new `transcripts` table (tracks guild, channel, type, user, file path, export time).
  - When `/support-close` or order close button is clicked:
    - Automatically exports transcript before channel deletion.
    - Shows user message confirming export with message count and filename.
    - Logs event to LogService.
  - New `transcriptRepo` with `save()`, `getById()`, `listByGuild()` methods.
  - New dashboard endpoints:
    - `GET /api/dashboard/guilds/:guildId/transcripts` — list all transcripts for a guild
    - `GET /api/dashboard/transcripts/:transcriptId/download` — stream transcript file (`.txt`)

### Infrastructure
- Database schema gains `transcripts` table.
- Migration helper in `database/index.js` remains idempotent.

## v0.5.0 - Sprint 4 Revision (Order Quantity + Welcome + Verification Log + Dashboard API)

### Major Changes

- **Product Delivery System — Revised**:
  - **JOKI QUEST** revamped: form now collects **Discord Email, Password Discord, Code Backup/Auth (2FA), Catatan** (4 fields, single modal instead of 2 steps).
  - After form submit, shows an embed with the submitted data + a **"🗑️ Hapus Data Login"** button so admin can wipe sensitive credentials from the database once the joki job is done. This prevents login data from accumulating indefinitely.
  - AUTO QUEST VIP and WEB PANEL unchanged (still 2-step modal forms per spec).

- **Order Quantity System**:
  - `/order` command now shows a modal asking "Berapa jumlah yang ingin dibeli?" before opening the order ticket.
  - Order ticket displays the quantity and shows all product prices multiplied by quantity.
  - `orders` table gains a `quantity` column; QRIS embed shows "Jumlah: {qty}x, Harga per unit: Rp..., Total: Rp...".
  - PaymentService.startOrder now accepts quantity parameter.

- **Welcome System — Now Fully Configurable**:
  - `/setup-welcome` command now accepts optional `message` and `role` parameters.
  - Welcome message supports `{user}` and `{server}` placeholders.
  - `guildMemberAdd` event now applies the custom welcome message + auto-assigns the welcome role (if configured).
  - Schema adds `welcome_message` and `welcome_role` columns to `settings` table.

- **Verification Logging**:
  - `verifyButton` handler now logs verification events to LogService (was missing before).

- **Dashboard API (Phase 2 Groundwork)**:
  - New `/api/dashboard` endpoints (requires `Authorization: Bearer <DISCORD_TOKEN>` header for now; Discord OAuth2 in Phase 2):
    - `GET /api/dashboard/guilds/:guildId/settings` — retrieve guild settings
    - `PUT /api/dashboard/guilds/:guildId/settings` — update welcome message, welcome role, QRIS image URL
    - `GET /api/dashboard/guilds/:guildId/products` — list products
    - `POST /api/dashboard/guilds/:guildId/products` — add new product
    - `GET /api/dashboard/guilds/:guildId/orders` — list orders
    - `GET /api/dashboard/guilds/:guildId/payments` — list payments
    - `GET /api/dashboard/guilds/:guildId/logs` — list logs (supports optional `?type=payment&type=ticket&type=verification`)
  - All repositories gain `listByGuild()` / `getByGuild()` methods to support dashboard queries.

### Infrastructure
- Database migrations made truly idempotent: `src/database/index.js` now checks `PRAGMA table_info()` before adding columns, safe for users upgrading from older schema versions.
- `orderQuantityModal.js` handler validates numeric input and enforces max 999 per ticket.

### Removed
- Removed old `joki-create.js` and `vip-add.js` commands (superseded by automatic post-payment flow).

## v0.4.0 - Sprint 4 (Product Delivery System)

- Implemented **Product Delivery System**, branched by `product.type` in `ProductService.deliver()`:
  - **JOKI QUEST** (`JokiQuestService`): after payment approved, sends a button that opens a
    2-step chained modal form (Discord modals cap at 5 inputs, spec needs 6 fields) collecting
    Username Game, UID, Target Quest, Email Login, Password Login, Catatan Tambahan. Data is
    stored in the new `joki_quest_orders` table and posted as an embed in the private order
    channel for the admin to act on.
  - **AUTO QUEST VIP** (`AutoQuestVipService`): admin uploads/replaces the delivery `.zip` via
    new `/vip-set-file` command (Discord attachment, downloaded and stored under `uploads/vip/`,
    tracked in new `vip_files` table). On payment approval the file is sent automatically in the
    order channel. This is a stand-in for the dashboard file manager planned in Phase 2.
  - **WEB PANEL** (`WebPanelService`): same 2-step modal pattern, collecting Nama Website, Nama
    Brand, Domain, Deskripsi Website, Fitur Tambahan, Catatan into new `web_panel_orders` table.
    Default theme stored as `CYBERPUNK`.
- Added `joki_quest_orders`, `web_panel_orders`, `vip_files` tables to `database/schema.sql`.
- Added repositories: `jokiQuestRepo`, `webPanelOrderRepo`, `vipFileRepo`.
- Added interaction handlers: `jokiFormButton`, `jokiModalSubmit`, `webFormButton`, `webModalSubmit`.
- `interactionCreate.js` router now also handles `isModalSubmit()` interactions.
- `/product-add` `type` option is now a fixed choice list (`general` / `joki_quest` /
  `auto_quest_vip` / `web_panel`) instead of free text, so delivery branching can't silently fail
  due to a typo.
- Removed obsolete stub commands `joki-create.js` and `vip-add.js` (superseded by the automatic
  post-payment flow + `/vip-set-file`).
- `PaymentService.approve()` now passes the `order` object into `ProductService.deliver()` so
  delivery handlers know who the buyer is and which order to attach data to.

## v0.3.0 - Sprint 3 (Done)

- Merged Scaffold + Sprint1 + Sprint2 into a single unified workspace (`src/`)
  following the layered architecture in ARCHITECTURE.md:
  Discord Client -> Handlers -> Commands -> Events -> Interactions -> Services -> Repositories -> SQLite
- Implemented Payment Engine (`PaymentService`):
  - Order -> QRIS Display -> Upload Proof -> Admin Approve/Reject -> Buyer Role -> Product Delivery
- Implemented Product Engine (`ProductService`, `/product-add`, `/product-list`)
- Implemented Buyer Role granting (`BuyerService`) on payment approval
- Implemented `orderTicket.js` and `supportTicket.js` (previously TODO stubs)
- Added `/setup-buyer-role` and `/setup-payment` (admin role, QRIS image, log channel) commands
- Added `/order` and `/support` slash commands to open ticket flows
- Added LogService writing to DB (`logs` table) and mirroring to a configured log channel
- Merged database schema (guilds, users, settings, products, orders, payments, tickets, logs)
  with backward-compatible migration from the old `guild_settings` table
- Added Railway deployment config (`railway.json`, `Procfile`)

## v0.2.0

- Support Ticket
- Order Ticket
- Initial QRIS flow design

## v0.1.0

- Project Scaffold
- Discord Bot base
- SQLite initialization
- Welcome framework
- Verification framework

## Goal

Next stable release: v1.0.0 Production Ready
