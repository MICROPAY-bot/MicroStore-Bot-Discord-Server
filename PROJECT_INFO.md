# PROJECT_INFO.md

# MICROSTORE

Status: Active Development. Current Phase: Sprint 4 (towards v1.0.0 Production Ready)

## Objective

Build a private Discord bot for a single Discord server with Railway deployment.

## Stack

- Node.js
- discord.js v14
- SQLite (better-sqlite3)
- Railway
- Express (dashboard phase)

## Current Progress

Completed:
- Scaffold
- Sprint 1 foundation (Welcome, Verification)
- Sprint 2 ticket modules (Support/Order ticket creation)
- Sprint 3 Payment Engine (QRIS Manual, Upload Proof, Approve/Reject, Buyer Role, Product Engine)
- Repository merge (Scaffold + Sprint1 + Sprint2 -> single workspace)

## MVP Features

- Welcome — ✅ Fully configurable (channel + message + role)
- Verification — ✅ Done (dengan log)
- Support Ticket — ✅ Done (private + close + transcript export)
- Order Ticket — ✅ Done (private + quantity + transcript export)
- QRIS Payment — ✅ Done (image + proof + approve/reject)
- Buyer Role — ✅ Auto-grant after approval
- Joki Quest — ✅ Form: Discord Email, Password, Backup Code, Catatan + wipe button
- Auto Quest VIP — ✅ File upload + auto delivery
- Web Panel — ✅ Form: website details (Cyberpunk theme)
- Logs — ✅ Payment + Ticket + Order + Verification + Transcript + YouTube
- Ticket Transcript — ✅ Auto-export on close, file save, downloadable
- YouTube Monitor — ✅ **RSS-based polling, auto-notification on new videos**
- Dashboard API — ✅ Ready for Phase 2 frontend

**🎉 MVP = 100% COMPLETE**

## Development Rules

- Continue existing repository.
- Do NOT recreate project.
- Preserve architecture unless necessary.
- Work sprint-by-sprint.
- Every sprint updates CHANGELOG.md.

## Next Sprint

Sprint 4:
- Ticket transcript export
- JOKI QUEST
- AUTO QUEST VIP
- Logs viewer polish
- Railway hardening
