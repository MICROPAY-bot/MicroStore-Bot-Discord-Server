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

    try {
      await interaction.member.roles.add(role);
    } catch (err) {
      console.error('Failed to assign verify role:', err);
      await LogService.log(
        interaction.guild,
        'verification-error',
        `⚠️ Gagal memberi role verifikasi ke <@${interaction.user.id}>: ${err.message}. Kemungkinan posisi role bot MICROSTORE lebih rendah dari role "${role.name}" di Server Settings > Roles.`
      ).catch(() => {});
      return interaction.reply({
        content: '❌ Gagal memberi role verifikasi. Hubungi admin (kemungkinan ada masalah permission role bot).',
        ephemeral: true,
      });
    }

    await interaction.reply({ content: '✅ Kamu berhasil diverifikasi!', ephemeral: true });
    await LogService.log(interaction.guild, 'verification', `<@${interaction.user.id}> berhasil verifikasi`);
  },
};
