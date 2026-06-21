const settingsRepo = require('../../repositories/settingsRepo');
const LogService = require('../../services/LogService');

module.exports = {
  customId: 'verify_button',
  async execute(interaction) {
    const settings = settingsRepo.get(interaction.guild.id);
    if (!settings || !settings.verify_role) {
      return interaction.reply({ content: '⚠️ Verification belum dikonfigurasi.', ephemeral: true });
    }

    const role = interaction.guild.roles.cache.get(settings.verify_role);
    if (!role) {
      return interaction.reply({ content: '⚠️ Role verifikasi tidak ditemukan.', ephemeral: true });
    }

    await interaction.member.roles.add(role).catch(() => null);
    await interaction.reply({ content: '✅ Kamu berhasil diverifikasi!', ephemeral: true });

    await LogService.log(interaction.guild, 'verification', `<@${interaction.user.id}> berhasil verifikasi`);
  },
};
