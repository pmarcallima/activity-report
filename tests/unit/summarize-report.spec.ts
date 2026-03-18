import { describe, expect, it } from "vitest";

import { summarizeReport, summarizeStory, summarizeUnlinkedRepo } from "../../src/domain/report/summarize-report.js";
import type {
  ReportModel,
  StoryAggregate,
  UnlinkedRepoActivity,
  GitCommit
} from "../../src/core/types.js";

function makeCommit(overrides: Partial<GitCommit> = {}): GitCommit {
  return {
    repoName: "repo-a",
    repoPath: "/repo-a",
    hash: "abc",
    shortHash: "abc",
    authorName: "Dev",
    authorEmail: "dev@example.com",
    authoredAt: "2026-03-10T10:00:00Z",
    message: "feat: login, auth",
    ...overrides
  };
}

function makeStory(overrides: Partial<StoryAggregate> = {}): StoryAggregate {
  return {
    storyId: 1,
    storyTitle: "Login",
    storyState: "Active",
    taskIds: [],
    relatedWorkItemIds: [],
    repos: ["repo-a"],
    commits: [makeCommit()],
    hotfixCommits: [],
    referencedItemIds: [1],
    exactMatchCount: 1,
    inferredMatchCount: 0,
    ...overrides
  };
}

function makeReport(overrides: Partial<Omit<ReportModel, "summary">> = {}): Omit<ReportModel, "summary"> {
  return {
    sprint: { id: "1", name: "Sprint 43", path: "\\Sprint 43" },
    period: { from: "2026-03-03", to: "2026-03-16" },
    stories: [],
    standaloneWorkItems: [],
    unlinkedRepos: [],
    includeUnlinkedTechnicalWork: false,
    locale: "en",
    stats: {
      repoCount: 1,
      commitCount: 5,
      storyCount: 0,
      standaloneItemCount: 0,
      relatedItemCount: 0,
      hotfixCount: 0,
      unlinkedCommitCount: 0,
      unlinkedRepoCount: 0
    },
    ...overrides
  };
}

describe("summarizeReport", () => {
  it("returns summaryNoStories when no stories", () => {
    const report = makeReport({ locale: "en" });
    const summary = summarizeReport(report);
    expect(summary).toContain("No Azure-linked");
  });

  it("returns summary focused on top story when stories exist", () => {
    const story = makeStory({ storyId: 10, commits: [makeCommit({ message: "Login, auth flow" })] });
    const report = makeReport({ stories: [story] });
    const summary = summarizeReport(report);
    expect(summary).toContain("US#10");
    expect(summary).toContain("repo-a");
  });

  it("includes standalone sentence when standaloneWorkItems length > 0", () => {
    const report = makeReport({
      standaloneWorkItems: [makeStory({ storyId: 99 })]
    });
    const summary = summarizeReport(report);
    expect(summary).toContain("Work was also captured");
  });

  it("includes unlinked repo sentence when includeUnlinkedTechnicalWork and unlinkedRepos", () => {
    const report = makeReport({
      includeUnlinkedTechnicalWork: true,
      unlinkedRepos: [
        {
          repoName: "other-repo",
          repoPath: "/other",
          commitCount: 2,
          commits: [makeCommit({ repoName: "other-repo", message: "chore: stuff" })],
          reasons: ["no-branch-reference"]
        }
      ]
    });
    const summary = summarizeReport(report);
    expect(summary).toContain("other-repo");
  });

  it("uses pt-BR messages when locale is pt-BR", () => {
    const report = makeReport({ locale: "pt-BR" });
    const summary = summarizeReport(report);
    expect(summary).toContain("Nenhuma user story vinculada");
  });
});

describe("summarizeStory", () => {
  it("returns themed summary for story with commits", () => {
    const story = makeStory({ repos: ["r1", "r2"], commits: [makeCommit({ message: "feat: login" })] });
    const summary = summarizeStory(story, "en");
    expect(summary).toContain("r1");
    expect(summary).toMatch(/login|implementation updates/);
  });

  it("respects locale pt-BR", () => {
    const story = makeStory();
    const summary = summarizeStory(story, "pt-BR");
    expect(summary).toBeTruthy();
    expect(summary.length).toBeGreaterThan(0);
  });
});

describe("summarizeUnlinkedRepo", () => {
  it("uses summaryCapturedOne for single commit", () => {
    const repo: UnlinkedRepoActivity = {
      repoName: "my-repo",
      repoPath: "/my-repo",
      commitCount: 1,
      commits: [makeCommit({ message: "fix: thing" })],
      reasons: ["no-branch-reference"]
    };
    const summary = summarizeUnlinkedRepo(repo, "en");
    expect(summary).toContain("my-repo");
    expect(summary).toContain("1 direct commit");
  });

  it("uses summaryCaptured for multiple commits", () => {
    const repo: UnlinkedRepoActivity = {
      repoName: "my-repo",
      repoPath: "/my-repo",
      commitCount: 3,
      commits: [
        makeCommit({ message: "a" }),
        makeCommit({ message: "b" }),
        makeCommit({ message: "c" })
      ],
      reasons: ["no-branch-reference"]
    };
    const summary = summarizeUnlinkedRepo(repo, "en");
    expect(summary).toContain("3");
    expect(summary).toContain("my-repo");
  });
});
