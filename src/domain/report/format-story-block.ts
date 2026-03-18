import type { StoryAggregate } from "../../core/types.js";
import type { ReportMessages } from "../../core/i18n.js";

/**
 * Formats the heading for a story or standalone work item (e.g. "US#123 - Title" or "Task#456 - Title").
 */
export function formatStoryHeading(
  story: StoryAggregate,
  asStandalone: boolean,
  t: ReportMessages
): string {
  if (!asStandalone || !story.workItemType) {
    return `US#${story.storyId} - ${story.storyTitle}`;
  }
  const label = story.workItemType === "Unknown" ? t.workItem : story.workItemType;
  const title = story.storyTitle ? ` - ${story.storyTitle}` : "";
  return `${label}#${story.storyId}${title}`;
}

/**
 * Formats link quality line (exact/inferred counts or "no linked commits").
 */
export function formatLinkQuality(
  exactMatchCount: number,
  inferredMatchCount: number,
  t: ReportMessages
): string {
  const parts: string[] = [];
  if (exactMatchCount > 0) {
    parts.push(`${exactMatchCount} ${t.exact}`);
  }
  if (inferredMatchCount > 0) {
    parts.push(`${inferredMatchCount} ${t.inferred}`);
  }
  return parts.length > 0 ? parts.join(", ") : t.noLinkedCommits;
}

type RenderStoryBlockOptions = {
  /** Markdown heading level (3 = ###, 4 = ####). */
  headingLevel: 3 | 4;
};

/**
 * Appends a story block (heading, state, summary, evidence) to the given lines.
 * Shared by single-sprint and multi-sprint report renderers to avoid duplication (DRY).
 */
export function renderStoryBlock(
  lines: string[],
  story: StoryAggregate,
  summarizeStoryFn: (s: StoryAggregate) => string,
  asStandalone: boolean,
  t: ReportMessages,
  options: RenderStoryBlockOptions = { headingLevel: 3 }
): void {
  const prefix = "#".repeat(options.headingLevel);
  lines.push(`${prefix} ${formatStoryHeading(story, asStandalone, t)}`);
  if (asStandalone) {
    lines.push(`- **${t.unlinkedFromStory}** ${t.unlinkedFromStoryNote}`);
  }
  lines.push(`- ${t.state}: ${story.storyState}`);
  lines.push(`- ${t.summary}: ${summarizeStoryFn(story)}`);
  lines.push(`- ${t.linkQuality}: ${formatLinkQuality(story.exactMatchCount, story.inferredMatchCount, t)}`);
  if (story.relatedWorkItemIds.length > 0) {
    lines.push(`- ${t.relatedItems}: ${story.relatedWorkItemIds.map((itemId) => `#${itemId}`).join(", ")}`);
  }
  lines.push(`- ${t.repositories}: ${story.repos.map((repo) => `\`${repo}\``).join(", ")}`);
  lines.push(`- ${t.evidence}:`);
  for (const commit of story.commits.sort((left, right) => left.authoredAt.localeCompare(right.authoredAt))) {
    lines.push(`  - \`${commit.repoName}\` - \`${commit.shortHash}\` - ${commit.message}`);
  }
  if (options.headingLevel === 3) {
    lines.push("");
  }
}
