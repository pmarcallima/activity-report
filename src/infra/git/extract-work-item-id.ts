export function extractWorkItemId(text: string): number | undefined {
  const match = text.match(/(?:AB#|#)(\d+)/i);
  if (!match) {
    return undefined;
  }

  return Number(match[1]);
}
