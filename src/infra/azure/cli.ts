import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export function getAzureCliExecutable(): string {
  return process.platform === "win32" ? "az.cmd" : "az";
}

export async function runAzureCommand(args: string[]): Promise<{ stdout: string; stderr: string }> {
  const executable = getAzureCliExecutable();
  const isWindows = process.platform === "win32";
  return execFileAsync(executable, args, {
    shell: isWindows,
    maxBuffer: 1024 * 1024
  });
}
