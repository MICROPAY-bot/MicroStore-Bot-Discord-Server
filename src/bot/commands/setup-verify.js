const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const settingsRepo = require('../../repositories/settingsRepo');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-verify')
    .setDescription('Setup verification channel + role')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) => o.setName('channel').setDescription('Channel').setRequired(true))
    .addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const role = interaction.options.getRole('role');
    settingsRepo.setVerify(interaction.guild.id, channel.id, role.id);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('verify_button').setLabel('✅ Verify Me').setStyle(ButtonStyle.Success)
    );

    await channel.send({ content: 'Klik tombol di bawah untuk verifikasi akun kamu.', components: [row] });
    await interaction.reply({ content: 'Verification configured', ephemeral: true });
  },
};
