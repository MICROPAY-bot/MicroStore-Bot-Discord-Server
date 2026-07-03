-- MICROSTORE database schema (merged from scaffold + sprint1 + sprint2)
-- Core tables per DATABASE.md: guilds, users, products, orders, payments, tickets, settings, logs

CREATE TABLE IF NOT EXISTS guilds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT UNIQUE,
  guild_name TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT UNIQUE,
  username TEXT,
  is_verified INTEGER DEFAULT 0,
  is_buyer INTEGER DEFAULT 0
);

-- settings: one row per guild (replaces old guild_settings, kept compatible)
CREATE TABLE IF NOT EXISTS settings (
  guild_id TEXT PRIMARY KEY,
  welcome_enabled INTEGER DEFAULT 0,
  welcome_channel TEXT,
  welcome_message TEXT,
  welcome_role TEXT,
  verify_enabled INTEGER DEFAULT 0,
  verify_channel TEXT,
  verify_role TEXT,
  buyer_role TEXT,
  admin_role TEXT,
  order_category TEXT,
  support_category TEXT,
  log_channel TEXT,
  qris_image_url TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT,
  name TEXT,
  type TEXT,
  price INTEGER,
  description TEXT,
  delivery_content TEXT,
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT,
  user_id TEXT,
  product_id INTEGER,
  channel_id TEXT,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending', -- pending | awaiting_proof | reviewing | completed | rejected | cancelled
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT,
  order_id INTEGER,
  user_id TEXT,
  amount INTEGER,
  proof_url TEXT,
  status TEXT DEFAULT 'pending', -- pending | proof_uploaded | approved | rejected
  reviewed_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME
);

CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT,
  user_id TEXT,
  channel_id TEXT,
  type TEXT, -- order | support
  status TEXT DEFAULT 'open', -- open | closed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT,
  type TEXT,
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Product System: JOKI QUEST form data (filled by buyer after payment approved)
CREATE TABLE IF NOT EXISTS joki_quest_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  guild_id TEXT,
  user_id TEXT,
  discord_email TEXT,
  password_discord TEXT,
  backup_code TEXT,
  catatan TEXT,
  status TEXT DEFAULT 'awaiting_form', -- awaiting_form | submitted | wiped
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME,
  wiped_at DATETIME
);

-- Product System: WEB PANEL form data
CREATE TABLE IF NOT EXISTS web_panel_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  guild_id TEXT,
  user_id TEXT,
  website_name TEXT,
  brand_name TEXT,
  domain TEXT,
  description TEXT,
  extra_features TEXT,
  notes TEXT,
  theme TEXT DEFAULT 'CYBERPUNK',
  status TEXT DEFAULT 'awaiting_form', -- awaiting_form | step1_done | submitted
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME
);

-- Product System: AUTO QUEST VIP delivery file (per guild, replaceable; dashboard will manage this in Phase 2)
CREATE TABLE IF NOT EXISTS vip_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT UNIQUE,
  file_path TEXT,
  original_name TEXT,
  uploaded_by TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Transcript Service: store exported ticket transcripts for audit trail
CREATE TABLE IF NOT EXISTS transcripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT,
  channel_id TEXT,
  channel_name TEXT,
  ticket_type TEXT,
  user_id TEXT,
  content TEXT,
  file_path TEXT,
  exported_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- YouTube Monitor: track which YouTube channels to monitor per guild
CREATE TABLE IF NOT EXISTS youtube_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT,
  channel_id TEXT, -- Discord channel ID where notifications go
  youtube_channel_id TEXT, -- YouTube channel ID (e.g., UCxxxxxx)
  youtube_channel_name TEXT, -- Display name
  last_check DATETIME, -- Last time we checked for new videos
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- YouTube Monitor: track videos we've already notified about (avoid duplicates)
CREATE TABLE IF NOT EXISTS youtube_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT,
  youtube_video_id TEXT, -- Video ID from YouTube
  title TEXT,
  url TEXT,
  published_at DATETIME,
  notified_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
