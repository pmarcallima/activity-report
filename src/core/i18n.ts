export type Locale = "pt-BR" | "en";

export type ReportMessages = {
  title: string;
  sprint: string;
  period: string;
  highlights: string;
  workedStories: string;
  standaloneItems: string;
  standaloneItemsOne: string;
  commitsAndItems: string;
  hotfixCount: string;
  hotfixCountOne: string;
  unlinkedCommits: string;
  unlinkedRepo: string;
  unlinkedRepoOne: string;
  userStories: string;
  noStories: string;
  tasksUnlinked: string;
  tasksUnlinkedSubtitle: string;
  unlinkedFromStory: string;
  unlinkedFromStoryNote: string;
  state: string;
  summary: string;
  linkQuality: string;
  relatedItems: string;
  repositories: string;
  evidence: string;
  unlinkedWork: string;
  unlinkedWorkSubtitle: string;
  noLinkedCommits: string;
  exact: string;
  inferred: string;
  workItem: string;
  theRepository: string;
  and: string;
  themeFallback: string;
  summaryFocused: string;
  summaryNoStories: string;
  summaryStandalone: string;
  summaryStandaloneOne: string;
  summaryUnlinkedRepo: string;
  summaryWorkedAcross: string;
  summaryCaptured: string;
  summaryCapturedOne: string;
  /** Multi-sprint report header: "Generated at" / "Gerado em" */
  generatedAt: string;
  /** Overview line: "Linked stories" / "User stories vinculadas" */
  overviewLinkedStories: string;
  /** Overview: "tasks/items" (short for standalone count) */
  overviewStandaloneShort: string;
  /** Overview: "linked commits" / "commits vinculados" */
  overviewLinkedCommits: string;
  /** Overview: "unlinked commits" / "commits não vinculados" */
  overviewUnlinkedCommits: string;
};

export type CliMessages = {
  fetchingSprints: string;
  selectSprints: string;
  customDateRange: string;
  startDate: string;
  endDate: string;
  dateFormatError: string;
  selectOneSprint: string;
  reportWritten: string;
  generatingReport: string;
  combinedReportWritten: string;
  foundRepos: string;
  collectingCommits: string;
  collectedCommits: string;
  loadingWorkItems: string;
  correlating: string;
  buildingReport: string;
  noReportsFound: string;
  reportNotFound: string;
  availableReports: string;
  selectReport: string;
  resolvingSprint: string;
  discoveringRepos: string;
  fetchingSprintDetails: string;
  resolvingSprintHistory: string;
  multiSprintTitle: string;
  overview: string;
  noStoriesShort: string;
  tutorialTitle: string;
  tutorialIntro: string;
  tutorialStepInstall: string;
  tutorialStepInit: string;
  tutorialStepDoctor: string;
  tutorialStepGenerate: string;
  tutorialStepView: string;
  tutorialNoteConfig: string;
};

const en: ReportMessages & CliMessages = {
  title: "Activity Report",
  sprint: "Sprint",
  period: "Period",
  highlights: "Highlights",
  workedStories: "Worked on {storyCount} user stories across {repoCount} repositories.",
  standaloneItems: "{count} task/work items without parent story or not in sprint.",
  standaloneItemsOne: "1 task/work item without parent story or not in sprint.",
  commitsAndItems: "Collected {commitCount} commits and {relatedCount} related work items.",
  hotfixCount: "Included {count} hotfix commits.",
  hotfixCountOne: "Included 1 hotfix commit.",
  unlinkedCommits: "Kept {count} additional unlinked commit(s) from {repoCount} repository(ies).",
  unlinkedRepo: "repositories",
  unlinkedRepoOne: "repository",
  userStories: "User Stories",
  noStories: "No correlated user stories were found for the selected sprint and date range.",
  tasksUnlinked: "Tasks / Other work items (unlinked from User Story)",
  tasksUnlinkedSubtitle: "Items with a card number (branch or message) but no parent User Story in the sprint.",
  unlinkedFromStory: "Unlinked from User Story",
  unlinkedFromStoryNote: "(task/work item not under a sprint User Story).",
  state: "State",
  summary: "Summary",
  linkQuality: "Link quality",
  relatedItems: "Related work items",
  repositories: "Repositories",
  evidence: "Evidence",
  unlinkedWork: "Unlinked Technical Work",
  unlinkedWorkSubtitle: "Commits with no card number in the branch name or in the message.",
  noLinkedCommits: "no linked commits",
  exact: "exact",
  inferred: "inferred",
  workItem: "Work Item",
  theRepository: "the repository",
  and: "and",
  themeFallback: "implementation updates",
  summaryFocused: "Focused on {ref} across {repos}, covering {themes}.",
  summaryNoStories: "No Azure-linked user stories were correlated for this sprint.",
  summaryStandalone: "Work was also captured under {count} task/work items (no parent user story or not in sprint).",
  summaryStandaloneOne: "Work was also captured under 1 task/work item (no parent user story or not in sprint).",
  summaryUnlinkedRepo: "Additional direct work was captured in {repo}, mainly around {themes}.",
  summaryWorkedAcross: "Worked across {repos} on {count} related item(s), mainly covering {themes}.",
  summaryCaptured: "Captured {count} direct commits in {repo}, mainly around {themes}.",
  summaryCapturedOne: "Captured 1 direct commit in {repo}, mainly around {themes}.",
  generatedAt: "Generated at",
  overviewLinkedStories: "Linked stories",
  overviewStandaloneShort: "tasks/items",
  overviewLinkedCommits: "linked commits",
  overviewUnlinkedCommits: "unlinked commits",
  fetchingSprints: "Fetching sprints from Azure...",
  selectSprints: "Select sprint(s) (use <space> to select, <enter> to confirm):",
  customDateRange: "Custom date range...",
  startDate: "Start date (YYYY-MM-DD):",
  endDate: "End date (YYYY-MM-DD):",
  dateFormatError: "Please enter a date in YYYY-MM-DD format.",
  selectOneSprint: "Please select at least one sprint.",
  reportWritten: "Report written to {path}",
  generatingReport: "Generating report for {sprint}...",
  combinedReportWritten: "Combined report written to {path}",
  foundRepos: "Found {count} repositories",
  collectingCommits: "Collecting commits from {count} repositories...",
  collectedCommits: "Collected {count} commits",
  loadingWorkItems: "Loading Azure sprint work items...",
  correlating: "Correlating commits to Azure work items...",
  buildingReport: "Building report...",
  noReportsFound: "No reports found. Generate a report first with 'activity-report generate'.",
  reportNotFound: "Report '{name}' not found.",
  availableReports: "Available reports:",
  selectReport: "Select a report to view:",
  resolvingSprint: "Resolving sprint...",
  discoveringRepos: "Discovering repositories...",
  fetchingSprintDetails: "Fetching sprint details...",
  resolvingSprintHistory: "Resolving sprint history...",
  multiSprintTitle: "Activity Report - Last Sprints",
  overview: "Overview",
  noStoriesShort: "No correlated user stories found.",
  tutorialTitle: "Quick start",
  tutorialIntro: "Run these commands from a directory where you will keep (or already have) activity-report.json.",
  tutorialStepInstall: "1. Install: npm install && npm run build && npm link (or use pnpm dev without linking)",
  tutorialStepInit: "2. Configure: activity-report init",
  tutorialStepDoctor: "3. Check: activity-report doctor",
  tutorialStepGenerate: "4. Generate report: activity-report generate --last-sprints 2",
  tutorialStepView: "5. View reports: activity-report view",
  tutorialNoteConfig: "Tip: Run activity-report from a folder that contains activity-report.json."
};

const ptBR: ReportMessages & CliMessages = {
  title: "Relatório de Atividades",
  sprint: "Sprint",
  period: "Período",
  highlights: "Destaques",
  workedStories: "Trabalho em {storyCount} user stories em {repoCount} repositórios.",
  standaloneItems: "{count} task(s)/item(ns) sem user story pai ou fora da sprint.",
  standaloneItemsOne: "1 task/item sem user story pai ou fora da sprint.",
  commitsAndItems: "Coletados {commitCount} commits e {relatedCount} work items relacionados.",
  hotfixCount: "Incluídos {count} commits de hotfix.",
  hotfixCountOne: "Incluído 1 commit de hotfix.",
  unlinkedCommits: "Mantidos {count} commit(s) não vinculados de {repoCount} repositório(s).",
  unlinkedRepo: "repositórios",
  unlinkedRepoOne: "repositório",
  userStories: "User Stories",
  noStories: "Nenhuma user story foi correlacionada para a sprint e período selecionados.",
  tasksUnlinked: "Tasks / Outros itens (não vinculados a User Story)",
  tasksUnlinkedSubtitle: "Itens com número de card (branch ou mensagem) mas sem User Story pai na sprint.",
  unlinkedFromStory: "Não vinculado a User Story",
  unlinkedFromStoryNote: "(task/item não está sob uma User Story da sprint).",
  state: "Estado",
  summary: "Resumo",
  linkQuality: "Qualidade do vínculo",
  relatedItems: "Work items relacionados",
  repositories: "Repositórios",
  evidence: "Evidências",
  unlinkedWork: "Trabalho técnico não vinculado",
  unlinkedWorkSubtitle: "Commits sem número de card na branch nem na mensagem.",
  noLinkedCommits: "nenhum commit vinculado",
  exact: "exato",
  inferred: "inferido",
  workItem: "Work Item",
  theRepository: "o repositório",
  and: "e",
  themeFallback: "atualizações de implementação",
  summaryFocused: "Foco em {ref} em {repos}, cobrindo {themes}.",
  summaryNoStories: "Nenhuma user story vinculada ao Azure foi correlacionada para esta sprint.",
  summaryStandalone: "Trabalho também registrado em {count} task(s)/item(ns) (sem user story pai ou fora da sprint).",
  summaryStandaloneOne: "Trabalho também registrado em 1 task/item (sem user story pai ou fora da sprint).",
  summaryUnlinkedRepo: "Trabalho direto adicional em {repo}, principalmente em {themes}.",
  summaryWorkedAcross: "Trabalho em {repos} em {count} item(ns) relacionado(s), cobrindo {themes}.",
  summaryCaptured: "Registrados {count} commits diretos em {repo}, principalmente em {themes}.",
  summaryCapturedOne: "Registrado 1 commit direto em {repo}, principalmente em {themes}.",
  generatedAt: "Gerado em",
  overviewLinkedStories: "User stories vinculadas",
  overviewStandaloneShort: "tasks/itens (sem User Story)",
  overviewLinkedCommits: "commits vinculados",
  overviewUnlinkedCommits: "commits não vinculados",
  fetchingSprints: "Buscando sprints no Azure...",
  selectSprints: "Selecione a(s) sprint(s) (<espaço> para marcar, <enter> para confirmar):",
  customDateRange: "Intervalo de datas personalizado...",
  startDate: "Data inicial (AAAA-MM-DD):",
  endDate: "Data final (AAAA-MM-DD):",
  dateFormatError: "Informe a data no formato AAAA-MM-DD.",
  selectOneSprint: "Selecione ao menos uma sprint.",
  reportWritten: "Relatório salvo em {path}",
  generatingReport: "Gerando relatório para {sprint}...",
  combinedReportWritten: "Relatório consolidado salvo em {path}",
  foundRepos: "Encontrados {count} repositórios",
  collectingCommits: "Coletando commits de {count} repositórios...",
  collectedCommits: "Coletados {count} commits",
  loadingWorkItems: "Carregando work items da sprint no Azure...",
  correlating: "Correlacionando commits aos work items do Azure...",
  buildingReport: "Montando relatório...",
  noReportsFound: "Nenhum relatório encontrado. Gere um com 'activity-report generate'.",
  reportNotFound: "Relatório '{name}' não encontrado.",
  availableReports: "Relatórios disponíveis:",
  selectReport: "Selecione um relatório para ver:",
  resolvingSprint: "Resolvendo sprint...",
  discoveringRepos: "Descobrindo repositórios...",
  fetchingSprintDetails: "Buscando detalhes da sprint...",
  resolvingSprintHistory: "Resolvendo histórico de sprints...",
  multiSprintTitle: "Relatório de Atividades - Últimas Sprints",
  overview: "Visão geral",
  noStoriesShort: "Nenhuma user story correlacionada encontrada.",
  tutorialTitle: "Início rápido",
  tutorialIntro: "Execute estes comandos a partir do diretório onde ficará (ou já existe) o activity-report.json.",
  tutorialStepInstall: "1. Instalar: npm install && npm run build && npm link (ou use pnpm dev sem link)",
  tutorialStepInit: "2. Configurar: activity-report init",
  tutorialStepDoctor: "3. Verificar: activity-report doctor",
  tutorialStepGenerate: "4. Gerar relatório: activity-report generate --last-sprints 2",
  tutorialStepView: "5. Ver relatórios: activity-report view",
  tutorialNoteConfig: "Dica: Execute o activity-report em uma pasta que contenha activity-report.json."
};

const messages: Record<Locale, ReportMessages & CliMessages> = { en, "pt-BR": ptBR };

/**
 * Parses a locale string from CLI or config (case-insensitive).
 * Returns canonical "en" | "pt-BR" or undefined if invalid/empty.
 */
export function parseLocale(input: string | undefined): Locale | undefined {
  if (input == null || input.trim() === "") return undefined;
  const normalized = input.trim().toLowerCase().replace("_", "-");
  if (normalized === "pt-br") return "pt-BR";
  if (normalized === "en") return "en";
  return undefined;
}

export function getReportMessages(locale: Locale): ReportMessages {
  return messages[locale] ?? messages.en;
}

export function getCliMessages(locale: Locale): CliMessages {
  return messages[locale] ?? messages.en;
}

export function getMessages(locale: Locale): ReportMessages & CliMessages {
  return messages[locale] ?? messages.en;
}

export function replaceParams(text: string, params: Record<string, string | number>): string {
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    text
  );
}

export function formatReportDate(isoString: string, locale: Locale): string {
  const date = new Date(isoString);
  const localeTag = locale === "pt-BR" ? "pt-BR" : "en-GB";
  return date.toLocaleString(localeTag, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
