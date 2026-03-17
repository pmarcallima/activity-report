import ora, { type Spinner } from "ora";
import cliProgress from "cli-progress";

export function isTTY(): boolean {
  return process.stdout.isTTY === true && process.stderr.isTTY === true;
}

export function createSpinner(text: string): Spinner {
  return ora({
    text,
    isEnabled: isTTY()
  });
}

export async function withSpinner<T>(
  text: string,
  fn: () => Promise<T>,
  succeedText?: string
): Promise<T> {
  if (!isTTY()) {
    console.log(`[info] ${text}`);
    const result = await fn();
    return result;
  }

  const spinner = createSpinner(text);
  spinner.start();

  try {
    const result = await fn();
    spinner.succeed(succeedText || text);
    return result;
  } catch (error) {
    spinner.fail(`${text} - failed`);
    throw error;
  }
}

export interface MultiBarController {
  start(repoName: string, total: number): void;
  increment(repoName: string, commits: number): void;
  stop(repoName: string): void;
}

export function createMultiBar(): MultiBarController {
  const bars = new Map<string, cliProgress.SingleBar>();
  const multi = new cliProgress.MultiBar(
    {
      clearOnComplete: false,
      hideCursor: true,
      format: "{bar}| {repo} | {value}/{total} commits",
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591"
    },
    cliProgress.Presets.shades_classic
  );

  return {
    start(repoName: string, total: number) {
      if (!isTTY()) return;
      const bar = multi.create(total, 0, { repo: repoName });
      bars.set(repoName, bar);
    },
    increment(repoName: string, commits: number) {
      const bar = bars.get(repoName);
      if (bar) {
        bar.increment();
      }
    },
    stop(repoName: string) {
      const bar = bars.get(repoName);
      if (bar) {
        bar.stop();
        bars.delete(repoName);
      }
    }
  };
}

export function stopAllBars(multi: MultiBarController, repoNames: string[]) {
  if (!isTTY()) return;
  for (const repoName of repoNames) {
    multi.stop(repoName);
  }
}
