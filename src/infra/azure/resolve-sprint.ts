import type { AppConfig, AzureIteration, SprintSelection } from "../../core/types.js";
import { getIterations } from "./get-iterations.js";

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

  const now = new Date().toISOString();
  const current = iterations.find((iteration) => {
    const start = iteration.startDate;
    const end = iteration.finishDate;
    if (!start || !end) return false;
    return start <= now && end >= now;
  });

  if (!current) {
    throw new Error("Could not resolve current Azure sprint.");
  }

  return current;
}
