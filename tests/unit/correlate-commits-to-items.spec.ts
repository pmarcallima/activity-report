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
});
