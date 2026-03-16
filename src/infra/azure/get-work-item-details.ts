import type { AppConfig, AzureWorkItem } from "../../core/types.js";
import { logger } from "../../core/logger.js";
import { uniqueNumbers } from "../../core/utils.js";
import { AzureClient } from "./azure-client.js";
import type { WorkItemApiResponse, WorkItemsBatchResponse } from "./types.js";

type GetWorkItemDetailsOptions = {
  expandRelated?: boolean;
};

export async function getWorkItemDetails(
  config: AppConfig,
  token: string,
  workItemIds: number[],
  options: GetWorkItemDetailsOptions = {}
): Promise<AzureWorkItem[]> {
  if (workItemIds.length === 0) {
    return [];
  }

  const client = new AzureClient(config, token);
  const collected = new Map<number, AzureWorkItem>();
  let pendingIds = uniqueNumbers(workItemIds);
  let depth = 0;

  while (pendingIds.length > 0) {
    const fetchedItems = await fetchWorkItemsBatch(client, pendingIds);
    for (const item of fetchedItems) {
      collected.set(item.id, item);
    }

    const nextIds = new Set<number>();
    for (const item of fetchedItems) {
      if (item.parentId && !collected.has(item.parentId)) {
        nextIds.add(item.parentId);
      }

      if (options.expandRelated && depth === 0) {
        for (const relatedId of item.relatedIds) {
          if (!collected.has(relatedId)) {
            nextIds.add(relatedId);
          }
        }
      }
    }

    pendingIds = [...nextIds];
    depth += 1;
  }

  return [...collected.values()];
}

async function fetchWorkItemsBatch(client: AzureClient, workItemIds: number[]): Promise<AzureWorkItem[]> {
  const chunks = chunk(workItemIds, 200);
  const responses = await Promise.all(chunks.map((ids) => fetchBatchChunk(client, ids)));

  return responses.flatMap((response) => response.value.map(mapWorkItem));
}

async function fetchBatchChunk(client: AzureClient, workItemIds: number[]): Promise<WorkItemsBatchResponse> {
  try {
    return await client.request<WorkItemsBatchResponse>({
      path: `_apis/wit/workitemsbatch?api-version=7.1`,
      method: "POST",
      body: {
        ids: workItemIds,
        $expand: "Relations"
      }
    });
  } catch (error) {
    if (workItemIds.length === 1) {
      logger.warn(`Skipping inaccessible work item ${workItemIds[0]}.`);
      return { value: [] };
    }

    const middle = Math.ceil(workItemIds.length / 2);
    const [left, right] = await Promise.all([
      fetchBatchChunk(client, workItemIds.slice(0, middle)),
      fetchBatchChunk(client, workItemIds.slice(middle))
    ]);

    return { value: [...left.value, ...right.value] };
  }
}

function mapWorkItem(item: WorkItemApiResponse): AzureWorkItem {
  const parentRelation = item.relations?.find((relation) => relation.rel === "System.LinkTypes.Hierarchy-Reverse");
  const childRelations = item.relations?.filter((relation) => relation.rel === "System.LinkTypes.Hierarchy-Forward") ?? [];
  const relatedRelations = item.relations?.filter((relation) => relation.rel === "System.LinkTypes.Related") ?? [];

  return {
    id: item.id,
    title: String(item.fields["System.Title"] ?? "Untitled"),
    type: String(item.fields["System.WorkItemType"] ?? "Unknown"),
    state: String(item.fields["System.State"] ?? "Unknown"),
    iterationPath: toOptionalString(item.fields["System.IterationPath"]),
    areaPath: toOptionalString(item.fields["System.AreaPath"]),
    assignedTo: extractAssignedTo(item.fields["System.AssignedTo"]),
    parentId: parentRelation?.url ? extractIdFromRelationUrl(parentRelation.url) : undefined,
    childIds: childRelations
      .map((relation) => relation.url)
      .filter((value): value is string => Boolean(value))
      .map(extractIdFromRelationUrl),
    relatedIds: relatedRelations
      .map((relation) => relation.url)
      .filter((value): value is string => Boolean(value))
      .map(extractIdFromRelationUrl),
    url: item.url
  };
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function extractAssignedTo(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "displayName" in value && typeof value.displayName === "string") {
    return value.displayName;
  }

  return undefined;
}

function extractIdFromRelationUrl(url: string): number {
  const id = url.split("/").pop();
  if (!id) {
    throw new Error(`Could not extract work item id from relation url '${url}'.`);
  }

  return Number(id);
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}
