import fs from "node:fs";
import path from "node:path";
import { hubRoot, policy } from "./config.js";
import { redact } from "./safety.js";

export function logAction(action) {
  const logRoot = policy.logsDir || path.join(hubRoot, "logs");
  fs.mkdirSync(logRoot, { recursive: true });
  const file = path.join(logRoot, `${new Date().toISOString().slice(0, 10)}.jsonl`);
  const record = {
    ts: new Date().toISOString(),
    ...action
  };
  fs.appendFileSync(file, `${redact(JSON.stringify(record))}\n`);
}
