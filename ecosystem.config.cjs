module.exports = {
  apps: [
    {
      name: "ai-agent-hub-discord-bot",
      cwd: "E:/AI/agents/ai-agent-hub/bot",
      script: "src/index.js",
      interpreter: "node",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      out_file: "E:/AI/agents/ai-agent-hub/logs/discord-bot.out.log",
      error_file: "E:/AI/agents/ai-agent-hub/logs/discord-bot.err.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
