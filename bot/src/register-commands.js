import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { runtime } from "./config.js";

const commands = [
  new SlashCommandBuilder().setName("projects").setDescription("Lista projetos permitidos"),
  new SlashCommandBuilder()
    .setName("set-project")
    .setDescription("Define o projeto ativo")
    .addStringOption((option) => option.setName("name").setDescription("Nome no registry").setRequired(true)),
  new SlashCommandBuilder().setName("agents").setDescription("Lista agentes disponiveis"),
  new SlashCommandBuilder()
    .setName("use-agent")
    .setDescription("Define o agente ativo")
    .addStringOption((option) => option.setName("name").setDescription("Nome do agente").setRequired(true)),
  new SlashCommandBuilder().setName("agent-status").setDescription("Mostra agente e projeto ativos"),
  new SlashCommandBuilder()
    .setName("codex")
    .setDescription("Executa Codex CLI no projeto ativo")
    .addStringOption((option) => option.setName("prompt").setDescription("Pedido para o Codex").setRequired(true)),
  new SlashCommandBuilder().setName("analyze-project").setDescription("Resume o projeto ativo com modelo local"),
  new SlashCommandBuilder()
    .setName("local")
    .setDescription("Usa modelo local via Ollama")
    .addStringOption((option) => option.setName("prompt").setDescription("Pedido local").setRequired(true)),
  new SlashCommandBuilder()
    .setName("skill-create")
    .setDescription("Cria rascunho de skill reutilizavel")
    .addStringOption((option) => option.setName("prompt").setDescription("Objetivo da skill").setRequired(true)),
  new SlashCommandBuilder().setName("skills").setDescription("Lista skills reutilizaveis"),
  new SlashCommandBuilder().setName("skill-suggestions").setDescription("Lista sugestoes de skills pendentes"),
  new SlashCommandBuilder()
    .setName("skill-approve")
    .setDescription("Aprova sugestao de skill")
    .addStringOption((option) => option.setName("id").setDescription("ID da sugestao").setRequired(true)),
  new SlashCommandBuilder()
    .setName("skill-reject")
    .setDescription("Rejeita sugestao de skill")
    .addStringOption((option) => option.setName("id").setDescription("ID da sugestao").setRequired(true)),
  new SlashCommandBuilder()
    .setName("memory-save")
    .setDescription("Salva uma regra/memoria do projeto")
    .addStringOption((option) => option.setName("text").setDescription("Memoria").setRequired(true)),
  new SlashCommandBuilder().setName("memory-show").setDescription("Mostra memoria do usuario, canal, projeto e sessao"),
  new SlashCommandBuilder()
    .setName("memory-clear")
    .setDescription("Apaga memoria com confirmacao textual")
    .addStringOption((option) =>
      option
        .setName("scope")
        .setDescription("Escopo da memoria")
        .setRequired(true)
        .addChoices(
          { name: "user", value: "user" },
          { name: "channel", value: "channel" },
          { name: "project", value: "project" },
          { name: "session", value: "session" }
        )
    )
    .addStringOption((option) => option.setName("confirm").setDescription("Digite CONFIRMAR").setRequired(true)),
  new SlashCommandBuilder().setName("memory-summarize").setDescription("Resume memoria persistente atual")
].map((command) => command.toJSON());

if (!runtime.discordToken || !runtime.discordClientId || !runtime.discordGuildId) {
  throw new Error("Configure DISCORD_TOKEN, DISCORD_CLIENT_ID e DISCORD_GUILD_ID no .env");
}

const rest = new REST({ version: "10" }).setToken(runtime.discordToken);
await rest.put(Routes.applicationGuildCommands(runtime.discordClientId, runtime.discordGuildId), { body: commands });
console.log("Discord slash commands registrados.");
