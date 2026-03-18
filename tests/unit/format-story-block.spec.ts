import { describe, expect, it } from "vitest";

import {
  formatStoryHeading,
  formatLinkQuality,
  renderStoryBlock
} from "../../src/domain/report/format-story-block.js";
import { getReportMessages } from "../../src/core/i18n.js";
import type { StoryAggregate, GitCommit } from "../../src/core/types.js";

const tEn = getReportMessages("en");

function makeStory(overrides: Partial<StoryAggregate> = {}): StoryAggregate {
  return {
    storyId: 123,
    storyTitle: "Login flow",
    storyState: "Active",
    taskIds: [],
    relatedWorkItemIds: [],
    repos: ["repo-a"],
    commits: [],
    hotfixCommits: [],
    referencedItemIds: [123],
    exactMatchCount: 2,
    inferredMatchCount: 1,
    ...overrides
  };
}

function makeCommit(overrides: Partial<GitCommit> = {}): GitCommit {
  return {
    repoName: "repo-a",
    repoPath: "/repo-a",
    hash: "abc1234",
    shortHash: "abc1234",
    authorName: "Dev",
    authorEmail: "dev@example.com",
    authoredAt: "2026-03-10T10:00:00Z",
    message: "feat: login",
    ...overrides
  };
}

describe("formatStoryHeading", () => {
  it("formats user story as US#id - title when not standalone", () => {
    const story = makeStory({ storyId: 42, storyTitle: "My Story" });
    expect(formatStoryHeading(story, false, tEn)).toBe("US#42 - My Story");
  });

  it("formats standalone with workItemType as Type#id - title", () => {
    const story = makeStory({
      storyId: 999,
      storyTitle: "Task title",
      workItemType: "Task"
    });
    expect(formatStoryHeading(story, true, tEn)).toBe("Task#999 - Task title");
  });

  it("formats standalone Unknown workItemType using t.workItem", () => {
    const story = makeStory({ storyId: 1, workItemType: "Unknown" });
    expect(formatStoryHeading(story, true, tEn)).toContain("Work Item#1");
  });

  it("formats standalone without title", () => {
    const story = makeStory({ storyTitle: "", workItemType: "Task" });
    expect(formatStoryHeading(story, true, tEn)).toBe("Task#123");
  });
});

describe("formatLinkQuality", () => {
  it("returns exact and inferred when both > 0", () => {
    expect(formatLinkQuality(2, 1, tEn)).toBe("2 exact, 1 inferred");
  });

  it("returns only exact when inferred is 0", () => {
    expect(formatLinkQuality(3, 0, tEn)).toBe("3 exact");
  });

  it("returns only inferred when exact is 0", () => {
    expect(formatLinkQuality(0, 2, tEn)).toBe("2 inferred");
  });

  it("returns noLinkedCommits when both 0", () => {
    expect(formatLinkQuality(0, 0, tEn)).toBe(tEn.noLinkedCommits);
  });
});

describe("renderStoryBlock", () => {
  it("appends heading, state, summary, link quality, repos, evidence", () => {
    const story = makeStory({
      commits: [
        makeCommit({ shortHash: "a1", message: "msg1", authoredAt: "2026-03-10T09:00:00Z" }),
        makeCommit({ shortHash: "b2", message: "msg2", authoredAt: "2026-03-10T11:00:00Z" })
      ]
    });
    const lines: string[] = [];
    const summarizeStoryFn = (s: StoryAggregate) => `summary for ${s.storyId}`;

    renderStoryBlock(lines, story, summarizeStoryFn, false, tEn);

    expect(lines[0]).toContain("US#123");
    expect(lines[0]).toContain("Login flow");
    expect(lines.some((l) => l.includes(tEn.state))).toBe(true);
    expect(lines.some((l) => l.includes("summary for 123"))).toBe(true);
    expect(lines.some((l) => l.includes("2 exact"))).toBe(true);
    expect(lines.some((l) => l.includes("repo-a"))).toBe(true);
    expect(lines.some((l) => l.includes("a1") && l.includes("msg1"))).toBe(true);
    expect(lines.some((l) => l.includes("b2") && l.includes("msg2"))).toBe(true);
  });

  it("uses heading level 4 when options.headingLevel is 4", () => {
    const story = makeStory();
    const lines: string[] = [];
    renderStoryBlock(lines, story, () => "x", false, tEn, { headingLevel: 4 });
    expect(lines[0]).toMatch(/^####\s/);
  });

  it("adds unlinked note when asStandalone is true", () => {
    const story = makeStory();
    const lines: string[] = [];
    renderStoryBlock(lines, story, () => "x", true, tEn);
    expect(lines.some((l) => l.includes(tEn.unlinkedFromStory))).toBe(true);
  });

  it("includes related items when present", () => {
    const story = makeStory({ relatedWorkItemIds: [456, 789] });
    const lines: string[] = [];
    renderStoryBlock(lines, story, () => "x", false, tEn);
    expect(lines.some((l) => l.includes("#456") && l.includes("#789"))).toBe(true);
  });
});
