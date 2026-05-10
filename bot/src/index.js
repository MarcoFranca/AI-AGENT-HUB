import { Client, GatewayIntentBits } from "discord.js";
import { runtime } from "./config.js";
import { handleCommand } from "./handlers.js";
import { logAction } from "./log.js";
import { createProgressReporter } from "./progress-reporter.js";
import { sendDiscordResponse } from "./discord-response.js";

if (!runtime.discordToken) {
  throw new Error("Configure DISCORD_TOKEN no .env");
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  await interaction.deferReply({ ephemeral: true });

  try {
    const userId = interaction.user.id;
    const reporter = createProgressReporter({
      interaction,
      commandName: interaction.commandName,
      userId,
      agent: "unknown"
    });
    const output = await handleCommand({
      commandName: interaction.commandName,
      userId,
      channelId: interaction.channelId,
      reporter,
      options: {
        name: interaction.options.getString("name"),
        prompt: interaction.options.getString("prompt"),
        text: interaction.options.getString("text"),
        id: interaction.options.getString("id"),
        scope: interaction.options.getString("scope"),
        confirm: interaction.options.getString("confirm")
      }
    });
    await sendDiscordResponse(interaction, output, interaction.commandName);
  } catch (error) {
    logAction({ command: interaction.commandName, error: error.message });
    await interaction.editReply(`Erro: ${String(error.message).slice(0, 1800)}`);
  }
});

client.once("ready", () => {
  console.log(`AI Agent Hub conectado como ${client.user.tag}`);
});

client.login(runtime.discordToken);
