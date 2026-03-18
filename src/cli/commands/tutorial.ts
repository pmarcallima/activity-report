import { loadConfig } from "../../config/load-config.js";
import { getCliMessages } from "../../core/i18n.js";

/**
 * Prints a short step-by-step tutorial to the terminal.
 * Uses config locale if available, otherwise defaults to "en".
 */
export async function tutorialCommand(options: { locale?: "en" | "pt-BR" }): Promise<void> {
  let locale: "en" | "pt-BR" = options.locale ?? "en";
  try {
    const config = await loadConfig();
    if (!options.locale && config.locale) {
      locale = config.locale;
    }
  } catch {
    // No config: keep default locale
  }

  const t = getCliMessages(locale);
  console.log(`\n${t.tutorialTitle}\n`);
  console.log(`${t.tutorialIntro}\n`);
  console.log(t.tutorialStepInstall);
  console.log(t.tutorialStepInit);
  console.log(t.tutorialStepDoctor);
  console.log(t.tutorialStepGenerate);
  console.log(t.tutorialStepView);
  console.log(`\n${t.tutorialNoteConfig}\n`);
}
