import fs from "node:fs";
import path from "node:path";
import { AttachmentBuilder } from "discord.js";
import { hubRoot } from "./config.js";

const DISCORD_LIMIT = 1900;
const FILE_THRESHOLD = 6000;

function chunks(text) {
  const output = [];
  let remaining = String(text || "");
  while (remaining.length > DISCORD_LIMIT) {
    let cut = remaining.lastIndexOf("\n", DISCORD_LIMIT);
    if (cut < 800) cut = DISCORD_LIMIT;
    output.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining) output.push(remaining);
  return output;
}

export async function sendDiscordResponse(interaction, text, baseName = "response") {
  const output = String(text || "");
  if (output.length > FILE_THRESHOLD) {
    const dir = path.join(hubRoot, "logs", "responses");
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, "-")}-${baseName}.md`);
    fs.writeFileSync(filePath, output);
    const attachment = new AttachmentBuilder(filePath, { name: `${baseName}.md` });
    await interaction.editReply({
      content: "Resposta grande gerada como Markdown.",
      files: [attachment]
    });
    return;
  }

  const parts = chunks(output);
  if (parts.length === 0) {
    await interaction.editReply("(sem resposta)");
    return;
  }

  await interaction.editReply(parts[0]);
  for (const part of parts.slice(1)) {
    await interaction.followUp({ content: part, ephemeral: true });
  }
}
