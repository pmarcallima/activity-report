# Activity Report CLI

Generate a sprint-scoped Markdown activity report by correlating Git commits from multiple repositories with Azure DevOps work items, while keeping unmatched work in a fallback section.

## Requirements

- Node.js 22+
- Azure CLI logged in (`az login`)

## Installation

### Option 1: Global CLI (Recommended)

Build and link globally:

```bash
npm install
npm run build
npm link
```

Now you can run `activity-report` from anywhere:

```bash
activity-report init
activity-report doctor
activity-report generate --last-sprints 2
```

### Option 2: Local Development

```bash
pnpm install
pnpm dev init
pnpm dev doctor
pnpm dev generate --last-sprints 2
```

## Quickstart

Run the init command to create configuration:

```bash
activity-report init
```

The `init` command will ask for:
- your Azure DevOps organization and project
- repository root folders
- output directory for reports

## Commands

- `init` - Create or update local configuration
- `doctor` - Validate configuration and environment
- `generate` - Create activity report
- `view` - Browse and view generated reports

## Usage

### Generate Reports

```bash
# Generate report for current sprint (default)
activity-report generate

# Interactive sprint selection (when running in terminal)
activity-report generate

# Generate report for a specific sprint
activity-report generate --sprint "Sprint 42"

# Generate report for a date range (no sprint required)
activity-report generate --from 2026-03-01 --to 2026-03-13

# Generate combined report for last N sprints
activity-report generate --last-sprints 2

# With debug output
activity-report generate --debug

# Specify custom output path
activity-report generate --output ./my-reports
```

### View Reports

```bash
# Interactive report browser (select from list)
activity-report view

# View most recent report
activity-report view --latest

# View specific report by name
activity-report view sprint-43
activity-report view 2026-03-01-to-2026-03-16
```

### Other Commands

```bash
# Initialize configuration
activity-report init

# Validate environment
activity-report doctor
```

### Interactive Sprint Selection

When running `activity-report generate` in a terminal without the `--sprint` flag, you'll be presented with an interactive list of available sprints from Azure DevOps:

```
? Select sprint:
❯ Sprint 43 (03/03 - 03/16) [current]
  Sprint 42 (02/17 - 03/02)
  Sprint 41 (02/03 - 02/16)
  ────────────────
  Custom date range...
```

You can also choose "Custom date range..." to specify dates without selecting a sprint.

### Date Range Mode

When using `--from` and `--to` without `--sprint`, the report generates in date-range mode:
- No sprint work items are loaded from Azure
- Only commits within the date range are included
- Report is saved to a date-based folder (e.g., `reports/2026-03-01-to-2026-03-13/report.md`)

This is useful when you need a report for dates that don't align with sprints, or when you just want commit activity without sprint backlog items.

## TUI Features

The CLI includes several terminal user interface (TUI) enhancements:

- **Progress indicators** - Visual feedback during long operations (repository scanning, commit collection, Azure API calls)
- **Animated spinners** - The `doctor` command shows animated spinners for each check
- **Interactive sprint selector** - Choose from available sprints in Azure DevOps using arrow keys
- **Report viewer** - Browse past reports with colorized output highlighting user stories, work items, and commits

## Configuration

The CLI uses a single `activity-report.json` file. This file contains personal settings (paths, email) and should **not be committed** to version control.

Example configuration:

```json
{
  "azure": {
    "organization": "your-org",
    "project": "Your Project"
  },
  "repoRoots": [
    "C:\\Users\\you\\work"
  ],
  "outputDir": "C:\\Users\\you\\reports",
  "git": {
    "authorEmail": "you@company.com"
  },
  "ignoreBranches": ["master", "develop"],
  "report": {
    "includeUnlinkedTechnicalWork": true
  },
  "debug": {
    "enabledByDefault": false
  }
}
```

### Git Identity

The CLI uses your Git identity to attribute commits. It checks:

1. Local git config in each repo root (takes precedence)
2. Global git config as fallback

To use a different identity for a specific project, initialize git and set local config:

```bash
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

Or configure globally:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Environment Variables in Paths

Use `${VAR_NAME}` placeholders for portable paths:

```json
{
  "repoRoots": ["${WORK_ROOT}\\my-project"],
  "outputDir": "${WORK_ROOT}\\activity-report\\reports"
}
```

Set the variable before running:

```powershell
$env:WORK_ROOT = "C:\Users\you\work"
activity-report generate --last-sprints 2
```

## Current Behavior

- Scans nested repositories under each path in `repoRoots`
- Reads commits for the configured Git author
- Parses `feature/<id>_description.<name>` and `hotfix/<id>_description.<name>` branches
- Loads sprint work items from Azure DevOps
- Rolls task, bug, and other work item activity up to the parent user story when possible
- Shows link quality as exact or inferred in report sections
- Adds generated summaries for each sprint, story, and unlinked repo section
- Keeps unmatched commits in `Unlinked Technical Work` when `includeUnlinkedTechnicalWork` is enabled
- Can generate a combined report for the last N sprints with `--last-sprints`
- When no current sprint is active, `--last-sprints` falls back to the most recent sprint
- Date-range mode (`--from` + `--to` without `--sprint`) skips Azure work item loading
- Writes a Markdown report to `outputDir`
- Writes debug JSON only when `--debug` is enabled
