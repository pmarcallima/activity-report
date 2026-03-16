import { input, select, confirm, checkbox } from "@inquirer/prompts";

export { input, select, confirm, checkbox };

export async function promptRequired(message: string, defaultValue?: string): Promise<string> {
  const result = await input({
    message,
    default: defaultValue,
    validate: (value: string) => {
      if (value.trim().length === 0) {
        return "This field is required. Please enter a value.";
      }
      return true;
    }
  });

  return result.trim();
}

export async function promptPath(message: string, defaultPath?: string): Promise<string> {
  const result = await input({
    message,
    default: defaultPath,
    validate: (value: string) => {
      if (value.trim().length === 0) {
        return "Path is required.";
      }
      return true;
    }
  });

  return result.trim();
}

export async function promptConfirm(message: string, defaultValue = true): Promise<boolean> {
  return confirm({
    message,
    default: defaultValue
  });
}

export async function promptSelect<T extends string>(
  message: string,
  choices: Array<{ name: string; value: T }>,
  defaultValue?: T
): Promise<T> {
  return select({
    message,
    choices,
    default: defaultValue
  });
}

export async function promptMultiSelect(
  message: string,
  choices: Array<{ name: string; value: string }>,
  defaultValues?: string[]
): Promise<string[]> {
  return checkbox({
    message,
    choices,
    default: defaultValues
  });
}
