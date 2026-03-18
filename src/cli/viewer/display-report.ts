import { readFile } from "node:fs/promises";
import colors from "ansi-colors";

export async function displayReport(filePath: string): Promise<void> {
  const content = await readFile(filePath, "utf-8");
  const colored = colorizeMarkdown(content);
  console.log(colored);
}

function colorizeMarkdown(content: string): string {
  const lines = content.split("\n");
  const coloredLines: string[] = [];

  for (const line of lines) {
    coloredLines.push(colorizeLine(line));
  }

  return coloredLines.join("\n");
}

function colorizeLine(line: string): string {
  // Headers
  if (line.startsWith("# ")) {
    return colors.bold.cyan(line);
  }
  if (line.startsWith("## ")) {
    return colors.bold.blue(line);
  }
  if (line.startsWith("### ")) {
    return colors.bold.green(line);
  }

  // Meta lines (Sprint:, Period:/Período:, Resumo:, Estado:, etc.)
  if (
    line.startsWith("Sprint:") ||
    line.startsWith("Period:") ||
    line.startsWith("Período:") ||
    line.startsWith("Summary:") ||
    line.startsWith("Resumo:") ||
    line.startsWith("State:") ||
    line.startsWith("Estado:")
  ) {
    return colors.dim(line);
  }

  // Work item references (US#12345, #12345)
  let result = line.replace(/US#(\d+)/g, colors.yellow("US#$1"));
  result = result.replace(/#(\d+)/g, colors.yellow("#$1"));

  // Commit hashes (backtick-enclosed)
  result = result.replace(/`([a-f0-9]+)`/g, colors.magenta("`$1`"));

  // Repository names in backticks
  result = result.replace(/`([^`]+)`/g, (_, text) => {
    if (text.includes("-") || text.includes("/")) {
      return colors.cyan(`\`${text}\``);
    }
    return `\`${text}\``;
  });

  // Bullet points in evidence sections
  if (line.startsWith("  - ")) {
    return colors.dim(line);
  }

  return result;
}

export function formatReportList(reports: Array<{ folderName: string; sprintName: string; period: string; commitCount: number; storyCount: number }>): string {
  const lines: string[] = [];

  const maxSprintLength = Math.max(...reports.map((r) => r.sprintName.length), 10);
  const maxPeriodLength = Math.max(...reports.map((r) => r.period.length), 12);

  for (const report of reports) {
    const sprint = report.sprintName.padEnd(maxSprintLength);
    const period = report.period.padEnd(maxPeriodLength);
    const commits = `${report.commitCount} commits`;
    const stories = report.storyCount > 0 ? `${report.storyCount} stories` : "no stories";

    lines.push(`${colors.bold(sprint)}  ${colors.dim(period)}  ${colors.green(commits)}  ${colors.blue(stories)}`);
  }

  return lines.join("\n");
}
