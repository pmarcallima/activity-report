import type { AppConfig, AzureIteration, SprintSelection } from "../../core/types.js";
import { getIterations } from "./get-iterations.js";

function formatSprintList(iterations: AzureIteration[]): string {
  return iterations
    .slice(0, 10)
    .map((i) => {
      const start = i.startDate?.slice(0, 10) ?? "no start";
      const end = i.finishDate?.slice(0, 10) ?? "no end";
      return `  - ${i.name} (${start} to ${end})`;
    })
    .join("\n");
}

export async function resolveSprint(
  config: AppConfig,
  token: string,
  resolution: SprintSelection
): Promise<AzureIteration> {
  const iterations = await getIterations(config, token);

  if (resolution.mode === "named") {
    const iteration = iterations.find(
      (candidate) => candidate.name === resolution.sprintName || candidate.path === resolution.sprintName
    );
    if (!iteration) {
      throw new Error(`Could not find sprint '${resolution.sprintName}'.`);
    }
    return iteration;
  }

  if (resolution.mode === "date-range") {
    return {
      id: "",
      name: `${resolution.from} to ${resolution.to}`,
      path: "",
      startDate: resolution.from,
      finishDate: resolution.to
    };
  }

  const now = new Date().toISOString();
  const current = iterations.find((iteration) => {
    const start = iteration.startDate;
    const end = iteration.finishDate;
    if (!start || !end) return false;
    return start <= now && end >= now;
  });

  if (!current) {
    const sortedByDate = iterations
      .filter((i) => i.startDate && i.finishDate)
      .sort((a, b) => new Date(b.startDate!).getTime() - new Date(a.startDate!).getTime());
    
    if (sortedByDate.length > 0) {
      return sortedByDate[0];
    }

    const nowDate = new Date().toISOString().slice(0, 10);
    const withDates = iterations.filter((i) => i.startDate && i.finishDate);
    const withoutDates = iterations.length - withDates.length;

    const suggestions = [
      `Current date: ${nowDate}`,
      `Found ${iterations.length} iterations (${withoutDates} without dates)`,
      withDates.length > 0 ? `Available sprints:\n${formatSprintList(withDates)}` : "No sprints with dates found in Azure.",
      "Tip: Use --sprint <name> to specify a sprint manually"
    ].join("\n");

    throw new Error(`Could not resolve current Azure sprint.\n\n${suggestions}`);
  }

  return current;
}
