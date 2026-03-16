import type { AppConfig, AzureIteration } from "../../core/types.js";
import { AzureClient } from "./azure-client.js";
import type { ClassificationNode } from "./types.js";

function flattenIterations(nodes: ClassificationNode[], parentPath = ""): AzureIteration[] {
  const iterations: AzureIteration[] = [];

  for (const node of nodes) {
    const currentPath = parentPath ? `${parentPath}\\${node.name}` : node.name;
    // Azure uses forward slashes in iteration paths for WIQL queries
    const wiqlPath = currentPath.replace(/\\/g, "/");

    if (node.attributes?.startDate || node.attributes?.finishDate) {
      iterations.push({
        id: node.id,
        name: node.name,
        path: wiqlPath,
        startDate: node.attributes?.startDate,
        finishDate: node.attributes?.finishDate
      });
    }

    if (node.children) {
      iterations.push(...flattenIterations(node.children, currentPath));
    }
  }

  return iterations;
}

export async function getIterations(config: AppConfig, token: string): Promise<AzureIteration[]> {
  const client = new AzureClient(config, token);

  const response = await client.request<ClassificationNode>({
    path: "_apis/wit/classificationnodes/iterations?$depth=10&api-version=7.1"
  });

  // The root node is the project name (e.g., "Group Com"), and its children are the iterations
  // We pass the root node name as the starting parent path so paths become "Group Com\Sprint X"
  if (response.children) {
    return flattenIterations(response.children, response.name);
  }

  return [];
}
