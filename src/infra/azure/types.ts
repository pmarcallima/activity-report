export type ClassificationNode = {
  id: string;
  name: string;
  path: string;
  attributes?: {
    startDate?: string;
    finishDate?: string;
    timeFrame?: string;
  };
  children?: ClassificationNode[];
};

export type IterationListResponse = {
  value: Array<{
    id: string;
    name: string;
    path: string;
    attributes?: {
      startDate?: string;
      finishDate?: string;
      timeFrame?: string;
    };
  }>;
};

export type WiqlResponse = {
  workItems: Array<{ id: number }>;
};

export type WorkItemApiResponse = {
  id: number;
  fields: Record<string, unknown>;
  relations?: Array<{
    rel: string;
    url: string;
    attributes?: { name?: string };
  }>;
};

export type WorkItemsBatchResponse = {
  value: WorkItemApiResponse[];
};
