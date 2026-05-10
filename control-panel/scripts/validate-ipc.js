const { runHubScript } = require("../src/ipc/actions");

const hubRoot = "E:/AI/agents/ai-agent-hub";

async function run(scriptName, timeoutMs) {
  const result = await runHubScript({ hubRoot, scriptName, timeoutMs });
  console.log(scriptName, JSON.stringify({
    ok: result.ok,
    error: result.error || null,
    data: result.data || null
  }));

  if (!result.ok) {
    process.exitCode = 1;
  }

  return result;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForOn() {
  const deadline = Date.now() + 90000;
  let lastStatus = null;

  while (Date.now() < deadline) {
    lastStatus = await runHubScript({
      hubRoot,
      scriptName: "status-hub.ps1",
      timeoutMs: 90000
    });

    const overall = lastStatus.data && lastStatus.data.overall;
    console.log("status-hub.ps1", JSON.stringify({
      ok: lastStatus.ok,
      overall,
      openWebUi: lastStatus.data && lastStatus.data.services && lastStatus.data.services.openWebUi && lastStatus.data.services.openWebUi.ok
    }));

    if (lastStatus.ok && overall === "ON") {
      return lastStatus;
    }

    await sleep(5000);
  }

  process.exitCode = 1;
  return lastStatus;
}

async function main() {
  await run("start-hub.ps1", 180000);
  await run("stop-hub.ps1", 180000);
  await run("start-hub.ps1", 180000);
  await waitForOn();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
