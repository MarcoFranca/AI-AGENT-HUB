import fs from "node:fs";
import path from "node:path";
import { hubRoot, runtime } from "./config.js";

const modelsConfigPath = path.join(hubRoot, "configs", "models.json");

const defaultConfig = {
  defaults: {
    local: runtime.localModel,
    analysis: "qwen2.5-coder:14b",
    reasoning: "deepseek-r1:8b",
    premium: "codex"
  },
  fallbacks: {
    quick: "qwen2.5-coder:7b",
    analysis: "qwen2.5-coder:14b",
    coding: "qwen2.5-coder:14b",
    reasoning: "deepseek-r1:8b",
    premium: "codex"
  }
};

export function loadModelsConfig() {
  try {
    return JSON.parse(fs.readFileSync(modelsConfigPath, "utf8"));
  } catch {
    return defaultConfig;
  }
}

export function getModelForTask(task = "local") {
  const config = loadModelsConfig();
  if (task === "analysis") {
    return config.defaults?.analysis || config.fallbacks?.analysis || runtime.localModel;
  }
  if (task === "reasoning") {
    return config.defaults?.reasoning || config.fallbacks?.reasoning || runtime.localModel;
  }
  return config.defaults?.local || config.fallbacks?.quick || runtime.localModel;
}
