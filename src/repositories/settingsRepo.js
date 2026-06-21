const db = require('../database');

module.exports = {
  get(guildId) {
    return db.prepare('SELECT * FROM settings WHERE guild_id = ?').get(guildId);
  },

  ensure(guildId) {
    db.prepare('INSERT OR IGNORE INTO settings(guild_id) VALUES (?)').run(guildId);
    return this.get(guildId);
  },

  setWelcome(guildId, channelId, message = null, roleId = null) {
    this.ensure(guildId);
    db.prepare(
      `UPDATE settings SET welcome_enabled = 1, welcome_channel = ?, welcome_message = ?, welcome_role = ? WHERE guild_id = ?`
    ).run(channelId, message, roleId, guildId);
  },

  setWelcomeMessage(guildId, message) {
    this.ensure(guildId);
    db.prepare(`UPDATE settings SET welcome_message = ? WHERE guild_id = ?`).run(message, guildId);
  },

  setWelcomeRole(guildId, roleId) {
    this.ensure(guildId);
    db.prepare(`UPDATE settings SET welcome_role = ? WHERE guild_id = ?`).run(roleId, guildId);
  },

  setVerify(guildId, channelId, roleId) {
    this.ensure(guildId);
    db.prepare(`UPDATE settings SET verify_enabled = 1, verify_channel = ?, verify_role = ? WHERE guild_id = ?`)
      .run(channelId, roleId, guildId);
  },

  setBuyerRole(guildId, roleId) {
    this.ensure(guildId);
    db.prepare(`UPDATE settings SET buyer_role = ? WHERE guild_id = ?`).run(roleId, guildId);
  },

  setAdminRole(guildId, roleId) {
    this.ensure(guildId);
    db.prepare(`UPDATE settings SET admin_role = ? WHERE guild_id = ?`).run(roleId, guildId);
  },

  setLogChannel(guildId, channelId) {
    this.ensure(guildId);
    db.prepare(`UPDATE settings SET log_channel = ? WHERE guild_id = ?`).run(channelId, guildId);
  },

  setQrisImage(guildId, url) {
    this.ensure(guildId);
    db.prepare(`UPDATE settings SET qris_image_url = ? WHERE guild_id = ?`).run(url, guildId);
  },
};
