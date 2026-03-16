import { runAzureCommand } from "./cli.js";

export async function getAccessToken(): Promise<string> {
  const { stdout } = await runAzureCommand([
    "account",
    "get-access-token",
    "--resource",
    "499b84ac-1321-427f-aa17-267ca6975798",
    "--output",
    "json"
  ]);

  const payload = JSON.parse(stdout) as { accessToken?: string };

  if (!payload.accessToken) {
    throw new Error("Azure CLI did not return an access token.");
  }

  return payload.accessToken;
}
