$ErrorActionPreference = "Stop"

wsl -d Ubuntu -- bash -lc 'export HERMES_HOME=/mnt/e/AI/agents/hermes-home; hermes'
