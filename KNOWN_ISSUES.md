# KNOWN ISSUES

- [RESOLVED] Repository was previously split across Scaffold, Sprint1, Sprint2 zips.
  Now merged into a single workspace (`server.js`, `src/`, `database/`).
- [RESOLVED] JOKI QUEST, AUTO QUEST VIP, and WEB PANEL are now implemented
  (Sprint 4) and wired into `ProductService.deliver()`, triggered automatically
  when an admin approves a payment.
- Joki Quest / Web Panel forms use **2 chained modals** because Discord caps
  modals at 5 text inputs each, while the spec needs 6 fields per form. This
  is by design, not a bug — but it means buyers see "Form (1/2)" then "(2/2)".
- Joki Quest stores the game **password in plaintext** in `joki_quest_orders`
  (required so admin can actually perform the quest) and displays it in the
  private order channel embed. The channel is already buyer+admin-only, but
  recommend periodically clearing old rows / deleting completed ticket
  channels once the joki job is done.
- `vip_files` are stored on local disk (`uploads/vip/`). On Railway this is
  **ephemeral** — same caveat as the SQLite DB below.
- **Web Panel / Dashboard is still a placeholder** (`src/dashboard/`) — Phase 2 work.
- **Railway + SQLite**: the DB file (`microstore.db`) and everything in `uploads/`
  (VIP files, transcripts, backups) now automatically follow Railway's
  auto-injected `RAILWAY_VOLUME_MOUNT_PATH` env var when a Volume is attached
  (see `src/utils/dataDir.js`). **The code is ready, but the Volume itself
  must still be created/attached manually** — this is a platform action that
  cannot be done from this repo or by an AI assistant; it requires access to
  your Railway dashboard or CLI. Steps:
  1. Open your service in the Railway dashboard → press `⌘K` (or right-click
     the project canvas) → "New" → "Volume".
  2. Attach it to this service and set a mount path, e.g. `/data`.
  3. Redeploy the service. Railway will automatically set
     `RAILWAY_VOLUME_MOUNT_PATH=/data` for you — no other config needed.
  4. Without this step, the DB and all uploads are wiped on every redeploy.
- Must attach a Railway Volume to the service before going to production.
- **Backups** also live under `uploads/backups/`, so they're covered by the
  same Volume — once attached, scheduled and manual backups persist too.
  For real disaster recovery, periodically download backups via
  `/backup-create` or the dashboard `GET /api/dashboard/backups/:filename/download`
  endpoint and store them somewhere off-server (Railway Volumes protect
  against redeploys wiping data, but not against the volume itself being
  deleted).
- Verification events are not yet written to `LogService` (Payment Log and
  Ticket Log work; Verification Log does not exist yet).
- **Dashboard OAuth2 setup required before first use**: Discord rejects the
  login if the redirect URL isn't registered. In the Discord Developer
  Portal → your app → OAuth2 → Redirects, add exactly:
  `<APP_BASE_URL>/auth/callback` (e.g. `https://yourapp.up.railway.app/auth/callback`).
  Must match `APP_BASE_URL` in your `.env` exactly (including http vs https).
- **Dashboard sessions are in-memory** (see `src/dashboard/README.md`) — fine
  for a single Railway instance, but everyone gets logged out on restart/redeploy.
- No automated test suite yet; current verification is static (syntax check +
  module-wiring dry run) since this sandbox has no network access to install
  `discord.js` / `better-sqlite3` for a live runtime test. Run `npm install`
  and test against a real bot token before deploying to Railway.
