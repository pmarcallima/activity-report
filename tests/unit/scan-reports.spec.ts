import { describe, expect, it, vi, beforeEach } from "vitest";

import { scanReports, findReportByName, type ReportMeta } from "../../src/cli/viewer/scan-reports.js";

vi.mock("node:fs/promises", () => ({
  readdir: vi.fn(),
  readFile: vi.fn()
}));

const { readdir, readFile } = await import("node:fs/promises");

describe("scanReports", () => {
  beforeEach(() => {
    vi.mocked(readdir).mockReset();
    vi.mocked(readFile).mockReset();
  });

  it("returns empty array when output dir does not exist", async () => {
    vi.mocked(readdir).mockRejectedValueOnce(new Error("ENOENT"));
    const reports = await scanReports("/nonexistent");
    expect(reports).toEqual([]);
  });

  it("parses report.md from subdirectory with Period: and commit/story lines", async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      { isDirectory: () => true, isFile: () => false, name: "Sprint 43" }
    ] as any);
    vi.mocked(readFile).mockResolvedValueOnce(
      [
        "# Activity Report",
        "Sprint: Sprint 43",
        "Period: 2026-03-03 to 2026-03-16",
        "Collected 10 commits and 3 related work items.",
        "Worked on 2 user story across 1 repositories."
      ].join("\n")
    );

    const reports = await scanReports("/out");
    expect(reports).toHaveLength(1);
    expect(reports[0]?.sprintName).toBe("Sprint 43");
    expect(reports[0]?.period).toBe("2026-03-03 to 2026-03-16");
    expect(reports[0]?.commitCount).toBe(10);
    expect(reports[0]?.storyCount).toBe(2);
    expect(reports[0]?.path).toContain("report.md");
  });

  it("parses Período: (pt-BR) in report content", async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      { isDirectory: () => true, isFile: () => false, name: "Sprint 43" }
    ] as any);
    vi.mocked(readFile).mockResolvedValueOnce(
      [
        "# Relatório de Atividades",
        "Sprint: Sprint 43",
        "Período: 01/03/2026 a 15/03/2026",
        "Coletados 5 commits e 1 work items relacionados.",
        "Trabalho em 1 user story em 1 repositórios."
      ].join("\n")
    );

    const reports = await scanReports("/out");
    expect(reports).toHaveLength(1);
    expect(reports[0]?.period).toMatch(/03\/2026 a 15\/03\/2026/);
    expect(reports[0]?.commitCount).toBe(5);
    expect(reports[0]?.storyCount).toBe(1);
  });

  it("sorts reports by commitCount descending", async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      { isDirectory: () => true, isFile: () => false, name: "Low" },
      { isDirectory: () => true, isFile: () => false, name: "High" }
    ] as any);
    vi.mocked(readFile)
      .mockResolvedValueOnce("Sprint: Low\nCollected 2 commits.\nWorked on 0 user stories.")
      .mockResolvedValueOnce("Sprint: High\nCollected 10 commits.\nWorked on 2 user stories.");

    const reports = await scanReports("/out");
    expect(reports).toHaveLength(2);
    expect(reports[0]?.commitCount).toBe(10);
    expect(reports[1]?.commitCount).toBe(2);
  });

  it("parses flat .md file in output dir", async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      { isDirectory: () => false, isFile: () => true, name: "sprint-43.report.md" }
    ] as any);
    vi.mocked(readFile).mockResolvedValueOnce(
      "Sprint: Sprint 43\nPeriod: 2026-03-01 to 2026-03-15\n5 commit\n1 user story"
    );

    const reports = await scanReports("/out");
    expect(reports).toHaveLength(1);
    expect(reports[0]?.folderName).toBe("sprint-43.report");
    expect(reports[0]?.commitCount).toBe(5);
    expect(reports[0]?.storyCount).toBe(1);
  });
});

describe("findReportByName", () => {
  const reports: ReportMeta[] = [
    { folderName: "Sprint 43", sprintName: "Sprint 43", period: "2026-03", commitCount: 10, storyCount: 2, path: "/a/report.md" },
    { folderName: "sprints-38-43", sprintName: "Sprint 38-43", period: "2026", commitCount: 50, storyCount: 10, path: "/b/report.md" }
  ];

  it("finds by exact folder name (case insensitive)", () => {
    expect(findReportByName(reports, "sprint 43")).toEqual(reports[0]);
    expect(findReportByName(reports, "Sprint 43")).toEqual(reports[0]);
  });

  it("finds by partial match", () => {
    expect(findReportByName(reports, "38-43")).toEqual(reports[1]);
  });

  it("normalizes spaces and dashes in search", () => {
    expect(findReportByName(reports, "sprint_43")).toEqual(reports[0]);
  });

  it("returns undefined when no match", () => {
    expect(findReportByName(reports, "Sprint 99")).toBeUndefined();
  });
});
