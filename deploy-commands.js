require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { loadCommands } = require('./src/bot/loadCommands');

const commands = [...loadCommands().values()].map((c) => c.data.toJSON());

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    if (!process.env.CLIENT_ID) {
      console.log('Set CLIENT_ID (dan GUILD_ID untuk guild-only deploy) di .env sebelum deploy.');
      return;
    }

    const route = process.env.GUILD_ID
      ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
      : Routes.applicationCommands(process.env.CLIENT_ID);

    const data = await rest.put(route, { body: commands });
    console.log(`✅ Deployed ${data.length} slash commands.`);
  } catch (err) {
    console.error(err);
  }
})();
