import { select } from "@inquirer/prompts";
import { input } from "@inquirer/prompts";

import type { AppConfig, AzureIteration, SprintSelection } from "../core/types.js";
import { getIterations } from "../infra/azure/get-iterations.js";
import { getAccessToken } from "../infra/azure/get-access-token.js";
import { withSpinner, isTTY } from "./progress.js";

export interface SprintChoice {
  name: string;
  value: string;
  dates?: string;
  isCurrent?: boolean;
}

export async function selectSprintInteractive(config: AppConfig): Promise<SprintSelection> {
  const token = await getAccessToken();

  const iterations = await withSpinner("Fetching sprints from Azure...", async () => {
    return getIterations(config, token);
  });

  const sortedIterations = iterations
    .filter((i) => i.startDate && i.finishDate)
    .sort((a, b) => new Date(b.startDate ?? 0).getTime() - new Date(a.startDate ?? 0).getTime());

  const now = new Date();

  const choices: SprintChoice[] = sortedIterations.slice(0, 20).map((iteration) => {
    const startDate = iteration.startDate ? new Date(iteration.startDate) : null;
    const finishDate = iteration.finishDate ? new Date(iteration.finishDate) : null;

    const isCurrent = startDate && finishDate
      ? now >= startDate && now <= finishDate
      : false;

    const dates = startDate && finishDate
      ? `${formatDate(startDate)} - ${formatDate(finishDate)}`
      : undefined;

    return {
      name: iteration.name,
      value: iteration.name,
      dates,
      isCurrent
    };
  });

  choices.push({
    name: "Custom date range...",
    value: "__custom__",
    dates: undefined,
    isCurrent: false
  });

  const formatChoice = (choice: SprintChoice): string => {
    let label = choice.name;
    if (choice.dates) {
      label += ` (${choice.dates})`;
    }
    if (choice.isCurrent) {
      label += " [current]";
    }
    return label;
  };

  const formattedChoices = choices.map((choice) => ({
    name: formatChoice(choice),
    value: choice.value
  }));

  const selected = await select({
    message: "Select sprint:",
    choices: formattedChoices
  });

  if (selected === "__custom__") {
    return await promptCustomDateRange();
  }

  const selectedIteration = sortedIterations.find((i) => i.name === selected);
  if (selectedIteration) {
    return { mode: "named", sprintName: selectedIteration.name };
  }

  return { mode: "current" };
}

async function promptCustomDateRange(): Promise<SprintSelection> {
  const from = await input({
    message: "Start date (YYYY-MM-DD):",
    validate: (value: string) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return "Please enter a date in YYYY-MM-DD format.";
      }
      return true;
    }
  });

  const to = await input({
    message: "End date (YYYY-MM-DD):",
    validate: (value: string) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return "Please enter a date in YYYY-MM-DD format.";
      }
      return true;
    }
  });

  return { mode: "date-range", from, to };
}

function formatDate(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}/${day}`;
}
