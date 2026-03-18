import type { AzureWorkItem, CorrelationConfidence, CorrelationResult, GitCommit, StoryAggregate } from "../../core/types.js";

export function correlateCommitsToItems(commits: GitCommit[], workItems: AzureWorkItem[]): CorrelationResult {
  const workItemMap = new Map(workItems.map((item) => [item.id, item]));
  const stories = new Map<number, StoryAggregate>();
  const standaloneItems = new Map<number, StoryAggregate>();
  const excludedCommits: CorrelationResult["excludedCommits"] = [];

  for (const commit of commits) {
    const referenceId = commit.branchReference?.itemId ?? commit.messageItemId;
    if (!referenceId) {
      excludedCommits.push({ commit, reason: "no-branch-reference" });
      continue;
    }

    const item = workItemMap.get(referenceId);
    if (!item) {
      const aggregate = standaloneItems.get(referenceId) ?? createStandaloneAggregate(referenceId, "Unknown");
      aggregate.repos = unique([...aggregate.repos, commit.repoName]);
      aggregate.referencedItemIds = unique([...aggregate.referencedItemIds, referenceId]);
      aggregate.commits.push(commit);
      aggregate.inferredMatchCount += 1;
      standaloneItems.set(referenceId, aggregate);
      continue;
    }

    const resolution = resolveStory(item, workItemMap);
    if (!resolution) {
      const aggregate = standaloneItems.get(item.id) ?? createStandaloneAggregateFromItem(item);
      aggregate.repos = unique([...aggregate.repos, commit.repoName]);
      aggregate.referencedItemIds = unique([...aggregate.referencedItemIds, item.id]);
      if (item.type === "Task") {
        aggregate.taskIds = unique([...aggregate.taskIds, item.id]);
      }
      aggregate.commits.push(commit);
      aggregate.exactMatchCount += 1;
      if (isHotfixCommit(commit)) {
        aggregate.hotfixCommits.push(commit);
      }
      standaloneItems.set(item.id, aggregate);
      continue;
    }

    const { story, confidence } = resolution;
    const aggregate = stories.get(story.id) ?? createAggregate(story);
    aggregate.repos = unique([...aggregate.repos, commit.repoName]);
    aggregate.referencedItemIds = unique([...aggregate.referencedItemIds, item.id]);
    if (item.id !== story.id) {
      aggregate.relatedWorkItemIds = unique([...aggregate.relatedWorkItemIds, item.id]);
    }

    if (item.type === "Task") {
      aggregate.taskIds = unique([...aggregate.taskIds, item.id]);
    }

    aggregate.commits.push(commit);
    if (confidence === "exact") {
      aggregate.exactMatchCount += 1;
    } else {
      aggregate.inferredMatchCount += 1;
    }

    if (isHotfixCommit(commit)) {
      aggregate.hotfixCommits.push(commit);
    }

    stories.set(story.id, aggregate);
  }

  return {
    includedStories: [...stories.values()].sort((left, right) => left.storyId - right.storyId),
    standaloneWorkItems: [...standaloneItems.values()].sort((left, right) => left.storyId - right.storyId),
    excludedCommits
  };
}

function resolveStory(
  item: AzureWorkItem,
  workItemMap: Map<number, AzureWorkItem>
): { story: AzureWorkItem; confidence: CorrelationConfidence } | undefined {
  const directStory = resolveThroughParents(item, workItemMap);
  if (directStory) {
    return { story: directStory, confidence: "exact" };
  }

  const relatedStory = resolveThroughRelatedItems(item, workItemMap);
  if (relatedStory) {
    return { story: relatedStory, confidence: "inferred" };
  }

  return undefined;
}

function createAggregate(story: AzureWorkItem): StoryAggregate {
  return {
    storyId: story.id,
    storyTitle: story.title,
    storyState: story.state,
    iterationPath: story.iterationPath,
    taskIds: [],
    relatedWorkItemIds: [],
    repos: [],
    commits: [],
    hotfixCommits: [],
    referencedItemIds: [story.id],
    exactMatchCount: 0,
    inferredMatchCount: 0
  };
}

function createStandaloneAggregate(itemId: number, workItemType: string): StoryAggregate {
  return {
    storyId: itemId,
    storyTitle: workItemType === "Unknown" ? "Work item not in sprint or not found" : "",
    storyState: "—",
    taskIds: [],
    relatedWorkItemIds: [],
    repos: [],
    commits: [],
    hotfixCommits: [],
    referencedItemIds: [itemId],
    exactMatchCount: 0,
    inferredMatchCount: 0,
    workItemType
  };
}

function createStandaloneAggregateFromItem(item: AzureWorkItem): StoryAggregate {
  return {
    storyId: item.id,
    storyTitle: item.title,
    storyState: item.state,
    iterationPath: item.iterationPath,
    taskIds: item.type === "Task" ? [item.id] : [],
    relatedWorkItemIds: [],
    repos: [],
    commits: [],
    hotfixCommits: [],
    referencedItemIds: [item.id],
    exactMatchCount: 0,
    inferredMatchCount: 0,
    workItemType: item.type
  };
}

function resolveThroughParents(item: AzureWorkItem, workItemMap: Map<number, AzureWorkItem>): AzureWorkItem | undefined {
  const visited = new Set<number>();
  let current: AzureWorkItem | undefined = item;

  while (current) {
    if (visited.has(current.id)) {
      return undefined;
    }

    visited.add(current.id);

    if (current.type === "User Story") {
      return current;
    }

    current = current.parentId ? workItemMap.get(current.parentId) : undefined;
  }

  return undefined;
}

function resolveThroughRelatedItems(item: AzureWorkItem, workItemMap: Map<number, AzureWorkItem>): AzureWorkItem | undefined {
  const queue = [...item.relatedIds];
  const visited = new Set<number>([item.id]);

  while (queue.length > 0) {
    const relatedId = queue.shift();
    if (!relatedId || visited.has(relatedId)) {
      continue;
    }

    visited.add(relatedId);
    const relatedItem = workItemMap.get(relatedId);
    if (!relatedItem) {
      continue;
    }

    const story = resolveThroughParents(relatedItem, workItemMap);
    if (story) {
      return story;
    }

    for (const nextRelatedId of relatedItem.relatedIds) {
      if (!visited.has(nextRelatedId)) {
        queue.push(nextRelatedId);
      }
    }
  }

  return undefined;
}

function isHotfixCommit(commit: GitCommit): boolean {
  return commit.branchReference?.type === "hotfix" || commit.message.startsWith("[HOTFIX]");
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
