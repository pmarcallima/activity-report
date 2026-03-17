import { describe, expect, it } from "vitest";

import { buildReportModel } from "../../src/domain/report/build-report-model.js";
import type { AzureIteration, CorrelationResult, GitCommit, RepoInfo } from "../../src/core/types.js";

describe("buildReportModel", () => {
  it("groups excluded commits as unlinked repo activity when enabled", () => {
    const repos: RepoInfo[] = [{ name: "workspace", path: "C:/workspace" }];
    const commit: GitCommit = {
      repoName: "workspace",
      repoPath: "C:/workspace",
      hash: "abc123",
      shortHash: "abc123",
      authorName: "testuser",
      authorEmail: "user@example.com",
      authoredAt: "2026-03-10T10:00:00Z",
      message: "Adjust prompt"
    };
    const sprint: AzureIteration = {
      id: "1",
      name: "Sprint 43",
      path: "My Project\\Sprint 43"
    };
    const correlation: CorrelationResult = {
      includedStories: [],
      excludedCommits: [{ commit, reason: "no-branch-reference" }]
    };

    const report = buildReportModel({
      repos,
      commits: [commit],
      sprint,
      correlation,
      from: "2026-03-03",
      to: "2026-03-16",
      includeUnlinkedTechnicalWork: true
    });

    expect(report.unlinkedRepos).toHaveLength(1);
    expect(report.unlinkedRepos[0]?.repoName).toBe("workspace");
    expect(report.stats.unlinkedCommitCount).toBe(1);
  });
});
