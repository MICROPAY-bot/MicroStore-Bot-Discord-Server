const settingsRepo = require('../../repositories/settingsRepo');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member) {
    const settings = settingsRepo.get(member.guild.id);
    if (!settings || !settings.welcome_enabled || !settings.welcome_channel) return;

    const channel = member.guild.channels.cache.get(settings.welcome_channel);
    if (channel) {
      // Use custom message if set, otherwise fallback to default
      const message = settings.welcome_message || `👋 Selamat datang {user} di {server}`;
      const formatted = message.replace('{user}', `<@${member.id}>`).replace('{server}', member.guild.name);

      await channel.send(formatted).catch(() => {});

      // Give welcome role if configured
      if (settings.welcome_role) {
        const role = member.guild.roles.cache.get(settings.welcome_role);
        if (role) {
          await member.roles.add(role).catch(() => {});
        }
      }
    }
  },
};
