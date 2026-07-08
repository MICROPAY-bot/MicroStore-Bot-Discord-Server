const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const settingsRepo = require('../../repositories/settingsRepo');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('qris')
    .setDescription('Upload/ganti gambar QRIS untuk pembayaran (langsung upload file, tanpa perlu link)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addAttachmentOption((o) =>
      o.setName('gambar').setDescription('Upload gambar QRIS (JPG/PNG)').setRequired(true)
    ),

  async execute(interaction) {
    const attachment = interaction.options.getAttachment('gambar');

    const isImage = attachment.contentType?.startsWith('image/');
    if (!isImage) {
      await interaction.reply({ content: '❌ File harus berupa gambar (JPG/PNG).', ephemeral: true });
      return;
    }

    settingsRepo.setQrisImage(interaction.guild.id, attachment.url);

    const embed = new EmbedBuilder()
      .setTitle('✅ QRIS Berhasil Diperbarui')
      .setDescription('Gambar QRIS ini akan otomatis muncul di setiap order pembayaran baru.')
      .setImage(attachment.url)
      .setColor(0x57f287);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
