import fs from "node:fs";
import path from "node:path";
import { policy, projectsConfig } from "./config.js";

export function resolveProject(name) {
  const project = projectsConfig.projects[name];
  if (!project || project.enabled !== true) {
    throw new Error(`Projeto nao permitido: ${name}`);
  }

  const projectPath = path.resolve(project.path);
  const allowed = policy.allowedRoots.some((root) => {
    const allowedRoot = path.resolve(root);
    return projectPath === allowedRoot || projectPath.startsWith(`${allowedRoot}${path.sep}`);
  });

  if (!allowed) {
    throw new Error(`Projeto fora da allowlist: ${name}`);
  }

  if (!fs.existsSync(projectPath)) {
    throw new Error(`Pasta nao encontrada: ${projectPath}`);
  }

  return { ...project, name, path: projectPath };
}

export function looksDestructive(text) {
  const lower = text.toLowerCase();
  return policy.destructivePatterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}

export function redact(text) {
  let output = String(text || "");
  for (const key of policy.redactKeys) {
    const re = new RegExp(`(${key}\\s*[:=]\\s*)[^\\s]+`, "gi");
    output = output.replace(re, "$1[REDACTED]");
  }
  return output;
}
