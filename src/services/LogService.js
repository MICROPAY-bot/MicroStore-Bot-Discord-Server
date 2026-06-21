const logRepo = require('../repositories/logRepo');
const settingsRepo = require('../repositories/settingsRepo');

module.exports = {
  /**
   * Record a log entry in DB and mirror it to the configured log channel (if set).
   */
  async log(guild, type, message) {
    logRepo.add(guild.id, type, message);

    const settings = settingsRepo.get(guild.id);
    if (settings && settings.log_channel) {
      const channel = guild.channels.cache.get(settings.log_channel);
      if (channel) {
        await channel.send({ content: `**[${type.toUpperCase()}]** ${message}` }).catch(() => {});
      }
    }
  },
};
