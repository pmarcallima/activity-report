import type { BranchReference } from "../../core/types.js";

/** feature/123_desc.owner or hotfix/123_desc.owner */
const STRICT_BRANCH_REGEX = /^(feature|hotfix)\/(\d+)_([^.]*)\.(.+)$/;
/** feature/123_something or hotfix/123_anything */
const RELAXED_BRANCH_REGEX = /^(feature|hotfix)\/(\d+)_.*$/;
/** feature/12345 or hotfix/12345 (no underscore — e.g. User Story number only) */
const FALLBACK_BRANCH_REGEX = /^(feature|hotfix)\/(\d+)(?:[-_].*)?$/;

export function parseBranchName(branchName: string): BranchReference | undefined {
  const strictMatch = branchName.match(STRICT_BRANCH_REGEX);
  if (strictMatch) {
    return {
      raw: branchName,
      type: strictMatch[1] as BranchReference["type"],
      itemId: Number(strictMatch[2]),
      description: strictMatch[3] || undefined,
      ownerSuffix: strictMatch[4] || undefined
    };
  }

  const relaxedMatch = branchName.match(RELAXED_BRANCH_REGEX);
  if (relaxedMatch) {
    return {
      raw: branchName,
      type: relaxedMatch[1] as BranchReference["type"],
      itemId: Number(relaxedMatch[2])
    };
  }

  const fallbackMatch = branchName.match(FALLBACK_BRANCH_REGEX);
  if (fallbackMatch) {
    return {
      raw: branchName,
      type: fallbackMatch[1] as BranchReference["type"],
      itemId: Number(fallbackMatch[2])
    };
  }

  return undefined;
}
