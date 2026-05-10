import { runtime } from "./config.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function askLocal(prompt, options = {}) {
  const attempts = options.attempts || 3;
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${runtime.ollamaBaseUrl}/api/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: options.model || runtime.localModel,
          prompt,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama falhou: HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.response || "";
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        break;
      }
      await sleep(1500 * attempt);
    }
  }

  throw lastError;
}
