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
      standaloneWorkItems: [],
      excludedCommits: [{ commit, reason: "no-branch-reference" }]
    };

    const report = buildReportModel({
      repos,
      commits: [commit],
      sprint,
      correlation,
      from: "2026-03-03",
      to: "2026-03-16",
      includeUnlinkedTechnicalWork: true,
      locale: "en"
    });

    expect(report.unlinkedRepos).toHaveLength(1);
    expect(report.unlinkedRepos[0]?.repoName).toBe("workspace");
    expect(report.stats.unlinkedCommitCount).toBe(1);
    expect(report.standaloneWorkItems).toHaveLength(0);
  });

  it("includes standalone work items (tasks/not found) in report", () => {
    const repos: RepoInfo[] = [{ name: "workspace", path: "C:/workspace" }];
    const commit: GitCommit = {
      repoName: "workspace",
      repoPath: "C:/workspace",
      hash: "def456",
      shortHash: "def456",
      authorName: "testuser",
      authorEmail: "user@example.com",
      authoredAt: "2026-03-10T10:00:00Z",
      message: "Implement task",
      branchReference: { raw: "feature/999_desc", type: "feature", itemId: 999 }
    };
    const sprint: AzureIteration = {
      id: "1",
      name: "Sprint 43",
      path: "My Project\\Sprint 43"
    };
    const correlation: CorrelationResult = {
      includedStories: [],
      standaloneWorkItems: [
        {
          storyId: 999,
          storyTitle: "Work item not in sprint or not found",
          storyState: "—",
          taskIds: [],
          relatedWorkItemIds: [],
          repos: ["workspace"],
          commits: [commit],
          hotfixCommits: [],
          referencedItemIds: [999],
          exactMatchCount: 0,
          inferredMatchCount: 1,
          workItemType: "Unknown"
        }
      ],
      excludedCommits: []
    };

    const report = buildReportModel({
      repos,
      commits: [commit],
      sprint,
      correlation,
      from: "2026-03-03",
      to: "2026-03-16",
      includeUnlinkedTechnicalWork: false,
      locale: "en"
    });

    expect(report.stories).toHaveLength(0);
    expect(report.standaloneWorkItems).toHaveLength(1);
    expect(report.standaloneWorkItems[0]?.storyId).toBe(999);
    expect(report.stats.standaloneItemCount).toBe(1);
  });
});
