import type { BranchReference } from "../../core/types.js";

const STRICT_BRANCH_REGEX = /^(feature|hotfix)\/(\d+)_([^.]*)\.(.+)$/;
const RELAXED_BRANCH_REGEX = /^(feature|hotfix)\/(\d+)_.*$/;

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

  return undefined;
}
