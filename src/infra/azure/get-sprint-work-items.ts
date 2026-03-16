import type { AppConfig, AzureIteration } from "../../core/types.js";
import { AzureClient } from "./azure-client.js";
import type { WiqlResponse } from "./types.js";

export async function getSprintWorkItemIds(
  config: AppConfig,
  token: string,
  sprint: AzureIteration
): Promise<number[]> {
  const client = new AzureClient(config, token);
  const wiql = {
    query: `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.IterationId] = ${sprint.id}`
  };

  const response = await client.request<WiqlResponse>({
    path: `_apis/wit/wiql?api-version=7.1`,
    method: "POST",
    body: wiql
  });

  return response.workItems.map((item) => item.id);
}
