import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { hubRoot, policy, runtime } from "./config.js";
import { looksDestructive, redact } from "./safety.js";

function isCodexLimitError(output) {
  return /limit|rate limit|usage limit|quota|temporarily unavailable|unavailable|429|too many requests/i.test(output || "");
}

export function runCodex(project, prompt) {
  if (looksDestructive(prompt)) {
    throw new Error("Esse pedido parece destrutivo. Confirme explicitamente antes de executar.");
  }

  return new Promise((resolve, reject) => {
    const outputDir = path.join(policy.logsDir || path.join(hubRoot, "logs"), "codex-output");
    fs.mkdirSync(outputDir, { recursive: true });
    const outputFile = path.join(outputDir, `${new Date().toISOString().replace(/[:.]/g, "-")}.md`);

    const child = spawn(runtime.codexCommand, ["exec", "--color", "never", "--output-last-message", outputFile, "-"], {
      cwd: project.path,
      shell: true,
      windowsHide: true,
      env: process.env
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      const finalMessage = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, "utf8").trim() : "";
      const output = redact(finalMessage || `${stdout}\n${stderr}`.trim());
      if (code !== 0) {
        const error = new Error(output || `Codex saiu com codigo ${code}`);
        error.codexLimited = isCodexLimitError(output);
        reject(error);
        return;
      }
      resolve(output || "Codex concluiu sem saida textual.");
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}
