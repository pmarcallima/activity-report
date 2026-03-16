import type { AppConfig } from "../../core/types.js";

type RequestOptions = {
  path: string;
  method?: string;
  body?: unknown;
};

export class AzureClient {
  public constructor(
    private readonly config: AppConfig,
    private readonly token: string
  ) {}

  public async request<T>({ path, method = "GET", body }: RequestOptions): Promise<T> {
    const url = new URL(
      `https://dev.azure.com/${this.config.azure.organization}/${this.config.azure.project}/${path}`
    );

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Azure request failed (${response.status}): ${text}`);
    }

    return (await response.json()) as T;
  }
}
