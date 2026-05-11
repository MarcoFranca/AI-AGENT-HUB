const { runChatMessage } = require("../src/ipc/chat");

async function main() {
  let response = "";
  const statuses = [];
  const contexts = [];

  const entry = await runChatMessage({
    hubRoot: "E:/AI/agents/ai-agent-hub",
    payload: {
      project: "wlg-capital-site",
      userId: "control-panel-validation",
      channelId: "control-panel-validation",
      agent: "coder",
      mode: "local",
      prompt: "Responda apenas OK para validar o chat nativo."
    },
    onStatus: async (data) => statuses.push(data),
    onContext: async (data) => contexts.push(data),
    onChunk: async (chunk) => {
      response += chunk;
    }
  });

  console.log(JSON.stringify({
    ok: response.includes("OK"),
    statuses: statuses.map((item) => item.status),
    contextLoaded: contexts.length > 0,
    response: response.slice(0, 120),
    historyTs: entry.ts
  }, null, 2));

  if (!response.includes("OK") || contexts.length === 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
