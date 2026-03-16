export function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values)];
}

export function slugify(value: string): string {
  return value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function extractSprintNumber(sprintName: string): number | undefined {
  // Match "Sprint 12", "Sprint-12", "sprint 12", "sprint12", etc.
  const match = sprintName.match(/sprint[\s-]*(\d+)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return undefined;
}
