#!/usr/bin/env node

import { Command } from "commander";

import { logger } from "../core/logger.js";
import { generateCommand } from "./commands/generate.js";
import { initCommand } from "./commands/init.js";
import { doctorCommand } from "./commands/doctor.js";
import { viewCommand } from "./commands/view.js";

const program = new Command();

program.name("activity-report").description("Generate a sprint-scoped activity report from Git repositories and Azure Boards.");

program
  .command("generate")
  .description("Generate a Markdown activity report")
  .option("--sprint <name>", "Sprint name or 'current'", "current")
  .option("--last-sprints <count>", "Generate a combined report for the last N sprints")
  .option("--from <date>", "Override start date (YYYY-MM-DD)")
  .option("--to <date>", "Override end date (YYYY-MM-DD)")
  .option("--output <path>", "Output directory or markdown file path")
  .option("--debug", "Write intermediate debug JSON files")
  .action(async (options) => {
    await generateCommand(options);
  });

program
  .command("view")
  .description("View generated activity reports")
  .option("--latest", "Show the most recent report")
  .argument("[name]", "Report name (e.g., sprint-43)")
  .action(async (name, options) => {
    await viewCommand({ name, ...options });
  });

program
  .command("init")
  .description("Create or update local configuration")
  .option("--force", "Overwrite existing local configuration")
  .action(async (options) => {
    await initCommand(options);
  });

program
  .command("doctor")
  .description("Validate configuration and environment")
  .action(async () => {
    await doctorCommand();
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(message);
  process.exitCode = 1;
});
