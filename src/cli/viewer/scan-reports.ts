import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export interface ReportMeta {
  folderName: string;
  sprintName: string;
  period: string;
  commitCount: number;
  storyCount: number;
  path: string;
}

export async function scanReports(outputDir: string): Promise<ReportMeta[]> {
  const reports: ReportMeta[] = [];

  try {
    const entries = await readdir(outputDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const reportPath = path.join(outputDir, entry.name, "report.md");
        try {
          const content = await readFile(reportPath, "utf-8");
          const meta = parseReportMetadata(entry.name, content, reportPath);
          if (meta) {
            reports.push(meta);
          }
        } catch {
          // Skip folders without report.md
        }
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const filePath = path.join(outputDir, entry.name);
        try {
          const content = await readFile(filePath, "utf-8");
          const meta = parseReportMetadata(entry.name.replace(".md", ""), content, filePath);
          if (meta) {
            reports.push(meta);
          }
        } catch {
          // Skip unreadable files
        }
      }
    }
  } catch {
    // Output directory doesn't exist
  }

  return reports.sort((a, b) => b.commitCount - a.commitCount);
}

function parseReportMetadata(folderName: string, content: string, reportPath: string): ReportMeta | null {
  const lines = content.split("\n");

  let sprintName = folderName;
  let period = "";
  let commitCount = 0;
  let storyCount = 0;

  for (const line of lines) {
    if (line.startsWith("Sprint: ")) {
      sprintName = line.slice(8).trim();
    } else if (line.startsWith("Period: ")) {
      period = line.slice(8).trim();
    } else if (line.includes("commit")) {
      const match = line.match(/(\d+)\s+commit/);
      if (match) {
        commitCount = parseInt(match[1], 10);
      }
    } else if (line.includes("story") || line.includes("user story")) {
      const match = line.match(/(\d+)\s+user story/i);
      if (match) {
        storyCount = parseInt(match[1], 10);
      }
    }
  }

  return {
    folderName,
    sprintName,
    period,
    commitCount,
    storyCount,
    path: reportPath
  };
}

export function findReportByName(reports: ReportMeta[], name: string): ReportMeta | undefined {
  const normalized = name.toLowerCase().replace(/[\s-_]+/g, "-");

  return reports.find((report) => {
    const folderNormalized = report.folderName.toLowerCase().replace(/[\s-_]+/g, "-");
    const sprintNormalized = report.sprintName.toLowerCase().replace(/[\s-_]+/g, "-");

    return (
      folderNormalized.includes(normalized) ||
      sprintNormalized.includes(normalized) ||
      normalized.includes(folderNormalized) ||
      normalized.includes(sprintNormalized)
    );
  });
}
