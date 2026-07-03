const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const TicketService = require('../../services/TicketService');
const ProductService = require('../../services/ProductService');

/**
 * Create a private order channel and let the buyer pick a product to purchase.
 * @param {Interaction} interaction
 * @param {number} quantity - how many items the buyer wants to order
 */
module.exports = async function createOrderTicket(interaction, quantity = 1) {
  const channel = await TicketService.createOrderTicket(interaction.guild, interaction.user);
  const products = ProductService.listProducts(interaction.guild.id);

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('order_close').setLabel('Close Ticket').setStyle(ButtonStyle.Secondary)
  );

  if (!products.length) {
    await channel.send({
      content: '⚠️ Belum ada produk yang tersedia. Hubungi admin untuk menambahkan produk.',
      components: [closeRow],
    });
    return channel;
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`order_select_product_q${quantity}`) // Include quantity in customId so handler knows it
    .setPlaceholder('Pilih produk yang ingin dibeli')
    .addOptions(
      products.slice(0, 25).map((p) => ({
        label: p.name,
        description: `Rp${p.price.toLocaleString('id-ID')} × ${quantity}`,
        value: String(p.id),
      }))
    );

  const menuRow = new ActionRowBuilder().addComponents(menu);

  await channel.send({
    content: `👋 <@${interaction.user.id}> Selamat datang di order ticket.\n\n📊 **Jumlah Order: ${quantity}**\n\nSilakan pilih produk:`,
    components: [menuRow, closeRow],
  });

  return channel;
};
