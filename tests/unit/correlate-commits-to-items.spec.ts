import { describe, expect, it } from "vitest";

import { correlateCommitsToItems } from "../../src/domain/correlation/correlate-commits-to-items.js";
import type { AzureWorkItem, GitCommit } from "../../src/core/types.js";

describe("correlateCommitsToItems", () => {
  it("rolls task commits up to parent story", () => {
    const commits: GitCommit[] = [
      {
        repoName: "repo-a",
        repoPath: "C:/repo-a",
        hash: "1234567890",
        shortHash: "1234567",
        authorName: "Test User",
        authorEmail: "test@example.com",
        authoredAt: "2026-03-13T10:00:00Z",
        message: "Implement login fix",
        branchName: "feature/200_task.testuser",
        branchReference: {
          raw: "feature/200_task.testuser",
          type: "feature",
          itemId: 200,
          description: "task",
          ownerSuffix: "testuser"
        }
      }
    ];

    const workItems: AzureWorkItem[] = [
      { id: 100, title: "Auth story", type: "User Story", state: "Active", childIds: [200], relatedIds: [] },
      { id: 200, title: "Auth task", type: "Task", state: "Active", parentId: 100, childIds: [], relatedIds: [] }
    ];

    const result = correlateCommitsToItems(commits, workItems);

    expect(result.includedStories).toHaveLength(1);
    expect(result.includedStories[0]?.storyId).toBe(100);
    expect(result.includedStories[0]?.taskIds).toEqual([200]);
    expect(result.includedStories[0]?.relatedWorkItemIds).toEqual([200]);
    expect(result.includedStories[0]?.exactMatchCount).toBe(1);
  });

  it("links bug commits through parent story hierarchy", () => {
    const commits: GitCommit[] = [
      {
        repoName: "repo-a",
        repoPath: "C:/repo-a",
        hash: "bug123456",
        shortHash: "bug1234",
        authorName: "Test User",
        authorEmail: "test@example.com",
        authoredAt: "2026-03-13T10:00:00Z",
        message: "Fix bug",
        messageItemId: 201
      }
    ];

    const workItems: AzureWorkItem[] = [
      { id: 100, title: "Auth story", type: "User Story", state: "Active", childIds: [201], relatedIds: [] },
      { id: 201, title: "Auth bug", type: "Bug", state: "Active", parentId: 100, childIds: [], relatedIds: [] }
    ];

    const result = correlateCommitsToItems(commits, workItems);

    expect(result.includedStories).toHaveLength(1);
    expect(result.includedStories[0]?.storyId).toBe(100);
    expect(result.includedStories[0]?.relatedWorkItemIds).toEqual([201]);
    expect(result.includedStories[0]?.exactMatchCount).toBe(1);
  });

  it("infers story through related work item when direct parent is missing", () => {
    const commits: GitCommit[] = [
      {
        repoName: "repo-a",
        repoPath: "C:/repo-a",
        hash: "rel123456",
        shortHash: "rel1234",
        authorName: "Test User",
        authorEmail: "test@example.com",
        authoredAt: "2026-03-13T10:00:00Z",
        message: "Fix related item",
        messageItemId: 300
      }
    ];

    const workItems: AzureWorkItem[] = [
      { id: 100, title: "Auth story", type: "User Story", state: "Active", childIds: [200], relatedIds: [] },
      { id: 200, title: "Auth task", type: "Task", state: "Active", parentId: 100, childIds: [], relatedIds: [] },
      { id: 300, title: "Peer bug", type: "Bug", state: "Active", childIds: [], relatedIds: [200] }
    ];

    const result = correlateCommitsToItems(commits, workItems);

    expect(result.includedStories).toHaveLength(1);
    expect(result.includedStories[0]?.storyId).toBe(100);
    expect(result.includedStories[0]?.inferredMatchCount).toBe(1);
  });

  it("puts task without parent story in standaloneWorkItems as the task itself", () => {
    const commits: GitCommit[] = [
      {
        repoName: "repo-a",
        repoPath: "C:/repo-a",
        hash: "abc",
        shortHash: "abc",
        authorName: "Test",
        authorEmail: "test@example.com",
        authoredAt: "2026-03-13T10:00:00Z",
        message: "Work on task",
        branchReference: { raw: "feature/200_foo", type: "feature", itemId: 200 }
      }
    ];
    const workItems: AzureWorkItem[] = [
      { id: 200, title: "Orphan task", type: "Task", state: "Active", childIds: [], relatedIds: [] }
    ];

    const result = correlateCommitsToItems(commits, workItems);

    expect(result.includedStories).toHaveLength(0);
    expect(result.standaloneWorkItems).toHaveLength(1);
    expect(result.standaloneWorkItems[0]?.storyId).toBe(200);
    expect(result.standaloneWorkItems[0]?.storyTitle).toBe("Orphan task");
    expect(result.standaloneWorkItems[0]?.workItemType).toBe("Task");
    expect(result.standaloneWorkItems[0]?.commits).toHaveLength(1);
    expect(result.excludedCommits).toHaveLength(0);
  });

  it("puts referenced item not found in Azure in standaloneWorkItems", () => {
    const commits: GitCommit[] = [
      {
        repoName: "repo-a",
        repoPath: "C:/repo-a",
        hash: "xyz",
        shortHash: "xyz",
        authorName: "Test",
        authorEmail: "test@example.com",
        authoredAt: "2026-03-13T10:00:00Z",
        message: "AB#99999 - Some work",
        messageItemId: 99999
      }
    ];
    const workItems: AzureWorkItem[] = [];

    const result = correlateCommitsToItems(commits, workItems);

    expect(result.includedStories).toHaveLength(0);
    expect(result.standaloneWorkItems).toHaveLength(1);
    expect(result.standaloneWorkItems[0]?.storyId).toBe(99999);
    expect(result.standaloneWorkItems[0]?.storyTitle).toBe("Work item not in sprint or not found");
    expect(result.standaloneWorkItems[0]?.workItemType).toBe("Unknown");
    expect(result.standaloneWorkItems[0]?.commits).toHaveLength(1);
    expect(result.excludedCommits).toHaveLength(0);
  });

  it("excludes only commits with no branch and no message reference", () => {
    const commits: GitCommit[] = [
      {
        repoName: "repo-a",
        repoPath: "C:/repo-a",
        hash: "noref",
        shortHash: "noref",
        authorName: "Test",
        authorEmail: "test@example.com",
        authoredAt: "2026-03-13T10:00:00Z",
        message: "Minor fix with no AB# or branch"
      }
    ];
    const result = correlateCommitsToItems(commits, []);

    expect(result.includedStories).toHaveLength(0);
    expect(result.standaloneWorkItems).toHaveLength(0);
    expect(result.excludedCommits).toHaveLength(1);
    expect(result.excludedCommits[0]?.reason).toBe("no-branch-reference");
  });
});
