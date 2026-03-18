# Activity Report CLI

Generate a sprint-scoped Markdown activity report by correlating Git commits from multiple repositories with Azure DevOps work items, while keeping unmatched work in a fallback section.

## Requirements

- **Node.js 22+**
- **Azure CLI** logged in (`az login`) so the CLI can access Azure DevOps

## Installation

Run these commands from the **project root** (the folder containing `package.json`).

### Option 1: Global CLI (recommended)

Install dependencies, build, and expose the CLI globally:

```bash
npm install
npm run build
npm link
```

After `npm link`, the `activity-report` command is available in your PATH. You can run it from any directory; the CLI looks for `activity-report.json` in the current working directory (or use it from the project root after `init`).

```bash
cd /path/to/your/work
activity-report init
activity-report doctor
activity-report generate --last-sprints 2
```

### Option 2: Local development (no global install)

Use the `dev` script so you can run the CLI without building or linking:

```bash
pnpm install
# or: npm install
```

Then run commands via:

```bash
pnpm dev init
pnpm dev doctor
pnpm dev generate --last-sprints 2
pnpm dev view
```

With npm: `npm run dev init`, `npm run dev doctor`, etc.

## Quickstart

1. **Install** (Option 1 or 2 above).
2. **Configure** — from the directory where you want to keep your config (e.g. project root or work folder), run:

   ```bash
   activity-report init
   ```

   `init` will ask for:
   - Azure DevOps organization and project
   - Repository root folder(s) (parent of your Git repos)
   - Output directory for reports
   - Optional: Git author email(s) for commit filtering, report language (pt-BR / en)

3. **Check** that everything is set up:

   ```bash
   activity-report doctor
   ```

4. **Generate** your first report:

   ```bash
   activity-report generate --last-sprints 2
   ```

5. **View** reports:

   ```bash
   activity-report view
   ```

Reports are written to the `outputDir` you chose (e.g. `./reports` or an absolute path). Run `activity-report` from a directory that contains `activity-report.json`, or the CLI will not find the config.

## Commands

- `init` - Create or update local configuration
- `doctor` - Validate configuration and environment
- `generate` - Create activity report
- `view` - Browse and view generated reports
- `tutorial` - Show a short step-by-step quick start guide

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

Reports are read from the `outputDir` configured in `activity-report.json`. The viewer lists all Markdown reports found there (single-sprint files like `sprint-43.md` and multi-sprint folders like `sprints-29-44/report.md`).

```bash
# Interactive report browser: choose from the list (sprint name, period, commit count)
activity-report view

# Open the most recent report directly (no prompt)
activity-report view --latest

# Open a specific report by name (partial match works)
activity-report view sprint-43
activity-report view sprints-29-44
activity-report view 2026-03-01-to-2026-03-16
```

The viewer shows colorized output (headings, US#/card refs, commit hashes, repo names). Messages and prompts respect the `locale` setting (e.g. pt-BR).

### Other Commands

```bash
# Initialize configuration
activity-report init

# Validate environment
activity-report doctor

# Show quick start guide (uses config locale, or --locale en / --locale pt-BR)
activity-report tutorial
activity-report tutorial --locale pt-BR
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

The CLI uses a single **`activity-report.json`** file. It is created by `activity-report init` and should **not be committed** to version control (paths, emails, and org/project are environment-specific).

The CLI looks for this file in the **current working directory** when you run any command. Run `activity-report` from the folder that contains `activity-report.json`, or place the file in the directory where you usually work.

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
  "locale": "pt-BR",
  "git": {
    "authorEmail": "you@company.com",
    "authorEmails": ["you@company.com", "personal@gmail.com"]
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

- **`locale`** (optional) — Report and CLI message language: `"pt-BR"` or `"en"` (default).

### Git author filter

By default only commits whose author email matches `git.authorEmail` are included. To include commits from several emails (e.g. personal and corporate), set `git.authorEmails` to an array; commits from any listed email are then included. Example: early commits with `joaovictooroc@gmail.com` and later ones with `joao.carvalho@groupsoftware.com.br` can both appear by using `"authorEmails": ["joaovictooroc@gmail.com", "joao.carvalho@groupsoftware.com.br"]`. If `authorEmails` is set, `authorEmail` is ignored.

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
- Reads commits for the configured Git author(s) (`authorEmail` or `authorEmails`)
- Parses branch names: `feature/<id>_...`, `hotfix/<id>_...`, and fallback `feature/<id>` / `hotfix/<id>` (e.g. User Story number only)
- Loads sprint work items from Azure DevOps
- Rolls task, bug, and other work item activity up to the parent user story when possible
- Shows link quality as exact or inferred in report sections
- Adds generated summaries for each sprint, story, and unlinked repo section
- Keeps unmatched commits in `Unlinked Technical Work` when `includeUnlinkedTechnicalWork` is enabled
- Can generate a combined report for the last N sprints with `--last-sprints`
- When no current sprint is active, `--last-sprints` falls back to the most recent sprint
- Date-range mode (`--from` + `--to` without `--sprint`) skips Azure work item loading
- Writes a Markdown report to `outputDir`
- Report text and CLI messages use `locale` when set (e.g. `pt-BR`)
- Writes debug JSON only when `--debug` is enabled
