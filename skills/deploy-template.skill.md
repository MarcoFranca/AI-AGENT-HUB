# Skill: Deploy Workflow Template

Use this as a starting point for project-specific deploy skills.

## Inputs

- Project name from `configs/projects.json`
- Target environment
- Deployment command
- Required checks

## Procedure

1. Confirm the selected project and target environment.
2. Read project docs and `AGENTS.md`.
3. Run non-destructive validation first.
4. Ask for confirmation before publishing, migrating data or deleting artifacts.
5. Log the final command, result and timestamp.
