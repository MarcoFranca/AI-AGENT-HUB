import fs from "node:fs";
import path from "node:path";
import { hubRoot, policy } from "./config.js";
import { redact } from "./safety.js";

function skillsRoot() {
  return policy.skillsDir || path.join(hubRoot, "skills");
}

export function ensureSkillLayout() {
  const root = skillsRoot();
  for (const dir of ["coding", "automation", "marketing", "sales", "manager", "coder"]) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
}

export function listSkills() {
  ensureSkillLayout();
  const root = skillsRoot();
  const lines = [];

  const walk = (dir, depth = 0) => {
    if (depth > 4) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const filePath = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(filePath, depth + 1);
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        lines.push(`- ${path.relative(root, filePath)}`);
      }
    }
  };

  walk(root);
  return lines.length ? lines.join("\n") : "Nenhuma skill encontrada ainda.";
}

export function createSkill({ project, prompt }) {
  ensureSkillLayout();
  const root = skillsRoot();
  const fileName = `${new Date().toISOString().replace(/[:.]/g, "-")}-${project.name}.skill.md`;
  const filePath = path.join(root, "coding", fileName);
  const body = `# Skill: ${prompt}\n\nProject: ${project.name}\n\n## Trigger\n\nUse when this workflow is relevant to the active project.\n\n## Procedure\n\n1. Read project instructions.\n2. Validate scope and safety.\n3. Execute incrementally.\n4. Verify outcome.\n5. Log useful follow-up knowledge.\n`;
  fs.writeFileSync(filePath, body);
  return `Skill criada: coding/${fileName}`;
}

function suggestionsRoot() {
  return path.join(policy.memoryDir || path.join(hubRoot, "memory"), "suggestions", "skills");
}

function slug(value) {
  return String(value || "skill")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "skill";
}

function looksReusable(prompt, response) {
  const text = `${prompt}\n${response}`.toLowerCase();
  return [
    "passo",
    "workflow",
    "processo",
    "campanha",
    "script",
    "deploy",
    "checklist",
    "template",
    "automacao",
    "automação",
    "reutiliz"
  ].some((word) => text.includes(word));
}

export function suggestSkillFromInteraction({ agent, project, prompt, response }) {
  if (!looksReusable(prompt, response)) return null;
  const root = suggestionsRoot();
  fs.mkdirSync(root, { recursive: true });
  const id = `${new Date().toISOString().replace(/[:.]/g, "-")}-${slug(agent)}-${slug(project?.name)}`;
  const title = `Workflow ${agent} - ${project?.name || "geral"}`;
  const suggestion = {
    id,
    status: "pending",
    agent,
    project: project?.name || "none",
    title,
    createdAt: new Date().toISOString(),
    prompt: redact(String(prompt || "").slice(0, 1200)),
    draft: redact(String(response || "").slice(0, 2500))
  };
  fs.writeFileSync(path.join(root, `${id}.json`), `${JSON.stringify(suggestion, null, 2)}\n`);
  return suggestion;
}

export function listSkillSuggestions() {
  const root = suggestionsRoot();
  if (!fs.existsSync(root)) return "Nenhuma sugestao de skill pendente.";
  const suggestions = fs.readdirSync(root)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8")))
    .filter((item) => item.status === "pending");
  if (!suggestions.length) return "Nenhuma sugestao de skill pendente.";
  return suggestions
    .slice(-20)
    .map((item) => `- ${item.id} | ${item.agent} | ${item.title}`)
    .join("\n");
}

export function approveSkillSuggestion(id) {
  ensureSkillLayout();
  const root = suggestionsRoot();
  const filePath = path.join(root, `${id}.json`);
  if (!fs.existsSync(filePath)) throw new Error(`Sugestao nao encontrada: ${id}`);
  const suggestion = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (suggestion.status !== "pending") throw new Error(`Sugestao nao esta pendente: ${id}`);

  const agentDir = path.join(skillsRoot(), slug(suggestion.agent));
  fs.mkdirSync(agentDir, { recursive: true });
  const skillPath = path.join(agentDir, `${slug(suggestion.title)}.md`);
  const body = [
    `# ${suggestion.title}`,
    "",
    `Agent: ${suggestion.agent}`,
    `Project: ${suggestion.project}`,
    "",
    "## Trigger",
    "",
    suggestion.prompt,
    "",
    "## Workflow Draft",
    "",
    suggestion.draft,
    ""
  ].join("\n");
  fs.writeFileSync(skillPath, body);
  suggestion.status = "approved";
  suggestion.approvedAt = new Date().toISOString();
  suggestion.skillPath = skillPath;
  fs.writeFileSync(filePath, `${JSON.stringify(suggestion, null, 2)}\n`);
  return `Skill aprovada: ${skillPath}`;
}

export function rejectSkillSuggestion(id) {
  const root = suggestionsRoot();
  const filePath = path.join(root, `${id}.json`);
  if (!fs.existsSync(filePath)) throw new Error(`Sugestao nao encontrada: ${id}`);
  const suggestion = JSON.parse(fs.readFileSync(filePath, "utf8"));
  suggestion.status = "rejected";
  suggestion.rejectedAt = new Date().toISOString();
  fs.writeFileSync(filePath, `${JSON.stringify(suggestion, null, 2)}\n`);
  return `Sugestao rejeitada: ${id}`;
}
