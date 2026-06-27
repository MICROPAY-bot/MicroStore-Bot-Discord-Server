const settingsRepo = require('../repositories/settingsRepo');

const BUMP_INTERVAL_MS = 2 * 60 * 60 * 1000; // Disboard allows /bump every 2 hours

module.exports = {
  /**
   * Periodically remind admins/members to run /bump (e.g. for Disboard) in the
   * configured channel, so the server stays near the top of public listings.
   */
  startReminder(client) {
    setInterval(async () => {
      for (const guild of client.guilds.cache.values()) {
        const settings = settingsRepo.get(guild.id);
        if (!settings || !settings.bump_reminder_enabled || !settings.bump_reminder_channel) continue;

        const channel = guild.channels.cache.get(settings.bump_reminder_channel);
        if (!channel) continue;

        await channel
          .send('⏰ **Waktunya bump server lagi!** Ketik `/bump` di sini supaya MICROSTORE tetap di posisi atas listing 🚀')
          .catch(() => {});
      }
    }, BUMP_INTERVAL_MS);

    console.log('✅ Bump reminder scheduler started (every 2 hours)');
  },
};
