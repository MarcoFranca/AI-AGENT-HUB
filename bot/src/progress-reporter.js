import { logAction } from "./log.js";

const LABELS = {
  analisando_projeto: "Analisando projeto",
  carregando_memoria: "Carregando memoria",
  carregando_skills: "Carregando skills",
  chamando_ollama: "Chamando Ollama",
  chamando_codex: "Chamando Codex",
  salvando_memoria: "Salvando memoria",
  sugerindo_skill: "Sugerindo skill",
  finalizado: "Finalizado",
  erro: "Erro"
};

export function createNoopReporter() {
  return {
    async report() {}
  };
}

export function createProgressReporter({ interaction, commandName, userId, agent }) {
  let lastEdit = 0;
  let lastText = "";

  return {
    async report(event, detail = "") {
      const label = LABELS[event] || event;
      const text = detail ? `${label}: ${detail}` : label;
      logAction({ userId, command: commandName, agent, status: event, detail });

      const now = Date.now();
      const immediate = event === "finalizado" || event === "erro";
      if (!immediate && now - lastEdit < 2500) return;
      if (text === lastText) return;

      lastEdit = now;
      lastText = text;

      if (!interaction) return;
      try {
        await interaction.editReply(`_${text}_`);
      } catch {
        try {
          await interaction.followUp({ content: `_${text}_`, ephemeral: true });
        } catch {
          // Status updates should never break the command.
        }
      }
    }
  };
}
