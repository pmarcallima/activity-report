import { select } from "@inquirer/prompts";

import { logger } from "../../core/logger.js";
import { loadConfig } from "../../config/load-config.js";
import { scanReports, findReportByName, type ReportMeta } from "../viewer/scan-reports.js";
import { displayReport, formatReportList } from "../viewer/display-report.js";

type ViewOptions = {
  name?: string;
  latest?: boolean;
};

export async function viewCommand(options: ViewOptions): Promise<void> {
  const config = await loadConfig();

  const reports = await scanReports(config.outputDir);

  if (reports.length === 0) {
    logger.error("No reports found. Generate a report first with 'activity-report generate'.");
    process.exitCode = 1;
    return;
  }

  // If specific report requested
  if (options.name) {
    const report = findReportByName(reports, options.name);
    if (!report) {
      logger.error(`Report '${options.name}' not found.`);
      logger.info("Available reports:");
      console.log(formatReportList(reports));
      process.exitCode = 1;
      return;
    }
    await displayReport(report.path);
    return;
  }

  // If --latest flag
  if (options.latest) {
    const latest = reports[0];
    await displayReport(latest.path);
    return;
  }

  // Interactive selection
  await selectAndDisplayReport(reports);
}

async function selectAndDisplayReport(reports: ReportMeta[]): Promise<void> {
  const choices = reports.map((report) => ({
    name: `${report.sprintName} (${report.period}) - ${report.commitCount} commits`,
    value: report.path
  }));

  const selected = await select({
    message: "Select a report to view:",
    choices
  });

  await displayReport(selected);
}
