import fs from "node:fs";
import path from "node:path";
import { hubRoot, policy } from "./config.js";
import { redact } from "./safety.js";

const MAX_SECTION = 2200;

function memoryRoot() {
  return policy.memoryDir || path.join(hubRoot, "memory");
}

function safeName(value) {
  return String(value || "default").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function readIfExists(filePath, max = MAX_SECTION) {
  if (!fs.existsSync(filePath)) return "";
  const text = fs.readFileSync(filePath, "utf8");
  return text.length > max ? text.slice(-max) : text;
}

function writeAppend(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, text);
}

export function ensureMemoryLayout() {
  const root = memoryRoot();
  for (const dir of ["users", "channels", "projects", "sessions"]) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
}

export function pathsFor({ userId, channelId, project, sessionId }) {
  const root = memoryRoot();
  const projectName = safeName(project?.name);
  return {
    root,
    user: path.join(root, "users", `${safeName(userId)}.md`),
    channel: path.join(root, "channels", `${safeName(channelId || "unknown-channel")}.md`),
    project: path.join(root, "projects", projectName, "memory.md"),
    session: path.join(root, "sessions", `${safeName(sessionId || `${userId}-${projectName}`)}.md`),
    projectDir: path.join(root, "projects", projectName)
  };
}

export function readProjectInstructions(project) {
  const candidates = ["AGENTS.md", "CLAUDE.md", "README.md"];
  return candidates
    .map((file) => {
      const filePath = path.join(project.path, file);
      const text = readIfExists(filePath, 7000);
      return text ? `## ${file}\n${text}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

export function readRelevantSkills() {
  const skillsDir = policy.skillsDir || path.join(hubRoot, "skills");
  if (!fs.existsSync(skillsDir)) return "";

  const files = [];
  const walk = (dir, depth = 0) => {
    if (depth > 3) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const filePath = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(filePath, depth + 1);
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) files.push(filePath);
    }
  };
  walk(skillsDir);

  return files
    .slice(0, 12)
    .map((file) => `- ${path.relative(skillsDir, file)}`)
    .join("\n");
}

export function buildMemoryContext({ userId, channelId, project, sessionId, agent = "local", agentPrompt = "" }) {
  ensureMemoryLayout();
  const paths = pathsFor({ userId, channelId, project, sessionId });
  const sections = [
    `# Agent ativo\n${agent}`,
    agentPrompt ? `# Prompt do agente\n${agentPrompt}` : "",
    `# Projeto ativo\n${project.name}: ${project.path}`,
    readProjectInstructions(project),
    `# Memoria do projeto\n${readIfExists(paths.project)}`,
    `# Memoria do usuario\n${readIfExists(paths.user)}`,
    `# Memoria do canal\n${readIfExists(paths.channel)}`,
    `# Sessao recente\n${readIfExists(paths.session)}`,
    `# Skills disponiveis\n${readRelevantSkills()}`
  ].filter((section) => section && section.trim() !== "");

  return sections.join("\n\n").slice(-9000);
}

export function saveManualMemory({ userId, channelId, project, text }) {
  ensureMemoryLayout();
  const paths = pathsFor({ userId, channelId, project });
  const line = `\n- ${new Date().toISOString()}: ${redact(text)}\n`;
  writeAppend(paths.project, line);
  writeAppend(paths.user, line);
}

export function saveInteractionMemory({ userId, channelId, project, sessionId, prompt, response, agent = "local" }) {
  ensureMemoryLayout();
  const paths = pathsFor({ userId, channelId, project, sessionId });
  const stamp = new Date().toISOString();
  const promptSummary = redact(String(prompt || "").slice(0, 500));
  const responseSummary = redact(String(response || "").slice(0, 700));
  const block = [
    `\n## ${stamp}`,
    `- Agent: ${agent}`,
    `- Projeto: ${project.name}`,
    `- Pergunta: ${promptSummary}`,
    `- Resposta: ${responseSummary}`,
    ""
  ].join("\n");

  writeAppend(paths.session, block);
  writeAppend(paths.project, block);
}

export function showMemory({ userId, channelId, project, sessionId }) {
  ensureMemoryLayout();
  const paths = pathsFor({ userId, channelId, project, sessionId });
  return [
    `# Memoria: ${project.name}`,
    `## Projeto\n${readIfExists(paths.project, 3000) || "(vazio)"}`,
    `## Usuario\n${readIfExists(paths.user, 2000) || "(vazio)"}`,
    `## Canal\n${readIfExists(paths.channel, 2000) || "(vazio)"}`,
    `## Sessao\n${readIfExists(paths.session, 2000) || "(vazio)"}`
  ].join("\n\n");
}

export function clearMemory({ userId, channelId, project, sessionId, scope }) {
  ensureMemoryLayout();
  const paths = pathsFor({ userId, channelId, project, sessionId });
  const allowed = {
    user: paths.user,
    channel: paths.channel,
    project: paths.project,
    session: paths.session
  };
  const target = allowed[scope];
  if (!target) throw new Error("Escopo invalido. Use: user, channel, project ou session.");
  if (fs.existsSync(target)) fs.rmSync(target, { force: true });
  return `Memoria apagada: ${scope}`;
}

export function projectMemoryPath(project) {
  return pathsFor({ userId: "system", channelId: "system", project }).project;
}
