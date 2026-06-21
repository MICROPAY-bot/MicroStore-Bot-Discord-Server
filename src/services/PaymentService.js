const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const orderRepo = require('../repositories/orderRepo');
const paymentRepo = require('../repositories/paymentRepo');
const settingsRepo = require('../repositories/settingsRepo');
const productRepo = require('../repositories/productRepo');
const BuyerService = require('./BuyerService');
const ProductService = require('./ProductService');
const LogService = require('./LogService');

module.exports = {
  /**
   * Step 1: ORDER -> create order + payment record, display QRIS in the order channel.
   */
  async startOrder(channel, user, productId, quantity = 1) {
    const guild = channel.guild;
    const product = productRepo.getById(productId);
    if (!product) {
      await channel.send('❌ Produk tidak ditemukan.');
      return null;
    }

    const totalPrice = product.price * quantity;
    const order = orderRepo.create(guild.id, user.id, product.id, channel.id, quantity);
    const payment = paymentRepo.create(guild.id, order.id, user.id, totalPrice);
    orderRepo.setStatus(order.id, 'awaiting_proof');

    const settings = settingsRepo.get(guild.id);

    const embed = new EmbedBuilder()
      .setTitle(`🧾 Order: ${product.name}`)
      .setDescription(
        `**Jumlah:** ${quantity}x\n**Harga per unit:** Rp${product.price.toLocaleString('id-ID')}\n**Total:** Rp${totalPrice.toLocaleString('id-ID')}\n\nScan QRIS di bawah lalu upload bukti pembayaran (gambar) di channel ini.`
      )
      .setColor(0x2b6cb0);

    if (settings?.qris_image_url) {
      embed.setImage(settings.qris_image_url);
    }

    await channel.send({ embeds: [embed] });
    await LogService.log(guild, 'payment', `Order #${order.id} dibuat oleh <@${user.id}> untuk produk "${product.name}" (qty: ${quantity}, total: Rp${totalPrice.toLocaleString('id-ID')})`);

    return { order, payment, product };
  },

  /**
   * Step 2: Upload Proof -> called when buyer attaches an image in the order channel.
   */
  async submitProof(channel, attachmentUrl) {
    const order = orderRepo.getByChannel(channel.id);
    if (!order || order.status !== 'awaiting_proof') return null;

    const payment = paymentRepo.getLatestByOrder(order.id);
    if (!payment) return null;

    paymentRepo.attachProof(payment.id, attachmentUrl);
    orderRepo.setStatus(order.id, 'reviewing');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`payment_approve_${payment.id}`)
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`payment_reject_${payment.id}`)
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `📥 Bukti pembayaran diterima untuk Order #${order.id}. Menunggu review admin.`,
      components: [row],
    });

    await LogService.log(channel.guild, 'payment', `Bukti pembayaran diupload untuk Order #${order.id}`);

    return { order, payment };
  },

  /**
   * Step 3a: Admin Approve -> Give Buyer Role -> Deliver Product.
   */
  async approve(channel, paymentId, reviewer) {
    const payment = paymentRepo.getById(paymentId);
    if (!payment) return null;

    const order = orderRepo.getById(payment.order_id);
    paymentRepo.approve(payment.id, reviewer.id);
    orderRepo.setStatus(order.id, 'completed');

    const guild = channel.guild;
    await BuyerService.grantBuyerRole(guild, payment.user_id);

    const product = productRepo.getById(order.product_id);
    if (product) {
      await ProductService.deliver(channel, product, order);
    }

    await channel.send(`✅ Pembayaran Order #${order.id} **disetujui** oleh <@${reviewer.id}>. Role buyer diberikan.`);
    await LogService.log(guild, 'payment', `Order #${order.id} APPROVED oleh <@${reviewer.id}>`);

    return { order, payment };
  },

  /**
   * Step 3b: Admin Reject.
   */
  async reject(channel, paymentId, reviewer) {
    const payment = paymentRepo.getById(paymentId);
    if (!payment) return null;

    const order = orderRepo.getById(payment.order_id);
    paymentRepo.reject(payment.id, reviewer.id);
    orderRepo.setStatus(order.id, 'rejected');

    await channel.send(
      `❌ Pembayaran Order #${order.id} **ditolak** oleh <@${reviewer.id}>. Silakan upload ulang bukti pembayaran yang valid.`
    );
    orderRepo.setStatus(order.id, 'awaiting_proof');

    await LogService.log(channel.guild, 'payment', `Order #${order.id} REJECTED oleh <@${reviewer.id}>`);

    return { order, payment };
  },
};
