import type { Config } from "../config/schema.js";

export type AppConfig = Config;

export type GenerateOptions = {
  sprint?: string;
  lastSprints?: string;
  from?: string;
  to?: string;
  output?: string;
  debug?: boolean;
  forSingleSprintInMulti?: string;
};

export type SprintSelection =
  | { mode: "current" }
  | { mode: "named"; sprintName: string }
  | { mode: "multi-sprint"; sprintNames: string[] }
  | { mode: "date-range"; from: string; to: string };

export type RepoInfo = {
  name: string;
  path: string;
};

export type BranchType = "feature" | "hotfix";

export type BranchReference = {
  raw: string;
  type: BranchType;
  itemId: number;
  description?: string;
  ownerSuffix?: string;
};

export type GitCommit = {
  repoName: string;
  repoPath: string;
  hash: string;
  shortHash: string;
  authorName: string;
  authorEmail: string;
  authoredAt: string;
  message: string;
  branchName?: string;
  branchReference?: BranchReference;
  messageItemId?: number;
};

export type AzureIteration = {
  id: string;
  name: string;
  path: string;
  startDate?: string;
  finishDate?: string;
};

export type AzureWorkItem = {
  id: number;
  type: string;
  title: string;
  state: string;
  iterationPath?: string;
  areaPath?: string;
  assignedTo?: string;
  parentId?: number;
  childIds: number[];
  relatedIds: number[];
  url?: string;
};

export type CorrelationConfidence = "exact" | "inferred";

export type StoryAggregate = {
  storyId: number;
  storyTitle: string;
  storyState: string;
  iterationPath?: string;
  taskIds: number[];
  relatedWorkItemIds: number[];
  repos: string[];
  commits: GitCommit[];
  hotfixCommits: GitCommit[];
  referencedItemIds: number[];
  exactMatchCount: number;
  inferredMatchCount: number;
  workItemType?: string;
};

export type CorrelationExclusionReason =
  | "no-branch-reference"
  | "item-not-found"
  | "item-outside-sprint"
  | "task-without-parent-story";

export type CorrelationResult = {
  includedStories: StoryAggregate[];
  standaloneWorkItems: StoryAggregate[];
  excludedCommits: Array<{
    commit: GitCommit;
    reason: CorrelationExclusionReason;
  }>;
};

export type UnlinkedRepoActivity = {
  repoName: string;
  repoPath: string;
  commitCount: number;
  commits: GitCommit[];
  reasons: CorrelationExclusionReason[];
};

export type ReportModel = {
  sprint: AzureIteration;
  period: {
    from: string;
    to: string;
  };
  summary: string;
  stories: StoryAggregate[];
  standaloneWorkItems: StoryAggregate[];
  unlinkedRepos: UnlinkedRepoActivity[];
  includeUnlinkedTechnicalWork: boolean;
  locale: "pt-BR" | "en";
  stats: {
    repoCount: number;
    commitCount: number;
    storyCount: number;
    standaloneItemCount: number;
    relatedItemCount: number;
    hotfixCount: number;
    unlinkedCommitCount: number;
    unlinkedRepoCount: number;
  };
};

export type GeneratePipelineResult = {
  repos: RepoInfo[];
  commits: GitCommit[];
  sprint: AzureIteration;
  workItems: AzureWorkItem[];
  correlation: CorrelationResult;
  report: ReportModel;
  outputPath: string;
};

export type MultiSprintReport = {
  generatedAt: string;
  reports: ReportModel[];
};
