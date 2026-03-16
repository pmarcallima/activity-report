import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export function getAzureCliExecutable(): string {
  return process.platform === "win32" ? "az.cmd" : "az";
}

export async function runAzureCommand(args: string[]): Promise<{ stdout: string; stderr: string }> {
  const executable = getAzureCliExecutable();

  if (process.platform === "win32") {
    const command = [executable, ...args].join(" ");
    return execFileAsync("cmd", ["/c", command], {
      maxBuffer: 1024 * 1024
    });
  }

  return execFileAsync(executable, args, {
    maxBuffer: 1024 * 1024
  });
}
