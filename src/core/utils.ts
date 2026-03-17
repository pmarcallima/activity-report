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
  const match = sprintName.match(/sprint[\s-]*(\d+)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return undefined;
}

export function isContiguousRange(numbers: number[]): boolean {
  if (numbers.length <= 1) return true;
  const sorted = [...numbers].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] !== 1) {
      return false;
    }
  }
  return true;
}

export function buildMultiSprintFolderName(sprintNames: string[]): string {
  const sprintNumbers = sprintNames
    .map(extractSprintNumber)
    .filter((n): n is number => n !== undefined)
    .sort((a, b) => a - b);

  if (sprintNumbers.length === 0) {
    return "multi-sprint";
  }

  if (sprintNumbers.length === 1) {
    return `sprints-${sprintNumbers[0]}`;
  }

  if (isContiguousRange(sprintNumbers)) {
    const min = sprintNumbers[0];
    const max = sprintNumbers[sprintNumbers.length - 1];
    return `sprints-${min}-${max}`;
  }

  return `sprints-${sprintNumbers.join("-")}`;
}
